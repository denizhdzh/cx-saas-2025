import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, DocumentArrowUpIcon, CogIcon } from '@heroicons/react/24/outline';
import TicketChart from './TicketChart';
import CategoryDonutChart from './CategoryDonutChart';
import SentimentChart from './SentimentChart';
import UrgencyChart from './UrgencyChart';
import TopicChart from './TopicChart';
import UserWorldMap from './UserWorldMap';
import LanguageChart from './LanguageChart';
import EngagementChart from './EngagementChart';
import BrowserChart from './BrowserChart';
import DeviceChart from './DeviceChart';
import DetailedMetricsCard from './DetailedMetricsCard';
import ReturnUserChart from './ReturnUserChart';
import KnowledgeGapModal from './KnowledgeGapModal';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { getConversationAnalytics, getKnowledgeGaps } from '../utils/newAnalyticsFunctions';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function AgentDashboard({ agent, onShowEmbed }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { agents, selectAgent, selectedAgent } = useAgent();
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const agentDropdownRef = useRef(null);
  const timeDropdownRef = useRef(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState([]);
  const [timeRange, setTimeRange] = useState('weekly'); // hourly, daily, weekly, quarterly, alltime
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedGap, setSelectedGap] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'messages'
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setIsAgentDropdownOpen(false);
      }
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setIsTimeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load analytics data when agent changes or timeRange changes
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!agent?.id || !user?.uid) return;

      setAnalyticsLoading(true);
      try {
        const [analytics, gaps] = await Promise.all([
          getConversationAnalytics(agent.id, timeRange, user.uid),
          getKnowledgeGaps(agent.id, user.uid)
        ]);
        setAnalyticsData(analytics);
        setKnowledgeGaps(gaps);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
  }, [agent?.id, timeRange, user?.uid]);

  // Load sessions when Messages tab is active
  useEffect(() => {
    const loadSessions = async () => {
      if (activeTab !== 'messages' || !agent?.id || !user?.uid) return;

      setSessionsLoading(true);
      try {
        const sessionsRef = collection(db, 'users', user.uid, 'agents', agent.id, 'sessions');
        const sessionsSnapshot = await getDocs(sessionsRef);

        const allConversations = [];

        for (const sessionDoc of sessionsSnapshot.docs) {
          const sessionData = sessionDoc.data();
          const anonymousUserId = sessionDoc.id;

          const conversationsRef = collection(sessionDoc.ref, 'conversations');
          const conversationsSnapshot = await getDocs(conversationsRef);

          for (const convDoc of conversationsSnapshot.docs) {
            const convData = convDoc.data();

            // Show only analyzed conversations (those with analysis data)
            if (convData.analysis && Object.keys(convData.analysis).length > 0) {
              allConversations.push({
                id: convDoc.id,
                anonymousUserId,
                ...convData,
                userInfo: sessionData.userInfo || {},
                userEmail: sessionData.userEmail || null,
                conversationSummary: convData.conversationSummary || {},
                analysis: convData.analysis || {}
              });
            }
          }
        }

        allConversations.sort((a, b) => {
          const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
          const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
          return timeB - timeA;
        });

        setSessions(allConversations);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [activeTab, agent?.id, user?.uid]);

  const handleAgentSelect = (selectedAgent) => {
    selectAgent(selectedAgent);
    setIsAgentDropdownOpen(false);
    navigate(`/dashboard/${selectedAgent.id}`);
  };


  const handleAgentSettings = () => {
    setIsAgentDropdownOpen(false);
    if (onShowEmbed) {
      onShowEmbed();
    }
  };

  const handleFillGap = (gap) => {
    setSelectedGap(gap);
    setIsModalOpen(true);
  };

  const handleSubmitAnswer = async (gap, answer) => {
    try {
      // Call Cloud Function to process and add the answer
      const response = await fetch('https://us-central1-cx-saas-8510f.cloudfunctions.net/fillKnowledgeGap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          agentId: agent.id,
          gapId: gap.id,
          question: gap.representativeQuestion || gap.question,
          userAnswer: answer
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fill knowledge gap');
      }

      // Reload knowledge gaps after successful submission
      const updatedGaps = await getKnowledgeGaps(agent.id, user.uid);
      setKnowledgeGaps(updatedGaps);
    } catch (error) {
      console.error('Error filling knowledge gap:', error);
      throw error;
    }
  };

  const handleSessionClick = async (session) => {
    setSelectedSession(session);
    setIsConversationModalOpen(true);

    try {
      const messagesRef = collection(
        db,
        'users',
        user.uid,
        'agents',
        agent.id,
        'sessions',
        session.anonymousUserId,
        'conversations',
        session.id,
        'messages'
      );
      const messagesSnapshot = await getDocs(messagesRef);

      const messageList = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeA - timeB;
      });

      setConversationMessages(messageList);
    } catch (error) {
      console.error('Error loading messages:', error);
      setConversationMessages([]);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Feedback': 'bg-blue-500/5 text-blue-500 border-blue-500',
      'Question': 'bg-purple-500/5 text-purple-500 border-purple-500',
      'Support Request': 'bg-orange-500/5 text-orange-500 border-orange-500',
      'Sales Inquiry': 'bg-green-500/5 text-green-500 border-green-500',
      'Bug Report': 'bg-red-500/5 text-red-500 border-red-500',
      'General': 'bg-stone-500/5 text-stone-500 border-stone-500'
    };
    return colors[category] || 'bg-stone-100 text-stone-800 border-stone-200';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'high': 'bg-red-500/5 text-red-500 border-red-500',
      'medium': 'bg-yellow-500/5 text-yellow-500 border-yellow-500',
      'low': 'bg-green-500/5 text-green-500 border-green-500'
    };
    return colors[urgency] || 'bg-stone-100 text-stone-800 border-stone-200';
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium text-stone-900 mb-2">No Agent Selected</div>
          <div className="text-stone-500">Please select an agent to view analytics.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Controls Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Agent Dropdown */}
          <div className="relative" ref={agentDropdownRef}>
            <button
              onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-stone-200 dark:md:hover:bg-stone-800 transition-colors"
            >
              <div className="w-5 h-5 bg-stone-100 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                {agent?.logoUrl ? (
                  <img 
                    src={agent.logoUrl} 
                    alt={agent.name}
                    className="w-5 h-5 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-4 h-4 bg-stone-600" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-md font-bold text-stone-900 dark:text-stone-50">
                  {agent?.projectName || agent?.name || 'Select Agent'}
                </div>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-stone-500 transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isAgentDropdownOpen && (
              <div className="absolute top-full left-0 min-w-[250px] mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-10">
                <div className="p-1 space-y-0.5">
                  {agents.map((agentOption) => (
                    <button
                      key={agentOption.id}
                      onClick={() => handleAgentSelect(agentOption)}
                      className={`w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group ${
                        agent?.id === agentOption.id ? 'bg-stone-50 dark:bg-stone-800' : ''
                      }`}
                    >
                      <div className="w-4 h-4 bg-stone-100 dark:bg-stone-800 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {agentOption.logoUrl ? (
                          <img
                            src={agentOption.logoUrl}
                            alt={agentOption.name}
                            className="w-4 h-4 object-cover rounded"
                          />
                        ) : (
                          <div className="w-3 h-3 bg-stone-600 dark:bg-stone-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{agentOption.projectName || agentOption.name}</div>
                      </div>
                    </button>
                  ))}

                  {/* Agent Settings */}
                  <div className="border-t border-stone-100 dark:border-stone-700 mt-1 p-1">
                    <button
                      onClick={handleAgentSettings}
                      className="w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
                    >
                      <CogIcon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Embed Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Time Filter */}
          <div className="relative" ref={timeDropdownRef}>
            <button
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-stone-200 dark:md:hover:bg-stone-800 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="text-md font-bold text-stone-900 dark:text-stone-50">
                  {timeRange === 'hourly' ? 'Last 24H' :
                   timeRange === 'daily' ? 'Last 7 Days' :
                   timeRange === 'weekly' ? 'Last 30 Days' :
                   timeRange === 'quarterly' ? 'Last 90 Days' :
                   'All Time'}
                </div>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-stone-500 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isTimeDropdownOpen && (
              <div className="absolute top-full left-0 min-w-[150px] mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-10">
                <div className="p-1 space-y-0.5">
                  {['hourly', 'daily', 'weekly', 'quarterly', 'alltime'].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setTimeRange(range);
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group ${
                        timeRange === range ? 'bg-stone-50 dark:bg-stone-800' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                          {range === 'hourly' ? 'Last 24H' :
                           range === 'daily' ? 'Last 7 Days' :
                           range === 'weekly' ? 'Last 30 Days' :
                           range === 'quarterly' ? 'Last 90 Days' :
                           'All Time'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab System */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'messages'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-sm'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-50'
            }`}
          >
            Messages
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' && (
        <>
      {/* Analytics Dashboard */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        {/* Top Metrics Row */}
        <div className="flex items-center gap-8 mb-8">
          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Total Conversations</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {analyticsData?.summary?.totalConversations || '0'}
            </div>
          </div>

          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>

          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Analyzed</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {analyticsData?.summary?.analyzedConversations || '0'}
            </div>
          </div>

          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>

          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Non-Analyzed</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {analyticsData?.summary?.nonAnalyzedConversations || '0'}
            </div>
          </div>

          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>

          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Success Rate</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {analyticsData?.summary?.resolutionRate || '0'}%
            </div>
          </div>

          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>

          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Knowledge Gaps</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {knowledgeGaps?.length || '0'}
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-80">
          {analyticsLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-stone-400 text-sm">Loading analytics...</div>
            </div>
          ) : analyticsData?.totalConversations > 0 ? (
            <TicketChart
              chartData={analyticsData?.chartData || {}}
              showOpened={true}
              showResolved={false}
              timeRange={timeRange}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-stone-400 text-sm">No conversations in this period</div>
                <div className="text-stone-300 text-xs mt-1">Your customers haven't started any chats yet</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Analytics Row - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Intent Categories Donut Chart */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Conversation Categories</h3>
            <div className="text-sm text-stone-500">AI Analysis</div>
          </div>
          <div className="h-64">
            <CategoryDonutChart data={analyticsData?.categoryData || []} />
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Sentiment Analysis</h3>
            <div className="text-sm text-stone-500">User Mood</div>
          </div>
          <div className="h-80">
            <SentimentChart data={analyticsData?.sentimentData || []} />
          </div>
        </div>

        {/* Urgency Distribution */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Urgency Levels</h3>
            <div className="text-sm text-stone-500">AI-Detected Priority</div>
          </div>
          <div className="h-64">
            <UrgencyChart data={analyticsData?.urgencyData || []} />
          </div>
        </div>

        {/* Topic Distribution */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Conversation Topics</h3>
            <div className="text-sm text-stone-500">Subject Matter</div>
          </div>
          <div className="h-64">
            <TopicChart data={analyticsData?.topicData || []} />
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Languages</h3>
            <div className="text-sm text-stone-500">User Preferences</div>
          </div>
          <div className="h-64">
            <LanguageChart data={analyticsData?.languageData || {}} />
          </div>
        </div>

        {/* Browsers */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Browsers</h3>
            <div className="text-sm text-stone-500">Browser Distribution</div>
          </div>
          <div className="h-64">
            <BrowserChart data={analyticsData?.browserData || {}} />
          </div>
        </div>

        {/* Devices */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Devices</h3>
            <div className="text-sm text-stone-500">Device Types</div>
          </div>
          <div className="h-64">
            <DeviceChart data={analyticsData?.deviceData || {}} />
          </div>
        </div>

        {/* Return Users */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">User Type</h3>
            <div className="text-sm text-stone-500">New vs Return</div>
          </div>
          <div className="h-64">
            <ReturnUserChart data={analyticsData?.returnUserData || []} />
          </div>
        </div>
      </div>

      {/* User Locations - Full Width */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">User Locations</h3>
          <div className="text-sm text-stone-500">Geographic Distribution</div>
        </div>
        <div className="h-96">
          <UserWorldMap data={analyticsData?.locationData || []} />
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Detailed Metrics</h3>
          <div className="text-sm text-stone-500">Session Analytics</div>
        </div>
        <DetailedMetricsCard detailedMetrics={analyticsData?.detailedMetrics || {}} />
      </div>

      {/* Knowledge Gaps */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Knowledge Gaps</h3>
          <div className="text-sm text-stone-500">Questions your agent couldn't answer</div>
        </div>
        {knowledgeGaps.length > 0 ? (
          <div className="space-y-3">
            {knowledgeGaps.slice(0, 10).map((gap) => (
              <div
                key={gap.id}
                className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900/30 rounded-lg border border-stone-100 dark:border-stone-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {gap.category || 'General'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-50 mb-1">
                    {gap.representativeQuestion || gap.question || 'Unknown question'}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    First asked: {gap.firstAsked?.toLocaleDateString()} • Last asked: {gap.lastAsked?.toLocaleDateString()}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 font-semibold">
                    Asked {gap.count}x
                  </span>
                  <button
                    onClick={() => handleFillGap(gap)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                  >
                    Fill Gap
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <div className="text-center">
              <div className="text-stone-400 dark:text-stone-500 text-sm mb-1">You're all set!</div>
              <div className="text-stone-300 dark:text-stone-600 text-xs">No unanswered questions detected so far</div>
            </div>
          </div>
        )}
      </div>

        </>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          {sessionsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-stone-400 text-sm">Loading conversations...</div>
            </div>
          ) : sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionClick(session)}
                  className="w-full flex items-start gap-4 p-4 bg-stone-50 dark:bg-stone-900/30 rounded-lg border border-stone-100 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 transition-colors text-left"
                >
                  {/* Left: Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {session.analysis?.mainCategory ? (
                        <>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(session.analysis.mainCategory)}`}>
                            {session.analysis.mainCategory}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(session.analysis.urgency)}`}>
                            {session.analysis.urgency || 'low'} priority
                          </span>
                          {session.analysis.resolved ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/5 text-green-500 border border-green-500">
                              ✓ Resolved
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/5 text-orange-500 border border-orange-500">
                              Unresolved
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                          {session.shouldAnalyze === 'false' ? 'Trivial Chat' :
                           session.shouldAnalyze === 'pending' ? 'Pending Analysis' :
                           session.shouldAnalyze === 'true' ? 'Analyzing...' : 'Not Analyzed'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-50 mb-1 truncate">
                      {session.analysis?.summary || session.analysisReason || 'Conversation'}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {session.lastMessageTime?.toDate?.().toLocaleString() || 'Unknown time'}
                      {session.userEmail && <> • {session.userEmail}</>}
                      {session.userInfo?.location?.city && (
                        <> • {session.userInfo.location.city}, {session.userInfo.location.country}</>
                      )}
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="flex flex-col items-end gap-1">
                    {session.analysis?.sentimentScore ? (
                      <div className="text-xs text-stone-500">
                        Sentiment: <span className="font-semibold text-stone-900 dark:text-stone-50">{session.analysis.sentimentScore}/10</span>
                      </div>
                    ) : (
                      <div className="text-xs text-stone-400">
                        No sentiment data
                      </div>
                    )}
                    <div className="text-xs text-stone-500">
                      Click to view messages
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-stone-400 dark:text-stone-500 text-sm mb-1">No customer conversations yet</div>
                <div className="text-stone-300 dark:text-stone-600 text-xs">When someone reaches out with a question or issue, it'll appear here</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conversation Detail Modal */}
      {isConversationModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(selectedSession.analysis?.mainCategory)}`}>
                    {selectedSession.analysis?.mainCategory || 'General'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyColor(selectedSession.analysis?.urgency)}`}>
                    {selectedSession.analysis?.urgency || 'low'} priority
                  </span>
                  {selectedSession.analysis?.resolved ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/5 text-green-500 border border-green-500">
                      ✓ Resolved
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-500/5 text-orange-500 border border-orange-500">
                      Unresolved
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-1">
                  {selectedSession.analysis?.summary || 'Conversation Details'}
                </h2>
                <div className="text-sm text-stone-500 dark:text-stone-400">
                  {selectedSession.lastMessageTime?.toDate?.().toLocaleString()}
                  {selectedSession.userEmail && <> • {selectedSession.userEmail}</>}
                  {selectedSession.userInfo?.location && (
                    <> • {selectedSession.userInfo.location.city}, {selectedSession.userInfo.location.country}</>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsConversationModalOpen(false);
                  setSelectedSession(null);
                  setConversationMessages([]);
                }}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Modal Body - Analysis */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Analysis Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">AI Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                    <div className="text-xs text-stone-500 mb-1">Intent</div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-50 capitalize">
                      {selectedSession.analysis?.intent || 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                    <div className="text-xs text-stone-500 mb-1">Sentiment Score</div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-50">
                      {selectedSession.analysis?.sentimentScore || 5}/10
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg col-span-2">
                    <div className="text-xs text-stone-500 mb-1">Sub-Category</div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-50">
                      {selectedSession.analysis?.subCategory || 'N/A'}
                    </div>
                  </div>
                  {selectedSession.analysis?.keyTopics && selectedSession.analysis.keyTopics.length > 0 && (
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg col-span-2">
                      <div className="text-xs text-stone-500 mb-2">Key Topics</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSession.analysis.keyTopics.map((topic, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-orange-500/5 text-orange-500 rounded-full">
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
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 mb-3">Conversation</h3>
                {conversationMessages.length > 0 ? (
                  <div className="space-y-3">
                    {conversationMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 capitalize">
                          {msg.role}
                        </div>
                        <div className="text-sm text-stone-900 dark:text-stone-50 whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                          {msg.timestamp?.toDate?.().toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-center text-sm text-stone-500">
                    Messages have been archived after analysis
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Gap Modal */}
      <KnowledgeGapModal
        gap={selectedGap}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGap(null);
        }}
        onSubmit={handleSubmitAnswer}
      />
    </div>
  );
}