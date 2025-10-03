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
    
    // Generate secret key for HMAC if not exists
    const crypto = require('crypto');
    const secretKey = crypto.randomBytes(32).toString('hex');

    // Create/update agent in users/{userId}/agents/{agentId}
    const agentRef = db.collection('users').doc(userId).collection('agents').doc(agentId);
    const agentData = {
      ...agentConfig,
      id: agentId,
      userId,
      trainingStatus: 'training',
      documentCount: documents.length,
      secretKey: secretKey, // For HMAC verification
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

// Chat with agent using similarity search (authenticated)
exports.chatWithAgent = onCall({
  timeoutSeconds: 120,
  memory: '512MiB'
}, async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId, message, sessionId, conversationHistory = [] } = request.data;
  const userId = request.auth.uid;

  return await processChatMessage(agentId, message, sessionId, conversationHistory, userId);
});

// Chat with agent for external widgets (HMAC authenticated)
exports.chatWithAgentExternal = onRequest({
  timeoutSeconds: 120,
  memory: '512MiB',
  cors: true
}, async (request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).send('Method not allowed');
    return;
  }

  try {
    console.log('🔍 Incoming request body:', JSON.stringify(request.body, null, 2));
    console.log('🔍 Request headers:', JSON.stringify(request.headers, null, 2));
    
    const { agentId, message, sessionId, anonymousUserId, conversationHistory = [], sessionData, hmac, timestamp } = request.body.data || request.body;
    
    // Get agent to verify HMAC - need to find agent across all users
    let agentDoc = null;
    let agent = null;
    
    // Search for agent across all users (inefficient but works for now)
    console.log('🔍 Searching for agentId:', agentId);
    
    // Debug: Check what collections exist
    try {
      const collections = await db.listCollections();
      console.log('🔍 Available collections:', collections.map(c => c.id));
    } catch (error) {
      console.log('🔍 Could not list collections:', error.message);
    }
    
    const usersSnapshot = await db.collection('users').get();
    console.log('🔍 Found', usersSnapshot.docs.length, 'users');
    
    for (const userDoc of usersSnapshot.docs) {
      console.log('🔍 Checking user:', userDoc.id);
      const agentRef = await db.collection('users').doc(userDoc.id).collection('agents').doc(agentId).get();
      if (agentRef.exists) {
        console.log('✅ Found agent in user:', userDoc.id);
        agentDoc = agentRef;
        agent = agentRef.data();
        break;
      }
    }
    
    if (!agentDoc || !agent) {
      console.log('❌ Agent not found:', agentId);
      response.status(404).json({ error: 'Agent not found' });
      return;
    }
    
    console.log('✅ Using agent:', agent.id || agentId);
    
    // Verify HMAC if enabled
    if (agent.secretKey && hmac) {
      const crypto = require('crypto');
      const payload = `${agentId}:${message}:${timestamp}`;
      const expectedHmac = crypto.createHmac('sha256', agent.secretKey).update(payload).digest('hex');
      
      if (hmac !== expectedHmac) {
        response.status(401).json({ error: 'Invalid HMAC signature' });
        return;
      }
      
      // Check timestamp (prevent replay attacks)
      const now = Date.now();
      if (Math.abs(now - timestamp) > 300000) { // 5 minutes
        response.status(401).json({ error: 'Request timestamp expired' });
        return;
      }
    }
    
    const result = await processChatMessage(agentId, message, sessionId, conversationHistory, agent.userId);
    
    // Save comprehensive session data if provided
    if (sessionData && anonymousUserId) {
      await saveSessionAnalytics(agent.userId, agentId, sessionData);
    }
    
    response.status(200).json({ data: result });
    
  } catch (error) {
    console.error('External chat error:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

// Shared chat processing function
async function processChatMessage(agentId, message, sessionId, conversationHistory, userId) {
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
    
    // Build conversation messages with history
    const messages = [
      {
        role: "system",
        content: `You are a friendly, helpful AI assistant. Respond with JSON containing both the chat response and conversation analysis.

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "response": "Your friendly chat response here",
  "analysis": {
    "intent": "support|sales|information|general",
    "sentiment": "positive|negative|neutral|confused|frustrated",
    "urgency": "low|medium|high",
    "needsTicket": true|false,
    "ticketReason": "billing_issue|technical_problem|urgent_request|negative_feedback|unresolved|null",
    "category": "support|sales|information|complaint|question",
    "topic": "pricing|features|integration|billing|technical|general"
  }
}

Chat Guidelines:
- Be conversational and personable while providing accurate information
- Respond in the same language the user is communicating in
- Answer casual questions like "how are you", "hello", "what's up" in a friendly way
- If user mentions their name, remember and use it naturally
- Ask follow-up questions to better help users and keep the conversation engaging
- Be concise but friendly - aim for 1-3 sentences unless more detail is needed
- Use a warm, professional tone and show genuine interest in helping

Analysis Guidelines:
- Set needsTicket: true for: billing issues, technical problems, urgent requests, strong negative sentiment, or complaints
- Set needsTicket: false for: general questions, feature inquiries, casual conversation, positive interactions
- Be accurate with sentiment and intent detection
- Choose the most relevant topic and category

Context from knowledge base:
${context}`
      }
    ];

    // Add conversation history for context
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    messages.push({
      role: "user",
      content: message
    });

    // Generate response using OpenAI
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const aiResponse = completion.choices[0].message.content;
    
    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (error) {
      console.log('❌ Failed to parse AI JSON response:', aiResponse);
      // Fallback to simple response
      parsedResponse = {
        response: aiResponse,
        analysis: {
          intent: "general",
          sentiment: "neutral",
          urgency: "low",
          needsTicket: false,
          ticketReason: null,
          category: "question",
          topic: "general"
        }
      };
    }
    
    // Store conversation with analysis under agent
    const conversationData = {
      sessionId: sessionId || `session_${Date.now()}`,
      message,
      response: parsedResponse.response,
      analysis: parsedResponse.analysis,
      relevantChunks: topChunks.map(chunk => ({
        content: chunk.content.substring(0, 100) + '...',
        similarity: chunk.similarity,
        source: chunk.source
      })),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('conversations').add(conversationData);
    
    console.log(`✅ Generated response: ${parsedResponse.response.substring(0, 100)}...`);
    
    return {
      response: parsedResponse.response,
      analysis: parsedResponse.analysis,
      sessionId: conversationData.sessionId,
      relevantSources: topChunks.map(c => c.source)
    };
    
  } catch (error) {
    console.error('❌ Error in chat:', error);
    throw new Error(`Chat failed: ${error.message}`);
  }
}

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
    
    // Generate simple embed code - widget fetches config from database automatically
    const hasHMAC = agent.secretKey && agent.allowedDomains && agent.allowedDomains.length > 0;

    const embedCode = `<!-- Orchis Chatbot -->
<script>
(function(){
  if(!window.OrchisChatbot){
    const script = document.createElement('script');
    script.src = 'https://orchis.app/chatbot-widget.js';
    script.onload = function() {
      if(window.OrchisChatbot) {
        window.OrchisChatbot.init({
          agentId: '${agentId}'${hasHMAC ? `,\n          allowedDomains: ${JSON.stringify(agent.allowedDomains)},\n          secretKey: '${agent.secretKey}'` : ''}
        });
      }
    };
    document.head.appendChild(script);
  }
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

// Save comprehensive session analytics to Firebase
async function saveSessionAnalytics(userId, agentId, sessionData) {
  try {
    console.log('📊 Saving session analytics for agent:', agentId);
    
    const now = new Date();
    const todayString = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Save detailed session data under agent
    await db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('analytics')
      .doc('sessions')
      .collection('detailed')
      .doc(sessionData.sessionId)
      .set({
        ...sessionData,
        savedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Update daily aggregated analytics under agent
    const dailyStatsRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('analytics')
      .doc('daily')
      .collection('stats')
      .doc(todayString);
    
    await db.runTransaction(async (transaction) => {
      const dailyDoc = await transaction.get(dailyStatsRef);
      
      if (dailyDoc.exists) {
        const currentStats = dailyDoc.data();
        
        transaction.update(dailyStatsRef, {
          totalSessions: (currentStats.totalSessions || 0) + 1,
          totalMessages: (currentStats.totalMessages || 0) + sessionData.messageCount,
          avgResponseTime: calculateNewAverage(
            currentStats.avgResponseTime || 0,
            currentStats.totalSessions || 0,
            sessionData.avgResponseTime
          ),
          [`sentimentCounts.${sessionData.sentiment}`]: 
            ((currentStats.sentimentCounts?.[sessionData.sentiment]) || 0) + 1,
          [`engagementLevels.${sessionData.behaviorMetrics.engagementLevel}`]: 
            ((currentStats.engagementLevels?.[sessionData.behaviorMetrics.engagementLevel]) || 0) + 1,
          [`deviceTypes.${sessionData.behaviorMetrics.deviceType}`]: 
            ((currentStats.deviceTypes?.[sessionData.behaviorMetrics.deviceType]) || 0) + 1,
          [`intents.${sessionData.intentDetection || 'unknown'}`]: 
            ((currentStats.intents?.[sessionData.intentDetection || 'unknown']) || 0) + 1,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        transaction.set(dailyStatsRef, {
          date: todayString,
          totalSessions: 1,
          totalMessages: sessionData.messageCount,
          avgResponseTime: sessionData.avgResponseTime,
          sentimentCounts: { [sessionData.sentiment]: 1 },
          engagementLevels: { [sessionData.behaviorMetrics.engagementLevel]: 1 },
          deviceTypes: { [sessionData.behaviorMetrics.deviceType]: 1 },
          intents: { [sessionData.intentDetection || 'unknown']: 1 },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    
    // Save user behavior patterns under agent
    if (sessionData.anonymousUserId) {
      await db.collection('users').doc(userId)
        .collection('agents').doc(agentId)
        .collection('analytics')
        .doc('user_patterns')
        .collection('anonymous_users')
        .doc(sessionData.anonymousUserId)
        .set({
          lastSession: sessionData.sessionId,
          totalSessions: admin.firestore.FieldValue.increment(1),
          totalMessages: admin.firestore.FieldValue.increment(sessionData.messageCount),
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          userAgent: sessionData.userLocation.userAgent,
          timezone: sessionData.userLocation.timezone,
          isReturnVisitor: sessionData.behaviorMetrics.returnVisitor,
          avgEngagementLevel: sessionData.behaviorMetrics.engagementLevel,
          preferredTopics: sessionData.topic ? [sessionData.topic] : []
        }, { merge: true });
    }
    
    console.log('✅ Session analytics saved successfully');
    
  } catch (error) {
    console.error('❌ Error saving session analytics:', error);
    // Don't throw error to avoid breaking the chat flow
  }
}

// Helper function to calculate new running average
function calculateNewAverage(currentAvg, currentCount, newValue) {
  if (currentCount === 0) return newValue;
  return Math.round(((currentAvg * currentCount) + newValue) / (currentCount + 1));
}

// AI-powered message analysis endpoint
exports.analyzeMessage = onRequest({
  timeoutSeconds: 60,
  memory: '512MiB',
  cors: true
}, async (request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).send('Method not allowed');
    return;
  }

  try {
    const { agentId, message, sessionId, analysisMode } = request.body.data || request.body;
    
    if (!analysisMode) {
      response.status(400).json({ error: 'Analysis mode required' });
      return;
    }

    // Get agent data for context
    let agent = null;
    const usersSnapshot = await db.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
      const agentRef = await db.collection('users').doc(userDoc.id).collection('agents').doc(agentId).get();
      if (agentRef.exists) {
        agent = agentRef.data();
        break;
      }
    }

    if (!agent) {
      response.status(404).json({ error: 'Agent not found' });
      return;
    }

    // Create analysis-focused prompt
    const analysisPrompt = `You are an AI customer service analyst. Your job is to analyze conversations and categorize them for business intelligence.

${message}

Respond with valid JSON only. Be precise and consistent with categorization.`;

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      await delay(MIN_API_INTERVAL - timeSinceLastCall);
    }
    lastApiCall = Date.now();

    // Call OpenAI for analysis
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a customer service conversation analyzer. Always respond with valid JSON containing conversation analysis. Be consistent with categorization."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.1, // Low temperature for consistent categorization
    });

    const analysisResult = completion.choices[0].message.content;
    
    response.status(200).json({ 
      data: { 
        response: analysisResult,
        sessionId: sessionId
      } 
    });
    
  } catch (error) {
    console.error('Message analysis error:', error);
    response.status(500).json({ error: 'Analysis failed' });
  }
});

