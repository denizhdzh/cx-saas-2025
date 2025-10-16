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
  timeoutSeconds: 120,
  memory: '512MiB'
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

      if (origin) {
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
    
    // Sort by similarity and get top 3 most relevant chunks
    const topChunks = chunksWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
    
    console.log(`🔍 Found ${topChunks.length} relevant chunks, top similarity: ${topChunks[0]?.similarity || 0}`);
    
    // Build context from relevant chunks
    const context = topChunks.map(chunk => chunk.content).join('\n\n');
    
    // Extract context from session data if available
    const currentPage = sessionData?.userInfo?.location?.pathname || 'unknown';
    const pageContent = sessionData?.pageContent;

    let pageContext = '';
    if (pageContent) {
      pageContext = `\n\nPAGE CONTEXT:
- URL: ${pageContent.url || currentPage}
- Title: ${pageContent.title || 'Unknown'}
- Main Headings: ${pageContent.headings || 'None'}`;
    } else if (currentPage !== 'unknown') {
      pageContext = `\n\nCONTEXT: User is currently on the "${currentPage}" page.`;
    }

    // Build conversation messages with history
    const platformInfo = agentData.websiteUrl ? `\n\nPLATFORM INFO:\n- Company/Platform: ${agentName}\n- Website: ${agentData.websiteUrl}\n- You are the official customer service agent for this platform` : '';

    const messages = [
      {
        role: "system",
        content: `You are ${agentName}, a helpful and friendly AI customer service assistant with access to a knowledge base.${platformInfo}

RESPONSE GUIDELINES:
1. Be warm, engaging and conversational - show genuine interest in helping
2. Use the user's name if provided and reference conversation history naturally
3. Ask follow-up questions when appropriate to better understand their needs
4. Show empathy and enthusiasm - make users feel heard and valued
5. For greetings: respond warmly and ask how you can help today
6. Keep responses natural (2-4 sentences) but add personality
7. If you don't know something about ${agentName}, be honest and say "I don't have that information in my knowledge base yet" - never pretend or make up information
8. Use page context to answer questions about current page content, URL, or what they're viewing
9. You are the ${agentName} assistant - always answer from the perspective of representing ${agentName}

KNOWLEDGE BASE:
${context}${pageContext}

IMPORTANT: You must respond with a JSON object in this exact format:
{
  "reply": "your natural conversational response here",
  "shouldAnalyze": "false" | "pending" | "true",
  "analysisReason": "brief explanation",
  "knowledgeGapDetected": true | false,
  "unansweredQuestion": "the specific question/topic you couldn't answer (null if answered)",
  "requestEmail": true | false
}

Analysis Guidelines:
- "false": Trivial conversation (greetings like "hello"/"hi", simple thanks, small talk) - don't save
- "pending": User has a problem/complaint but needs more details - ask follow-up questions to get complete context
- "true": Conversation has enough context to analyze (detailed complaint, support issue, complete inquiry) - save for analytics

Knowledge Gap Detection:
- Set knowledgeGapDetected=true if user asked something specific that's NOT in your knowledge base
- Set unansweredQuestion to the specific question (e.g., "shipping times to Canada", "refund policy", "API rate limits")
- Only detect real questions, not greetings or chitchat
- Be specific with the question (not just "product info" but "product pricing for enterprise plan")

Email Request:
- Set requestEmail=true if the user has a problem, complaint, or technical issue that might need follow-up
- In your reply, politely ask for their email to help resolve their issue (e.g., "Could you share your email so we can follow up on this?")
- Don't ask for email on greetings, simple questions that were answered, or casual conversation
- If user already provided their email in the conversation, set requestEmail=false

Examples:
- User: "hello" → shouldAnalyze: "false", knowledgeGapDetected: false, requestEmail: false
- User: "what's your refund policy?" (not in KB) → knowledgeGapDetected: true, unansweredQuestion: "refund policy", requestEmail: false
- User: "I can't log in" → shouldAnalyze: "pending", requestEmail: true (ask for email in reply)
- User: "My order is broken" → shouldAnalyze: "pending", requestEmail: true
- User: "thanks bye" → shouldAnalyze: "false", knowledgeGapDetected: false, requestEmail: false

Remember: Your reply should be warm and helpful, while shouldAnalyze tracks if we need to save this conversation for business insights.`
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
      model: "gpt-4.1-nano",
      messages: messages,
      max_completion_tokens: 500,
      temperature: 0.7, // Natural but focused responses
      response_format: { type: "json_object" }
    });

    const rawResponse = completion.choices[0].message.content;
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', rawResponse);
      // Fallback to plain text response
      parsedResponse = {
        reply: rawResponse,
        shouldAnalyze: "false",
        analysisReason: "JSON parsing failed"
      };
    }

    const aiResponse = parsedResponse.reply;
    const shouldAnalyze = parsedResponse.shouldAnalyze || "false";
    const analysisReason = parsedResponse.analysisReason || "No reason provided";
    const knowledgeGapDetected = parsedResponse.knowledgeGapDetected || false;
    const unansweredQuestion = parsedResponse.unansweredQuestion || null;
    const requestEmail = parsedResponse.requestEmail || false;

    console.log(`📊 Analysis decision: ${shouldAnalyze} - ${analysisReason}`);
    if (knowledgeGapDetected) {
      console.log(`❓ Knowledge gap detected: "${unansweredQuestion}"`);
    }
    if (requestEmail) {
      console.log(`📧 Email requested from user`);
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

    await sessionRef.set(sessionUpdateData, { merge: true });

    // Update conversation metadata with analysis status
    await conversationRef.set({
      conversationId: conversationId,
      startedAt: sessionData?.currentConversation?.startedAt || admin.firestore.FieldValue.serverTimestamp(),
      lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
      shouldAnalyze: shouldAnalyze,
      analysisReason: analysisReason,
      analyzed: shouldAnalyze === "true" ? false : null // Only set analyzed flag if we need to analyze
    }, { merge: true });

    // Save user message in conversation
    const userMessageRef = conversationRef.collection('messages').doc();
    await userMessageRef.set({
      role: 'user',
      content: message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Save assistant response in conversation
    const assistantMessageRef = conversationRef.collection('messages').doc();
    await assistantMessageRef.set({
      role: 'assistant',
      content: aiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      relevantChunks: topChunks.map(chunk => ({
        content: chunk.content.substring(0, 100) + '...',
        similarity: chunk.similarity,
        source: chunk.source
      }))
    });

    console.log(`✅ Messages saved to session ${sessionId}`);

    // If shouldAnalyze is "true", trigger immediate analysis
    if (shouldAnalyze === "true") {
      console.log(`🔍 Triggering immediate analysis for conversation ${conversationId}`);
      try {
        await analyzeConversationImmediately(userId, agentId, finalAnonymousUserId, conversationId);
      } catch (analysisError) {
        console.error('❌ Analysis failed but chat succeeded:', analysisError);
        // Don't throw - analysis failure shouldn't break chat
      }
    }

    // If knowledge gap detected, process it asynchronously (don't await - let it run in background)
    if (knowledgeGapDetected && unansweredQuestion) {
      processKnowledgeGap(userId, agentId, unansweredQuestion, message).catch(error => {
        console.error('❌ Knowledge gap processing failed:', error);
        // Don't throw - this shouldn't break chat flow
      });
    }

    // Update message usage AFTER successful chat
    // Each successful response = 1 message
    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const currentMessagesUsed = (updatedUserDoc.data()?.messagesUsed || 0) + 1;
    const messageLimit = updatedUserDoc.data()?.messageLimit || 100;

    await db.collection('users').doc(userId).update({
      messagesUsed: admin.firestore.FieldValue.increment(1)
    });
    console.log(`📊 Updated message usage: ${currentMessagesUsed}/${messageLimit}`);

    return {
      response: aiResponse,
      sessionId: sessionId,
      relevantSources: topChunks.map(c => c.source)
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

    // Search for agent across all users
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const agentRef = await db.collection('users').doc(userDoc.id)
        .collection('agents').doc(agentId).get();

      if (agentRef.exists) {
        const agentData = agentRef.data();

        // Get user's subscription plan for whitelabel support
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
        return;
      }
    }

    response.status(404).json({ error: 'Agent not found' });

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
exports.fillKnowledgeGap = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, agentId, gapId, question, userAnswer } = req.body;

    if (!userId || !agentId || !gapId || !question || !userAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional knowledge base editor.' },
        { role: 'user', content: enhancementPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const enhancedAnswer = enhancementResponse.choices[0].message.content.trim();

    // Step 2: Generate embedding for the Q&A pair
    const contentForEmbedding = `Question: ${question}\n\nAnswer: ${enhancedAnswer}`;

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: contentForEmbedding,
      dimensions: 512
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Step 3: Add to knowledge base as a new chunk
    const chunkRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('knowledgeChunks').doc();

    await chunkRef.set({
      text: contentForEmbedding,
      embedding: embedding,
      source: 'knowledge_gap',
      sourceId: gapId,
      question: question,
      answer: enhancedAnswer,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      chunkIndex: 0,
      metadata: {
        originalAnswer: userAnswer,
        enhanced: true,
        addedBy: 'user'
      }
    });

    // Step 4: Mark the knowledge gap as filled
    const gapRef = db.collection('users').doc(userId)
      .collection('agents').doc(agentId)
      .collection('knowledgeGaps').doc(gapId);

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

// Get admin stats
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

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const plan = userData.subscriptionPlan || 'free';

      // Count plan distribution
      if (planDistribution.hasOwnProperty(plan)) {
        planDistribution[plan]++;
      }

      // Count agents for this user
      const agentsSnapshot = await userDoc.ref.collection('agents').get();
      totalAgents += agentsSnapshot.size;
    }

    console.log('✅ Admin stats fetched successfully');

    return {
      totalUsers,
      planDistribution,
      totalAgents
    };

  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    throw new Error('Failed to fetch admin stats: ' + error.message);
  }
});

