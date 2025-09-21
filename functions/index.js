const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

admin.initializeApp();
const db = admin.firestore();

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY
});

// Utility function to chunk text
function chunkText(text, maxLength = 1000) {
  const chunks = [];
  let currentChunk = '';
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate embeddings for text chunks
async function generateEmbeddings(textChunks) {
  try {
    const embeddings = [];
    
    for (const chunk of textChunks) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk
      });
      
      embeddings.push({
        text: chunk,
        embedding: response.data[0].embedding
      });
    }
    
    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

// Calculate cosine similarity
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Process uploaded document
exports.processDocument = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { agentId, fileName, fileContent, fileType } = data;
    const userId = context.auth.uid;

    // Verify agent belongs to user
    const agentDoc = await db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists || agentDoc.data().userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Agent not found or access denied');
    }

    let extractedText = '';

    // Extract text based on file type
    if (fileType === 'text/plain') {
      extractedText = fileContent;
    } else if (fileType === 'application/pdf') {
      const buffer = Buffer.from(fileContent, 'base64');
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const buffer = Buffer.from(fileContent, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Unsupported file type');
    }

    // Clean and chunk the text
    const cleanText = extractedText.replace(/\s+/g, ' ').trim();
    const chunks = chunkText(cleanText);

    // Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // Store document and embeddings in Firestore
    const documentRef = db.collection('documents').doc();
    const documentData = {
      id: documentRef.id,
      agentId,
      userId,
      fileName,
      fileType,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      chunkCount: chunks.length,
      processed: true
    };

    await documentRef.set(documentData);

    // Store embeddings in subcollection
    const batch = db.batch();
    embeddings.forEach((embedding, index) => {
      const embeddingRef = documentRef.collection('embeddings').doc(`chunk_${index}`);
      batch.set(embeddingRef, {
        text: embedding.text,
        embedding: embedding.embedding,
        chunkIndex: index
      });
    });

    await batch.commit();

    // Update agent document count
    await db.collection('agents').doc(agentId).update({
      documentCount: admin.firestore.FieldValue.increment(1),
      trainingStatus: 'trained',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      documentId: documentRef.id,
      chunkCount: chunks.length
    };

  } catch (error) {
    console.error('Error processing document:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Chat with agent
exports.chatWithAgent = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { agentId, message, conversationId } = data;
    const userId = context.auth.uid;

    // Verify agent belongs to user
    const agentDoc = await db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists || agentDoc.data().userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Agent not found or access denied');
    }

    const agent = agentDoc.data();

    // Generate embedding for the user message
    const messageEmbedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: message
    });

    // Find relevant document chunks
    const documentsSnapshot = await db.collection('documents')
      .where('agentId', '==', agentId)
      .get();

    let relevantChunks = [];

    for (const docSnapshot of documentsSnapshot.docs) {
      const embeddingsSnapshot = await docSnapshot.ref.collection('embeddings').get();
      
      for (const embeddingDoc of embeddingsSnapshot.docs) {
        const embeddingData = embeddingDoc.data();
        const similarity = cosineSimilarity(
          messageEmbedding.data[0].embedding,
          embeddingData.embedding
        );

        if (similarity > 0.7) { // Similarity threshold
          relevantChunks.push({
            text: embeddingData.text,
            similarity,
            documentId: docSnapshot.id
          });
        }
      }
    }

    // Sort by similarity and take top 3
    relevantChunks.sort((a, b) => b.similarity - a.similarity);
    relevantChunks = relevantChunks.slice(0, 3);

    // Build context from relevant chunks
    const context = relevantChunks.length > 0 
      ? relevantChunks.map(chunk => chunk.text).join('\n\n')
      : '';

    // Get conversation history
    let conversationHistory = [];
    if (conversationId) {
      const historySnapshot = await db.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(10)
        .get();

      conversationHistory = historySnapshot.docs.map(doc => doc.data());
    }

    // Create system prompt based on agent type
    const systemPrompts = {
      customer_support: "You are a helpful customer support assistant. Use the provided context to answer questions accurately and professionally.",
      sales: "You are a sales assistant. Help customers understand products and guide them towards making informed decisions.",
      technical: "You are a technical support specialist. Provide detailed technical assistance based on the documentation.",
      general: "You are a helpful AI assistant. Answer questions using the provided context when available."
    };

    const systemPrompt = systemPrompts[agent.type] || systemPrompts.general;

    // Build messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `${systemPrompt}\n\n${context ? `Context from documents:\n${context}\n\n` : ''}Remember to be helpful and accurate in your responses.`
      }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    // Save conversation to Firestore
    const conversationRef = conversationId 
      ? db.collection('conversations').doc(conversationId)
      : db.collection('conversations').doc();

    if (!conversationId) {
      await conversationRef.set({
        agentId,
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await conversationRef.update({
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Save messages
    const batch = db.batch();
    
    const userMessageRef = conversationRef.collection('messages').doc();
    batch.set(userMessageRef, {
      role: 'user',
      content: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    const aiMessageRef = conversationRef.collection('messages').doc();
    batch.set(aiMessageRef, {
      role: 'assistant',
      content: aiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      relevantChunks: relevantChunks.length
    });

    await batch.commit();

    return {
      response: aiResponse,
      conversationId: conversationRef.id,
      relevantSources: relevantChunks.length
    };

  } catch (error) {
    console.error('Error in chat:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Get agent conversations
exports.getAgentConversations = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { agentId } = data;
    const userId = context.auth.uid;

    // Verify agent belongs to user
    const agentDoc = await db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists || agentDoc.data().userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Agent not found or access denied');
    }

    const conversationsSnapshot = await db.collection('conversations')
      .where('agentId', '==', agentId)
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();

    const conversations = await Promise.all(
      conversationsSnapshot.docs.map(async (doc) => {
        const conversationData = doc.data();
        
        // Get last message
        const lastMessageSnapshot = await doc.ref.collection('messages')
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        const lastMessage = lastMessageSnapshot.docs[0]?.data();

        return {
          id: doc.id,
          ...conversationData,
          lastMessage: lastMessage?.content || '',
          lastMessageTime: lastMessage?.timestamp
        };
      })
    );

    return { conversations };

  } catch (error) {
    console.error('Error getting conversations:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Delete document
exports.deleteDocument = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { documentId } = data;
    const userId = context.auth.uid;

    const documentDoc = await db.collection('documents').doc(documentId).get();
    if (!documentDoc.exists || documentDoc.data().userId !== userId) {
      throw new functions.https.HttpsError('permission-denied', 'Document not found or access denied');
    }

    const documentData = documentDoc.data();

    // Delete embeddings subcollection
    const embeddingsSnapshot = await documentDoc.ref.collection('embeddings').get();
    const batch = db.batch();
    
    embeddingsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete document
    batch.delete(documentDoc.ref);
    await batch.commit();

    // Update agent document count
    await db.collection('agents').doc(documentData.agentId).update({
      documentCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };

  } catch (error) {
    console.error('Error deleting document:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});