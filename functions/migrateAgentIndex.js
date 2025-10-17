/**
 * Migration Script: Create agentIndex for all existing agents
 *
 * This script creates an agentIndex collection that maps agentId -> userId
 * for fast lookups without scanning all users.
 *
 * Run this ONCE with: node migrateAgentIndex.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateAgentIndex() {
  console.log('🚀 Starting agentIndex migration...\n');

  let totalAgents = 0;
  let successCount = 0;
  let errorCount = 0;

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users\n`);

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 Processing user: ${userId}`);

      // Get all agents for this user
      const agentsSnapshot = await userDoc.ref.collection('agents').get();
      console.log(`   📁 Found ${agentsSnapshot.size} agents`);

      // Create agentIndex for each agent
      for (const agentDoc of agentsSnapshot.docs) {
        const agentId = agentDoc.id;
        totalAgents++;

        try {
          await db.collection('agentIndex').doc(agentId).set({
            userId: userId,
            agentId: agentId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            migratedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          successCount++;
          console.log(`   ✅ Created index for agent: ${agentId}`);
        } catch (error) {
          errorCount++;
          console.error(`   ❌ Failed to create index for agent ${agentId}:`, error.message);
        }
      }
    }

    console.log('\n\n' + '='.repeat(50));
    console.log('📊 MIGRATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`Total agents processed: ${totalAgents}`);
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
migrateAgentIndex();
