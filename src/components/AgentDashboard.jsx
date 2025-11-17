import React, { useState, useRef, useEffect } from 'react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import TicketChart from './TicketChart';
import CategoryDonutChart from './CategoryDonutChart';
import SentimentChart from './SentimentChart';
import UrgencyChart from './UrgencyChart';
import UserWorldMap from './UserWorldMap';
import LanguageChart from './LanguageChart';
import BrowserChart from './BrowserChart';
import DeviceChart from './DeviceChart';
import ReturnUserChart from './ReturnUserChart';
import { HugeiconsIcon } from '@hugeicons/react';
import KnowledgeGapModal from './KnowledgeGapModal';
import IntentChart from './IntentChart';
import ConfidenceChart from './ConfidenceChart';
import VisitorDetailModal from './VisitorDetailModal';
import TicketDetailModal from './TicketDetailModal';
import { useAuth } from '../contexts/AuthContext';
import { getConversationAnalytics, getKnowledgeGaps } from '../utils/newAnalyticsFunctions';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function AgentDashboard({ agent }) {
  const { user } = useAuth();
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const timeDropdownRef = useRef(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState([]);
  const [timeRange, setTimeRange] = useState('weekly'); // hourly, daily, weekly, quarterly, alltime
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedGap, setSelectedGap] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'visitors', or 'tickets'
  const [visitors, setVisitors] = useState([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [chatbotLoaded, setChatbotLoaded] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target)) {
        setIsTimeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset state when agent changes
  useEffect(() => {
    setAnalyticsData(null);
    setKnowledgeGaps([]);
    setVisitors([]);
    setTickets([]);
    setTimeRange('weekly');
    setChatbotLoaded(false); // Reset chatbot when agent changes
  }, [agent?.id]);

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

  // Load visitors when Visitors tab is active
  useEffect(() => {
    const loadVisitors = async () => {
      if (activeTab !== 'visitors' || !agent?.id || !user?.uid) return;

      setVisitorsLoading(true);
      try {
        // Calculate startDate based on timeRange
        const now = new Date();
        let startDate;
        switch (timeRange) {
          case 'hourly':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'daily':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'quarterly':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'alltime':
            startDate = new Date(0);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const sessionsRef = collection(db, 'users', user.uid, 'agents', agent.id, 'sessions');
        const sessionsSnapshot = await getDocs(sessionsRef);

        const visitorsList = sessionsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            anonymousUserId: doc.id,
            ...doc.data()
          }))
          .filter(visitor => {
            const lastMessageTime = visitor.lastMessageTime?.toDate?.();
            return lastMessageTime && lastMessageTime >= startDate;
          })
          .sort((a, b) => {
            const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
            const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
            return timeB - timeA;
          })
          .slice(0, 5);

        setVisitors(visitorsList);
      } catch (error) {
        console.error('Error loading visitors:', error);
      } finally {
        setVisitorsLoading(false);
      }
    };

    loadVisitors();
  }, [activeTab, agent?.id, user?.uid, timeRange]);

  // Load tickets when Tickets tab is active
  useEffect(() => {
    const loadTickets = async () => {
      if (activeTab !== 'tickets' || !agent?.id || !user?.uid) return;

      setTicketsLoading(true);
      try {
        // Calculate startDate based on timeRange
        const now = new Date();
        let startDate;
        switch (timeRange) {
          case 'hourly':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'daily':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'quarterly':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'alltime':
            startDate = new Date(0);
            break;
          default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const ticketsRef = collection(db, 'users', user.uid, 'agents', agent.id, 'tickets');
        const ticketsSnapshot = await getDocs(ticketsRef);

        const ticketsList = ticketsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(ticket => {
            const createdAt = ticket.createdAt?.toDate?.();
            return createdAt && createdAt >= startDate;
          })
          .sort((a, b) => {
            const timeA = a.createdAt?.toDate?.() || new Date(0);
            const timeB = b.createdAt?.toDate?.() || new Date(0);
            return timeB - timeA;
          });

        setTickets(ticketsList);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setTicketsLoading(false);
      }
    };

    loadTickets();
  }, [activeTab, agent?.id, user?.uid, timeRange]);

  const handleFillGap = (gap) => {
    setSelectedGap(gap);
    setIsModalOpen(true);
  };

  const handleSubmitAnswer = async (gap, answer) => {
    try {
      // Call Cloud Function to process and add the answer
      const response = await fetch('https://us-central1-candelaai.cloudfunctions.net/fillKnowledgeGap', {
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

  const handleSkipGap = async (gap) => {
    try {
      // Mark gap as skipped in Firestore
      const gapRef = doc(db, 'users', user.uid, 'agents', agent.id, 'knowledgeGaps', gap.id);
      await updateDoc(gapRef, {
        skipped: true,
        skippedAt: new Date()
      });

      // Remove from local state immediately
      setKnowledgeGaps(prev => prev.filter(g => g.id !== gap.id));
    } catch (error) {
      console.error('Error skipping knowledge gap:', error);
      // Even if backend fails, remove from UI
      setKnowledgeGaps(prev => prev.filter(g => g.id !== gap.id));
    }
  };

  const handleVisitorClick = (visitor) => {
    setSelectedVisitor(visitor);
    setIsVisitorModalOpen(true);
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleTestAgent = () => {
    // AGGRESSIVE CLEANUP - Remove ALL orchis elements
    const orchisElements = document.querySelectorAll('[id*="orchis"], [class*="orchis"]');
    orchisElements.forEach(el => {
      console.log('🗑️ Removing:', el);
      el.remove();
    });

    // Remove any iframes that might be chatbot
    const iframes = document.querySelectorAll('iframe[src*="orchis"]');
    iframes.forEach(iframe => iframe.remove());

    // Reset chatbot loaded state
    setChatbotLoaded(false);

    // Wait a bit for cleanup
    setTimeout(() => {
      if (!window.OrchisChatbot) {
        // First time - load the script
        const script = document.createElement('script');
        script.src = 'https://orchis.app/chatbot-widget.js';
        script.onload = function() {
          if (window.OrchisChatbot) {
            console.log('✅ Initializing chatbot for agent:', agent?.id);
            window.OrchisChatbot.init({
              agentId: agent?.id || 'YUtxUdsTvLauRmozIgKT'
            });
            setChatbotLoaded(true);
            setTimeout(() => {
              if (window.OrchisChatbot?.open) {
                window.OrchisChatbot.open();
              }
            }, 500);
          }
        };
        document.head.appendChild(script);
      } else {
        // Script exists - reinit with new agent
        console.log('✅ Reinitializing chatbot for agent:', agent?.id);
        window.OrchisChatbot.init({
          agentId: agent?.id || 'YUtxUdsTvLauRmozIgKT'
        });
        setChatbotLoaded(true);
        setTimeout(() => {
          if (window.OrchisChatbot?.open) {
            window.OrchisChatbot.open();
          }
        }, 500);
      }
    }, 200);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Feedback': 'bg-blue-500/5 text-blue-500 border-blue-500',
      'Question': 'bg-purple-500/5 text-purple-500 border-purple-500',
      'Support Request': 'bg-green-500/5 text-green-500 border-green-500',
      'Support': 'bg-green-500/5 text-green-500 border-green-500',
      'Sales Inquiry': 'bg-green-500/5 text-green-500 border-green-500',
      'Sales': 'bg-green-500/5 text-green-500 border-green-500',
      'Bug Report': 'bg-red-500/5 text-red-500 border-red-500',
      'Complaint': 'bg-red-500/5 text-red-500 border-red-500',
      'General': 'bg-neutral-500/5 text-neutral-500 border-neutral-500'
    };
    return colors[category] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium text-neutral-900 mb-2">No Agent Selected</div>
          <div className="text-neutral-500">Please select an agent to view analytics.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      {/* Controls Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap w-full md:w-auto">
          {/* Time Filter */}
          <div className="relative" ref={timeDropdownRef}>
            <button
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-neutral-200 dark:md:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="text-md font-bold text-neutral-900 dark:text-neutral-50">
                  {timeRange === 'hourly' ? 'Last 24H' :
                   timeRange === 'daily' ? 'Last 7 Days' :
                   timeRange === 'weekly' ? 'Last 30 Days' :
                   timeRange === 'quarterly' ? 'Last 90 Days' :
                   'All Time'}
                </div>
              </div>
              <HugeiconsIcon icon={ArrowDown01Icon} className={`w-4 h-4 text-neutral-500 transition-transform ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isTimeDropdownOpen && (
              <div className="absolute top-full left-0 min-w-[150px] mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10">
                <div className="p-1 space-y-0.5">
                  {['hourly', 'daily', 'weekly', 'quarterly', 'alltime'].map((range) => (
                    <button
                      key={range}
                      onClick={() => {
                        setTimeRange(range);
                        setIsTimeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group ${
                        timeRange === range ? 'bg-neutral-50 dark:bg-neutral-800' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
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

          {/* Test Agent Button */}
          <button
            onClick={handleTestAgent}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer"
            title={`Chat with ${agent?.projectName || 'your agent'}`}
          >
            Show {agent?.projectName || 'Agent'} Demo
          </button>
        </div>

        {/* Tab System */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'visitors'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            Visitors
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'tickets'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50'
            }`}
          >
            Tickets
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' && (
        <>
      {/* Analytics Dashboard */}
      <div className="mb-6">
        {analyticsLoading ? (
          <div className="h-40 flex items-center justify-center bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <div className="text-neutral-400 text-sm">Loading analytics...</div>
          </div>
        ) : (
          <TicketChart analyticsData={analyticsData} />
        )}
      </div>

      {/* User Sentiment Analysis - Full Width */}
      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">User Sentiment</h3>
          <div className="text-sm text-neutral-500">Customer Mood Distribution</div>
        </div>
        <div className="h-64">
          <SentimentChart data={analyticsData?.sentimentData || []} />
        </div>
      </div>

      {/* Bottom Analytics Row - 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* User Intent */}
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">User Intent</h3>
            <div className="text-sm text-neutral-500">Why They Contacted</div>
          </div>
          <div className="h-64">
            <IntentChart data={analyticsData?.intentData || []} />
          </div>
        </div>

        {/* AI Confidence */}
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">AI Confidence</h3>
            <div className="text-sm text-neutral-500">Answer Quality</div>
          </div>
          <div className="h-64">
            <ConfidenceChart
              data={analyticsData?.confidenceData || []}
              avgConfidence={analyticsData?.summary?.avgConfidence || 0}
            />
          </div>
        </div>

        {/* Intent Categories Donut Chart */}
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Categories</h3>
            <div className="text-sm text-neutral-500">Message Types</div>
          </div>
          <div className="h-64">
            <CategoryDonutChart data={analyticsData?.categoryData || []} />
          </div>
        </div>

        {/* Urgency Distribution */}
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Urgency Levels</h3>
            <div className="text-sm text-neutral-500">AI-Detected Priority</div>
          </div>
          <div className="h-64">
            <UrgencyChart data={analyticsData?.urgencyData || []} />
          </div>
        </div>

      </div>


      {/* Knowledge Gaps */}
      <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Knowledge Gaps</h3>
          <div className="text-sm text-neutral-500">Questions your agent couldn't answer</div>
        </div>
        {knowledgeGaps.length > 0 ? (
          <div className="space-y-3">
            {knowledgeGaps.slice(0, 10).map((gap) => (
              <div
                key={gap.id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/30 rounded-lg border border-neutral-100 dark:border-neutral-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">
                      {gap.category || 'General'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                    {gap.representativeQuestion || gap.question || 'Unknown question'}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    First asked: {gap.firstAsked?.toLocaleDateString()} • Last asked: {gap.lastAsked?.toLocaleDateString()}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-semibold">
                    Asked {gap.count}x
                  </span>
                  <button
                    onClick={() => handleFillGap(gap)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
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
              <div className="text-neutral-400 dark:text-neutral-500 text-sm mb-1">You're all set!</div>
              <div className="text-neutral-300 dark:text-neutral-600 text-xs">No unanswered questions detected so far</div>
            </div>
          </div>
        )}
      </div>

        </>
      )}

      {/* Visitors Tab */}
      {activeTab === 'visitors' && (
        <>
        {/* User Locations - Full Width */}
          <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">User Locations</h3>
              <div className="text-sm text-neutral-500">Geographic Distribution</div>
            </div>
            <div className="h-96">
              {analyticsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-neutral-400 text-sm">Loading...</div>
                </div>
              ) : (
                <UserWorldMap data={analyticsData?.locationData || []} />
              )}
            </div>
          </div>
          {/* User Analytics Charts - 2x2 Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            
            {/* Languages */}
            <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Languages</h3>
                <div className="text-sm text-neutral-500">User Preferences</div>
              </div>
              <div className="h-64">
                {analyticsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-neutral-400 text-sm">Loading...</div>
                  </div>
                ) : (
                  <LanguageChart data={analyticsData?.languageData || {}} />
                )}
              </div>
            </div>

            {/* Browsers */}
            <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Browsers</h3>
                <div className="text-sm text-neutral-500">Browser Distribution</div>
              </div>
              <div className="h-64">
                {analyticsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-neutral-400 text-sm">Loading...</div>
                  </div>
                ) : (
                  <BrowserChart data={analyticsData?.browserData || {}} />
                )}
              </div>
            </div>

            {/* Devices */}
            <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Devices</h3>
                <div className="text-sm text-neutral-500">Device Types</div>
              </div>
              <div className="h-64">
                {analyticsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-neutral-400 text-sm">Loading...</div>
                  </div>
                ) : (
                  <DeviceChart data={analyticsData?.deviceData || {}} />
                )}
              </div>
            </div>

            {/* Return Users */}
            <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">User Type</h3>
                <div className="text-sm text-neutral-500">New vs Return</div>
              </div>
              <div className="h-64">
                {analyticsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-neutral-400 text-sm">Loading...</div>
                  </div>
                ) : (
                  <ReturnUserChart data={analyticsData?.returnUserData || []} />
                )}
              </div>
            </div>
          </div>

          

          {/* All Visitors List */}
          <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Latest Visitors</h3>
              <div className="text-sm text-neutral-500">{visitors.length} total</div>
            </div>
            {visitorsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-neutral-400 text-sm">Loading visitors...</div>
              </div>
            ) : visitors.length > 0 ? (
              <div className="space-y-3">
                {visitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    onClick={() => handleVisitorClick(visitor)}
                    className="p-4 bg-neutral-50 dark:bg-neutral-900/30 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                            {visitor.anonymousUserId}
                          </span>
                          {visitor.userEmail && (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/5 text-blue-500 border border-blue-500">
                              {visitor.userEmail}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {visitor.userInfo?.location?.city && visitor.userInfo?.location?.country && (
                            <>📍 {visitor.userInfo.location.city}, {visitor.userInfo.location.country}</>
                          )}
                          {visitor.userInfo?.device?.browser && (
                            <> • 💻 {visitor.userInfo.device.browser} on {visitor.userInfo.device.deviceType}</>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                          {visitor.totalConversations || 0} conversations
                        </div>
                        <div className="text-xs text-neutral-400">
                          Last visit: {visitor.lastMessageTime?.toDate?.().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {visitor.userInfo?.language && (
                      <div className="text-xs text-neutral-500">
                        🌐 Language: {visitor.userInfo.language}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-neutral-400 dark:text-neutral-500 text-sm mb-1">No visitors yet</div>
                  <div className="text-neutral-300 dark:text-neutral-600 text-xs">When someone visits your site, they'll appear here</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Support Tickets</h3>
            <div className="text-sm text-neutral-500">{tickets.length} total</div>
          </div>
          {ticketsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-neutral-400 text-sm">Loading tickets...</div>
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className="p-4 bg-neutral-50 dark:bg-neutral-900/30 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Left: Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
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
                            ? 'bg-green-500/5 text-green-500 border-green-500'
                            : 'bg-green-500/5 text-green-500 border-green-500'
                        }`}>
                          {ticket.status === 'open' ? '🔴 Open' : '✓ Closed'}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">
                        {ticket.summary}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {ticket.email && <>📧 {ticket.email}</>}
                        {ticket.userInfo?.location?.city && (
                          <> • 📍 {ticket.userInfo.location.city}, {ticket.userInfo.location.country}</>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">
                        Created: {ticket.createdAt?.toDate?.().toLocaleString()}
                      </div>
                    </div>

                    {/* Right: Stats */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs text-neutral-500">
                        Sentiment: <span className="font-semibold text-neutral-900 dark:text-neutral-50">{ticket.userSentimentScore}/10</span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        AI Confidence: <span className="font-semibold text-neutral-900 dark:text-neutral-50">{ticket.aiConfidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-neutral-400 dark:text-neutral-500 text-sm mb-1">No tickets yet</div>
                <div className="text-neutral-300 dark:text-neutral-600 text-xs">When someone needs support, tickets will appear here</div>
              </div>
            </div>
          )}
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
        onSkip={handleSkipGap}
      />

      {/* Visitor Detail Modal */}
      <VisitorDetailModal
        visitor={selectedVisitor}
        isOpen={isVisitorModalOpen}
        onClose={() => {
          setIsVisitorModalOpen(false);
          setSelectedVisitor(null);
        }}
        agentId={agent?.id}
        userId={user?.uid}
      />

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setSelectedTicket(null);
        }}
        agentId={agent?.id}
        userId={user?.uid}
      />
    </div>
  );
}