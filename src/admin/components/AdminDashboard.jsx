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
    { id: 'stats', label: 'Dashboard' },
    { id: 'blog', label: 'Blog Posts' },
    { id: 'roadmap', label: 'Roadmap' },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logonaked2.png" alt="Orchis" className="h-8 w-auto" />
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
                  ? 'bg-white text-neutral-900'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-medium text-neutral-900 mb-1">Dashboard</h1>
              <p className="text-sm text-neutral-600">Platform metrics and analytics</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg border border-neutral-200">
                    <div className="animate-pulse">
                      <div className="h-4 bg-neutral-200 rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-neutral-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Users */}
                <div className="bg-white p-6 rounded-lg border border-neutral-200">
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Total Users</h3>
                    <div className="text-4xl font-light text-neutral-900">{stats?.totalUsers || 0}</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Registered accounts</span>
                      <span className="font-medium text-neutral-900">{stats?.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Avg agents per user</span>
                      <span className="font-medium text-neutral-900">
                        {stats?.totalUsers > 0 ? (stats?.totalAgents / stats?.totalUsers).toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-neutral-100">
                      <span className="text-neutral-600">Active subscriptions</span>
                      <span className="font-medium text-neutral-900">
                        {Object.values(stats?.planDistribution || {}).reduce((a, b) => a + b, 0) - (stats?.planDistribution?.free || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Agents */}
                <div className="bg-white p-6 rounded-lg border border-neutral-200">
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Total Agents</h3>
                    <div className="text-4xl font-light text-neutral-900">{stats?.totalAgents || 0}</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">AI agents created</span>
                      <span className="font-medium text-neutral-900">{stats?.totalAgents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Total conversations</span>
                      <span className="font-medium text-neutral-900">{stats?.totalConversations || 0}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-neutral-100">
                      <span className="text-neutral-600">Total messages</span>
                      <span className="font-medium text-neutral-900">{stats?.totalMessages || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab('blog')}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="font-medium text-neutral-900 mb-1">Create Blog Post</div>
                  <div className="text-xs text-neutral-500">Add new content</div>
                </button>

                <button
                  onClick={() => window.open('/blog', '_blank')}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="font-medium text-neutral-900 mb-1">View Blog</div>
                  <div className="text-xs text-neutral-500">Public blog page</div>
                </button>

                <button
                  onClick={() => setActiveTab('roadmap')}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="font-medium text-neutral-900 mb-1">Manage Roadmap</div>
                  <div className="text-xs text-neutral-500">Update features</div>
                </button>

                <button
                  onClick={() => window.open('/', '_blank')}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="font-medium text-neutral-900 mb-1">View Homepage</div>
                  <div className="text-xs text-neutral-500">Main website</div>
                </button>

                <button
                  onClick={seedDataFromAdmin}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="font-medium text-neutral-900 mb-1">Seed Roadmap</div>
                  <div className="text-xs text-neutral-500">Add sample roadmap items</div>
                </button>

                <button
                  onClick={loadStats}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="font-medium text-neutral-900 mb-1">Refresh Stats</div>
                  <div className="text-xs text-neutral-500">Reload data</div>
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