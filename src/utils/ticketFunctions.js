import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Ticket categories
export const TICKET_CATEGORIES = {
  TECHNICAL: 'technical',
  FEATURE_REQUEST: 'feature_request',
  CONTENT_ISSUE: 'content_issue',
  PERFORMANCE: 'performance',
  BUG: 'bug',
  OTHER: 'other'
};

// Ticket priorities
export const TICKET_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Ticket statuses
export const TICKET_STATUSES = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

// Create a new ticket
export const createTicket = async (agentId, ticketData) => {
  try {
    const ticket = {
      agentId,
      title: ticketData.title,
      description: ticketData.description,
      category: ticketData.category || TICKET_CATEGORIES.OTHER,
      priority: ticketData.priority || TICKET_PRIORITIES.MEDIUM,
      status: TICKET_STATUSES.NEW,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: ticketData.userId || null,
      userEmail: ticketData.userEmail || null,
      assignedTo: null,
      resolutionNotes: null,
      resolvedAt: null,
      tags: ticketData.tags || []
    };

    const docRef = await addDoc(collection(db, 'tickets'), ticket);
    return { id: docRef.id, ...ticket };
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

// Get tickets for an agent with filters
export const getAgentTickets = async (agentId, filters = {}) => {
  try {
    let q = query(
      collection(db, 'tickets'),
      where('agentId', '==', agentId)
    );

    // Add filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }

    // Add ordering
    q = query(q, orderBy('createdAt', 'desc'));

    // Add limit if specified
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting tickets:', error);
    throw error;
  }
};

// Update ticket status
export const updateTicketStatus = async (ticketId, status, resolutionNotes = null) => {
  try {
    const updateData = {
      status,
      updatedAt: Timestamp.now()
    };

    if (status === TICKET_STATUSES.RESOLVED || status === TICKET_STATUSES.CLOSED) {
      updateData.resolvedAt = Timestamp.now();
      if (resolutionNotes) {
        updateData.resolutionNotes = resolutionNotes;
      }
    }

    await updateDoc(doc(db, 'tickets', ticketId), updateData);
    return true;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
};

// Get ticket analytics for agent
export const getTicketAnalytics = async (agentId, timeRange = 'daily', userId = null) => {
  try {
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

    if (!userId) {
      console.log('No userId provided, returning empty analytics...');
      return createEmptyAnalytics(timeRange);
    }

    // Get data from Firebase Analytics structure
    try {
      // Calculate how many days we need based on timeRange
      let daysToFetch;
      switch (timeRange) {
        case 'weekly':
          daysToFetch = 7;
          break;
        case 'monthly':
          daysToFetch = 30;
          break;
        default: // daily
          daysToFetch = 1;
      }

      // Path: users/{userId}/agents/{agentId}/analytics/daily/stats/{date}
      const dailyStatsRef = collection(db, 'users', userId, 'agents', agentId, 'analytics', 'daily', 'stats');
      const dailyStatsQuery = query(
        dailyStatsRef,
        orderBy('date', 'desc'),
        limit(daysToFetch)
      );
      const dailyStatsSnapshot = await getDocs(dailyStatsQuery);
      const dailyStats = dailyStatsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Path: users/{userId}/agents/{agentId}/analytics/sessions/detailed/{sessionId}
      const sessionsRef = collection(db, 'users', userId, 'agents', agentId, 'analytics', 'sessions', 'detailed');
      const sessionsQuery = query(
        sessionsRef,
        where('savedAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('savedAt', 'desc'),
        limit(50) // Get last 50 sessions for detailed view
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Path: users/{userId}/agents/{agentId}/conversations - Get actual AI analysis data
      const conversationsRef = collection(db, 'users', userId, 'agents', agentId, 'conversations');
      const conversationsQuery = query(
        conversationsRef,
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc'),
        limit(200) // Get last 200 conversations for analysis
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);
      const conversations = conversationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Path: users/{userId}/agents/{agentId}/analytics/user_patterns/anonymous_users/{userId}
      let userPatterns = [];
      try {
        const userPatternsRef = collection(db, 'users', userId, 'agents', agentId, 'analytics', 'user_patterns', 'anonymous_users');
        const userPatternsSnapshot = await getDocs(userPatternsRef);
        userPatterns = userPatternsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (patternsError) {
        console.log('Could not fetch user patterns:', patternsError);
      }

      console.log('Found analytics:', {
        dailyStats: dailyStats.length,
        sessions: sessions.length,
        conversations: conversations.length,
        userPatterns: userPatterns.length
      });

      if (dailyStats.length > 0 || sessions.length > 0 || conversations.length > 0) {
        console.log(`📊 Processing analytics for timeRange: ${timeRange}, ${sessions.length} sessions, ${conversations.length} conversations found`);
        const analyticsData = processRealAnalyticsData(dailyStats, sessions, conversations, userPatterns, timeRange);
        // Add detailed metrics and sessions list
        analyticsData.detailedMetrics = calculateDetailedMetrics(sessions);
        analyticsData.recentSessions = sessions.slice(0, 10); // Last 10 sessions
        console.log('📊 Detailed metrics calculated:', analyticsData.detailedMetrics);
        return analyticsData;
      }
    } catch (error) {
      console.log('Error fetching analytics:', error);
    }

    // No data found - return empty analytics with zeros
    console.log('No analytics data found, returning zeros...');
    return createEmptyAnalytics(timeRange);
  } catch (error) {
    console.error('Error getting ticket analytics:', error);
    throw error;
  }
};

// Process real analytics data from Firebase
const processRealAnalyticsData = (dailyStats, sessions, conversations, userPatterns, timeRange) => {
  const groupedData = {};
  const categoryData = {};
  const sentimentData = {};
  const locationData = {};
  const urgencyData = {};
  const topicData = {};
  const engagementData = {};
  const deviceData = {};
  const referrerData = {};
  const browserData = {};
  const languageData = {};
  const leadQualityData = {};

  // Initialize ALL periods with zeros
  const now = new Date();
  let periods = [];
  switch (timeRange) {
    case 'weekly':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(date.toISOString().split('T')[0]);
      }
      break;
    case 'monthly':
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(date.toISOString().split('T')[0]);
      }
      break;
    default: // daily
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        periods.push(`${String(hour.getHours()).padStart(2, '0')}:00`);
      }
  }

  // Initialize all periods with zero values
  periods.forEach(period => {
    groupedData[period] = { opened: 0, resolved: 0 };
  });

  // Aggregate from daily stats
  let totalSessions = 0;
  let totalMessages = 0;
  let avgResponseTime = 0;

  dailyStats.forEach(dayStat => {
    const date = dayStat.date;
    if (date && groupedData[date] !== undefined) {
      groupedData[date] = {
        opened: dayStat.totalSessions || 0,
        resolved: Math.floor((dayStat.totalSessions || 0) * 0.8) // 80% resolution rate
      };
    }

    totalSessions += dayStat.totalSessions || 0;
    totalMessages += dayStat.totalMessages || 0;

    // Aggregate engagement levels
    if (dayStat.engagementLevels) {
      Object.entries(dayStat.engagementLevels).forEach(([level, count]) => {
        engagementData[level] = (engagementData[level] || 0) + count;
      });
    }

    // Aggregate device types
    if (dayStat.deviceTypes) {
      Object.entries(dayStat.deviceTypes).forEach(([device, count]) => {
        deviceData[device] = (deviceData[device] || 0) + count;
      });
    }
  });

  // Track unique anonymous users for location
  const uniqueUsersByCountry = {};

  // Aggregate from sessions for additional metrics
  sessions.forEach(session => {
    // Location data from userLocation - track unique users only
    if (session.userLocation?.timezone && session.anonymousUserId) {
      const country = timezoneToCountry(session.userLocation.timezone);
      if (!uniqueUsersByCountry[country]) {
        uniqueUsersByCountry[country] = new Set();
      }
      uniqueUsersByCountry[country].add(session.anonymousUserId);
    }

    // Referrer data
    if (session.userLocation?.referrer) {
      const referrer = session.userLocation.referrer;
      referrerData[referrer] = (referrerData[referrer] || 0) + 1;
    }

    // Browser data
    if (session.behaviorMetrics?.browserInfo) {
      const browser = session.behaviorMetrics.browserInfo.toLowerCase();
      browserData[browser] = (browserData[browser] || 0) + 1;
    }

    // Language data
    if (session.language) {
      const lang = session.language.split('-')[0]; // Convert en-US to en
      languageData[lang] = (languageData[lang] || 0) + 1;
    }

    // Lead quality data
    if (session.businessMetrics?.leadQuality) {
      const quality = session.businessMetrics.leadQuality;
      leadQualityData[quality] = (leadQualityData[quality] || 0) + 1;
    }

    if (session.avgResponseTime) {
      avgResponseTime = session.avgResponseTime; // Use latest
    }
  });

  // Convert unique users to counts
  Object.entries(uniqueUsersByCountry).forEach(([country, userSet]) => {
    locationData[country] = userSet.size;
  });

  // Aggregate from user patterns for UNIQUE users only
  userPatterns.forEach(pattern => {
    if (pattern.timezone) {
      const country = timezoneToCountry(pattern.timezone);
      locationData[country] = (locationData[country] || 0) + 1; // Count each pattern as 1 unique user
    }
  });

  // Aggregate from CONVERSATIONS for AI analysis data (category, topic, sentiment, urgency)
  console.log('📊 Processing conversations for AI analysis data:', conversations.length);
  conversations.forEach(conversation => {
    // Category from AI analysis
    if (conversation.analysis?.category) {
      const category = conversation.analysis.category;
      categoryData[category] = (categoryData[category] || 0) + 1;
    }

    // Topic from AI analysis
    if (conversation.analysis?.topic) {
      const topic = conversation.analysis.topic;
      topicData[topic] = (topicData[topic] || 0) + 1;
    }

    // Sentiment from AI analysis
    if (conversation.analysis?.sentiment) {
      const sentiment = conversation.analysis.sentiment;
      sentimentData[sentiment] = (sentimentData[sentiment] || 0) + 1;
    }

    // Urgency from AI analysis
    if (conversation.analysis?.urgency) {
      const urgency = conversation.analysis.urgency;
      urgencyData[urgency] = (urgencyData[urgency] || 0) + 1;
    }
  });

  console.log('📊 Aggregated from conversations:', {
    categories: Object.keys(categoryData),
    topics: Object.keys(topicData),
    sentiments: Object.keys(sentimentData),
    urgencies: Object.keys(urgencyData)
  });

  // Convert to arrays with ALL categories/sentiments
  const allCategories = ['support', 'sales', 'information', 'complaint', 'question', 'technical', 'other'];
  const categoryArray = allCategories.map(category => ({
    category,
    count: categoryData[category] || categoryData['unknown'] || 0
  }));

  // Sentiment data - convert to 1-10 scoring system
  const sentimentScoreData = {};

  // Map old sentiment strings to scores 1-10
  Object.entries(sentimentData).forEach(([sentiment, count]) => {
    let score;
    if (sentiment === 'positive') score = 8;
    else if (sentiment === 'negative') score = 3;
    else if (sentiment === 'neutral') score = 5;
    else if (sentiment === 'frustrated') score = 2;
    else if (sentiment === 'confused') score = 4;
    else score = 5; // default

    sentimentScoreData[score] = (sentimentScoreData[score] || 0) + count;
  });

  // Create array for all 10 sentiment scores
  const sentimentArray = Array.from({ length: 10 }, (_, i) => ({
    sentiment: i + 1,
    count: sentimentScoreData[i + 1] || 0
  }));

  // Location data
  const allLocations = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'TR'];
  const locationArray = allLocations.map(country => ({
    country,
    count: locationData[country] || 0
  }));

  // Urgency data
  console.log('📊 Raw urgency data:', urgencyData);
  const allUrgencies = ['low', 'medium', 'high'];
  const urgencyArray = allUrgencies.map(urgency => ({
    urgency,
    count: urgencyData[urgency] || 0
  }));

  // Topic data
  console.log('📊 Raw topic data:', topicData);
  const allTopics = ['pricing', 'features', 'integration', 'billing', 'technical', 'general'];
  const topicArray = allTopics.map(topic => ({
    topic,
    count: topicData[topic] || 0
  }));

  console.log('📊 Final urgency array:', urgencyArray);
  console.log('📊 Final topic array:', topicArray);
  console.log('📊 Final engagement data:', engagementData);
  console.log('📊 Final device data:', deviceData);
  console.log('📊 Final referrer data:', referrerData);
  console.log('📊 Final browser data:', browserData);
  console.log('📊 Final language data:', languageData);

  return {
    chartData: groupedData,
    categoryData: categoryArray,
    sentimentData: sentimentArray,
    locationData: locationArray,
    urgencyData: urgencyArray,
    topicData: topicArray,
    engagementData: engagementData,
    deviceData: deviceData,
    referrerData: referrerData,
    browserData: browserData,
    languageData: languageData,
    leadQualityData: leadQualityData,
    totalUsers: Object.values(locationData).reduce((sum, count) => sum + count, 0),
    summary: {
      resolutionRate: 80,
      openTickets: Math.floor(totalSessions * 0.2),
      resolvedToday: Math.floor(totalSessions * 0.8),
      avgResponseTime: avgResponseTime ? `${avgResponseTime}ms` : '2.3h'
    }
  };
};

// Calculate detailed metrics from sessions
const calculateDetailedMetrics = (sessions) => {
  if (!sessions || sessions.length === 0) {
    return {
      avgTimeOnPageBeforeChat: 0,
      avgSessionDuration: 0,
      avgScrollDepth: 0,
      returnVisitorRate: 0,
      avgMessagesPerSession: 0,
      totalSessions: 0
    };
  }

  let totalTimeBeforeChat = 0;
  let totalDuration = 0;
  let totalScrollDepth = 0;
  let returnVisitors = 0;
  let totalMessages = 0;

  sessions.forEach(session => {
    if (session.behaviorMetrics?.timeOnPageBeforeChat) {
      totalTimeBeforeChat += session.behaviorMetrics.timeOnPageBeforeChat;
    }
    if (session.sessionDuration) {
      totalDuration += session.sessionDuration;
    }
    if (session.behaviorMetrics?.scrollDepth) {
      totalScrollDepth += session.behaviorMetrics.scrollDepth;
    }
    if (session.behaviorMetrics?.returnVisitor) {
      returnVisitors++;
    }
    if (session.messageCount) {
      totalMessages += session.messageCount;
    }
  });

  const count = sessions.length;

  return {
    avgTimeOnPageBeforeChat: totalTimeBeforeChat / count,
    avgSessionDuration: totalDuration / count,
    avgScrollDepth: totalScrollDepth / count,
    returnVisitorRate: (returnVisitors / count) * 100,
    avgMessagesPerSession: totalMessages / count,
    totalSessions: count
  };
};

// Helper to map timezone to country
const timezoneToCountry = (timezone) => {
  const tzMap = {
    'America/New_York': 'US',
    'America/Los_Angeles': 'US',
    'America/Chicago': 'US',
    'America/Toronto': 'CA',
    'Europe/London': 'GB',
    'Europe/Berlin': 'DE',
    'Europe/Paris': 'FR',
    'Europe/Istanbul': 'TR',
    'Australia/Sydney': 'AU',
    'Asia/Tokyo': 'JP'
  };
  return tzMap[timezone] || 'US';
};

// Process analytics data from tickets and AI conversations
const processAnalyticsData = (tickets, conversations, timeRange) => {
  const groupedData = {};
  const categoryData = {};
  const sentimentData = {};
  const locationData = {};
  
  // Process tickets
  tickets.forEach(ticket => {
    const date = ticket.createdAt.toDate();
    let dateKey;

    // Group by time range
    switch (timeRange) {
      case 'weekly':
        dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'monthly':
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // daily
        dateKey = `${String(date.getHours()).padStart(2, '0')}:00`;
    }

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = { opened: 0, resolved: 0 };
    }

    groupedData[dateKey].opened++;
    
    if (ticket.status === TICKET_STATUSES.RESOLVED || ticket.status === TICKET_STATUSES.CLOSED) {
      groupedData[dateKey].resolved++;
    }
  });

  // Process AI conversations for additional analytics
  conversations.forEach(conversation => {
    // Category analysis from AI
    if (conversation.analysis?.category) {
      const category = conversation.analysis.category;
      categoryData[category] = (categoryData[category] || 0) + 1;
    }

    // Sentiment analysis from AI
    if (conversation.analysis?.sentiment) {
      const sentiment = conversation.analysis.sentiment;
      sentimentData[sentiment] = (sentimentData[sentiment] || 0) + 1;
    }

    // Location data (mock for now - could be extracted from session data)
    // In real implementation, get from sessionData.userLocation
    const locations = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'IN'];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    locationData[randomLocation] = (locationData[randomLocation] || 0) + 1;
  });

  // Convert objects to arrays for charts
  const categoryArray = Object.entries(categoryData).map(([category, count]) => ({
    category,
    count
  }));

  const sentimentArray = Object.entries(sentimentData).map(([sentiment, count]) => ({
    sentiment,
    count
  }));

  const locationArray = Object.entries(locationData).map(([country, count]) => ({
    country,
    count
  }));

  // Calculate summary stats
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => 
    t.status === TICKET_STATUSES.RESOLVED || t.status === TICKET_STATUSES.CLOSED
  ).length;
  const openTickets = totalTickets - resolvedTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;
  const avgResponseTime = '2.3h'; // TODO: Calculate real response time
  const totalUsers = locationArray.reduce((sum, item) => sum + item.count, 0);

  return {
    chartData: groupedData,
    categoryData: categoryArray,
    sentimentData: sentimentArray,
    locationData: locationArray,
    totalUsers,
    summary: {
      resolutionRate,
      openTickets,
      resolvedToday: resolvedTickets,
      avgResponseTime
    }
  };
};

