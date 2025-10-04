import React from 'react';
import { ClockIcon, UserGroupIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function DetailedMetricsCard({ detailedMetrics = {} }) {
  const {
    avgTimeOnPageBeforeChat = 0,
    avgSessionDuration = 0,
    avgScrollDepth = 0,
    returnVisitorRate = 0,
    avgMessagesPerSession = 0,
    totalSessions = 0
  } = detailedMetrics;

  // Format time - input is in milliseconds, convert to seconds first
  const formatTime = (milliseconds) => {
    const seconds = milliseconds / 1000;
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const metrics = [
    {
      icon: ClockIcon,
      label: 'Time Before Chat',
      value: formatTime(avgTimeOnPageBeforeChat),
      description: 'Avg time on page before opening chat',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: ChartBarIcon,
      label: 'Session Duration',
      value: formatTime(avgSessionDuration),
      description: 'Avg conversation length',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: ArrowPathIcon,
      label: 'Scroll Depth',
      value: `${Math.round(avgScrollDepth)}%`,
      description: 'Avg page scroll before chat',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: UserGroupIcon,
      label: 'Return Visitors',
      value: `${Math.round(returnVisitorRate)}%`,
      description: 'Users who came back',
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      icon: ChartBarIcon,
      label: 'Messages/Session',
      value: avgMessagesPerSession.toFixed(1),
      description: 'Avg messages per conversation',
      color: 'text-pink-600 dark:text-pink-400'
    }
  ];

  if (totalSessions === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-stone-400 dark:text-stone-500 text-sm mb-1">No session data yet</div>
          <div className="text-stone-300 dark:text-stone-600 text-xs">Detailed metrics will appear as users interact</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-stone-50 dark:bg-stone-900/50 rounded-lg p-4 border border-stone-200 dark:border-stone-800">
          <div className="flex items-start justify-between mb-2">
            <metric.icon className={`w-5 h-5 ${metric.color}`} />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-50 mb-1">
            {metric.value}
          </div>
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
            {metric.label}
          </div>
          <div className="text-xs text-stone-500 dark:text-stone-500">
            {metric.description}
          </div>
        </div>
      ))}
    </div>
  );
}
