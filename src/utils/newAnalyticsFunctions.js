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
 * Helper: Convert timezone to country code (approximate)
 */
function timezoneToCountry(timezone) {
  const timezoneMap = {
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'America/Mexico_City': 'MX',
    'America/Sao_Paulo': 'BR',
    'America/Argentina/Buenos_Aires': 'AR',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Madrid': 'ES',
    'Europe/Rome': 'IT',
    'Europe/Istanbul': 'TR',
    'Europe/Moscow': 'RU',
    'Asia/Dubai': 'AE',
    'Asia/Kolkata': 'IN',
    'Asia/Shanghai': 'CN',
    'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR',
    'Asia/Singapore': 'SG',
    'Asia/Bangkok': 'TH',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Pacific/Auckland': 'NZ',
    'Africa/Cairo': 'EG',
    'Africa/Johannesburg': 'ZA'
  };

  // Direct match
  if (timezoneMap[timezone]) {
    return timezoneMap[timezone];
  }

  // Try to match by prefix (e.g., "America/Phoenix" -> "US")
  for (const [tz, country] of Object.entries(timezoneMap)) {
    if (timezone.startsWith(tz.split('/')[0])) {
      return country;
    }
  }

  return null;
}

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
    const allSessions = [];
    const allMessages = [];

    // Process all sessions in parallel for maximum speed
    await Promise.all(sessionsSnapshot.docs.map(async (sessionDoc) => {
      const sessionData = sessionDoc.data();
      allSessions.push({
        id: sessionDoc.id,
        ...sessionData
      });

      const conversationsRef = collection(
        db, 'users', userId, 'agents', agentId, 'sessions', sessionDoc.id, 'conversations'
      );
      const conversationsSnapshot = await getDocs(conversationsRef);

      // Process each conversation and fetch messages in parallel
      await Promise.all(conversationsSnapshot.docs.map(async (convDoc) => {
        const convData = convDoc.data();
        const lastMessageTime = convData.lastMessageTime?.toDate?.();

        // Only include conversations within time range
        if (lastMessageTime && lastMessageTime >= startDate) {
          allConversations.push({
            id: convDoc.id,
            sessionId: sessionDoc.id,
            userInfo: sessionData.userInfo || {},
            ...convData
          });

          // Fetch messages for this conversation
          const messagesRef = collection(convDoc.ref, 'messages');
          const messagesSnapshot = await getDocs(messagesRef);

          messagesSnapshot.docs.forEach(msgDoc => {
            const msgData = msgDoc.data();
            const msgTime = msgData.timestamp?.toDate?.();
            if (msgTime && msgTime >= startDate) {
              allMessages.push({
                id: msgDoc.id,
                ...msgData
              });
            }
          });
        }
      }));
    }));

    // Filter only analyzed conversations
    const analyzedConversations = allConversations.filter(conv =>
      conv.analyzed && conv.analysis
    );

    // Build analytics from conversations (pass both all and analyzed, plus sessions and messages)
    const analytics = buildAnalyticsFromConversations(allConversations, analyzedConversations, timeRange, allSessions, allMessages);

    return analytics;

  } catch (error) {
    console.error('Error fetching conversation analytics:', error);
    return createEmptyAnalytics();
  }
};

/**
 * Build analytics data structure from analyzed conversations
 */
