import { createTicket, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from './ticketFunctions';

// Test ticket data generator
export const createTestTickets = async (agentId, count = 20) => {
  const categories = Object.values(TICKET_CATEGORIES);
  const priorities = Object.values(TICKET_PRIORITIES);
  const statuses = Object.values(TICKET_STATUSES);
  
  const sampleTitles = [
    'Chatbot not responding to queries',
    'Integration with Slack failing',
    'Add multilingual support',
    'Response time is too slow',
    'Wrong answers for product information',
    'Cannot access dashboard',
    'Export conversation history feature',
    'Custom training data upload',
    'Widget styling customization',
    'API rate limits too restrictive'
  ];

  const sampleDescriptions = [
    'Users are reporting that the chatbot is not responding to their queries consistently.',
    'The Slack integration is failing with authentication errors.',
    'We need support for Spanish and French languages.',
    'Response time is over 5 seconds which is unacceptable.',
    'The bot is providing incorrect product information to customers.',
    'Users cannot access the admin dashboard after login.',
    'Need ability to export conversation history as CSV.',
    'Allow users to upload custom training data files.',
    'Need more customization options for the chat widget appearance.',
    'Current API rate limits are too restrictive for our use case.'
  ];

  const promises = [];
  
  for (let i = 0; i < count; i++) {
    const now = new Date();
    const randomDaysAgo = Math.floor(Math.random() * 7); // Last 7 days
    const randomHoursAgo = Math.floor(Math.random() * 24);
    
    const createdDate = new Date(now.getTime() - (randomDaysAgo * 24 * 60 * 60 * 1000) - (randomHoursAgo * 60 * 60 * 1000));
    
    const ticketData = {
      title: sampleTitles[Math.floor(Math.random() * sampleTitles.length)],
      description: sampleDescriptions[Math.floor(Math.random() * sampleDescriptions.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      userId: `user_${Math.random().toString(36).substring(7)}`,
      userEmail: `user${i}@example.com`,
      tags: ['test-data']
    };

    // Override createdAt for testing
    const promise = createTicket(agentId, ticketData).then(ticket => {
      // Randomly resolve some tickets
      if (Math.random() > 0.3) { // 70% chance to be resolved
        const resolvedStatus = Math.random() > 0.1 ? TICKET_STATUSES.RESOLVED : TICKET_STATUSES.CLOSED;
        // This would normally call updateTicketStatus, but for simplicity we'll leave as is
      }
      return ticket;
    });
    
    promises.push(promise);
  }

  try {
    const results = await Promise.all(promises);
    console.log(`Created ${results.length} test tickets for agent ${agentId}`);
    return results;
  } catch (error) {
    console.error('Error creating test tickets:', error);
    throw error;
  }
};

// Quick function to add to console for testing
window.createTestTickets = createTestTickets;