// Process new analytics data structure
const processNewAnalyticsData = (analyticsData, conversations, timeRange) => {
  const groupedData = {};
  const categoryData = {};
  const sentimentData = {};
  const locationData = {};

  // First, initialize ALL periods with zeros
  const now = new Date();
  let periods = [];
  switch (timeRange) {
    case 'weekly':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(date.toISOString().split('T')[0]);
      }
      break;
    case 'monthly':
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(date.toISOString().split('T')[0]);
      }
      break;
    default: // daily
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        periods.push(`${String(hour.getHours()).padStart(2, '0')}:00`);
      }
  }

  // Initialize all periods with zero values
  periods.forEach(period => {
    groupedData[period] = { opened: 0, resolved: 0 };
  });

  // Aggregate data from daily stats
  let totalSessions = 0;
  let totalMessages = 0;
  let avgResponseTime = 0;

  analyticsData.forEach(dayData => {
    if (dayData.totalSessions) totalSessions += dayData.totalSessions;
    if (dayData.totalMessages) totalMessages += dayData.totalMessages;
    if (dayData.avgResponseTime) avgResponseTime = dayData.avgResponseTime; // Use latest

    // Aggregate sentiment data
    if (dayData.sentimentCounts) {
      Object.entries(dayData.sentimentCounts).forEach(([sentiment, count]) => {
        sentimentData[sentiment] = (sentimentData[sentiment] || 0) + count;
      });
    }

    // Aggregate intent/category data
    if (dayData.intents) {
      Object.entries(dayData.intents).forEach(([intent, count]) => {
        categoryData[intent] = (categoryData[intent] || 0) + count;
      });
    }

    // For chart data, create time-based grouping
    const date = dayData.date;
    if (date && groupedData[date]) {
      groupedData[date] = {
        opened: dayData.totalSessions || 0,
        resolved: Math.floor((dayData.totalSessions || 0) * 0.7) // Mock resolution rate
      };
    }
  });

  // Convert objects to arrays for charts - always show all categories
  const allCategories = ['support', 'sales', 'information', 'complaint', 'question', 'technical', 'other'];
  const categoryArray = allCategories.map(category => ({
    category,
    count: categoryData[category] || 0
  }));

  // Always show all sentiments
  const allSentiments = ['positive', 'neutral', 'negative'];
  const sentimentArray = allSentiments.map(sentiment => ({
    sentiment,
    count: sentimentData[sentiment] || 0
  }));

  // Mock location data for now - always show all locations
  const locationArray = [
    { country: 'US', count: Math.floor(totalSessions * 0.4) || 0 },
    { country: 'CA', count: Math.floor(totalSessions * 0.2) || 0 },
    { country: 'GB', count: Math.floor(totalSessions * 0.15) || 0 },
    { country: 'DE', count: Math.floor(totalSessions * 0.1) || 0 },
    { country: 'FR', count: Math.floor(totalSessions * 0.08) || 0 },
    { country: 'AU', count: Math.floor(totalSessions * 0.05) || 0 },
    { country: 'JP', count: Math.floor(totalSessions * 0.02) || 0 }
  ];

  return {
    chartData: groupedData,
    categoryData: categoryArray,
    sentimentData: sentimentArray,
    locationData: locationArray,
    totalUsers: locationArray.reduce((sum, item) => sum + item.count, 0),
    summary: {
      resolutionRate: 75, // Mock resolution rate
      openTickets: Math.floor(totalSessions * 0.3),
      resolvedToday: Math.floor(totalSessions * 0.7),
      avgResponseTime: avgResponseTime ? `${avgResponseTime}ms` : '2.3h'
    }
  };
};

