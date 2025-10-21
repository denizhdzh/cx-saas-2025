import React, { useState, useEffect } from 'react';
import { adminLogout, getAdminStats } from '../../utils/firebaseFunctions';
import BlogManager from './BlogManager';
import RoadmapManager from './RoadmapManager';
import { seedDataFromAdmin } from '../seedRoadmapData';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const result = await getAdminStats();
      setStats(result.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    adminLogout();
    window.location.reload();
  };

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: '📊' },
    { id: 'blog', label: 'Blog Posts', icon: '📝' },
    { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
  ];

  const planColors = {
    free: 'bg-neutral-100 text-neutral-700 border-neutral-300',
    starter: 'bg-blue-50 text-blue-700 border-blue-300',
    growth: 'bg-purple-50 text-purple-700 border-purple-300',
    scale: 'bg-orange-50 text-orange-700 border-orange-300'
  };

  const planIcons = {
    free: '🆓',
    starter: '🚀',
    growth: '📈',
    scale: '⚡'
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logonaked.png" alt="Orchis" className="h-8 w-auto" />
              <span className="text-sm text-neutral-500">/</span>
              <span className="text-sm font-medium text-neutral-900">Admin</span>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-neutral-200 p-1 rounded-lg mb-8 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-thin text-neutral-900 mb-2">Dashboard</h1>
              <p className="text-neutral-600">Platform metrics and analytics</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-neutral-200">
                    <div className="animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-neutral-500">Total Users</h3>
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="text-3xl font-thin text-neutral-900">{stats?.totalUsers || 0}</div>
                    <p className="text-sm text-neutral-500 mt-1">Registered accounts</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-neutral-500">Total Agents</h3>
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div className="text-3xl font-thin text-neutral-900">{stats?.totalAgents || 0}</div>
                    <p className="text-sm text-neutral-500 mt-1">AI agents created</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-neutral-500">Conversations</h3>
                      <span className="text-2xl">💬</span>
                    </div>
                    <div className="text-3xl font-thin text-neutral-900">{stats?.totalConversations || 0}</div>
                    <p className="text-sm text-neutral-500 mt-1">Total chats</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-neutral-500">Messages</h3>
                      <span className="text-2xl">💭</span>
                    </div>
                    <div className="text-3xl font-thin text-neutral-900">{stats?.totalMessages || 0}</div>
                    <p className="text-sm text-neutral-500 mt-1">AI responses</p>
                  </div>
                </div>

                {/* Analytics Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-green-700">Avg Confidence</h3>
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div className="text-3xl font-thin text-green-900">{stats?.avgConfidence || 0}%</div>
                    <p className="text-sm text-green-600 mt-1">AI confidence score</p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-red-700">Urgent Issues</h3>
                      <span className="text-2xl">🚨</span>
                    </div>
                    <div className="text-3xl font-thin text-red-900">{stats?.urgentMessages || 0}</div>
                    <p className="text-sm text-red-600 mt-1">Urgency ≥ 7/10</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-blue-700">Ticket Suggestions</h3>
                      <span className="text-2xl">🎫</span>
                    </div>
                    <div className="text-3xl font-thin text-blue-900">{stats?.ticketSuggestions || 0}</div>
                    <p className="text-sm text-blue-600 mt-1">AI suggested tickets</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-orange-700">Off-Topic</h3>
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="text-3xl font-thin text-orange-900">{stats?.irrelevantQuestions || 0}</div>
                    <p className="text-sm text-orange-600 mt-1">Irrelevant questions</p>
                  </div>
                </div>

                {/* Sentiment Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900 mb-6">Sentiment Analysis</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-3xl mb-2">😊</div>
                      <div className="text-2xl font-thin text-green-900">{stats?.sentimentBreakdown?.positive || 0}</div>
                      <div className="text-sm text-green-600 mt-1">Positive</div>
                    </div>
                    <div className="text-center p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="text-3xl mb-2">😐</div>
                      <div className="text-2xl font-thin text-neutral-900">{stats?.sentimentBreakdown?.neutral || 0}</div>
                      <div className="text-sm text-neutral-600 mt-1">Neutral</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-3xl mb-2">😞</div>
                      <div className="text-2xl font-thin text-red-900">{stats?.sentimentBreakdown?.negative || 0}</div>
                      <div className="text-sm text-red-600 mt-1">Negative</div>
                    </div>
                  </div>
                  {/* Sentiment bar */}
                  <div className="mt-4 h-3 flex rounded-full overflow-hidden">
                    {(() => {
                      const total = (stats?.sentimentBreakdown?.positive || 0) +
                                   (stats?.sentimentBreakdown?.neutral || 0) +
                                   (stats?.sentimentBreakdown?.negative || 0);
                      if (total === 0) return <div className="w-full bg-neutral-200"></div>;

                      const positivePercent = ((stats?.sentimentBreakdown?.positive || 0) / total) * 100;
                      const neutralPercent = ((stats?.sentimentBreakdown?.neutral || 0) / total) * 100;
                      const negativePercent = ((stats?.sentimentBreakdown?.negative || 0) / total) * 100;

                      return (
                        <>
                          {positivePercent > 0 && <div className="bg-green-400" style={{ width: `${positivePercent}%` }}></div>}
                          {neutralPercent > 0 && <div className="bg-neutral-300" style={{ width: `${neutralPercent}%` }}></div>}
                          {negativePercent > 0 && <div className="bg-red-400" style={{ width: `${negativePercent}%` }}></div>}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900 mb-6">Message Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries({
                      Support: { icon: '🛠️', color: 'blue' },
                      Sales: { icon: '💰', color: 'green' },
                      Question: { icon: '❓', color: 'purple' },
                      Complaint: { icon: '😤', color: 'red' },
                      General: { icon: '💬', color: 'neutral' }
                    }).map(([category, { icon, color }]) => (
                      <div key={category} className={`text-center p-4 bg-${color}-50 rounded-lg border border-${color}-200`}>
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className={`text-2xl font-thin text-${color}-900`}>
                          {stats?.categoryBreakdown?.[category] || 0}
                        </div>
                        <div className={`text-sm text-${color}-600 mt-1`}>{category}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Intent Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900 mb-6">User Intent</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries({
                      question: { icon: '🤔', label: 'Question' },
                      complaint: { icon: '😠', label: 'Complaint' },
                      browsing: { icon: '👀', label: 'Browsing' },
                      purchase: { icon: '🛒', label: 'Purchase' },
                      greeting: { icon: '👋', label: 'Greeting' }
                    }).map(([intent, { icon, label }]) => (
                      <div key={intent} className="text-center p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className="text-2xl font-thin text-neutral-900">
                          {stats?.intentBreakdown?.[intent] || 0}
                        </div>
                        <div className="text-sm text-neutral-600 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Distribution */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200">
                  <h3 className="text-lg font-medium text-neutral-900 mb-6">Subscription Plan Distribution</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(stats?.planDistribution || {}).map(([plan, count]) => (
                      <div
                        key={plan}
                        className={`p-4 rounded-lg border-2 ${planColors[plan]}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{planIcons[plan]}</span>
                          <span className="text-2xl font-thin">{count}</span>
                        </div>
                        <div className="text-sm font-medium capitalize">{plan}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {stats.totalUsers > 0
                            ? `${((count / stats.totalUsers) * 100).toFixed(1)}%`
                            : '0%'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Plan Bar Chart */}
                  <div className="mt-6">
                    <div className="h-8 flex rounded-lg overflow-hidden">
                      {Object.entries(stats?.planDistribution || {}).map(([plan, count]) => {
                        const percentage = stats.totalUsers > 0
                          ? (count / stats.totalUsers) * 100
                          : 0;

                        if (percentage === 0) return null;

                        return (
                          <div
                            key={plan}
                            className={`${planColors[plan].split(' ')[0]} flex items-center justify-center text-xs font-medium`}
                            style={{ width: `${percentage}%` }}
                            title={`${plan}: ${count} users (${percentage.toFixed(1)}%)`}
                          >
                            {percentage > 10 && `${percentage.toFixed(0)}%`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('blog')}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-left cursor-pointer"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-neutral-900">Create Blog Post</div>
                  <div className="text-sm text-neutral-500">Add new content to the blog</div>
                </button>

                <button
                  onClick={() => window.open('/blog', '_blank')}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-left cursor-pointer"
                >
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="font-medium text-neutral-900">View Blog</div>
                  <div className="text-sm text-neutral-500">See the public blog</div>
                </button>

                <button
                  onClick={() => setActiveTab('roadmap')}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-left cursor-pointer"
                >
                  <div className="text-2xl mb-2">🗺️</div>
                  <div className="font-medium text-neutral-900">Manage Roadmap</div>
                  <div className="text-sm text-neutral-500">Update product roadmap</div>
                </button>

                <button
                  onClick={() => window.open('/', '_blank')}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-left cursor-pointer"
                >
                  <div className="text-2xl mb-2">🏠</div>
                  <div className="font-medium text-neutral-900">View Homepage</div>
                  <div className="text-sm text-neutral-500">Check the main site</div>
                </button>

                <button
                  onClick={seedDataFromAdmin}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-left cursor-pointer"
                >
                  <div className="text-2xl mb-2">🌱</div>
                  <div className="font-medium text-neutral-900">Seed Data</div>
                  <div className="text-sm text-neutral-500">Add sample roadmap data</div>
                </button>

                <button
                  onClick={loadStats}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors text-left cursor-pointer"
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="font-medium text-neutral-900">Refresh Stats</div>
                  <div className="text-sm text-neutral-500">Reload dashboard data</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blog' && <BlogManager />}
        {activeTab === 'roadmap' && <RoadmapManager />}
      </div>
    </div>
  );
}