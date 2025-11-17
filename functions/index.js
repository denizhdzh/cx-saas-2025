const { onCall, onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');
const fetch = require('node-fetch');

admin.initializeApp();

// Set global options for v2 functions
setGlobalOptions({
  region: 'us-central1'
});

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    console.log(`📄 Extracting text from: ${filename}`);
    console.log(`📋 MIME type: ${mimeType}`);
    console.log(`📦 Buffer size: ${buffer.length} bytes`);

    switch (mimeType) {
      case 'application/pdf':
        console.log('🔄 Processing as PDF...');
        const pdfData = await pdfParse(buffer);
        console.log(`✅ PDF extracted: ${pdfData.text.length} characters`);
        return pdfData.text;

      case 'text/plain':
        console.log('🔄 Processing as TXT...');
        const textContent = buffer.toString('utf-8');
        console.log(`✅ TXT extracted: ${textContent.length} characters`);
        console.log(`📝 First 100 chars: ${textContent.substring(0, 100)}`);
        return textContent;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        console.log('🔄 Processing as DOCX...');
        const docResult = await mammoth.extractRawText({ buffer });
        console.log(`✅ DOCX extracted: ${docResult.value.length} characters`);
        return docResult.value;

      default:
        console.error(`❌ Unsupported MIME type: ${mimeType}`);
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`❌ Error extracting text from ${filename}:`, error);
    console.error(`❌ Error stack:`, error.stack);
    throw error;
  }
}

// Create and train agent
exports.trainAgent = onCall({
  timeoutSeconds: 300,
  memory: '512MiB',
  minInstances: 0,
  maxInstances: 3
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

    // Create agentIndex for fast lookup (agentId -> userId mapping)
    await db.collection('agentIndex').doc(agentId).set({
      userId: userId,
      agentId: agentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('✅ AgentIndex created for fast lookup');

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
  timeoutSeconds: 180,
  memory: '512MiB',
  minInstances: 0,
  maxInstances: 3
}, async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId, fileName, fileUrl } = request.data;

  console.log(`\n🚀 ========== PROCESS DOCUMENT START ==========`);
  console.log(`👤 User: ${request.auth.uid}`);
  console.log(`🤖 Agent ID: ${agentId}`);
  console.log(`📄 File Name: ${fileName}`);
  console.log(`🔗 File URL: ${fileUrl}`);

  try {
    // Extract file path from download URL
    const urlParts = fileUrl.split('/o/')[1].split('?')[0];
    const filePath = decodeURIComponent(urlParts);
    console.log(`📂 File Path: ${filePath}`);

    // Download file from storage
    console.log(`⬇️  Downloading file from storage...`);
    const file = storage.bucket().file(filePath);
    const [fileBuffer] = await file.download();
    const [metadata] = await file.getMetadata();
    console.log(`✅ File downloaded successfully`);
    console.log(`📋 File metadata:`, JSON.stringify(metadata, null, 2));

    // Extract text from file
    console.log(`\n📝 ========== TEXT EXTRACTION START ==========`);
    const text = await extractTextFromFile(fileBuffer, metadata.contentType, fileName);
    console.log(`✅ ========== TEXT EXTRACTION SUCCESS ==========`);
    
    // For temp processing, just return the text content
    if (agentId === 'temp') {
      console.log(`🗑️  Temp file - deleting after processing`);
      // Delete temp file after processing
      try {
        await file.delete();
        console.log(`✅ Temp file deleted`);
      } catch (deleteError) {
        console.log('⚠️  Temp file already deleted or not found');
      }

      console.log(`✅ ========== PROCESS DOCUMENT SUCCESS (TEMP) ==========\n`);
      return {
        success: true,
        textContent: text,
        message: 'Text extracted successfully'
      };
    }

    // Create chunks for real agents
    console.log(`\n✂️  ========== CHUNKING TEXT ==========`);
    const chunks = chunkText(text);
    console.log(`✅ Created ${chunks.length} chunks`);

    // Store chunks in Firestore using correct user structure
    console.log(`\n💾 ========== STORING CHUNKS ==========`);
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

    console.log(`💾 Committing batch write to Firestore...`);
    await batch.commit();
    console.log(`✅ Batch write successful`);

    console.log(`✅ ========== PROCESS DOCUMENT SUCCESS ==========\n`);
    return {
      success: true,
      textContent: text,
      chunksCreated: chunks.length,
      chunks: chunksData
    };

  } catch (error) {
    console.error(`\n❌ ========== PROCESS DOCUMENT ERROR ==========`);
    console.error(`❌ Error message:`, error.message);
    console.error(`❌ Error stack:`, error.stack);
    console.error(`❌ ========== PROCESS DOCUMENT FAILED ==========\n`);
    throw new Error('Failed to process document: ' + error.message);
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
  timeoutSeconds: 60,
  memory: '256MiB',
  minInstances: 0,
  maxInstances: 5,
  concurrency: 80
}, async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId, message, sessionId, conversationHistory = [] } = request.data;
  const userId = request.auth.uid;

  // For authenticated users, no anonymousUserId or sessionData
  return await processChatMessage(agentId, message, sessionId, conversationHistory, userId, null, null);
});

// Chat with agent for external widgets (HMAC authenticated)
exports.chatWithAgentExternal = onRequest({
  timeoutSeconds: 60,
  memory: '256MiB',
  cors: true,
  minInstances: 0,
  maxInstances: 10,
  concurrency: 100
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

    // NEW: Use agentIndex collection for fast lookup
    console.log('🔍 Looking up agent:', agentId);

    const agentIndexRef = await db.collection('agentIndex').doc(agentId).get();

    if (!agentIndexRef.exists) {
      console.log('❌ Agent not found in index:', agentId);
      response.status(404).json({ error: 'Agent not found' });
      return;
    }

    const agentIndex = agentIndexRef.data();
    const userId = agentIndex.userId;

    console.log('✅ Found agent userId from index:', userId);

    // Get agent data
    const agentRef = await db.collection('users').doc(userId).collection('agents').doc(agentId).get();

    if (!agentRef.exists) {
      console.log('❌ Agent not found:', agentId);
      response.status(404).json({ error: 'Agent not found' });
      return;
    }

    agentDoc = agentRef;
    agent = agentRef.data();

    console.log('✅ Using agent:', agent.id || agentId);

    // Get user IP and fetch geolocation data
    let geoLocation = null;
    try {
      const userIp = request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                     request.headers['x-real-ip'] ||
                     request.connection?.remoteAddress ||
                     request.socket?.remoteAddress;

      console.log('🌍 User IP:', userIp);

      // Skip localhost/private IPs
      if (userIp && !userIp.includes('127.0.0.1') && !userIp.includes('::1') && !userIp.startsWith('192.168.')) {
        const geoResponse = await fetch(`http://ip-api.com/json/${userIp}?fields=status,country,countryCode,city,lat,lon,timezone`);
        const geoData = await geoResponse.json();

        if (geoData.status === 'success') {
          geoLocation = {
            city: geoData.city,
            country: geoData.country,
            countryCode: geoData.countryCode,
            lat: geoData.lat,
            lon: geoData.lon,
            timezone: geoData.timezone
          };
          console.log('✅ Geolocation:', geoLocation);
        }
      }
    } catch (geoError) {
      console.log('⚠️  Could not fetch geolocation:', geoError.message);
    }

    // Merge geolocation into sessionData
    const enrichedSessionData = {
      ...sessionData,
      userInfo: {
        ...sessionData?.userInfo,
        location: {
          ...sessionData?.userInfo?.location,
          ...geoLocation
        }
      }
    };

    // Verify domain whitelist
    const origin = request.headers.origin || request.headers.referer;
    if (agent.allowedDomains && agent.allowedDomains.length > 0) {
      let domainAllowed = false;

      if (origin && origin !== 'null' && origin !== 'undefined') {
        try {
          const requestDomain = new URL(origin).hostname;
          console.log('🔍 Checking domain:', requestDomain);

          for (const allowedDomain of agent.allowedDomains) {
            const cleanDomain = allowedDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            if (requestDomain === cleanDomain || requestDomain.endsWith('.' + cleanDomain)) {
              domainAllowed = true;
              console.log('✅ Domain allowed:', requestDomain);
              break;
            }
          }
        } catch (error) {
          console.error('❌ Error parsing origin URL:', origin, error);
        }
      }

      if (!domainAllowed) {
        console.log('❌ Domain not allowed:', origin);

        // Log security alert to Firestore
        try {
          await db.collection('users').doc(agent.userId)
            .collection('agents').doc(agentId)
            .collection('alerts').add({
              type: 'domain_blocked',
              blockedDomain: origin || 'unknown',
              requestDomain: origin ? new URL(origin).hostname : 'unknown',
              agentId: agentId,
              agentName: agent.name || 'Unknown Agent',
              message: message ? message.substring(0, 100) : 'No message',
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
              severity: 'warning'
            });
          console.log('✅ Security alert logged');
        } catch (alertError) {
          console.error('❌ Failed to log security alert:', alertError);
        }

        response.status(403).json({ error: 'Domain not allowed' });
        return;
      }
    }

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
    
    const result = await processChatMessage(agentId, message, sessionId, conversationHistory, agent.userId, anonymousUserId, enrichedSessionData);

    response.status(200).json({ data: result });

  } catch (error) {
    console.error('External chat error:', error);

    // Handle token limit error
    if (error.code === 'LIMIT_REACHED') {
      response.status(429).json({
        error: 'LIMIT_REACHED',
        message: 'Monthly message limit reached. Please upgrade your plan.',
        details: error.details
      });
      return;
    }

    response.status(500).json({ error: 'Internal server error' });
  }
});

