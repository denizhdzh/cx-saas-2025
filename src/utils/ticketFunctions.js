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
export const getTicketAnalytics = async (agentId, timeRange = 'daily') => {
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

    const q = query(
      collection(db, 'tickets'),
      where('agentId', '==', agentId),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Process data for analytics
    const analytics = processTicketData(tickets, timeRange);
    return analytics;
  } catch (error) {
    console.error('Error getting ticket analytics:', error);
    throw error;
  }
};

// Process ticket data for charts
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
export const getRecentActivity = async (agentId, limit = 10) => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('agentId', '==', agentId),
      orderBy('updatedAt', 'desc'),
      limit(limit)
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