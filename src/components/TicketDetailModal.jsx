import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export default function TicketDetailModal({ ticket, isOpen, onClose, agentId, userId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConversation = async () => {
      if (!isOpen || !ticket || !agentId || !userId) {
        console.log('TicketDetailModal - Missing data:', { isOpen, hasTicket: !!ticket, agentId, userId });
        return;
      }

      setLoading(true);
      try {
        // Load messages from the session that created this ticket
        if (ticket.sessionId) {
          const sessionPath = `users/${userId}/agents/${agentId}/sessions/${ticket.sessionId}`;
          console.log('TicketDetailModal - Loading from session:', sessionPath);
          console.log('TicketDetailModal - Ticket data:', ticket);

          // First, get all conversations for this session
          const conversationsRef = collection(
            db,
            'users',
            userId,
            'agents',
            agentId,
            'sessions',
            ticket.sessionId,
            'conversations'
          );
          const conversationsSnapshot = await getDocs(conversationsRef);

          console.log('TicketDetailModal - Found conversations:', conversationsSnapshot.docs.length);

          // Collect all messages from all conversations
          const allMessages = [];

          for (const convDoc of conversationsSnapshot.docs) {
            const messagesRef = collection(
              db,
              'users',
              userId,
              'agents',
              agentId,
              'sessions',
              ticket.sessionId,
              'conversations',
              convDoc.id,
              'messages'
            );
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
            const messagesSnapshot = await getDocs(messagesQuery);

            messagesSnapshot.docs.forEach(doc => {
              allMessages.push({
                id: doc.id,
                conversationId: convDoc.id,
                ...doc.data()
              });
            });
          }

          // Sort all messages by timestamp
          allMessages.sort((a, b) => {
            const timeA = a.timestamp?.toDate?.() || new Date(0);
            const timeB = b.timestamp?.toDate?.() || new Date(0);
            return timeA - timeB;
          });

          console.log('TicketDetailModal - Total messages from all conversations:', allMessages.length);
          console.log('TicketDetailModal - Processed messages:', allMessages);
          setMessages(allMessages);
        } else {
          console.warn('TicketDetailModal - No sessionId found in ticket:', ticket);
        }
      } catch (error) {
        console.error('TicketDetailModal - Error loading conversation:', error);
        console.error('TicketDetailModal - Error details:', {
          code: error.code,
          message: error.message,
          sessionId: ticket?.sessionId,
          agentId,
          userId
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [isOpen, ticket, agentId, userId]);

  if (!isOpen || !ticket) return null;

  const getCategoryColor = (category) => {
    const colors = {
      'Feedback': 'bg-blue-500/5 text-blue-500 border-blue-500',
      'Question': 'bg-purple-500/5 text-purple-500 border-purple-500',
      'Support Request': 'bg-orange-500/5 text-orange-500 border-orange-500',
      'Support': 'bg-orange-500/5 text-orange-500 border-orange-500',
      'Sales Inquiry': 'bg-green-500/5 text-green-500 border-green-500',
      'Sales': 'bg-green-500/5 text-green-500 border-green-500',
      'Bug Report': 'bg-red-500/5 text-red-500 border-red-500',
      'Complaint': 'bg-red-500/5 text-red-500 border-red-500',
      'General': 'bg-neutral-500/5 text-neutral-500 border-neutral-500'
    };
    return colors[category] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Ticket Details
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(ticket.category)}`}>
                {ticket.category}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                ticket.urgency >= 7 ? 'bg-red-500/5 text-red-500 border-red-500' :
                ticket.urgency >= 4 ? 'bg-yellow-500/5 text-yellow-500 border-yellow-500' :
                'bg-green-500/5 text-green-500 border-green-500'
              }`}>
                Urgency: {ticket.urgency}/10
              </span>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                ticket.status === 'open'
                  ? 'bg-orange-500/5 text-orange-500 border-orange-500'
                  : 'bg-green-500/5 text-green-500 border-green-500'
              }`}>
                {ticket.status === 'open' ? '🔴 Open' : '✓ Closed'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Ticket Info */}
        <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
          <div className="mb-4">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Summary</div>
            <div className="text-base font-medium text-neutral-900 dark:text-neutral-50">
              {ticket.summary}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ticket.email && (
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Email</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  📧 {ticket.email}
                </div>
              </div>
            )}
            {ticket.userInfo?.location?.city && (
              <div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Location</div>
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  📍 {ticket.userInfo.location.city}, {ticket.userInfo.location.country}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Sentiment Score</div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {ticket.userSentimentScore}/10
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">AI Confidence</div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {ticket.aiConfidence}%
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Created</div>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {ticket.createdAt?.toDate?.().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
            Conversation History
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-neutral-400 text-sm">Loading conversation...</div>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === 'user' || message.sender === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg p-3 ${
                        isUser
                          ? 'bg-orange-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isUser ? 'text-orange-100' : 'text-neutral-500'
                        }`}
                      >
                        {message.timestamp?.toDate?.().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-neutral-400 dark:text-neutral-500 text-sm mb-1">No conversation</div>
                <div className="text-neutral-300 dark:text-neutral-600 text-xs">
                  No conversation history available for this ticket
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