// Shared chat processing function
async function processChatMessage(agentId, message, sessionId, conversationHistory, userId, anonymousUserId, sessionData) {
  try {
    console.log(`💬 Processing chat for agent ${agentId}: "${message}"`);
    console.log('📍 Session data:', JSON.stringify(sessionData?.userInfo?.location, null, 2));

    // Check message limit BEFORE processing
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const messageLimit = userData.messageLimit || 0;
      const messagesUsed = userData.messagesUsed || 0;

      console.log(`📊 Message usage: ${messagesUsed}/${messageLimit}`);

      // If limit reached, throw special error
      if (messageLimit > 0 && messagesUsed >= messageLimit) {
        const error = new Error('LIMIT_REACHED');
        error.code = 'LIMIT_REACHED';
        error.details = {
          messagesUsed,
          messageLimit,
          plan: userData.subscriptionPlan || 'free'
        };
        throw error;
      }
    }

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
    
    // Get agent data for configuration
    const agentDoc = await db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .get();

    const agentData = agentDoc.exists ? agentDoc.data() : {};
    const agentName = agentData.name || agentData.projectName || 'Assistant';

    // Get all chunks for this agent
    const chunksSnapshot = await db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('chunks')
      .get();

    if (chunksSnapshot.empty) {
      return {
        response: `I don't have any knowledge base to answer your question. Please train me with some documents first.`,
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
    
    // Sort by similarity and get top 2 most relevant chunks (reduced from 3)
    const topChunks = chunksWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 2);

    console.log(`🔍 Found ${topChunks.length} relevant chunks, top similarity: ${topChunks[0]?.similarity || 0}`);

    // Build context from relevant chunks (max 800 chars per chunk)
    const context = topChunks.map(chunk => chunk.content.substring(0, 800)).join('\n\n');
    
    // Extract enriched context from session data if available
    const userLocation = sessionData?.userInfo?.location;
    const hostname = userLocation?.hostname || '';
    const pathname = userLocation?.pathname || '/';
    const fullUrl = hostname ? `https://${hostname}${pathname}` : 'unknown';
    const pageContent = sessionData?.pageContent;
    const previousConversations = conversationHistory.length;
    const isReturningUser = sessionData?.userInfo?.isReturnUser || false;

    // Get saved user info from previous conversations
    const userSessionRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('sessions').doc(anonymousUserId);
    const existingSessionDoc = await userSessionRef.get();
    const savedUserName = existingSessionDoc.exists ? existingSessionDoc.data()?.userName : null;

    let pageContext = '';
    if (pageContent) {
      pageContext = `\n\nPAGE CONTEXT:
- URL: ${pageContent.url || fullUrl}
- Title: ${pageContent.title || 'Unknown'}
- Main Headings: ${pageContent.headings || 'None'}`;
    } else if (fullUrl !== 'unknown') {
      pageContext = `\n\nCONTEXT: User is currently on "${fullUrl}"`;
    }

    // Add enriched user analytics context
    const analytics = sessionData?.userAnalytics || {};
    let userContext = '';

    // Build comprehensive user profile
    if (analytics.visits > 0) {
      // Behavioral pattern
      const pattern = analytics.returning || 'new';
      const engagement = analytics.engagement || 0;
      const bounceRate = analytics.bounceRate || 0;

      userContext += `\n\nUSER PROFILE:`;

      // Visit pattern and engagement
      if (pattern === 'new' || pattern === 'second_time') {
        userContext += `\n- Status: ${pattern === 'new' ? 'First time visitor' : 'Second visit'} - be welcoming and helpful!`;
      } else {
        userContext += `\n- Status: ${pattern.charAt(0).toUpperCase() + pattern.slice(1)} visitor (${analytics.visits} visits)`;
      }

      // Engagement insights
      if (engagement >= 70) {
        userContext += `\n- Engagement: HIGH (${engagement}/100) - highly engaged user, values detailed answers`;
      } else if (engagement >= 40) {
        userContext += `\n- Engagement: Medium (${engagement}/100) - interested but selective`;
      } else if (pattern !== 'new') {
        userContext += `\n- Engagement: Low (${engagement}/100) - quick answers preferred`;
      }

      // Bounce behavior
      if (bounceRate > 50 && analytics.visits > 2) {
        userContext += `\n- Behavior: Tends to bounce quickly - provide concise, direct answers`;
      }

      // Activity metrics
      if (analytics.totalActive > 60) {
        const mins = Math.floor(analytics.totalActive / 60);
        userContext += `\n- Total time spent: ${mins}+ minutes across visits`;
      }

      if (analytics.pagesViewed > 1) {
        userContext += `\n- Explored ${analytics.pagesViewed} different pages`;
        if (analytics.topPage) {
          const topPageName = analytics.topPage.split('/').filter(p => p).pop() || 'homepage';
          userContext += ` (most time on: ${topPageName})`;
        }
      }

      // Widget interaction
      if (analytics.widgetOpens > 0) {
        userContext += `\n- Widget opens: ${analytics.widgetOpens} time${analytics.widgetOpens > 1 ? 's' : ''}`;
      }

      // Context clues
      if (analytics.referrer && analytics.referrer !== 'direct') {
        userContext += `\n- Came from: ${analytics.referrer}`;
      }

      // Device/browser for context
      if (analytics.device) {
        userContext += `\n- Device: ${analytics.device}`;
      }
    } else {
      // Fallback to basic info
      if (isReturningUser) {
        userContext += `\n\nUSER INFO: Returning user (${previousConversations > 0 ? `${previousConversations} previous messages` : 'first visit today'})`;
      } else {
        userContext += `\n\nUSER INFO: First time visitor`;
      }
    }

    // Count conversation messages (needed before name section)
    const conversationMessageCount = conversationHistory.length + 1; // +1 for current message

    // Build personalized user context for AI
    let personalizedContext = '';

    // User identity
    if (savedUserName) {
      personalizedContext += `\n👤 USER: ${savedUserName} (USE THEIR NAME!)`;
    } else if (conversationMessageCount <= 1) {
      personalizedContext += `\n👤 USER: Unknown - PROACTIVELY ASK: "May I know your name?" in your greeting`;
    } else {
      personalizedContext += `\n👤 USER: Unknown - ask naturally when appropriate`;
    }

    // Location
    if (userLocation?.city && userLocation?.country) {
      personalizedContext += `\n📍 LOCATION: ${userLocation.city}, ${userLocation.country}`;
    }

    // Behavior pattern
    const pattern = analytics.returning || 'new';
    const engagement = analytics.engagement || 0;

    if (pattern === 'new') {
      personalizedContext += `\n✨ STATUS: First-time visitor - be extra welcoming!`;
    } else if (pattern === 'frequent' || pattern === 'regular') {
      personalizedContext += `\n🌟 STATUS: ${pattern} visitor (${analytics.visits || 0} visits) - acknowledge their loyalty!`;
    }

    // Engagement level
    if (engagement >= 70) {
      personalizedContext += `\n💎 ENGAGEMENT: High (${engagement}/100) - they value detailed answers`;
    } else if (engagement >= 40) {
      personalizedContext += `\n📊 ENGAGEMENT: Medium (${engagement}/100) - balance detail with brevity`;
    } else if (pattern !== 'new') {
      personalizedContext += `\n⚡ ENGAGEMENT: Low (${engagement}/100) - keep answers concise`;
    }

    // Current page context
    if (pageContent?.url) {
      personalizedContext += `\n📄 CURRENT PAGE: ${pageContent.url}`;
      if (pageContent.title) {
        personalizedContext += ` - ${pageContent.title}`;
      }
    }

    // Device context
    if (analytics.device) {
      personalizedContext += `\n📱 DEVICE: ${analytics.device}`;
    }

    // ============================================
    // PHASE 1: QUICK RESPONSE (User waits here)
    // ============================================

    const quickMessages = [
      {
        role: "system",
        content: `You are ${agentName}, a warm and friendly customer service assistant${agentData.websiteUrl ? ` for ${agentData.websiteUrl}` : ''}.

${personalizedContext}

KNOWLEDGE BASE:
${context}

YOUR TASK:
1. ${!savedUserName && conversationMessageCount <= 1 ? '⚠️ CRITICAL: This is the first message and you don\'t know their name. YOU MUST ask "May I know your name?" in your greeting. This is MANDATORY.' : 'Answer the user\'s question naturally and conversationally'}
2. ONLY answer questions about ${agentName} - politely decline unrelated topics
3. If you don't have specific information, say: "I don't have that detail yet, but I can help with [related topic]"
4. Keep responses concise (2-3 sentences) unless complexity requires more
5. Use a warm, friendly tone - like a helpful human colleague

RESPOND WITH JSON ONLY:
{
  "reply": "your response (warm, natural, helpful)",
  "userName": "extract if user shares name this message (e.g. 'I'm John' or 'My name is Sarah' → extract 'John'/'Sarah'), otherwise null",
  "isRelevant": false (ONLY include if question is completely unrelated to ${agentName}),
  "relevanceScore": 0-100 (ONLY include if isRelevant=false)
}

RELEVANCE RULES:
- Assume isRelevant=true (don't include in JSON) if question is about ${agentName}
- ONLY include isRelevant=false if: recipes, coding, math, other companies/products
- If you don't know the answer but it's about ${agentName}, still isRelevant=true (just say you don't know)

Examples:
1. First message (no name): "Hello!" → {"reply": "Hi there! 👋 Welcome to ${agentName}. May I know your name? How can I help you today?"}
2. "What's your pricing?" → {"reply": "Let me help you with our pricing..."}
3. "How do I make pizza?" → {"reply": "I can only help with questions about ${agentName}. What would you like to know about our services?", "isRelevant": false, "relevanceScore": 0}
4. "I'm Sarah, what features do you have?" → {"reply": "Nice to meet you, Sarah! Let me tell you about our key features...", "userName": "Sarah"}`
      }
    ];

    // Add conversation history
    conversationHistory.forEach(msg => {
      quickMessages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current user message
    quickMessages.push({
      role: "user",
      content: message
    });

    console.log(`💬 Sending ${quickMessages.length} messages to AI (${conversationHistory.length} history)`);

    // Quick AI call
    const quickCompletion = await getOpenAI().chat.completions.create({
      model: "gpt-4.1-nano",
      messages: quickMessages,
      max_completion_tokens: 250,
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    let quickResponse;
    try {
      quickResponse = JSON.parse(quickCompletion.choices[0].message.content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      quickResponse = {
        reply: quickCompletion.choices[0].message.content,
        isRelevant: true
      };
    }

    const aiResponse = quickResponse.reply;
    const detectedUserName = quickResponse.userName || null;
    const isRelevant = quickResponse.isRelevant !== undefined ? quickResponse.isRelevant : true;
    const relevanceScore = quickResponse.relevanceScore || 100;

    console.log(`✅ Quick response generated (${aiResponse.length} chars)`);
    if (detectedUserName) console.log(`👤 Name detected: ${detectedUserName}`);
    if (!isRelevant) console.log(`⚠️ Irrelevant question detected (score: ${relevanceScore})`);

    // Filter irrelevant questions
    let finalResponse = aiResponse;
    if (!isRelevant || relevanceScore < 30) {
      finalResponse = `I can only help with questions about ${agentName}. Please ask me about our services, features, or how I can assist you! 😊`;
      console.log(`🚫 Replaced with redirect message`);
    }

    // Ensure anonymousUserId is defined
    const finalAnonymousUserId = anonymousUserId || `anon_${Date.now()}`;

    // Extract conversationId from sessionData
    const conversationId = sessionData?.currentConversation?.conversationId || `conv_${Date.now()}`;

    // New structure: users/{userId}/agents/{agentId}/sessions/{anonymousUserId}/conversations/{conversationId}
    const sessionRef = db.collection('users').doc(userId).collection('agents').doc(agentId).collection('sessions').doc(finalAnonymousUserId);
    const conversationRef = sessionRef.collection('conversations').doc(conversationId);

    // Check if user provided email in their message and save it
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = message.match(emailRegex);
    const userEmail = emailMatch ? emailMatch[0] : null;

    // Update session metadata (user-level)
    const sessionUpdateData = {
      anonymousUserId: finalAnonymousUserId,
      agentId: agentId,
      userInfo: sessionData?.userInfo || {},
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
      totalConversations: admin.firestore.FieldValue.increment(1)
    };

    // Add email if detected
    if (userEmail) {
      sessionUpdateData.userEmail = userEmail;
      console.log(`📧 User email detected and saved: ${userEmail}`);
    }

    // Add userName if detected by AI (only if not already saved)
    if (detectedUserName && !savedUserName) {
      sessionUpdateData.userName = detectedUserName;
      console.log(`👤 User name saved to session: ${detectedUserName}`);
    }

    await sessionRef.set(sessionUpdateData, { merge: true });

    // Update conversation metadata (minimal for Phase 1)
    await conversationRef.set({
      conversationId: conversationId,
      startedAt: sessionData?.currentConversation?.startedAt || admin.firestore.FieldValue.serverTimestamp(),
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
      messageCount: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    // Save user message
    const userMessageRef = conversationRef.collection('messages').doc();
    await userMessageRef.set({
      role: 'user',
      content: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Save assistant response
    const assistantMessageRef = conversationRef.collection('messages').doc();
    await assistantMessageRef.set({
      role: 'assistant',
      content: finalResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      relevantChunks: topChunks.map(chunk => ({
        content: chunk.content.substring(0, 100) + '...',
        similarity: chunk.similarity,
        source: chunk.source
      }))
    });

    console.log(`💾 Messages saved to Firestore`);

    // Update message usage AFTER successful chat
    await db.collection('users').doc(userId).update({
      messagesUsed: admin.firestore.FieldValue.increment(1)
    });

    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const currentMessagesUsed = updatedUserDoc.data()?.messagesUsed || 0;
    const messageLimit = updatedUserDoc.data()?.messageLimit || 100;
    console.log(`📊 Updated message usage: ${currentMessagesUsed}/${messageLimit}`);

    // ============================================
    // PHASE 2: BACKGROUND ANALYSIS (Async - every 10 messages)
    // ============================================

    const currentMessageCount = (conversationHistory.length + 2) / 2; // +2 for current pair, /2 for pairs

    if (currentMessageCount % 10 === 0) {
      console.log(`🔍 Triggering analysis (every 10 messages: ${currentMessageCount})`);

      performDetailedAnalysis(userId, agentId, finalAnonymousUserId, conversationId, {
        userMessage: message,
        aiResponse: finalResponse,
        conversationHistory,
        savedUserName: detectedUserName || savedUserName,
        analytics,
        userLocation,
        pageContent,
        agentName
      }).catch(err => {
        console.error('❌ Background analysis failed (non-blocking):', err);
      });
    }

    // Return immediately (user doesn't wait for analysis)
    return {
      response: finalResponse,
      userName: detectedUserName || savedUserName || null,
      sessionId: sessionId,
      relevantSources: topChunks.map(c => c.source),
      isRelevant: isRelevant
    };
    
  } catch (error) {
    console.error('❌ Error in chat:', error);

    // Re-throw limit error with proper structure
    if (error.code === 'LIMIT_REACHED') {
      throw error;
    }

    throw new Error(`Chat failed: ${error.message}`);
  }
}

// NEW FUNCTION: Background Analysis (runs every 10 messages)
async function performDetailedAnalysis(userId, agentId, anonymousUserId, conversationId, data) {
  try {
    console.log('🔬 Starting detailed analysis (background)...');

    // Get all messages in conversation for full context
    const conversationRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('sessions').doc(anonymousUserId)
      .collection('conversations').doc(conversationId);

    const messagesSnapshot = await conversationRef.collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(20) // Last 20 messages for analysis
      .get();

    const messages = messagesSnapshot.docs
      .reverse()
      .map(doc => doc.data())
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      await delay(MIN_API_INTERVAL - timeSinceLastCall);
    }
    lastApiCall = Date.now();

    // Detailed analysis with AI
    const analysisCompletion = await getOpenAI().chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `You are a customer service conversation analyst. Analyze the last 10 message pairs.

User: ${data.savedUserName || 'Unknown'}
Behavior: ${data.analytics.returning || 'new'} visitor, ${data.analytics.engagement || 0}/100 engagement
Location: ${data.userLocation?.city || 'Unknown'}

CONVERSATION:
${messages}

RESPOND WITH JSON - OMIT FIELDS WITH NO MEANINGFUL DATA (null/false/neutral/0):
{
  "overallSentiment": "positive|negative" (OMIT if neutral),
  "sentimentScore": 1-10 (ONLY if overallSentiment present),
  "primaryCategory": "Support|Sales|Question|Complaint" (ONLY if clear pattern),
  "primaryIntent": "support|sales|information|browsing" (ONLY if clear),
  "averageUrgency": 1-10 (ONLY if >=6),
  "knowledgeGaps": ["topic1", "topic2"] (ONLY if we failed to answer multiple times),
  "shouldCreateTicket": true (ONLY if: frustrated user OR unresolved issues OR explicit request),
  "ticketReason": "brief reason" (ONLY if shouldCreateTicket=true),
  "conversationSummary": "1-2 sentence summary of entire conversation",
  "keyTopics": ["topic1", "topic2", "topic3"] (main topics discussed)
}

Examples:
1. Simple Q&A (no issues) → {"conversationSummary": "User asked about features", "keyTopics": ["features"]}
2. Frustrated user → {"overallSentiment": "negative", "sentimentScore": 3, "shouldCreateTicket": true, "ticketReason": "Unresolved technical issue", ...}
3. Sales inquiry → {"primaryIntent": "sales", "primaryCategory": "Sales", ...}`
        }
      ],
      max_completion_tokens: 300,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(analysisCompletion.choices[0].message.content);

    console.log('✅ Analysis complete:', analysis);

    // Save to Firestore
    await conversationRef.update({
      detailedAnalysis: analysis,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      analyzed: true
    });

    // Process knowledge gaps
    if (analysis.knowledgeGaps && analysis.knowledgeGaps.length > 0) {
      console.log(`📚 Processing ${analysis.knowledgeGaps.length} knowledge gaps`);
      for (const gap of analysis.knowledgeGaps) {
        await processKnowledgeGap(userId, agentId, gap, messages).catch(err => {
          console.error(`Failed to process knowledge gap "${gap}":`, err);
        });
      }
    }

    // Create ticket if needed
    if (analysis.shouldCreateTicket) {
      console.log(`🎫 Creating support ticket: ${analysis.ticketReason}`);

      const sessionDoc = await db.collection('users').doc(userId)
        .collection('agents').doc(agentId)
        .collection('sessions').doc(anonymousUserId)
        .get();

      const userEmail = sessionDoc.exists ? sessionDoc.data()?.userEmail : null;

      if (userEmail) {
        await createTicket(userId, agentId, anonymousUserId, conversationId, {
          email: userEmail,
          category: analysis.primaryCategory || 'Support',
          urgency: analysis.averageUrgency || 5,
          ticketReason: analysis.ticketReason,
          userSentiment: analysis.overallSentiment || 'neutral',
          userSentimentScore: analysis.sentimentScore || 5,
          aiConfidence: 50
        });

        console.log('✅ Ticket created successfully');
      } else {
        console.log('⚠️ Cannot create ticket - no email available');
      }
    }

    console.log('✅ Background analysis complete');

  } catch (error) {
    console.error('❌ Background analysis error:', error);
    // Don't throw - this is non-blocking
  }
}

// Process knowledge gap: categorize and group similar questions
async function processKnowledgeGap(userId, agentId, unansweredQuestion, originalMessage) {
  try {
    console.log(`📚 Processing knowledge gap: "${unansweredQuestion}"`);

    // Get existing knowledge gaps for this agent
    const knowledgeGapsRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('knowledgeGaps');

    const existingGaps = await knowledgeGapsRef.get();
    const existingGapsList = existingGaps.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      await delay(MIN_API_INTERVAL - timeSinceLastCall);
    }
    lastApiCall = Date.now();

    // Ask AI to categorize and find similar existing gaps
    const categorizationPrompt = `You are analyzing a knowledge gap in a customer service chatbot.

NEW UNANSWERED QUESTION: "${unansweredQuestion}"
ORIGINAL USER MESSAGE: "${originalMessage}"

EXISTING KNOWLEDGE GAPS:
${existingGapsList.length > 0 ? existingGapsList.map((gap, idx) =>
  `${idx + 1}. Category: "${gap.category}", Question: "${gap.representativeQuestion}" (asked ${gap.count} times)`
).join('\n') : 'No existing gaps yet.'}

Your task:
1. If this question is similar to an existing gap, return the existing gap's ID
2. If it's a new topic, create a new category name and representative question

Respond with valid JSON only:
{
  "matchesExisting": true | false,
  "existingGapId": "doc-id or null",
  "category": "Brief category name (e.g., 'Shipping & Delivery', 'Pricing Plans', 'Technical Support')",
  "representativeQuestion": "A clear, general version of the question",
  "confidence": 0.0-1.0
}

Guidelines:
- Categories should be broad but clear (2-4 words max)
- Representative question should be the simplest form (e.g., "refund policy" not "I want to know about your refund policy")
- Match existing if >70% similar in topic
- Be consistent with existing category naming`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "You are an AI knowledge base analyst. Always respond with valid JSON for categorizing customer questions."
        },
        {
          role: "user",
          content: categorizationPrompt
        }
      ],
      max_completion_tokens: 200,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const categorization = JSON.parse(completion.choices[0].message.content);
    console.log(`🔍 Categorization result:`, categorization);

    // Update or create knowledge gap
    if (categorization.matchesExisting && categorization.existingGapId) {
      // Increment existing gap
      const existingGapRef = knowledgeGapsRef.doc(categorization.existingGapId);
      await existingGapRef.update({
        count: admin.firestore.FieldValue.increment(1),
        lastAsked: admin.firestore.FieldValue.serverTimestamp(),
        recentQuestions: admin.firestore.FieldValue.arrayUnion({
          question: unansweredQuestion,
          askedAt: new Date().toISOString()
        })
      });
      console.log(`✅ Updated existing gap: ${categorization.existingGapId}`);
    } else {
      // Create new knowledge gap
      await knowledgeGapsRef.add({
        category: categorization.category,
        representativeQuestion: categorization.representativeQuestion,
        count: 1,
        firstAsked: admin.firestore.FieldValue.serverTimestamp(),
        lastAsked: admin.firestore.FieldValue.serverTimestamp(),
        recentQuestions: [{
          question: unansweredQuestion,
          askedAt: new Date().toISOString()
        }],
        resolved: false
      });
      console.log(`✅ Created new knowledge gap: ${categorization.category}`);
    }

  } catch (error) {
    console.error('❌ Error processing knowledge gap:', error);
    throw error;
  }
}

// Create a support ticket
async function createTicket(userId, agentId, anonymousUserId, conversationId, ticketData) {
  try {
    console.log(`🎫 Creating ticket for conversation ${conversationId}`);

    // Get conversation summary
    const conversationRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('sessions').doc(anonymousUserId)
      .collection('conversations').doc(conversationId);

    const conversationDoc = await conversationRef.get();
    const conversationData = conversationDoc.exists ? conversationDoc.data() : {};

    // Get session data for user info
    const sessionRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('sessions').doc(anonymousUserId);

    const sessionDoc = await sessionRef.get();
    const sessionData = sessionDoc.exists ? sessionDoc.data() : {};

    // Generate AI summary of the conversation
    let summary = conversationData.analysisReason || ticketData.ticketReason || 'Support request';

    // Get messages for detailed summary
    const messagesSnapshot = await conversationRef.collection('messages').orderBy('timestamp', 'asc').get();
    if (!messagesSnapshot.empty) {
      const messages = messagesSnapshot.docs.map(doc => doc.data());
      const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      // Generate better summary with AI
      try {
        const now = Date.now();
        const timeSinceLastCall = now - lastApiCall;
        if (timeSinceLastCall < MIN_API_INTERVAL) {
          await delay(MIN_API_INTERVAL - timeSinceLastCall);
        }
        lastApiCall = Date.now();

        const summaryCompletion = await getOpenAI().chat.completions.create({
          model: "gpt-4.1-nano",
          messages: [
            {
              role: "system",
              content: "You are a support ticket summarizer. Create a brief, clear 1-2 sentence summary of the user's issue."
            },
            {
              role: "user",
              content: `Summarize this support conversation:\n\n${conversationText}`
            }
          ],
          max_completion_tokens: 100,
          temperature: 0.3
        });

        summary = summaryCompletion.choices[0].message.content;
      } catch (summaryError) {
        console.error('❌ Failed to generate AI summary:', summaryError);
        // Keep existing summary
      }
    }

    // Create ticket document
    const ticketRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('tickets').doc();

    const ticketDocument = {
      ticketId: ticketRef.id,
      email: ticketData.email,
      conversationId: conversationId,
      sessionId: anonymousUserId,
      category: ticketData.category || 'Support',
      urgency: ticketData.urgency || 5,
      status: 'open',
      summary: summary,
      ticketReason: ticketData.ticketReason,
      userSentiment: ticketData.userSentiment || 'neutral',
      userSentimentScore: ticketData.userSentimentScore || 5,
      aiConfidence: ticketData.aiConfidence || 50,
      userInfo: {
        location: sessionData.userInfo?.location || {},
        device: sessionData.userInfo?.device || {},
        language: sessionData.userInfo?.language || 'en-US'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await ticketRef.set(ticketDocument);

    console.log(`✅ Ticket ${ticketRef.id} created successfully`);

    return ticketRef.id;

  } catch (error) {
    console.error('❌ Error creating ticket:', error);
    throw error;
  }
}

// Analyze conversation immediately after shouldAnalyze=true
async function analyzeConversationImmediately(userId, agentId, anonymousUserId, conversationId) {
  try {
    console.log(`🔍 Starting immediate analysis for conversation ${conversationId}`);

    const conversationRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('sessions').doc(anonymousUserId)
      .collection('conversations').doc(conversationId);

    // Get conversation doc
    const conversationDoc = await conversationRef.get();
    if (!conversationDoc.exists) {
      console.log('⏭️  Conversation not found, skipping analysis');
      return;
    }

    // Get all messages in this conversation
    const messagesSnapshot = await conversationRef.collection('messages').orderBy('timestamp', 'asc').get();
    if (messagesSnapshot.empty) {
      console.log('⏭️  No messages found, skipping analysis');
      return;
    }

    const messages = messagesSnapshot.docs.map(doc => doc.data());
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    // Skip if too short
    const wordCount = conversationText.split(/\s+/).length;
    if (wordCount < 10) {
      console.log(`⏭️  Conversation too short (${wordCount} words), skipping analysis`);
      await conversationRef.update({
        analyzed: true,
        analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        skipped: true,
        reason: 'Too short'
      });
      return;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      await delay(MIN_API_INTERVAL - timeSinceLastCall);
    }
    lastApiCall = Date.now();

    // Analyze with OpenAI
    const analysisPrompt = `Analyze this customer service conversation and provide insights in JSON format.

Conversation:
${conversationText}

Respond with valid JSON only:
{
  "summary": "Brief 1-2 sentence summary of the conversation",
  "mainCategory": "Feedback|Question|Support Request|Sales Inquiry|Bug Report|General",
  "subCategory": "Specific topic (max 50 chars)",
  "sentimentScore": 1-10,
  "intent": "support|sales|information|general",
  "urgency": "low|medium|high",
  "keyTopics": ["topic1", "topic2"],
  "resolved": true or false
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "You are an AI conversation analyst. Always respond with valid JSON containing analysis results."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_completion_tokens: 300,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const analysisText = completion.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    console.log(`✅ Analysis complete for conversation ${conversationId}: ${analysis.mainCategory} - ${analysis.subCategory}`);

    // Save analysis (keep messages for viewing)
    await conversationRef.update({
      analyzed: true,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      analysis: analysis,
      messageCount: messages.length,
      conversationSummary: {
        firstMessage: messages[0].content.substring(0, 200),
        lastMessage: messages[messages.length - 1].content.substring(0, 200)
      }
    });

    console.log(`✅ Analysis saved, messages preserved for conversation ${conversationId}`);

  } catch (error) {
    console.error('❌ Error in immediate analysis:', error);
    throw error;
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


// AI-powered message analysis endpoint
// Get agent config (public endpoint - no auth required)
exports.getAgentConfig = onRequest({
  timeoutSeconds: 30,
  memory: '256MiB',
  cors: true
}, async (request, response) => {
  // Set CORS headers
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    const { agentId } = request.query || request.body;

    if (!agentId) {
      response.status(400).json({ error: 'agentId is required' });
      return;
    }

    // Use agentIndex for fast lookup
    const agentIndexRef = await db.collection('agentIndex').doc(agentId).get();

    if (!agentIndexRef.exists) {
      response.status(404).json({ error: 'Agent not found' });
      return;
    }

    const agentIndex = agentIndexRef.data();
    const userId = agentIndex.userId;

    // Get agent data
    const agentRef = await db.collection('users').doc(userId)
      .collection('agents').doc(agentId).get();

    if (!agentRef.exists) {
      response.status(404).json({ error: 'Agent not found' });
      return;
    }

    const agentData = agentRef.data();

    // Get user's subscription plan for whitelabel support
    const userDoc = await db.collection('users').doc(userId).get();
    const userDocData = userDoc.data();
    const subscriptionPlan = userDocData?.subscriptionPlan || 'free';
    const isWhitelabel = subscriptionPlan === 'growth' || subscriptionPlan === 'scale';

    // Return only safe, public fields
    response.status(200).json({
      projectName: agentData.projectName || agentData.name || 'Assistant',
      logoUrl: agentData.logoUrl || null,
      userIcon: agentData.userIcon || 'alien',
      primaryColor: agentData.primaryColor || '#f97316',
      returnUserDiscount: agentData.returnUserDiscount || null,
      firstTimeDiscount: agentData.firstTimeDiscount || null,
      popups: agentData.popups || [], // New popups array
      whitelabel: isWhitelabel // Growth and Scale plans get whitelabel
    });

  } catch (error) {
    console.error('Get agent config error:', error);
    response.status(500).json({ error: 'Failed to get agent config' });
  }
});

exports.fetchWebsiteMetadata = onCall({
  timeoutSeconds: 30,
  memory: '256MiB'
}, async (request) => {
  try {
    const { url } = request.data;

    if (!url) {
      throw new Error('URL is required');
    }

    console.log('📡 Fetching metadata for:', url);

    // Fetch the website HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MetadataBot/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Extract metadata using regex (simple parsing)
    const getMetaContent = (property, attribute = 'property') => {
      const regex = new RegExp(`<meta\\s+${attribute}=["']${property}["']\\s+content=["']([^"']+)["']`, 'i');
      const match = html.match(regex);
      return match ? match[1] : null;
    };

    const getTitleContent = () => {
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return match ? match[1].trim() : null;
    };

    // Try to get site name from various sources
    const ogSiteName = getMetaContent('og:site_name');
    const ogTitle = getMetaContent('og:title');
    const twitterTitle = getMetaContent('twitter:title', 'name');
    const pageTitle = getTitleContent();
    const ogDescription = getMetaContent('og:description');
    const metaDescription = getMetaContent('description', 'name');

    const siteName = ogSiteName || ogTitle || twitterTitle || pageTitle || new URL(url).hostname;
    const description = ogDescription || metaDescription || '';

    console.log('✅ Metadata extracted:', { siteName, description: description.substring(0, 100) });

    return {
      siteName: siteName.trim(),
      description: description.trim().slice(0, 200),
      success: true
    };

  } catch (error) {
    console.error('❌ Error fetching metadata:', error);
    throw new Error(`Failed to fetch metadata: ${error.message}`);
  }
});

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

    // Get agent data for context using agentIndex
    const agentIndexRef = await db.collection('agentIndex').doc(agentId).get();

    if (!agentIndexRef.exists) {
      response.status(404).json({ error: 'Agent not found' });
      return;
    }

    const agentIndex = agentIndexRef.data();
    const userId = agentIndex.userId;

    const agentRef = await db.collection('users').doc(userId)
      .collection('agents').doc(agentId).get();

    if (!agentRef.exists) {
      response.status(404).json({ error: 'Agent not found' });
      return;
    }

    const agent = agentRef.data();

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
      model: "gpt-4.1-nano",
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

// Stripe Price IDs Configuration
const STRIPE_PRICES = {
  starter_monthly: 'price_1SEtjICw3gxLTtQCr7xvDdR0',
  starter_yearly: 'price_1SEtjICw3gxLTtQCC6fIugqt',
  growth_monthly: 'price_1SEtjuCw3gxLTtQChEonKkz1',
  growth_yearly: 'price_1SEtjuCw3gxLTtQCa4MZ13YJ',
  scale_monthly: 'price_1SEtkRCw3gxLTtQCXUDDMDiD',
  scale_yearly: 'price_1SEtkRCw3gxLTtQCtNWV255C'
};

// Create Stripe Checkout Session
exports.createCheckoutSession = onCall({ cors: true }, async (request) => {
  try {
    const { priceId, userId } = request.data;

    if (!priceId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Get or create Stripe customer
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    let customerId = userData?.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData?.email,
        metadata: {
          firebaseUID: userId
        }
      });
      customerId = customer.id;

      // Save customer ID to Firestore
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId
      });
    }

    // Determine if this is a monthly plan and suggest yearly alternative
    const isMonthly = priceId === STRIPE_PRICES.starter_monthly ||
                     priceId === STRIPE_PRICES.growth_monthly ||
                     priceId === STRIPE_PRICES.scale_monthly;

    let discounts = undefined;

    // If monthly, suggest yearly plan with discount
    if (isMonthly) {
      let yearlyPriceId;
      if (priceId === STRIPE_PRICES.starter_monthly) yearlyPriceId = STRIPE_PRICES.starter_yearly;
      else if (priceId === STRIPE_PRICES.growth_monthly) yearlyPriceId = STRIPE_PRICES.growth_yearly;
      else if (priceId === STRIPE_PRICES.scale_monthly) yearlyPriceId = STRIPE_PRICES.scale_yearly;

      // Add yearly price as alternative
      discounts = [{
        promotion_code: undefined // Will show coupon field
      }];
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true, // Enable coupon codes
      success_url: `${request.rawRequest.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.rawRequest.headers.origin}/dashboard/billing`,
      metadata: {
        userId: userId
      }
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Create checkout session error:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
});

// Create Customer Portal Session
exports.createPortalSession = onCall({ cors: true }, async (request) => {
  try {
    const { userId } = request.data;

    if (!userId) {
      throw new Error('Missing userId');
    }

    // Get Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${request.rawRequest.headers.origin}/dashboard/billing`,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Create portal session error:', error);
    throw new Error(`Failed to create portal session: ${error.message}`);
  }
});

// Stripe Webhook Handler
exports.stripeWebhook = onRequest({ cors: true }, async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⛔ Webhook signature verification failed:', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Webhook received: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const previousAttributes = event.data.previous_attributes;

        // Only process when status changes to 'active' (initial purchase completion)
        if (previousAttributes?.status === 'incomplete' && subscription.status === 'active') {
          console.log('🎉 New subscription activated!');

          const customer = subscription.customer;
          const priceId = subscription.items.data[0].price.id;
          const subscriptionId = subscription.id;

          // Find user by customer ID
          const usersSnapshot = await db.collection('users')
            .where('stripeCustomerId', '==', customer)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userDoc = usersSnapshot.docs[0];

            // Determine plan based on price ID
            let planName = 'free';
            let messageLimit = 100;
            let agentLimit = 1;

            if (priceId === STRIPE_PRICES.starter_monthly || priceId === STRIPE_PRICES.starter_yearly) {
              planName = 'starter';
              messageLimit = 1500;
              agentLimit = 1;
            } else if (priceId === STRIPE_PRICES.growth_monthly || priceId === STRIPE_PRICES.growth_yearly) {
              planName = 'growth';
              messageLimit = 7500;
              agentLimit = 5;
            } else if (priceId === STRIPE_PRICES.scale_monthly || priceId === STRIPE_PRICES.scale_yearly) {
              planName = 'scale';
              messageLimit = 50000;
              agentLimit = -1; // Unlimited
            }

            // Update user with subscription info
            const subscriptionItem = subscription.items.data[0];
            await userDoc.ref.update({
              subscriptionStatus: 'active',
              subscriptionPlan: planName,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              messageLimit: messageLimit,
              agentLimit: agentLimit,
              currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
              updatedAt: new Date().toISOString()
            });

            console.log(`✅ User ${userDoc.id} upgraded to ${planName} plan`);
          }
        } else {
          // Other updates (renewals, etc.)
          console.log(`📝 Subscription updated: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = subscription.customer;

        // Find user by customer ID
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customer)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'canceled',
            subscriptionPlan: 'free',
            stripeSubscriptionId: null,
            stripePriceId: null,
            messageLimit: 100,
            agentLimit: 1,
            messagesUsed: 0,
            updatedAt: new Date().toISOString()
          });

          console.log(`❌ Subscription canceled for user ${userDoc.id}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customer = invoice.customer;
        const billingReason = invoice.billing_reason;

        // Get subscription ID from new API structure
        const subscriptionId = invoice.parent?.subscription_details?.subscription || invoice.subscription;

        if (!subscriptionId) {
          console.log('⚠️  No subscription ID found in invoice');
          break;
        }

        // Find user by customer ID
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customer)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];

          // Prepare billing record
          const billingRecord = {
            invoiceId: invoice.id,
            subscriptionId: subscriptionId,
            amount: invoice.amount_paid / 100, // Convert cents to dollars
            currency: invoice.currency.toUpperCase(),
            status: invoice.status,
            billingReason: billingReason,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
            paidAt: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
            periodStart: new Date(invoice.period_start * 1000).toISOString(),
            periodEnd: new Date(invoice.period_end * 1000).toISOString(),
            createdAt: new Date().toISOString()
          };

          // Save billing record to user's billings subcollection
          await userDoc.ref.collection('billings').doc(invoice.id).set(billingRecord);

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;

          // Determine plan based on price ID
          let planName = 'free';
          let messageLimit = 100;
          let agentLimit = 1;

          if (priceId === STRIPE_PRICES.starter_monthly || priceId === STRIPE_PRICES.starter_yearly) {
            planName = 'starter';
            messageLimit = 1500;
            agentLimit = 1;
          } else if (priceId === STRIPE_PRICES.growth_monthly || priceId === STRIPE_PRICES.growth_yearly) {
            planName = 'growth';
            messageLimit = 7500;
            agentLimit = 5;
          } else if (priceId === STRIPE_PRICES.scale_monthly || priceId === STRIPE_PRICES.scale_yearly) {
            planName = 'scale';
            messageLimit = 50000;
            agentLimit = -1; // Unlimited
          }

          // If this is a subscription_create (initial payment), update full subscription info
          if (billingReason === 'subscription_create') {
            await userDoc.ref.update({
              subscriptionStatus: 'active',
              subscriptionPlan: planName,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              messageLimit: messageLimit,
              agentLimit: agentLimit,
              messagesUsed: 0,
              currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              updatedAt: new Date().toISOString()
            });
            console.log(`💰 Initial payment: User ${userDoc.id} upgraded to ${planName} plan`);
          }
          // If this is a subscription_cycle (renewal), just reset message usage
          else if (billingReason === 'subscription_cycle') {
            await userDoc.ref.update({
              messagesUsed: 0,
              currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
              updatedAt: new Date().toISOString()
            });
            console.log(`🔄 Monthly renewal: messagesUsed reset for user ${userDoc.id}`);
          }

          console.log(`📄 Invoice saved: ${invoice.id} (${billingReason})`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer = invoice.customer;

        // Find user by customer ID
        const usersSnapshot = await db.collection('users')
          .where('stripeCustomerId', '==', customer)
          .limit(1)
          .get();

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await userDoc.ref.update({
            subscriptionStatus: 'past_due',
            updatedAt: new Date().toISOString()
          });

          console.log(`⚠️  Payment failed for user ${userDoc.id}`);
        }
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    response.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    response.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Scheduled function to analyze old sessions (runs every 30 minutes)
// DEPRECATED: Old cron job system - replaced with real-time analysis
// Keeping this commented out for reference in case we need batch processing in the future
/*
exports.analyzeOldSessions = onSchedule('every 30 minutes', async (event) => {
  // This function has been replaced with real-time analysis in processChatMessage()
  // Analysis now happens immediately when shouldAnalyze='true'
  console.log('⚠️  This cron job is deprecated. Using real-time analysis instead.');
});
*/

// Fill Knowledge Gap - Enhance user answer and add to knowledge base
exports.fillKnowledgeGap = onRequest({
  timeoutSeconds: 60,
  memory: '512MiB',
  cors: true
}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, agentId, gapId, question, userAnswer } = req.body;

    if (!userId || !agentId || !gapId || !question || !userAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the knowledge gap to get category
    const gapRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('knowledgeGaps').doc(gapId);

    const gapDoc = await gapRef.get();
    const gapData = gapDoc.exists ? gapDoc.data() : {};

    const openai = getOpenAI();

    // Step 1: Enhance the answer using AI
    const enhancementPrompt = `You are a professional knowledge base editor. A user has provided an answer to a customer question.
Your task is to enhance and format this answer to be clear, professional, and comprehensive.

Question: ${question}

User's Answer: ${userAnswer}

Please enhance this answer to:
1. Be clear and professional
2. Be comprehensive but concise
3. Use proper formatting with bullet points or numbered lists where appropriate
4. Include relevant details that might help answer similar questions
5. Maintain a helpful and friendly tone

Return ONLY the enhanced answer, without any preamble or explanation.`;

    const enhancementResponse = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: 'You are a professional knowledge base editor.' },
        { role: 'user', content: enhancementPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const enhancedAnswer = enhancementResponse.choices[0].message.content.trim();

    // Step 2: Generate embedding for the Q&A pair (using same model as trainAgent)
    const contentForEmbedding = `Question: ${question}\n\nAnswer: ${enhancedAnswer}`;

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: contentForEmbedding
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Step 3: Add to knowledge base as a new chunk
    const chunkRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('chunks').doc();

    await chunkRef.set({
      id: chunkRef.id,
      content: contentForEmbedding, // Use 'content' to match existing chunks structure
      embedding: embedding,
      source: 'knowledge_gap',
      sourceId: gapId,
      index: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        fileType: 'knowledge_gap',
        fileName: `Knowledge Gap: ${gapData.category || 'General'}`,
        chunkIndex: 0,
        totalChunks: 1,
        originalSize: contentForEmbedding.length,
        embeddingModel: 'text-embedding-ada-002',
        question: question,
        answer: enhancedAnswer,
        originalAnswer: userAnswer,
        enhanced: true,
        addedBy: 'user'
      }
    });

    // Step 4: Mark the knowledge gap as filled
    await gapRef.update({
      filled: true,
      filledAt: admin.firestore.FieldValue.serverTimestamp(),
      chunkId: chunkRef.id,
      enhancedAnswer: enhancedAnswer
    });

    // Step 5: Optionally delete the gap (or keep it for history)
    // await gapRef.delete();

    console.log(`✅ Knowledge gap filled for agent ${agentId}: ${question}`);

    return res.status(200).json({
      success: true,
      chunkId: chunkRef.id,
      enhancedAnswer: enhancedAnswer
    });

  } catch (error) {
    console.error('Error filling knowledge gap:', error);
    return res.status(500).json({
      error: 'Failed to fill knowledge gap',
      details: error.message
    });
  }
});

