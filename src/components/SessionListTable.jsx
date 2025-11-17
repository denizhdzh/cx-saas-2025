import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

export default function SessionListTable({ sessions = [] }) {
  const [expandedSession, setExpandedSession] = useState(null);

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format duration - input is in milliseconds, convert to seconds first
  const formatDuration = (milliseconds) => {
    if (!milliseconds) return '0s';
    const seconds = milliseconds / 1000;
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  // Get sentiment badge color
  const getSentimentColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  // Get urgency badge color
  const getUrgencyColor = (urgency) => {
    if (urgency === 'high') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (urgency === 'medium') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  };

  if (sessions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-neutral-400 dark:text-neutral-500 text-sm mb-1">No sessions yet</div>
          <div className="text-neutral-300 dark:text-neutral-600 text-xs">Recent conversations will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Time</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Category</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Sentiment</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Urgency</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">Messages</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <React.Fragment key={session.id}>
              <tr
                className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors"
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              >
                <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                  {formatDate(session.timestamp)}
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                    {session.category || 'General'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(session.sentiment || 5)}`}>
                    {session.sentiment || 5}/10
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(session.urgency || 'low')}`}>
                    {session.urgency || 'low'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {session.resolved ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      Resolved
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                      Open
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-neutral-700 dark:text-neutral-300">
                  {session.messageCount || 0}
                </td>
                <td className="py-3 px-4">
                  {expandedSession === session.id ? (
                    <ChevronUpIcon className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-neutral-400" />
                  )}
                </td>
              </tr>

              {/* Expanded Details */}
              {expandedSession === session.id && (
                <tr className="bg-neutral-50 dark:bg-neutral-900/30">
                  <td colSpan="7" className="py-4 px-4">
                    <div className="space-y-3">
                      {/* AI Summary */}
                      <div>
                        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">AI Summary</div>
                        <div className="text-sm text-neutral-700 dark:text-neutral-300">
                          {session.summary || 'No summary available'}
                        </div>
                      </div>

                      {/* Session IDs */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Conversation ID</div>
                          <div className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
                            {session.id}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Session ID</div>
                          <div className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
                            {session.sessionId}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
