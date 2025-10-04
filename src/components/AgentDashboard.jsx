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
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import { getTicketAnalytics, getRecentActivity } from '../utils/ticketFunctions';

export default function AgentDashboard({ agent, onShowEmbed }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { agents, selectAgent, selectedAgent } = useAgent();
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const agentDropdownRef = useRef(null);
  const timeDropdownRef = useRef(null);
  
  // Ticket analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showOpened, setShowOpened] = useState(true);
  const [showResolved, setShowResolved] = useState(true);
  const [timeRange, setTimeRange] = useState('daily');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

      console.log('🔄 Loading analytics for timeRange:', timeRange);
      setAnalyticsLoading(true);
      try {
        const [analytics, activity] = await Promise.all([
          getTicketAnalytics(agent.id, timeRange, user.uid),
          getRecentActivity(agent.id, 5)
        ]);

        console.log('✅ Analytics loaded:', {
          detailedMetrics: analytics.detailedMetrics,
          recentSessions: analytics.recentSessions?.length,
          timeRange
        });

        setAnalyticsData(analytics);
        setRecentActivity(activity);
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
                  {agent?.name || 'Select Agent'}
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
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{agentOption.name}</div>
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
                  {timeRange === 'daily' ? 'Last 24H' : timeRange === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
                </div>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-stone-500 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isTimeDropdownOpen && (
              <div className="absolute top-full left-0 min-w-[120px] mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-10">
                <div className="p-1 space-y-0.5">
                  {['daily', 'weekly', 'monthly'].map((range) => (
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
                          {range === 'daily' ? 'Last 24H' : range === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
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
          <div 
            className="cursor-pointer" 
            onClick={() => setShowOpened(!showOpened)}
          >
            <div className="flex items-center gap-2 mb-1">
              <input 
                type="checkbox" 
                checked={showOpened}
                onChange={() => {}} // Handled by parent onClick
                className="checkbox-orange pointer-events-none"
              />
              <span className="text-xs font-medium text-stone-500">Tickets Opened</span>
            </div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-50">
              {analyticsData?.chartData ? 
                Object.values(analyticsData.chartData).reduce((total, day) => total + (day.opened || 0), 0) 
                : '0'
              }
            </div>
          </div>
          
          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>
          
          <div 
            className="cursor-pointer" 
            onClick={() => setShowResolved(!showResolved)}
          >
            <div className="flex items-center gap-2 mb-1">
              <input 
                type="checkbox" 
                checked={showResolved}
                onChange={() => {}} // Handled by parent onClick
                className="checkbox-orange pointer-events-none"
              />
              <span className="text-xs font-medium text-stone-500">Tickets Resolved</span>
            </div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-50">
              {analyticsData?.chartData ? 
                Object.values(analyticsData.chartData).reduce((total, day) => total + (day.resolved || 0), 0) 
                : '0'
              }
            </div>
          </div>
          
          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>
          
          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Resolution Rate</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-50">
              {analyticsData ? analyticsData.summary.resolutionRate : '0'}%
            </div>
          </div>
          
          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>
          
          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Open Tickets</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-50">
              {analyticsData ? analyticsData.summary.openTickets : '0'}
            </div>
          </div>
          
          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>
          
          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Resolved</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-50">
              {analyticsData ? analyticsData.summary.resolvedToday : '0'}
            </div>
          </div>
          
          <div className="w-px h-12 bg-stone-200 dark:bg-stone-700"></div>
          
          <div>
            <div className="text-xs font-medium text-stone-500 mb-1">Avg Response</div>
            <div className="text-4xl font-bold text-stone-900 dark:text-stone-50">
              {analyticsData ? analyticsData.summary.avgResponseTime : '0h'}
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-80">
          {analyticsLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-stone-400 text-sm">Loading chart data...</div>
            </div>
          ) : (
            <TicketChart 
              chartData={analyticsData?.chartData || {}}
              showOpened={showOpened}
              showResolved={showResolved}
              timeRange={timeRange}
            />
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
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Ticket Urgency</h3>
            <div className="text-sm text-stone-500">Priority Levels</div>
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

      {/* Engagement & Device Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Engagement Levels */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">User Engagement</h3>
            <div className="text-sm text-stone-500">Activity Level</div>
          </div>
          <div className="h-64">
            <EngagementChart data={analyticsData?.engagementData || {}} />
          </div>
        </div>

        {/* Device Types */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Device Distribution</h3>
            <div className="text-sm text-stone-500">Platform Usage</div>
          </div>
          <div className="h-64">
            <DeviceChart data={analyticsData?.deviceData || {}} />
          </div>
        </div>
      </div>

      {/* Traffic & Browser Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Referrer Sources */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Traffic Sources</h3>
            <div className="text-sm text-stone-500">Referrers</div>
          </div>
          <div className="h-64">
            <ReferrerChart data={analyticsData?.referrerData || {}} />
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Browser Usage</h3>
            <div className="text-sm text-stone-500">User Agents</div>
          </div>
          <div className="h-64">
            <BrowserChart data={analyticsData?.browserData || {}} />
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Languages</h3>
            <div className="text-sm text-stone-500">User Preferences</div>
          </div>
          <div className="h-64">
            <LanguageChart data={analyticsData?.languageData || {}} />
          </div>
        </div>
      </div>

      {/* Detailed Metrics Card */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Detailed Session Metrics</h3>
          <div className="text-sm text-stone-500">Advanced behavior insights</div>
        </div>
        <div className="min-h-[120px]">
          <DetailedMetricsCard detailedMetrics={analyticsData?.detailedMetrics || {}} />
        </div>
      </div>

      {/* World Map */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">User Locations</h3>
          <div className="text-sm text-stone-500">{analyticsData?.totalUsers || 0} total users</div>
        </div>
        <div className="h-96">
          <UserWorldMap data={analyticsData?.locationData || []} />
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Recent Sessions</h3>
          <div className="text-sm text-stone-500">Last 10 conversations</div>
        </div>
        <SessionListTable sessions={analyticsData?.recentSessions || []} />
      </div>
    </div>
  );
}