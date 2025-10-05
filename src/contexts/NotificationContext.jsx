import React, { createContext, useContext, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Notification Container */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="pointer-events-auto animate-fade-in-down"
          >
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border transition-all ${
                notif.type === 'success'
                  ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                  : notif.type === 'error'
                  ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  notif.type === 'success'
                    ? 'bg-green-500 animate-pulse'
                    : notif.type === 'error'
                    ? 'bg-orange-500 animate-pulse'
                    : 'bg-orange-500 animate-pulse'
                }`}
              />
              <div className="text-sm font-medium text-stone-900 dark:text-stone-50 whitespace-nowrap">
                {notif.message}
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className="flex-shrink-0 p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors ml-2"
              >
                <XMarkIcon className="w-3.5 h-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