// Process conversations data only
const processConversationsData = (conversations, timeRange) => {
  const groupedData = {};
  const categoryData = {};
  const sentimentData = {};
  const locationData = {};

  // First, initialize ALL periods with zeros
  const now = new Date();
  let periods = [];
  switch (timeRange) {
    case 'weekly':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(date.toISOString().split('T')[0]);
      }
      break;
    case 'monthly':
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(date.toISOString().split('T')[0]);
      }
      break;
    default: // daily
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        periods.push(`${String(hour.getHours()).padStart(2, '0')}:00`);
      }
  }

  // Initialize all periods with zero values
  periods.forEach(period => {
    groupedData[period] = { opened: 0, resolved: 0 };
  });

  // Process conversations
  conversations.forEach(conversation => {
    const date = conversation.createdAt.toDate();
    let dateKey;

    // Group by time range
    switch (timeRange) {
      case 'weekly':
        dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'monthly':
        dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD for monthly too
        break;
      default: // daily
        dateKey = `${String(date.getHours()).padStart(2, '0')}:00`;
    }

    if (groupedData[dateKey]) {
      groupedData[dateKey].opened++;
      groupedData[dateKey].resolved = Math.floor(groupedData[dateKey].opened * 0.7); // Mock resolution
    }
    
    // Category analysis from AI
    if (conversation.analysis?.category) {
      const category = conversation.analysis.category;
      categoryData[category] = (categoryData[category] || 0) + 1;
    }

    // Sentiment analysis from AI
    if (conversation.analysis?.sentiment) {
      const sentiment = conversation.analysis.sentiment;
      sentimentData[sentiment] = (sentimentData[sentiment] || 0) + 1;
    }

    // Mock location data
    const locations = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'IN'];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    locationData[randomLocation] = (locationData[randomLocation] || 0) + 1;
  });

  // Convert objects to arrays for charts - always show all categories
  const allCategories = ['support', 'sales', 'information', 'complaint', 'question', 'technical', 'other'];
  const categoryArray = allCategories.map(category => ({
    category,
    count: categoryData[category] || 0
  }));

  // Always show all sentiments
  const allSentiments = ['positive', 'neutral', 'negative'];
  const sentimentArray = allSentiments.map(sentiment => ({
    sentiment,
    count: sentimentData[sentiment] || 0
  }));

  // Always show all locations
  const allLocations = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'IN'];
  const locationArray = allLocations.map(country => ({
    country,
    count: locationData[country] || 0
  }));

  const totalConversations = conversations.length;
  const totalUsers = locationArray.reduce((sum, item) => sum + item.count, 0);

  return {
    chartData: groupedData,
    categoryData: categoryArray,
    sentimentData: sentimentArray,
    locationData: locationArray,
    totalUsers,
    summary: {
      resolutionRate: 75, // Mock resolution rate
      openTickets: Math.floor(totalConversations * 0.3),
      resolvedToday: Math.floor(totalConversations * 0.7),
      avgResponseTime: '2.3h'
    }
  };
};