// Initialize user document on first sign-in
// Add new training data (append to existing chunks)
exports.addTrainingData = onCall({
  timeoutSeconds: 300,
  memory: '512MiB'
}, async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId, trainingText } = request.data;
  const userId = request.auth.uid;

  try {
    console.log('📝 Adding new training data for agent:', agentId);

    // Chunk the text
    const chunks = chunkText(trainingText);
    console.log(`✂️ Created ${chunks.length} chunks from new training text`);

    const agentRef = db.collection('users').doc(userId).collection('agents').doc(agentId);
    const allChunks = [];

    // Create embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastCall = now - lastApiCall;
        if (timeSinceLastCall < MIN_API_INTERVAL) {
          await delay(MIN_API_INTERVAL - timeSinceLastCall);
        }
        lastApiCall = now;

        // Generate embedding
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
          embedding: embedding,
          source: 'Added Training Content',
          sourceId: `added-${Date.now()}`,
          index: i,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            fileType: 'text/plain',
            fileName: 'Added Training Content',
            chunkIndex: i,
            totalChunks: chunks.length,
            originalSize: trainingText.length,
            embeddingModel: "text-embedding-ada-002"
          }
        };

        await chunkRef.set(chunkData);
        allChunks.push(chunkData);

        console.log(`✅ Created embedding for chunk ${i + 1}/${chunks.length}`);
      } catch (error) {
        console.error(`❌ Error creating embedding for chunk ${i}:`, error);
      }
    }

    // Update agent total chunks
    await agentRef.update({
      totalChunks: admin.firestore.FieldValue.increment(chunks.length),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Added ${allChunks.length} new chunks to agent ${agentId}`);

    return {
      success: true,
      chunksAdded: allChunks.length,
      message: 'Training data added successfully'
    };

  } catch (error) {
    console.error('❌ Error adding training data:', error);
    throw new Error(`Failed to add training data: ${error.message}`);
  }
});

// Update chunk with AI (intelligently replace specific info)
exports.updateChunkWithAI = onCall({
  timeoutSeconds: 120,
  memory: '512MiB'
}, async (request) => {
  if (!request.auth) {
    throw new Error('User must be authenticated');
  }

  const { agentId, chunkId, oldInfo, newInfo, originalContent } = request.data;
  const userId = request.auth.uid;

  try {
    console.log(`🤖 Updating chunk ${chunkId} with AI`);
    console.log(`📝 Replacing "${oldInfo}" with "${newInfo}"`);

    // Use AI to intelligently update the chunk content
    const updatePrompt = `You are a precise text editor. Update the following text by replacing "${oldInfo}" with "${newInfo}", while keeping everything else exactly the same.

Original text:
${originalContent}

Instructions:
- Only replace "${oldInfo}" with "${newInfo}"
- Keep all other text, formatting, and structure identical
- If the old info appears multiple times, replace all occurrences
- Return ONLY the updated text, no explanations

Updated text:`;

    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      await delay(MIN_API_INTERVAL - timeSinceLastCall);
    }
    lastApiCall = Date.now();

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "You are a precise text editor. Only make the requested changes, nothing more."
        },
        {
          role: "user",
          content: updatePrompt
        }
      ],
      max_completion_tokens: 2000,
      temperature: 0.1
    });

    const updatedContent = completion.choices[0].message.content.trim();
    console.log(`✅ AI updated the content`);

    // Generate new embedding for updated content
    const embeddingResponse = await getOpenAI().embeddings.create({
      model: "text-embedding-ada-002",
      input: updatedContent,
    });

    const newEmbedding = embeddingResponse.data[0].embedding;

    // Update the chunk in Firestore
    const chunkRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('chunks').doc(chunkId);

    await chunkRef.update({
      content: updatedContent,
      embedding: newEmbedding,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      'metadata.lastUpdated': new Date().toISOString(),
      'metadata.updateHistory': admin.firestore.FieldValue.arrayUnion({
        oldInfo: oldInfo,
        newInfo: newInfo,
        updatedAt: new Date().toISOString()
      })
    });

    console.log(`✅ Chunk ${chunkId} updated successfully`);

    return {
      success: true,
      updatedContent: updatedContent,
      message: 'Chunk updated successfully'
    };

  } catch (error) {
    console.error('❌ Error updating chunk:', error);
    throw new Error(`Failed to update chunk: ${error.message}`);
  }
});

exports.initializeUser = onCall({ cors: true }, async (request) => {
  try {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    // Only create if doesn't exist
    if (!userDoc.exists) {
      console.log('📝 Creating new user document for:', userId);

      const userData = {
        displayName: request.auth.token.name || 'User',
        email: request.auth.token.email,
        photoURL: request.auth.token.picture || null,
        subscriptionStatus: 'free',
        subscriptionPlan: 'free',
        messageLimit: 100,
        messagesUsed: 0,
        agentLimit: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await userRef.set(userData);
      console.log('✅ User document created successfully!');

      // Send welcome email
      if (userData.email) {
        await sendEmail({
          to: userData.email,
          subject: '🎉 Welcome to Orchis!',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #f97316; font-size: 28px; margin-bottom: 20px;">🎉 Welcome to Orchis!</h1>

              <p style="font-size: 16px; color: #44403c; line-height: 1.6;">
                Hey ${userData.displayName}!
              </p>

              <p style="font-size: 16px; color: #44403c; line-height: 1.6;">
                You're all set! Now let's create your first AI agent and start automating customer support.
              </p>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 8px 0; color: #78350f;">Quick Start:</h3>
                <ul style="margin: 8px 0; padding-left: 20px; color: #78350f;">
                  <li>Create your AI agent</li>
                  <li>Upload your knowledge base</li>
                  <li>Embed widget on your website</li>
                </ul>
              </div>

              <a href="https://orchis.app/dashboard"
                 style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px;">
                Create Your First Agent →
              </a>

              <p style="margin-top: 32px; color: #78716c; font-size: 14px;">
                Need help? Reply to this email anytime!
              </p>

              <p style="color: #a8a29e; font-size: 12px; margin-top: 24px;">
                — Team Orchis
              </p>
            </div>
          `
        });
        console.log('📧 Welcome email sent to:', userData.email);
      }

      return { success: true, created: true, userData };
    }

    console.log('✅ User document already exists');
    return { success: true, created: false, userData: userDoc.data() };

  } catch (error) {
    console.error('❌ Error initializing user:', error);
    throw new Error('Failed to initialize user: ' + error.message);
  }
});

