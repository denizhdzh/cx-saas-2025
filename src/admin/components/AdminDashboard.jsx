import React, { useState, useEffect } from 'react';
import { adminLogout, getWaitlistStats } from '../../utils/firebaseFunctions';
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
      const waitlistStats = await getWaitlistStats();
      setStats(waitlistStats);
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
              <p className="text-neutral-600">Overview of your application metrics</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-neutral-500">Total Waitlist</h3>
                    <span className="text-2xl">📧</span>
                  </div>
                  <div className="text-3xl font-thin text-neutral-900">{stats?.total || 0}</div>
                  <p className="text-sm text-neutral-500 mt-1">Total signups</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-neutral-500">Recent Signups</h3>
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="text-3xl font-thin text-neutral-900">{stats?.recent || 0}</div>
                  <p className="text-sm text-neutral-500 mt-1">Last 7 days</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-neutral-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-neutral-500">Conversion Rate</h3>
                    <span className="text-2xl">📈</span>
                  </div>
                  <div className="text-3xl font-thin text-neutral-900">
                    {stats?.total > 0 ? Math.round((stats.recent / stats.total) * 100) : 0}%
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">Weekly growth</p>
                </div>
              </div>
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