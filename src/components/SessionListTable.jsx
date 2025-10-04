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
          <div className="text-stone-400 dark:text-stone-500 text-sm mb-1">No sessions yet</div>
          <div className="text-stone-300 dark:text-stone-600 text-xs">Recent conversations will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200 dark:border-stone-700">
            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 dark:text-stone-400">Time</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 dark:text-stone-400">Duration</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 dark:text-stone-400">Messages</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 dark:text-stone-400">Topic</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 dark:text-stone-400">Sentiment</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 dark:text-stone-400">Urgency</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-stone-600 dark:text-stone-400">Device</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <React.Fragment key={session.id}>
              <tr
                className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 cursor-pointer transition-colors"
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              >
                <td className="py-3 px-4 text-sm text-stone-700 dark:text-stone-300">
                  {formatDate(session.savedAt || session.startTime)}
                </td>
                <td className="py-3 px-4 text-sm text-stone-700 dark:text-stone-300">
                  {formatDuration(session.sessionDuration)}
                </td>
                <td className="py-3 px-4 text-sm text-stone-700 dark:text-stone-300">
                  {session.messageCount || 0}
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                    {session.topic || 'general'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(session.sentimentScore || 5)}`}>
                    {session.sentimentScore || 5}/10
                  </span>
                </td>
                <td className="py-3 px-4">
                  {session.ticketPriority ? (
                    <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(session.ticketPriority)}`}>
                      {session.ticketPriority}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-stone-700 dark:text-stone-300">
                  {session.behaviorMetrics?.deviceType || 'unknown'}
                </td>
                <td className="py-3 px-4">
                  {expandedSession === session.id ? (
                    <ChevronUpIcon className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-stone-400" />
                  )}
                </td>
              </tr>

              {/* Expanded Details */}
              {expandedSession === session.id && (
                <tr className="bg-stone-50 dark:bg-stone-900/30">
                  <td colSpan="8" className="py-4 px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Time Before Chat</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {formatDuration(session.behaviorMetrics?.timeOnPageBeforeChat || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Scroll Depth</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {Math.round(session.behaviorMetrics?.scrollDepth || 0)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Engagement</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.behaviorMetrics?.engagementLevel || 'unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Visitor Type</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.behaviorMetrics?.returnVisitor ? 'Return' : 'New'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Avg Response Time</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.avgResponseTime ? `${session.avgResponseTime}ms` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Intent</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.intentDetection || 'unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Location</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.userLocation?.timezone || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Referrer</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.userLocation?.referrer || 'direct'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Browser</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.behaviorMetrics?.browserInfo || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Language</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.language || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Clicks Before Chat</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.behaviorMetrics?.clicksBeforeChat || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Page Views</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.behaviorMetrics?.pageViewCount || 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Lead Quality</div>
                        <div className="text-sm font-semibold text-stone-900 dark:text-stone-50">
                          {session.businessMetrics?.leadQuality || 'unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Session ID</div>
                        <div className="text-xs font-mono text-stone-700 dark:text-stone-300 truncate">
                          {session.sessionId?.substring(0, 12)}...
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
