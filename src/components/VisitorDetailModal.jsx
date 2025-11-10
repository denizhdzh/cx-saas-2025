import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export default function VisitorDetailModal({ visitor, isOpen, onClose, agentId, userId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      if (!isOpen || !visitor || !agentId || !userId) {
        console.log('VisitorDetailModal - Missing data:', { isOpen, hasVisitor: !!visitor, agentId, userId });
        return;
      }

      setLoading(true);
      try {
        const sessionPath = `users/${userId}/agents/${agentId}/sessions/${visitor.id}`;
        console.log('VisitorDetailModal - Loading from session:', sessionPath);

        // First, get all conversations for this session
        const conversationsRef = collection(
          db,
          'users',
          userId,
          'agents',
          agentId,
          'sessions',
          visitor.id,
          'conversations'
        );
        const conversationsSnapshot = await getDocs(conversationsRef);

        console.log('VisitorDetailModal - Found conversations:', conversationsSnapshot.docs.length);

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
            visitor.id,
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

        console.log('VisitorDetailModal - Total messages from all conversations:', allMessages.length);
        console.log('VisitorDetailModal - Processed messages:', allMessages);
        setMessages(allMessages);
      } catch (error) {
        console.error('VisitorDetailModal - Error loading messages:', error);
        console.error('VisitorDetailModal - Error details:', {
          code: error.code,
          message: error.message,
          visitor: visitor.id,
          agentId,
          userId
        });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [isOpen, visitor, agentId, userId]);

  if (!isOpen || !visitor) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50 mb-2">
              Visitor Details
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {visitor.anonymousUserId}
              </span>
              {visitor.userEmail && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/5 text-blue-500 border border-blue-500">
                  {visitor.userEmail}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Visitor Info */}
        <div className="p-6 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-800">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {visitor.userInfo?.location?.city && (
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Location</div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-50">
                  📍 {visitor.userInfo.location.city}, {visitor.userInfo.location.country}
                </div>
              </div>
            )}
            {visitor.userInfo?.device?.browser && (
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Device</div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-50">
                  💻 {visitor.userInfo.device.browser} on {visitor.userInfo.device.deviceType}
                </div>
              </div>
            )}
            {visitor.userInfo?.language && (
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Language</div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-50">
                  🌐 {visitor.userInfo.language}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Conversations</div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {visitor.totalConversations || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Last Visit</div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {visitor.lastMessageTime?.toDate?.().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-4">
            Conversation History
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-stone-400 text-sm">Loading messages...</div>
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
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-50'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isUser ? 'text-orange-100' : 'text-stone-500'
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
                <div className="text-stone-400 dark:text-stone-500 text-sm mb-1">No messages</div>
                <div className="text-stone-300 dark:text-stone-600 text-xs">
                  No conversation history available
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
