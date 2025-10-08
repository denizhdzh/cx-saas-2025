import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { CreditCardIcon, Settings03Icon, ArrowDown01Icon, SquareArrowMoveRightUpIcon, Alert02Icon } from '@hugeicons/core-free-icons';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, onSnapshot as onDocSnapshot } from 'firebase/firestore';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { agents } = useAgent();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [messageCredits, setMessageCredits] = useState({ used: 0, limit: 0 });
  const userDropdownRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(part => part[0]).join('').substring(0, 2).toUpperCase();
  };

  // Listen for unread alerts across all agents
  useEffect(() => {
    if (!user || !agents || agents.length === 0) {
      setUnreadAlertsCount(0);
      return;
    }

    const unsubscribers = [];

    agents.forEach((agent) => {
      const alertsRef = collection(db, 'users', user.uid, 'agents', agent.id, 'alerts');
      const q = query(alertsRef, where('read', '==', false));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Recalculate total unread alerts across all agents
        let totalUnread = 0;
        agents.forEach((ag) => {
          const agentAlertsRef = collection(db, 'users', user.uid, 'agents', ag.id, 'alerts');
          const agentQuery = query(agentAlertsRef, where('read', '==', false));

          onSnapshot(agentQuery, (agentSnapshot) => {
            totalUnread = agentSnapshot.docs.length;
            setUnreadAlertsCount(totalUnread);
          });
        });
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, agents]);

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
  };

  const handleBilling = () => {
    setIsUserDropdownOpen(false);
    navigate('/dashboard/billing');
  };

  return (
    <nav className="w-full bg-stone-50 dark:bg-stone-900 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Orchis Logo"
              className="w-5 h-5"
            />
            <span className="font-bold text-stone-900 dark:text-stone-50 text-md">ORCHIS</span>
          </Link>

          {/* Right Section: Alerts + User Profile */}
          <div className="flex items-center gap-3">
            {/* Alert Bell */}
            {unreadAlertsCount > 0 && (
              <Link
                to="/dashboard"
                className="relative p-2 rounded-lg hover:bg-stone-200 dark:md:hover:bg-stone-800 transition-colors"
                title={`${unreadAlertsCount} unread security alert${unreadAlertsCount > 1 ? 's' : ''}`}
              >
                <HugeiconsIcon icon={Alert02Icon} className="w-5 h-5 text-stone-500" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </span>
              </Link>
            )}

            {/* User Profile Dropdown */}
            <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-stone-200 dark:md:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 bg-stone-900 dark:bg-stone-50 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-stone-50 dark:text-stone-900">
                    {getInitials(user?.displayName)}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                  {user?.displayName || 'User'}
                </div>
              </div>
              <HugeiconsIcon icon={ArrowDown01Icon} className={`w-4 h-4 text-stone-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserDropdownOpen && (
              <div className="absolute top-full right-0 min-w-[200px] mt-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg z-10">
                <div className="p-1 space-y-0.5">
                  {/* Message Credits */}
                  <div className="px-2 py-2 mb-1">
                    <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
                      <span>Credits</span>
                      <span>{messageCredits.limit - messageCredits.used} / {messageCredits.limit}</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${messageCredits.limit > 0 ? ((messageCredits.limit - messageCredits.used) / messageCredits.limit) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSettings}
                    className="w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-stone-800 dark:md:hover:bg-stone-50 hover:text-white dark:md:hover:text-black transition-colors group cursor-pointer"
                  >
                    <HugeiconsIcon icon={Settings03Icon} className="w-4 h-4 text-stone-500 group-hover:text-white dark:md:group-hover:text-black" />
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-50 dark:md:group-hover:text-black group-hover:text-white">Settings</span>
                  </button>

                  <button
                    onClick={handleBilling}
                    className="w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-stone-800 dark:md:hover:bg-stone-50 hover:text-white dark:md:hover:text-black transition-colors group cursor-pointer"
                  >
                    <HugeiconsIcon icon={CreditCardIcon} className="w-4 h-4 text-stone-500 group-hover:text-white dark:md:group-hover:text-black" />
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-50 dark:md:group-hover:text-black group-hover:text-white">Billing</span>
                  </button>

                  <div className="border-t border-stone-100 dark:border-stone-700 mt-1">
                    <button
                      onClick={handleLogout}
                      className="mt-1 w-full flex items-center gap-1 px-2 py-1 text-left rounded-md hover:bg-stone-800 dark:md:hover:bg-stone-50 hover:text-white dark:md:hover:text-black transition-colors group cursor-pointer"
                    >
                      <HugeiconsIcon icon={SquareArrowMoveRightUpIcon} className="w-4 h-4 text-stone-500 group-hover:text-white dark:md:group-hover:text-black" />
                      <span className="text-sm font-medium text-stone-900 dark:text-stone-50 dark:md:group-hover:text-black group-hover:text-white">Log out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </nav>
  );
}