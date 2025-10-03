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

    // Get conversations from new structure: users/{userId}/agents/{agentId}/conversations/
    let conversations = [];
    let analytics = null;
    
    if (userId) {
      try {
        // Get conversations from new structure
        const conversationsQuery = query(
          collection(db, 'users', userId, 'agents', agentId, 'conversations'),
          where('createdAt', '>=', Timestamp.fromDate(startDate)),
          orderBy('createdAt', 'asc')
        );
        const conversationsSnapshot = await getDocs(conversationsQuery);
        conversations = conversationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Found conversations:', conversations.length, 'for agent:', agentId);

        // Get analytics data from new structure
        try {
          const analyticsQuery = query(
            collection(db, 'users', userId, 'agents', agentId, 'analytics', 'daily', 'stats'),
            orderBy('date', 'desc'),
            limit(30)
          );
          const analyticsSnapshot = await getDocs(analyticsQuery);
          const analyticsData = analyticsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('Found analytics data:', analyticsData.length, 'records');
          
          if (analyticsData.length > 0) {
            analytics = processNewAnalyticsData(analyticsData, conversations, timeRange);
          }
        } catch (analyticsError) {
          console.log('No analytics data found, will use conversations only');
        }
      } catch (error) {
        console.log('Error fetching from new structure:', error);
      }
    }

    // If no data found, create demo data for testing
    if (conversations.length === 0 && !analytics) {
      console.log('No data found, creating demo data...');
      return createDemoAnalytics(timeRange);
    }

    // Process data for analytics
    if (analytics) {
      return analytics;
    } else {
      return processConversationsData(conversations, timeRange);
    }
  } catch (error) {
    console.error('Error getting ticket analytics:', error);
    throw error;
  }
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
    if (date) {
      groupedData[date] = {
        opened: dayData.totalSessions || 0,
        resolved: Math.floor((dayData.totalSessions || 0) * 0.7) // Mock resolution rate
      };
    }
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

  // Mock location data for now
  const locationArray = [
    { country: 'US', count: Math.floor(totalSessions * 0.4) },
    { country: 'CA', count: Math.floor(totalSessions * 0.2) },
    { country: 'GB', count: Math.floor(totalSessions * 0.15) },
    { country: 'DE', count: Math.floor(totalSessions * 0.1) },
    { country: 'FR', count: Math.floor(totalSessions * 0.08) },
    { country: 'AU', count: Math.floor(totalSessions * 0.05) },
    { country: 'JP', count: Math.floor(totalSessions * 0.02) }
  ].filter(item => item.count > 0);

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
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default: // daily
        dateKey = `${String(date.getHours()).padStart(2, '0')}:00`;
    }

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = { opened: 0, resolved: 0 };
    }

    groupedData[dateKey].opened++;
    groupedData[dateKey].resolved = Math.floor(groupedData[dateKey].opened * 0.7); // Mock resolution
    
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
const createDemoAnalytics = (timeRange) => {
  const now = new Date();
  const groupedData = {};
  
  // Generate demo data based on time range
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
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!periods.includes(monthKey)) periods.push(monthKey);
      }
      break;
    default: // daily
      for (let i = 23; i >= 0; i--) {
        periods.push(`${String(i).padStart(2, '0')}:00`);
      }
  }
  
  periods.forEach(period => {
    groupedData[period] = {
      opened: Math.floor(Math.random() * 20) + 5,
      resolved: Math.floor(Math.random() * 15) + 3
    };
  });
  
  const categoryData = [
    { category: 'support', count: 45 },
    { category: 'sales', count: 32 },
    { category: 'information', count: 28 },
    { category: 'complaint', count: 12 },
    { category: 'question', count: 18 }
  ];
  
  const sentimentData = [
    { sentiment: 'positive', count: 78 },
    { sentiment: 'neutral', count: 45 },
    { sentiment: 'negative', count: 12 }
  ];
  
  const locationData = [
    { country: 'US', count: 42 },
    { country: 'CA', count: 28 },
    { country: 'GB', count: 19 },
    { country: 'DE', count: 15 },
    { country: 'FR', count: 12 },
    { country: 'AU', count: 8 },
    { country: 'JP', count: 5 }
  ];
  
  return {
    chartData: groupedData,
    categoryData,
    sentimentData,
    locationData,
    totalUsers: locationData.reduce((sum, item) => sum + item.count, 0),
    summary: {
      resolutionRate: 85,
      openTickets: 23,
      resolvedToday: 67,
      avgResponseTime: '2.3h'
    }
  };
};