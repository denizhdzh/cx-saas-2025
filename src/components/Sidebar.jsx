import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings03Icon, ArrowDown01Icon, SquareArrowMoveRightUpIcon, Settings02Icon, CreditCardIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import { db } from '../firebase';
import { doc, onSnapshot as onDocSnapshot } from 'firebase/firestore';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { agents, selectedAgent, selectAgent } = useAgent();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [messageCredits, setMessageCredits] = useState({ used: 0, limit: 0 });
  const userDropdownRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  // Listen for message credits
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onDocSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessageCredits({
          used: data.messagesUsed || 0,
          limit: data.messageLimit || 0
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsUserDropdownOpen(false);
      navigate('/signin');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSettings = () => {
    setIsUserDropdownOpen(false);
    navigate('/dashboard/settings');
    onClose?.(); // Close sidebar on mobile
  };

  const handleBilling = () => {
    setIsUserDropdownOpen(false);
    navigate('/dashboard/billing');
    onClose?.(); // Close sidebar on mobile
  };

  const handleAgentSelect = (agent) => {
    selectAgent(agent);
    navigate(`/dashboard/${agent.id}`);
    onClose?.(); // Close sidebar on mobile after selection
  };

  const handleAgentSettings = (agentId) => {
    navigate(`/dashboard/${agentId}?view=agentsettings`);
    onClose?.(); // Close sidebar on mobile
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`w-64 h-screen fixed left-0 top-0 bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 cursor-pointer"
        >
          <img
            src="/logo.webp"
            alt="Orchis Logo"
            className="w-7 h-7"
          />
          <span className="font-bold text-neutral-900 dark:text-neutral-50 text-md">ORCHIS</span>
        </button>
      </div>

      {/* Agent List */}
      {agents.length > 0 && (
        <div className="py-2 border-b border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="max-h-[calc(6*3rem)] overflow-y-auto px-3">
            {agents.map((agent) => (
              <div key={agent.id} className="mb-1">
                <button
                  onClick={() => handleAgentSelect(agent)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all ${
                    selectedAgent?.id === agent.id
                      ? 'bg-neutral-200 dark:bg-neutral-800'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {agent.logoUrl ? (
                      <img
                        src={agent.logoUrl}
                        alt={agent.name}
                        className="w-5 h-5 object-cover rounded"
                      />
                    ) : (
                      <CpuChipIcon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200 truncate">
                      {agent.projectName || agent.name}
                    </div>
                  </div>
                </button>

                {/* Agent Submenu - Show when agent is selected */}
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    selectedAgent?.id === agent.id ? 'max-h-10 opacity-100 mt-1' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="ml-7 mr-0">
                    <button
                      onClick={() => handleAgentSettings(agent.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all"
                    >
                      <HugeiconsIcon icon={Settings02Icon} className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Section: Credits & User */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
        {/* Credits Display */}
        <div className="px-3 py-2.5 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wide text-neutral-500 dark:text-neutral-400">Credits</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-50">
              {messageCredits.limit - messageCredits.used}
            </span>
          </div>

          {/* Segmented Progress Bar - 50 segments for maximum dashed look */}
          <div className="flex gap-0.5 mb-2.5">
            {[...Array(50)].map((_, index) => {
              const segmentPercentage = (index + 1) * 2;
              const currentPercentage = messageCredits.limit > 0
                ? ((messageCredits.limit - messageCredits.used) / messageCredits.limit) * 100
                : 0;
              const isActive = currentPercentage >= segmentPercentage;

              return (
                <div
                  key={index}
                  className={`flex-1 h-2.5 rounded-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-green-500'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-neutral-500 dark:text-neutral-400">of {messageCredits.limit}</span>
            {(messageCredits.limit > 0 && (messageCredits.limit - messageCredits.used) / messageCredits.limit < 0.2) || messageCredits.limit < 500 ? (
              <button
                onClick={handleBilling}
                className="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-all"
              >
                Upgrade
              </button>
            ) : null}
          </div>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-neutral-900 dark:bg-neutral-50 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-neutral-50 dark:text-neutral-900">
                  {getInitials(user?.displayName)}
                </span>
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                {user?.displayName || 'User'}
              </div>
              <div className="text-xs text-neutral-500 truncate">
                {user?.email || ''}
              </div>
            </div>
            <HugeiconsIcon icon={ArrowDown01Icon} className={`w-4 h-4 text-neutral-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu - Opens Upward */}
          {isUserDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-10">
              <div className="p-1 space-y-0.5">
                <button
                  onClick={handleBilling}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group cursor-pointer"
                >
                  <HugeiconsIcon icon={CreditCardIcon} className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Billing</span>
                </button>

                <button
                  onClick={handleSettings}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group cursor-pointer"
                >
                  <HugeiconsIcon icon={Settings03Icon} className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">Settings</span>
                </button>

                <div className="border-t border-neutral-100 dark:border-neutral-700 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group cursor-pointer"
                >
                  <HugeiconsIcon icon={SquareArrowMoveRightUpIcon} className="w-4 h-4 text-neutral-500 group-hover:text-red-600" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50 group-hover:text-red-600">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
