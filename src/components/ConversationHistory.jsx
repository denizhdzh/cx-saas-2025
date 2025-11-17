import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, CogIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';

export default function ConversationHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { agents, selectAgent, selectedAgent } = useAgent();
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const agentDropdownRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setIsAgentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load sessions when agent changes
  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedAgent?.id || !user?.uid) return;

      setLoading(true);
      try {
        // Path: users/{userId}/agents/{agentId}/sessions/{anonymousUserId}/conversations/{conversationId}
        const sessionsRef = collection(db, 'users', user.uid, 'agents', selectedAgent.id, 'sessions');
        const sessionsSnapshot = await getDocs(sessionsRef);

        const allConversations = [];

        // Loop through each session (anonymous user)
        for (const sessionDoc of sessionsSnapshot.docs) {
          const sessionData = sessionDoc.data();
          const anonymousUserId = sessionDoc.id;

          // Get all conversations for this session
          const conversationsRef = collection(sessionDoc.ref, 'conversations');
          const conversationsSnapshot = await getDocs(conversationsRef);

          for (const convDoc of conversationsSnapshot.docs) {
            const convData = convDoc.data();

            // Only show analyzed conversations
            if (convData.analyzed) {
              allConversations.push({
                id: convDoc.id,
                anonymousUserId,
                ...convData,
                userInfo: sessionData.userInfo || {},
                conversationSummary: convData.conversationSummary || {},
                analysis: convData.analysis || {}
              });
            }
          }
        }

        // Sort by last message time (most recent first)
        allConversations.sort((a, b) => {
          const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
          const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
          return timeB - timeA;
        });

        setSessions(allConversations);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [selectedAgent?.id, user?.uid]);

  const handleAgentSelect = (agent) => {
    selectAgent(agent);
    setIsAgentDropdownOpen(false);
  };

  const handleAgentSettings = () => {
    setIsAgentDropdownOpen(false);
    navigate(`/dashboard/${selectedAgent?.id}`);
  };

  const handleSessionClick = async (session) => {
    setSelectedSession(session);
    setIsModalOpen(true);

    // Fetch messages for this conversation
    try {
      const messagesRef = collection(
        db,
        'users',
        user.uid,
        'agents',
        selectedAgent.id,
        'sessions',
        session.anonymousUserId,
        'conversations',
        session.id,
        'messages'
      );
      const messagesSnapshot = await getDocs(query(messagesRef));

      const messageList = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeA - timeB;
      });

      setMessages(messageList);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Feedback': 'bg-blue-500/20 text-blue-800 border-blue-200',
      'Question': 'bg-purple-500/20 text-purple-800 border-purple-200',
      'Support Request': 'bg-orange-500/20 text-orange-800 border-orange-200',
      'Sales Inquiry': 'bg-green-500/20 text-green-800 border-green-200',
      'Bug Report': 'bg-red-500/20 text-red-800 border-red-200',
      'General': 'bg-neutral-500/20 text-neutral-800 border-neutral-200'
    };
    return colors[category] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'high': 'bg-red-500/20 text-red-800 border-red-200',
      'medium': 'bg-yellow-500/20 text-yellow-800 border-yellow-200',
      'low': 'bg-green-500/20 text-green-800 border-green-200'
    };
    return colors[urgency] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  if (!selectedAgent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium text-neutral-900 mb-2">No Agent Selected</div>
          <div className="text-neutral-500">Please select an agent to view conversations.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Header with Agent Dropdown */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Agent Dropdown */}
          <div className="relative" ref={agentDropdownRef}>
            <button
              onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-neutral-200 dark:md:hover:bg-neutral-800 transition-colors"
            >
              <div className="w-5 h-5 bg-neutral-100 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                {selectedAgent?.logoUrl ? (
                  <img
                    src={selectedAgent.logoUrl}
                    alt={selectedAgent.name}
                    className="w-5 h-5 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-4 h-4 bg-neutral-600" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-md font-bold text-neutral-900 dark:text-neutral-50">
                  {selectedAgent?.projectName || selectedAgent?.name || 'Select Agent'}
                </div>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-neutral-500 transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isAgentDropdownOpen && (
              <div className="absolute top-full left-0 min-w-[250px] mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                <div className="p-1 space-y-0.5">
                  {agents.map((agentOption) => (
                    <button
                      key={agentOption.id}
                      onClick={() => handleAgentSelect(agentOption)}
                      className={`w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group ${
                        selectedAgent?.id === agentOption.id ? 'bg-neutral-50 dark:bg-neutral-800' : ''
                      }`}
                    >
                      <div className="w-4 h-4 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {agentOption.logoUrl ? (
                          <img
                            src={agentOption.logoUrl}
                            alt={agentOption.name}
                            className="w-4 h-4 object-cover rounded"
                          />
                        ) : (
                          <div className="w-3 h-3 bg-neutral-600 dark:bg-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{agentOption.projectName || agentOption.name}</div>
                      </div>
                    </button>
                  ))}

                  {/* Agent Settings */}
                  <div className="border-t border-neutral-100 dark:border-neutral-700 mt-1 p-1">
                    <button
                      onClick={handleAgentSettings}
                      className="w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                    >
                      <CogIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Back to Dashboard</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Conversation History
          </h1>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-neutral-400 text-sm">Loading conversations...</div>
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className="w-full flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/30 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors text-left"
              >
                {/* Left: Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(session.analysis?.mainCategory)}`}>
                      {session.analysis?.mainCategory || 'General'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(session.analysis?.urgency)}`}>
                      {session.analysis?.urgency || 'low'} priority
                    </span>
                    {session.analysis?.resolved ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-800 border border-green-200">
                        ✓ Resolved
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-800 border border-orange-200">
                        Unresolved
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1 truncate">
                    {session.analysis?.summary || 'No summary available'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {session.lastMessageTime?.toDate?.().toLocaleString() || 'Unknown time'}
                    {session.userInfo?.location?.city && (
                      <> • {session.userInfo.location.city}, {session.userInfo.location.country}</>
                    )}
                  </div>
                </div>

                {/* Right: Stats */}
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xs text-neutral-500">
                    Sentiment: <span className="font-semibold text-neutral-900 dark:text-neutral-50">{session.analysis?.sentimentScore || 5}/10</span>
                  </div>
                  <div className="text-xs text-neutral-500">
                    {session.messageCount || 0} messages
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-neutral-400 dark:text-neutral-500 text-sm mb-1">No conversations yet</div>
              <div className="text-neutral-300 dark:text-neutral-600 text-xs">Conversations will appear here once analyzed</div>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Detail Modal */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(selectedSession.analysis?.mainCategory)}`}>
                    {selectedSession.analysis?.mainCategory || 'General'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(selectedSession.analysis?.urgency)}`}>
                    {selectedSession.analysis?.urgency || 'low'} priority
                  </span>
                  {selectedSession.analysis?.resolved ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-800 border border-green-200">
                      ✓ Resolved
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-800 border border-orange-200">
                      Unresolved
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                  {selectedSession.analysis?.summary || 'Conversation Details'}
                </h2>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {selectedSession.lastMessageTime?.toDate?.().toLocaleString()}
                  {selectedSession.userInfo?.location && (
                    <> • {selectedSession.userInfo.location.city}, {selectedSession.userInfo.location.country}</>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSession(null);
                  setMessages([]);
                }}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Modal Body - Analysis */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Analysis Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3">AI Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="text-xs text-neutral-500 mb-1">Intent</div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50 capitalize">
                      {selectedSession.analysis?.intent || 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="text-xs text-neutral-500 mb-1">Sentiment Score</div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {selectedSession.analysis?.sentimentScore || 5}/10
                    </div>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg col-span-2">
                    <div className="text-xs text-neutral-500 mb-1">Sub-Category</div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {selectedSession.analysis?.subCategory || 'N/A'}
                    </div>
                  </div>
                  {selectedSession.analysis?.keyTopics && selectedSession.analysis.keyTopics.length > 0 && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg col-span-2">
                      <div className="text-xs text-neutral-500 mb-2">Key Topics</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSession.analysis.keyTopics.map((topic, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Section */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-3">Conversation</h3>
                {messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 capitalize">
                          {msg.role}
                        </div>
                        <div className="text-sm text-neutral-900 dark:text-neutral-50 whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          {msg.timestamp?.toDate?.().toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-center text-sm text-neutral-500">
                    Messages have been archived after analysis
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