function buildAnalyticsFromConversations(allConversations, analyzedConversations, timeRange, allSessions = [], allMessages = []) {
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

  // Calculate category distribution (from ALL conversations with latestAnalytics)
  const categoryCount = { Support: 0, Sales: 0, Question: 0, Complaint: 0, General: 0 };
  allConversations.forEach(conv => {
    const category = conv.latestAnalytics?.category || conv.analysis?.mainCategory || 'General';
    if (categoryCount.hasOwnProperty(category)) {
      categoryCount[category] += 1;
    } else {
      categoryCount[category] = 1;
    }
  });

  const categoryData = Object.entries(categoryCount)
    .filter(([_, value]) => value > 0) // Only show categories with data
    .map(([name, value]) => ({
      name,
      value,
      percentage: allConversations.length > 0 ? Math.round((value / allConversations.length) * 100) : 0
    }));

  // Calculate sentiment distribution (from ALL messages with analytics.sentimentScore)
  const sentimentBuckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
  allMessages.forEach(msg => {
    const score = msg.analytics?.sentimentScore;
    if (score && score >= 1 && score <= 10) {
      sentimentBuckets[score] += 1;
    }
  });

  const sentimentData = Object.entries(sentimentBuckets).map(([score, count]) => ({
    score: parseInt(score),
    count
  }));

  // Calculate urgency distribution (from ALL conversations with latestAnalytics)
  const urgencyCount = { low: 0, medium: 0, high: 0 };
  allConversations.forEach(conv => {
    const urgencyScore = conv.latestAnalytics?.urgency || conv.analysis?.urgency;

    // Convert numeric urgency (0-10) to low/medium/high
    let urgency = 'low';
    if (typeof urgencyScore === 'number') {
      if (urgencyScore >= 7) urgency = 'high';
      else if (urgencyScore >= 4) urgency = 'medium';
      else urgency = 'low';
    } else if (typeof urgencyScore === 'string') {
      urgency = urgencyScore.toLowerCase();
    }

    if (urgencyCount.hasOwnProperty(urgency)) {
      urgencyCount[urgency] += 1;
    }
  });

  const urgencyData = Object.entries(urgencyCount).map(([name, value]) => ({
    name: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Unknown',
    value,
    percentage: allConversations.length > 0 ? Math.round((value / allConversations.length) * 100) : 0
  }));

  // Calculate topic distribution (from messages analytics.topics)
  const topicCount = {};
  allMessages.forEach(msg => {
    const topics = msg.analytics?.topics || msg.analytics?.keyTopics || [];
    topics.forEach(topic => {
      if (topic && typeof topic === 'string') {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
      }
    });
  });

  const topicData = Object.entries(topicCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value
    }));

  // Calculate intent distribution (from messages analytics.intent)
  const intentCount = { question: 0, complaint: 0, browsing: 0, purchase: 0, greeting: 0 };
  allMessages.forEach(msg => {
    const intent = msg.analytics?.intent || msg.intent;
    if (intent && intentCount.hasOwnProperty(intent)) {
      intentCount[intent] += 1;
    }
  });

  const intentData = Object.entries(intentCount).map(([name, count]) => ({
    intent: name,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
    value: count
  }));

  // Calculate AI confidence distribution (from messages analytics.aiConfidence)
  const confidenceRanges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
  let totalConfidence = 0;
  let confidenceCount = 0;

  allMessages.forEach(msg => {
    const confidence = msg.analytics?.aiConfidence || msg.analytics?.confidence;
    if (confidence !== undefined && confidence !== null) {
      totalConfidence += confidence;
      confidenceCount++;

      // Categorize into ranges
      if (confidence >= 0 && confidence <= 20) confidenceRanges['0-20']++;
      else if (confidence >= 21 && confidence <= 40) confidenceRanges['21-40']++;
      else if (confidence >= 41 && confidence <= 60) confidenceRanges['41-60']++;
      else if (confidence >= 61 && confidence <= 80) confidenceRanges['61-80']++;
      else if (confidence >= 81 && confidence <= 100) confidenceRanges['81-100']++;
    }
  });

  const avgConfidence = confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0;

  const confidenceData = Object.entries(confidenceRanges).map(([range, count]) => ({
    range,
    confidence: parseInt(range.split('-')[0]), // For sorting
    count,
    value: count
  }));

  // Calculate summary stats
  const totalConversations = allConversations.length;
  const analyzedCount = analyzedConversations.length;
  const resolvedConversations = analyzedConversations.filter(c => c.analysis?.resolved).length;
  const unresolvedConversations = analyzedCount - resolvedConversations;
  const resolutionRate = analyzedCount > 0 ? Math.round((resolvedConversations / analyzedCount) * 100) : 0;

  // Calculate average sentiment (from ALL conversations with latestAnalytics)
  const sentimentScores = allConversations
    .map(c => c.latestAnalytics?.userSentimentScore || c.analysis?.sentimentScore)
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

  // Process session data for browser, device, language, location, return users
  const browserCount = {};
  const deviceCount = {};
  const languageCount = {};
  const locationCount = {}; // Aggregate by country code
  let returnUserCount = 0;
  let newUserCount = 0;

  allSessions.forEach(session => {
    const userInfo = session.userInfo || {};

    // Browser data
    if (userInfo.device?.browser) {
      browserCount[userInfo.device.browser] = (browserCount[userInfo.device.browser] || 0) + 1;
    }

    // Device data
    if (userInfo.device?.deviceType) {
      deviceCount[userInfo.device.deviceType] = (deviceCount[userInfo.device.deviceType] || 0) + 1;
    }

    // Language data
    if (userInfo.language) {
      languageCount[userInfo.language] = (languageCount[userInfo.language] || 0) + 1;
    }

    // Location data (for map)
    // Priority: IP-based location (city+country) > timezone-based country
    let countryCode = null;
    let countryName = null;

    if (userInfo.location?.countryCode) {
      // IP-based location available
      countryCode = userInfo.location.countryCode;
      countryName = userInfo.location.country || countryCode;
    } else if (userInfo.location?.timezone) {
      // Fallback: Estimate country from timezone
      countryCode = timezoneToCountry(userInfo.location.timezone);
      countryName = countryCode;
    }

    if (countryCode) {
      if (!locationCount[countryCode]) {
        locationCount[countryCode] = {
          countryCode: countryCode,
          country: countryName,
          count: 0
        };
      }
      locationCount[countryCode].count += 1;
    }

    // Return user tracking
    if (userInfo.isReturnUser === true) {
      returnUserCount++;
    } else {
      newUserCount++;
    }
  });

  // Convert locationCount object to array
  const locationData = Object.values(locationCount);

  // Format return user data for donut chart
  const returnUserData = [
    { name: 'New Users', value: newUserCount },
    { name: 'Return Users', value: returnUserCount }
  ];

  // Calculate detailed metrics
  let totalTimeBeforeChat = 0;
  let totalSessionDuration = 0;
  let totalScrollDepth = 0;
  let totalMessagesCount = 0;
  let sessionsWithData = 0;

  allSessions.forEach(session => {
    const userInfo = session.userInfo || {};

    // Average messages per session (from totalConversations in session)
    if (session.totalConversations) {
      totalMessagesCount += session.totalConversations;
    }

    // Session duration could be calculated from firstVisit to lastVisit if needed
    // For now we'll skip or use placeholder values
    sessionsWithData++;
  });

  const detailedMetrics = {
    avgTimeOnPageBeforeChat: 0, // Would need widget open timestamp to calculate
    avgSessionDuration: 0, // Would need session close timestamp to calculate
    avgScrollDepth: 0, // Not tracked currently
    returnVisitorRate: allSessions.length > 0 ? (returnUserCount / allSessions.length) * 100 : 0,
    avgMessagesPerSession: allSessions.length > 0 ? totalMessagesCount / allSessions.length : 0,
    totalSessions: allSessions.length
  };

  return {
    chartData,
    categoryData,
    sentimentData,
    urgencyData,
    topicData,
    intentData,
    confidenceData,
    browserData: browserCount,
    deviceData: deviceCount,
    languageData: languageCount,
    locationData,
    returnUserData,
    detailedMetrics,
    summary: {
      totalConversations,
      analyzedConversations: analyzedCount,
      nonAnalyzedConversations: totalConversations - analyzedCount,
      resolvedConversations,
      unresolvedConversations,
      resolutionRate,
      avgSentiment: parseFloat(avgSentiment),
      avgConfidence
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
    // Get all knowledge gaps (no filter, we'll filter client-side)
    const knowledgeGapsSnapshot = await getDocs(knowledgeGapsRef);

    const gaps = knowledgeGapsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        firstAsked: doc.data().firstAsked?.toDate?.(),
        lastAsked: doc.data().lastAsked?.toDate?.()
      }))
      // Filter out filled or skipped gaps
      .filter(gap => gap.filled !== true && gap.skipped !== true);

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
    intentData: [],
    confidenceData: [],
    browserData: {},
    deviceData: {},
    languageData: {},
    locationData: [],
    returnUserData: [],
    detailedMetrics: {},
    summary: {
      totalConversations: 0,
      analyzedConversations: 0,
      nonAnalyzedConversations: 0,
      resolvedConversations: 0,
      unresolvedConversations: 0,
      resolutionRate: 0,
      avgSentiment: 5.0,
      avgConfidence: 0
    },
    recentSessions: [],
    totalConversations: 0
  };
}