// Process ticket data for charts (legacy - keeping for backwards compatibility)
const processTicketData = (tickets, timeRange) => {
  const groupedData = {};
  const categoryStats = {};
  
  tickets.forEach(ticket => {
    const date = ticket.createdAt.toDate();
    let dateKey;

    // Group by time range
    switch (timeRange) {
      case 'weekly':
        dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'monthly':
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // daily
        dateKey = `${String(date.getHours()).padStart(2, '0')}:00`;
    }

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = { opened: 0, resolved: 0 };
    }

    groupedData[dateKey].opened++;
    
    if (ticket.status === TICKET_STATUSES.RESOLVED || ticket.status === TICKET_STATUSES.CLOSED) {
      groupedData[dateKey].resolved++;
    }

    // Category stats
    if (!categoryStats[ticket.category]) {
      categoryStats[ticket.category] = 0;
    }
    categoryStats[ticket.category]++;
  });

  // Calculate summary stats
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter(t => 
    t.status === TICKET_STATUSES.RESOLVED || t.status === TICKET_STATUSES.CLOSED
  ).length;
  const openTickets = totalTickets - resolvedTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

  // Calculate average response time (mock for now)
  const avgResponseTime = '2.3h'; // TODO: Calculate real response time

  return {
    chartData: groupedData,
    categoryStats,
    summary: {
      resolutionRate,
      openTickets,
      resolvedToday: resolvedTickets,
      avgResponseTime
    }
  };
};

