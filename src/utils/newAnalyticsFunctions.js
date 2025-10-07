import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get analytics for an agent based on the new conversation structure
 * Path: /users/{userId}/agents/{agentId}/sessions/{anonymousUserId}/conversations/{conversationId}
 */
export const getConversationAnalytics = async (agentId, timeRange = 'daily', userId = null) => {
  try {
    if (!userId || !agentId) {
      return createEmptyAnalytics();
    }

    const now = new Date();
    let startDate;

    // Calculate date range
    switch (timeRange) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // daily
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get all sessions for this agent
    const sessionsRef = collection(db, 'users', userId, 'agents', agentId, 'sessions');
    const sessionsSnapshot = await getDocs(sessionsRef);

    const allConversations = [];

    // For each session, get all conversations
    for (const sessionDoc of sessionsSnapshot.docs) {
      const conversationsRef = collection(
        db, 'users', userId, 'agents', agentId, 'sessions', sessionDoc.id, 'conversations'
      );
      const conversationsSnapshot = await getDocs(conversationsRef);

      conversationsSnapshot.docs.forEach(convDoc => {
        const convData = convDoc.data();

        // Only include conversations within time range
        const lastMessageTime = convData.lastMessageTime?.toDate?.();
        if (lastMessageTime && lastMessageTime >= startDate) {
          allConversations.push({
            id: convDoc.id,
            sessionId: sessionDoc.id,
            ...convData
          });
        }
      });
    }

    // Filter only analyzed conversations
    const analyzedConversations = allConversations.filter(conv =>
      conv.analyzed && conv.analysis
    );

    // Build analytics from conversations (pass both all and analyzed)
    const analytics = buildAnalyticsFromConversations(allConversations, analyzedConversations, timeRange);

    return analytics;

  } catch (error) {
    console.error('Error fetching conversation analytics:', error);
    return createEmptyAnalytics();
  }
};

/**
 * Build analytics data structure from analyzed conversations
 */
