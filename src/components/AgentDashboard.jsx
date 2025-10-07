import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, DocumentArrowUpIcon, CogIcon } from '@heroicons/react/24/outline';
import TicketChart from './TicketChart';
import CategoryDonutChart from './CategoryDonutChart';
import SentimentChart from './SentimentChart';
import UserWorldMap from './UserWorldMap';
import UrgencyChart from './UrgencyChart';
import TopicChart from './TopicChart';
import EngagementChart from './EngagementChart';
import DeviceChart from './DeviceChart';
import DetailedMetricsCard from './DetailedMetricsCard';
import SessionListTable from './SessionListTable';
import ReferrerChart from './ReferrerChart';
import BrowserChart from './BrowserChart';
import LanguageChart from './LanguageChart';
import KnowledgeGapModal from './KnowledgeGapModal';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { getConversationAnalytics, getKnowledgeGaps } from '../utils/newAnalyticsFunctions';

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
  const [timeRange, setTimeRange] = useState('daily'); // hourly, daily, weekly, quarterly, alltime
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedGap, setSelectedGap] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          question: gap.question,
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
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        {/* Top Metrics Row */}
        <div className="flex items-center gap-8 mb-8">
          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Total Conversations</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {analyticsData?.summary?.analyzedConversations || '0'}
            </div>
          </div>

          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>

          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Resolved</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {analyticsData?.summary?.resolvedConversations || '0'}
            </div>
          </div>

          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>

          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Unresolved</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {analyticsData?.summary?.unresolvedConversations || '0'}
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
            <div className="text-xs font-medium text-stone-500 mb-1">Avg Sentiment</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100">
              {analyticsData?.summary?.avgSentiment?.toFixed(1) || '5.0'}/10
            </div>
          </div>

          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>

          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Knowledge Gaps</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              {knowledgeGaps?.length || '0'}
              {knowledgeGaps?.length > 0 && <span className="text-2xl">⚠️</span>}
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
              <div className="text-stone-400 text-sm">No conversation data available for this time range</div>
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
      </div>


      {/* Recent Conversations Table */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Recent Conversations</h3>
          <div className="text-sm text-stone-500">Last 10 analyzed chats</div>
        </div>
        <SessionListTable sessions={analyticsData?.recentSessions || []} />
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
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-50 mb-1">
                    {gap.question}
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
              <div className="text-stone-400 dark:text-stone-500 text-sm mb-1">No knowledge gaps detected</div>
              <div className="text-stone-300 dark:text-stone-600 text-xs">Your agent is answering all questions successfully</div>
            </div>
          </div>
        )}
      </div>

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