// Get admin stats with enriched analytics
exports.getAdminStats = onCall({ cors: true }, async (request) => {
  try {
    console.log('📊 Fetching admin stats...');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Count users by subscription plan
    const planDistribution = {
      free: 0,
      starter: 0,
      growth: 0,
      scale: 0
    };

    let totalAgents = 0;
    let totalConversations = 0;
    let totalMessages = 0;

    // Analytics aggregates
    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    const categoryBreakdown = { Support: 0, Sales: 0, Question: 0, Complaint: 0, General: 0 };
    const intentBreakdown = { question: 0, complaint: 0, browsing: 0, purchase: 0, greeting: 0 };
    let urgentMessages = 0; // urgency >= 7
    let ticketSuggestions = 0;
    let irrelevantQuestions = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const plan = userData.subscriptionPlan || 'free';

      // Count plan distribution
      if (planDistribution.hasOwnProperty(plan)) {
        planDistribution[plan]++;
      }

      // Get agents for this user
      const agentsSnapshot = await userDoc.ref.collection('agents').get();
      totalAgents += agentsSnapshot.size;

      // For each agent, get sessions and analyze messages
      for (const agentDoc of agentsSnapshot.docs) {
        const sessionsSnapshot = await agentDoc.ref.collection('sessions').get();

        for (const sessionDoc of sessionsSnapshot.docs) {
          const conversationsSnapshot = await sessionDoc.ref.collection('conversations').get();
          totalConversations += conversationsSnapshot.size;

          for (const conversationDoc of conversationsSnapshot.docs) {
            const messagesSnapshot = await conversationDoc.ref.collection('messages')
              .where('role', '==', 'assistant')
              .get();

            for (const messageDoc of messagesSnapshot.docs) {
              const messageData = messageDoc.data();
              totalMessages++;

              // Extract analytics if available
              const analytics = messageData.analytics;
              if (analytics) {
                // User Sentiment
                if (analytics.userSentiment) {
                  sentimentBreakdown[analytics.userSentiment] = (sentimentBreakdown[analytics.userSentiment] || 0) + 1;
                }

                // Category
                if (analytics.category) {
                  categoryBreakdown[analytics.category] = (categoryBreakdown[analytics.category] || 0) + 1;
                }

                // Intent
                if (analytics.intent) {
                  intentBreakdown[analytics.intent] = (intentBreakdown[analytics.intent] || 0) + 1;
                }

                // Urgency
                if (analytics.urgency >= 7) {
                  urgentMessages++;
                }

                // Ticket suggestions
                if (analytics.shouldCreateTicket) {
                  ticketSuggestions++;
                }

                // Relevance
                if (analytics.isRelevant === false) {
                  irrelevantQuestions++;
                }

                // AI Confidence
                if (analytics.aiConfidence) {
                  totalConfidence += analytics.aiConfidence;
                  confidenceCount++;
                }
              }
            }
          }
        }
      }
    }

    const avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0;

    console.log('✅ Admin stats fetched successfully');

    return {
      totalUsers,
      planDistribution,
      totalAgents,
      totalConversations,
      totalMessages,
      sentimentBreakdown,
      categoryBreakdown,
      intentBreakdown,
      urgentMessages,
      ticketSuggestions,
      irrelevantQuestions,
      avgConfidence
    };

  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    throw new Error('Failed to fetch admin stats: ' + error.message);
  }
});