// Get recent ticket activity
export const getRecentActivity = async (agentId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('agentId', '==', agentId),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const ticket = { id: doc.id, ...doc.data() };
      return {
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        updatedAt: ticket.updatedAt,
        category: ticket.category
      };
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    throw error;
  }
};

// Create demo analytics data for testing
// Create empty analytics with all zeros
const createEmptyAnalytics = (timeRange) => {
  const now = new Date();
  const groupedData = {};

  // Generate periods based on time range
  let periods = [];
  switch (timeRange) {
    case 'weekly':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(date.toISOString().split('T')[0]);
      }
      break;
    case 'monthly':
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        periods.push(date.toISOString().split('T')[0]);
      }
      break;
    default: // daily (last 24 hours)
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        periods.push(`${String(hour.getHours()).padStart(2, '0')}:00`);
      }
  }

  // Create all periods with zero values
  periods.forEach(period => {
    groupedData[period] = { opened: 0, resolved: 0 };
  });

  // All categories with zero counts
  const allCategories = ['support', 'sales', 'information', 'complaint', 'question', 'technical', 'other'];
  const categoryData = allCategories.map(category => ({
    category,
    count: 0
  }));

  // All sentiments with zero counts (1-10 scoring)
  const sentimentData = Array.from({ length: 10 }, (_, i) => ({
    sentiment: i + 1,
    count: 0
  }));

  // All locations with zero counts
  const allLocations = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'TR'];
  const locationData = allLocations.map(country => ({
    country,
    count: 0
  }));

  // All urgencies with zero counts
  const allUrgencies = ['low', 'medium', 'high'];
  const urgencyData = allUrgencies.map(urgency => ({
    urgency,
    count: 0
  }));

  // All topics with zero counts
  const allTopics = ['pricing', 'features', 'integration', 'billing', 'technical', 'general'];
  const topicData = allTopics.map(topic => ({
    topic,
    count: 0
  }));

  // Empty engagement and device data
  const engagementData = {};
  const deviceData = {};
  const referrerData = {};
  const browserData = {};
  const languageData = {};
  const leadQualityData = {};

  return {
    chartData: groupedData,
    categoryData,
    sentimentData,
    locationData,
    urgencyData,
    topicData,
    engagementData,
    deviceData,
    referrerData,
    browserData,
    languageData,
    leadQualityData,
    totalUsers: 0,
    detailedMetrics: {
      avgTimeOnPageBeforeChat: 0,
      avgSessionDuration: 0,
      avgScrollDepth: 0,
      returnVisitorRate: 0,
      avgMessagesPerSession: 0,
      totalSessions: 0
    },
    recentSessions: [],
    summary: {
      resolutionRate: 0,
      openTickets: 0,
      resolvedToday: 0,
      avgResponseTime: '0h'
    }
  };
};