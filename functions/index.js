const { onCall, onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');

admin.initializeApp();

// Set global options for v2 functions
setGlobalOptions({
  region: 'us-central1'
});

// Initialize OpenAI lazily
let openaiInstance = null;
function getOpenAI() {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let lastApiCall = 0;
const MIN_API_INTERVAL = 100; // 100ms between calls

// Initialize services
const db = admin.firestore();
const storage = admin.storage();

// Text chunking function
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to end at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const boundary = Math.max(lastPeriod, lastNewline);
      
      if (boundary > start + chunkSize * 0.5) {
        end = boundary + 1;
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = Math.max(start + chunkSize - overlap, end);
  }
  
  return chunks;
}

// Extract text from different file types
async function extractTextFromFile(buffer, mimeType, filename) {
  try {
    switch (mimeType) {
      case 'application/pdf':
        const pdfData = await pdfParse(buffer);
        return pdfData.text;
        
      case 'text/plain':
        return buffer.toString('utf-8');
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value;
        
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`Error extracting text from ${filename}:`, error);
    throw error;
  }
}

// Create and train agent
exports.trainAgent = onCall({
  timeoutSeconds: 540,
  memory: '2GiB'
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId, documents, agentConfig } = request.data;
  const userId = request.auth.uid;
  
  try {
    console.log('🚀 Starting agent training for user:', userId);
    
    // Create/update agent in users/{userId}/agents/{agentId}
    const agentRef = db.collection('users').doc(userId).collection('agents').doc(agentId);
    const agentData = {
      ...agentConfig,
      id: agentId,
      userId,
      trainingStatus: 'training',
      documentCount: documents.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await agentRef.set(agentData, { merge: true });
    console.log('✅ Agent created/updated in Firestore');
    
    // Process each document
    const allChunks = [];
    
    for (const doc of documents) {
      console.log(`📄 Processing document: ${doc.name}`);
      
      try {
        // Use text content directly from frontend
        const text = doc.textContent;
        console.log(`📝 Using provided text content: ${text.length} characters from ${doc.name}`);
        
        // Create chunks
        const chunks = chunkText(text);
        console.log(`✂️ Created ${chunks.length} chunks from ${doc.name}`);
        
        // Create embeddings for chunks and store with vector data
        console.log(`🔄 Creating embeddings for ${chunks.length} chunks...`);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          try {
            // Rate limiting for OpenAI API
            const now = Date.now();
            const timeSinceLastCall = now - lastApiCall;
            if (timeSinceLastCall < MIN_API_INTERVAL) {
              await delay(MIN_API_INTERVAL - timeSinceLastCall);
            }
            lastApiCall = now;
            
            // Generate embedding with OpenAI
            const embeddingResponse = await getOpenAI().embeddings.create({
              model: "text-embedding-ada-002",
              input: chunk,
            });
            
            const embedding = embeddingResponse.data[0].embedding;
            
            // Store chunk with embedding
            const chunkRef = agentRef.collection('chunks').doc();
            const chunkData = {
              id: chunkRef.id,
              content: chunk,
              embedding: embedding, // Vector representation
              source: doc.name,
              sourceId: doc.id,
              index: i,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              metadata: {
                fileType: doc.type,
                fileName: doc.name,
                chunkIndex: i,
                totalChunks: chunks.length,
                originalSize: doc.size,
                embeddingModel: "text-embedding-ada-002"
              }
            };
            
            await chunkRef.set(chunkData);
            allChunks.push(chunkData);
            
            console.log(`✅ Created embedding for chunk ${i + 1}/${chunks.length} from ${doc.name}`);
            
          } catch (embeddingError) {
            console.error(`❌ Error creating embedding for chunk ${i}:`, embeddingError);
            
            // Retry once for rate limit errors
            if (embeddingError.status === 429 || embeddingError.message.includes('rate limit')) {
              console.log(`🔄 Retrying embedding for chunk ${i} after rate limit...`);
              await delay(2000); // Wait 2 seconds
              
              try {
                const retryResponse = await getOpenAI().embeddings.create({
                  model: "text-embedding-ada-002",
                  input: chunk,
                });
                
                const embedding = retryResponse.data[0].embedding;
                const chunkRef = agentRef.collection('chunks').doc();
                const chunkData = {
                  id: chunkRef.id,
                  content: chunk,
                  embedding: embedding,
                  source: doc.name,
                  sourceId: doc.id,
                  index: i,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  metadata: {
                    fileType: doc.type,
                    fileName: doc.name,
                    chunkIndex: i,
                    totalChunks: chunks.length,
                    originalSize: doc.size,
                    embeddingModel: "text-embedding-ada-002",
                    retried: true
                  }
                };
                
                await chunkRef.set(chunkData);
                allChunks.push(chunkData);
                console.log(`✅ Retry successful for chunk ${i + 1}/${chunks.length} from ${doc.name}`);
                continue;
              } catch (retryError) {
                console.error(`❌ Retry failed for chunk ${i}:`, retryError);
              }
            }
            
            // Store chunk without embedding as fallback
            const chunkRef = agentRef.collection('chunks').doc();
            const chunkData = {
              id: chunkRef.id,
              content: chunk,
              embedding: null,
              source: doc.name,
              sourceId: doc.id,
              index: i,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              metadata: {
                fileType: doc.type,
                fileName: doc.name,
                chunkIndex: i,
                totalChunks: chunks.length,
                originalSize: doc.size,
                embeddingError: embeddingError.message,
                needsRetry: true
              }
            };
            
            await chunkRef.set(chunkData);
            allChunks.push(chunkData);
          }
        }
        
        console.log(`💾 Stored ${chunks.length} chunks with embeddings for ${doc.name}`);
        
      } catch (docError) {
        console.error(`❌ Error processing document ${doc.name}:`, docError);
        // Continue with other documents
      }
    }
    
    // Update agent with final training status
    await agentRef.update({
      trainingStatus: 'trained',
      totalChunks: allChunks.length,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('🎉 Training completed successfully');
    
    return {
      success: true,
      agentId,
      totalDocuments: documents.length,
      totalChunks: allChunks.length,
      message: 'Agent trained successfully'
    };
    
  } catch (error) {
    console.error('❌ Error training agent:', error);
    
    // Update agent status to error
    try {
      await db.collection('users').doc(userId).collection('agents').doc(agentId).update({
        trainingStatus: 'error',
        error: error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      console.error('Error updating agent status:', updateError);
    }
    
    throw new Error(`Training failed: ${error.message}`);
  }
});

// Process uploaded document
exports.processDocument = onCall({
  timeoutSeconds: 300,
  memory: '1GiB'
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId, fileName, fileUrl } = request.data;
  
  try {
    // Extract file path from download URL
    const urlParts = fileUrl.split('/o/')[1].split('?')[0];
    const filePath = decodeURIComponent(urlParts);
    
    // Download file from storage
    const file = storage.bucket().file(filePath);
    const [fileBuffer] = await file.download();
    const [metadata] = await file.getMetadata();
    
    // Extract text from file
    const text = await extractTextFromFile(fileBuffer, metadata.contentType, fileName);
    
    // For temp processing, just return the text content
    if (agentId === 'temp') {
      // Delete temp file after processing
      try {
        await file.delete();
      } catch (deleteError) {
        console.log('Temp file already deleted or not found');
      }
      
      return {
        success: true,
        textContent: text,
        message: 'Text extracted successfully'
      };
    }
    
    // Create chunks for real agents
    const chunks = chunkText(text);
    
    // Store chunks in Firestore using correct user structure
    const batch = db.batch();
    const chunksData = [];
    const agentRef = db.collection('users').doc(request.auth.uid).collection('agents').doc(agentId);
    
    chunks.forEach((chunk, index) => {
      const chunkDoc = agentRef.collection('chunks').doc();
      const chunkData = {
        id: chunkDoc.id,
        content: chunk,
        embedding: null, // Will be generated separately
        source: fileName,
        sourceId: `uploaded_${Date.now()}_${index}`,
        index,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          fileType: metadata.contentType,
          fileName,
          chunkIndex: index,
          totalChunks: chunks.length
        }
      };
      
      batch.set(chunkDoc, chunkData);
      chunksData.push(chunkData);
    });
    
    // Update agent document count
    batch.update(agentRef, {
      documentCount: admin.firestore.FieldValue.increment(1),
      trainingStatus: 'trained',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await batch.commit();
    
    return {
      success: true,
      textContent: text,
      chunksCreated: chunks.length,
      chunks: chunksData
    };
    
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error('Failed to process document');
  }
});

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Chat with agent using similarity search
exports.chatWithAgent = onCall({
  timeoutSeconds: 120,
  memory: '512MiB'
}, async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId, message, sessionId } = request.data;
  const userId = request.auth.uid;
  
  try {
    console.log(`💬 Processing chat for agent ${agentId}: "${message}"`);
    
    // Rate limiting for OpenAI API
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      await delay(MIN_API_INTERVAL - timeSinceLastCall);
    }
    lastApiCall = Date.now();
    
    // Generate embedding for user's question
    const questionEmbedding = await getOpenAI().embeddings.create({
      model: "text-embedding-ada-002",
      input: message,
    });
    const questionVector = questionEmbedding.data[0].embedding;
    
    // Get all chunks for this agent
    const chunksSnapshot = await db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('chunks')
      .get();
    
    if (chunksSnapshot.empty) {
      return {
        response: "I don't have any knowledge base to answer your question. Please train me with some documents first.",
        sessionId
      };
    }
    
    // Calculate similarity scores for each chunk
    const chunksWithScores = [];
    chunksSnapshot.docs.forEach(doc => {
      const chunkData = doc.data();
      if (chunkData.embedding) {
        const similarity = cosineSimilarity(questionVector, chunkData.embedding);
        chunksWithScores.push({
          ...chunkData,
          similarity
        });
      }
    });
    
    // Sort by similarity and get top 3 most relevant chunks
    const topChunks = chunksWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    
    console.log(`🔍 Found ${topChunks.length} relevant chunks, top similarity: ${topChunks[0]?.similarity || 0}`);
    
    // Build context from relevant chunks
    const context = topChunks.map(chunk => chunk.content).join('\n\n');
    
    // Generate response using OpenAI
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a friendly, helpful AI assistant. Be conversational and personable while providing accurate information from the knowledge base.

Guidelines:
- Respond in the same language the user is communicating in
- Answer casual questions like "how are you", "hello", "what's up" in a friendly way even if not in the knowledge base
- If user mentions their name, remember and use it naturally throughout the conversation
- Ask follow-up questions to better help users and keep the conversation engaging
- Be concise but friendly - aim for 1-3 sentences unless more detail is needed
- If you don't have specific information in the knowledge base, acknowledge this but still try to be helpful with general guidance
- Use a warm, professional tone and show genuine interest in helping
- Avoid refusing to answer unless the question is inappropriate or harmful
- Be more engaging and show personality while staying professional

Context from knowledge base:
${context}`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const response = completion.choices[0].message.content;
    
    // Store conversation
    const conversationData = {
      agentId,
      sessionId: sessionId || `session_${Date.now()}`,
      userId,
      message,
      response,
      relevantChunks: topChunks.map(chunk => ({
        content: chunk.content.substring(0, 100) + '...',
        similarity: chunk.similarity,
        source: chunk.source
      })),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('conversations').add(conversationData);
    
    console.log(`✅ Generated response: ${response.substring(0, 100)}...`);
    
    return {
      response,
      sessionId: conversationData.sessionId,
      relevantSources: topChunks.map(c => c.source)
    };
    
  } catch (error) {
    console.error('❌ Error in chat:', error);
    throw new Error(`Chat failed: ${error.message}`);
  }
});

// Generate embed code
exports.generateEmbedCode = onCall(async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId } = request.data;
  
  try {
    // Get agent data (using user structure)
    const agentDoc = await db.collection('users').doc(request.auth.uid).collection('agents').doc(agentId).get();
    if (!agentDoc.exists) {
      throw new Error('Agent not found');
    }
    
    const agent = agentDoc.data();
    
    const embedCode = `<!-- Orchis Chatbot -->
<div id="orchis-chatbot-${agentId}"></div>
<script>
  (function() {
    const chatbotConfig = {
      agentId: '${agentId}',
      projectName: '${agent.projectName || 'Chatbot'}',
      primaryColor: '#2563eb',
      position: 'bottom-right'
    };
    
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/chatbot-widget.js';
    script.onload = function() {
      OrchisChatbot.init(chatbotConfig);
    };
    document.head.appendChild(script);
  })();
</script>`;

    return { embedCode };
    
  } catch (error) {
    console.error('Error generating embed code:', error);
    throw new Error('Failed to generate embed code');
  }
});

// Generate dynamic sitemap
exports.generateSitemap = onRequest({
  timeoutSeconds: 60,
  memory: '256MiB'
}, async (request, response) => {
  try {
    // Set content type for XML
    response.set('Content-Type', 'application/xml');
    
    // Static pages
    const staticPages = [
      { url: 'https://orchis.app/', priority: '1.0', changefreq: 'weekly' },
      { url: 'https://orchis.app/blog', priority: '0.8', changefreq: 'daily' }
    ];
    
    // Get published blog posts
    const blogPosts = [];
    try {
      const postsSnapshot = await db.collection('admin/blog/posts')
        .where('published', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      postsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.slug) {
          blogPosts.push({
            url: `https://orchis.app/blog/${data.slug}`,
            priority: '0.7',
            changefreq: 'monthly',
            lastmod: data.updatedAt ? new Date(data.updatedAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });
        }
      });
    } catch (blogError) {
      console.error('Error fetching blog posts for sitemap:', blogError);
    }
    
    // Generate XML sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Add static pages
    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
    });
    
    // Add blog posts
    blogPosts.forEach(post => {
      sitemap += `
  <url>
    <loc>${post.url}</loc>
    <changefreq>${post.changefreq}</changefreq>
    <priority>${post.priority}</priority>
    <lastmod>${post.lastmod}</lastmod>
  </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    // Cache for 1 hour
    response.set('Cache-Control', 'public, max-age=3600');
    response.status(200).send(sitemap);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    response.status(500).send('Error generating sitemap');
  }
});