function buildAnalyticsFromConversations(allConversations, analyzedConversations, timeRange) {
  // Initialize chart data structure
  const chartData = {};
  const now = new Date();

  // Determine time periods and keys based on range
  let periods = [];
  let getKey = null;

  switch(timeRange) {
    case 'hourly': // Last 24 hours
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 60 * 60 * 1000);
        const key = `${date.toISOString().split('T')[0]} ${date.getHours().toString().padStart(2, '0')}:00`;
        periods.push(key);
        chartData[key] = { total: 0, analyzed: 0, resolved: 0 };
      }
      getKey = (date) => {
        const d = date.toDate ? date.toDate() : date;
        return `${d.toISOString().split('T')[0]} ${d.getHours().toString().padStart(2, '0')}:00`;
      };
      break;

    case 'daily': // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        periods.push(key);
        chartData[key] = { total: 0, analyzed: 0, resolved: 0 };
      }
      getKey = (date) => {
        const d = date.toDate ? date.toDate() : date;
        return d.toISOString().split('T')[0];
      };
      break;

    case 'weekly': // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        periods.push(key);
        chartData[key] = { total: 0, analyzed: 0, resolved: 0 };
      }
      getKey = (date) => {
        const d = date.toDate ? date.toDate() : date;
        return d.toISOString().split('T')[0];
      };
      break;

    case 'quarterly': // Last 90 days - weekly aggregation
      for (let i = 12; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const key = `Week of ${weekStart.toISOString().split('T')[0]}`;
        periods.push(key);
        chartData[key] = { total: 0, analyzed: 0, resolved: 0 };
      }
      getKey = (date) => {
        const d = date.toDate ? date.toDate() : date;
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay()); // Start of week
        return `Week of ${weekStart.toISOString().split('T')[0]}`;
      };
      break;

    case 'alltime': // All time - monthly aggregation
      // Get first conversation date
      const firstConvDate = allConversations.length > 0
        ? allConversations.reduce((earliest, conv) => {
            const convDate = conv.lastMessageTime?.toDate?.() || new Date();
            return convDate < earliest ? convDate : earliest;
          }, new Date())
        : new Date();

      const monthsDiff = Math.ceil((now - firstConvDate) / (30 * 24 * 60 * 60 * 1000));
      const monthsToShow = Math.max(monthsDiff, 12); // At least 12 months

      for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        periods.push(key);
        chartData[key] = { total: 0, analyzed: 0, resolved: 0 };
      }
      getKey = (date) => {
        const d = date.toDate ? date.toDate() : date;
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      };
      break;

    default:
      // Fallback to daily
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        periods.push(key);
        chartData[key] = { total: 0, analyzed: 0, resolved: 0 };
      }
      getKey = (date) => {
        const d = date.toDate ? date.toDate() : date;
        return d.toISOString().split('T')[0];
      };
  }

  // Count total conversations
  allConversations.forEach(conv => {
    const date = conv.lastMessageTime;
    if (date && getKey) {
      const key = getKey(date);
      if (chartData[key]) {
        chartData[key].total += 1;
      }
    }
  });

  // Count analyzed and resolved conversations
  analyzedConversations.forEach(conv => {
    const date = conv.lastMessageTime;
    if (date && getKey) {
      const key = getKey(date);
      if (chartData[key]) {
        chartData[key].analyzed += 1;
        if (conv.analysis?.resolved) {
          chartData[key].resolved += 1;
        }
      }
    }
  });

  // Calculate category distribution (only from analyzed conversations)
  const categoryCount = {};
  analyzedConversations.forEach(conv => {
    const category = conv.analysis?.mainCategory || 'General';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / analyzedConversations.length) * 100)
  }));

  // Calculate sentiment distribution
  const sentimentBuckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
  analyzedConversations.forEach(conv => {
    const score = conv.analysis?.sentimentScore;
    if (score && score >= 1 && score <= 10) {
      sentimentBuckets[score] += 1;
    }
  });

  const sentimentData = Object.entries(sentimentBuckets).map(([score, count]) => ({
    score: parseInt(score),
    count
  }));

  // Calculate urgency distribution
  const urgencyCount = { low: 0, medium: 0, high: 0 };
  analyzedConversations.forEach(conv => {
    const urgency = conv.analysis?.urgency || 'low';
    urgencyCount[urgency] = (urgencyCount[urgency] || 0) + 1;
  });

  const urgencyData = Object.entries(urgencyCount).map(([name, value]) => ({
    name: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Unknown',
    value,
    percentage: analyzedConversations.length > 0 ? Math.round((value / analyzedConversations.length) * 100) : 0
  }));

  // Calculate topic distribution
  const topicCount = {};
  analyzedConversations.forEach(conv => {
    const topics = conv.analysis?.keyTopics || [];
    topics.forEach(topic => {
      topicCount[topic] = (topicCount[topic] || 0) + 1;
    });
  });

  const topicData = Object.entries(topicCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value
    }));

  // Calculate summary stats
  const totalConversations = allConversations.length;
  const analyzedCount = analyzedConversations.length;
  const resolvedConversations = analyzedConversations.filter(c => c.analysis?.resolved).length;
  const unresolvedConversations = analyzedCount - resolvedConversations;
  const resolutionRate = analyzedCount > 0 ? Math.round((resolvedConversations / analyzedCount) * 100) : 0;

  // Calculate average sentiment
  const sentimentScores = analyzedConversations
    .map(c => c.analysis?.sentimentScore)
    .filter(score => score && score >= 1 && score <= 10);
  const avgSentiment = sentimentScores.length > 0
    ? (sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length).toFixed(1)
    : 5.0;

  // Recent sessions for table
  const recentSessions = analyzedConversations
    .sort((a, b) => {
      const aTime = a.lastMessageTime?.toDate?.() || new Date(0);
      const bTime = b.lastMessageTime?.toDate?.() || new Date(0);
      return bTime - aTime;
    })
    .slice(0, 10)
    .map(conv => ({
      id: conv.id,
      sessionId: conv.sessionId,
      category: conv.analysis?.mainCategory || 'General',
      sentiment: conv.analysis?.sentimentScore || 5,
      urgency: conv.analysis?.urgency || 'low',
      resolved: conv.analysis?.resolved || false,
      summary: conv.analysis?.summary || 'No summary available',
      messageCount: conv.messageCount || 0,
      timestamp: conv.lastMessageTime?.toDate?.() || new Date()
    }));

  return {
    chartData,
    categoryData,
    sentimentData,
    urgencyData,
    topicData,
    summary: {
      totalConversations,
      analyzedConversations: analyzedCount,
      resolvedConversations,
      unresolvedConversations,
      resolutionRate,
      avgSentiment: parseFloat(avgSentiment)
    },
    recentSessions,
    totalConversations: allConversations.length
  };
}

/**
 * Get knowledge gaps for an agent
 */
export const getKnowledgeGaps = async (agentId, userId) => {
  try {
    if (!userId || !agentId) {
      return [];
    }

    const knowledgeGapsRef = collection(db, 'users', userId, 'agents', agentId, 'knowledgeGaps');
    const q = query(knowledgeGapsRef, where('filled', '!=', true));
    const knowledgeGapsSnapshot = await getDocs(q);

    const gaps = knowledgeGapsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      firstAsked: doc.data().firstAsked?.toDate?.(),
      lastAsked: doc.data().lastAsked?.toDate?.()
    }));

    // Sort by count (most asked first)
    gaps.sort((a, b) => (b.count || 0) - (a.count || 0));

    return gaps;

  } catch (error) {
    console.error('Error fetching knowledge gaps:', error);
    return [];
  }
};

/**
 * Create empty analytics structure
 */
function createEmptyAnalytics() {
  return {
    chartData: {},
    categoryData: [],
    sentimentData: [],
    urgencyData: [],
    topicData: [],
    summary: {
      openTickets: 0,
      resolvedToday: 0,
      resolutionRate: 0,
      avgResponseTime: '0m'
    },
    recentSessions: [],
    totalConversations: 0
  };
}
