import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Squares2X2Icon, 
  ArrowRightStartOnRectangleIcon, 
  CogIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import { signOutUser } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { agents, selectedAgent, selectAgent } = useAgent();
  const [userPlan, setUserPlan] = useState('free');

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserPlan(userDoc.data().plan || 'free');
          }
        } catch (error) {
          console.error('Error fetching user plan:', error);
        }
      }
    };

    fetchUserPlan();
  }, [user]);

  // Auto-select most recent agent
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      // Sort agents by creation date and select the most recent
      const sortedAgents = [...agents].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      selectAgent(sortedAgents[0]);
    }
  }, [agents, selectedAgent, selectAgent]);

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: Squares2X2Icon, 
      label: 'Dashboard',
      description: 'Overview & analytics',
      badge: null
    },
    { 
      path: '/embed', 
      icon: Squares2X2Icon, 
      label: 'Embed Code',
      description: 'Get integration code',
      badge: null
    },
  ];

  const settingsItems = [
    { path: '/settings', icon: CogIcon, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Orchis Logo" 
              className="w-6 h-6"
            />
            <span className="font-bold text-neutral-900 text-sm">ORCHIS</span>
          </Link>
        </div>

        {/* Agent Selector */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="text-xs font-medium text-gray-700 mb-2">Current Agent</div>
          {agents.length > 0 ? (
            <div className="relative">
              <select
                value={selectedAgent?.id || ''}
                onChange={(e) => {
                  const agent = agents.find(a => a.id === e.target.value);
                  if (agent) {
                    selectAgent(agent);
                  }
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
          ) : (
            <Link
              to="/create-agent"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="text-lg">+</span>
              <span>Create Agent</span>
            </Link>
          )}
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors ${
                    active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title=""
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex items-center justify-between flex-1">
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-900 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Upgrade Section */}
        {userPlan === 'free' && (
          <div className="px-3 pb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-900 mb-1">Upgrade to Pro</div>
              <div className="text-xs text-gray-600 mb-3">Unlock advanced features</div>
              <button className="w-full bg-gray-900 text-white text-xs font-medium py-2 rounded-md hover:bg-gray-800 transition-colors">
                Upgrade
              </button>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="px-3 pb-4">
          <div className="space-y-1">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors ${
                    active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  title=""
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Profile */}
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="flex items-center gap-2 py-3">
            <div className="w-7 h-7 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-white">
                {getInitials(user?.displayName)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.displayName || 'User'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {userPlan} plan
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Sign out"
            >
              <ArrowRightStartOnRectangleIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}