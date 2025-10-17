import React, { useState, useEffect } from "react";

// SessionTimeline Component
function SessionTimeline() {
  const [activeSession, setActiveSession] = useState(0);

  const sessions = [
    {
      id: 1,
      type: "first_visit",
      user: "Anonymous User #4821",
      timestamp: "Just now",
      pages: ["Homepage", "Features"],
      status: "active",
      welcome: "👋 Welcome! How can I help you today?",
      sentiment: null
    },
    {
      id: 2,
      type: "return_visit",
      user: "Returning User #3291",
      timestamp: "2 min ago",
      pages: ["Pricing", "Checkout"],
      status: "completed",
      welcome: "Welcome back! Ready to continue?",
      sentiment: "positive",
      conversationCount: 3
    },
    {
      id: 3,
      type: "return_visit",
      user: "Returning User #2847",
      timestamp: "5 min ago",
      pages: ["Dashboard", "Settings"],
      status: "completed",
      welcome: "Good to see you again! Need help with something?",
      sentiment: "neutral",
      conversationCount: 7
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSession((prev) => (prev + 1) % sessions.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const current = sessions[activeSession];

  return (
    <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl p-6 flex flex-col justify-between">
      <div className="text-xs font-medium text-white mb-4 text-center">Live Session Tracking</div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {/* Active Session Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 transition-all duration-500">
          {/* User Info */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                current.type === 'first_visit' ? 'bg-blue-400 animate-pulse' : 'bg-green-400'
              }`}></div>
              <div>
                <div className="text-xs font-semibold text-white">
                  {current.user}
                </div>
                <div className="text-xs text-white/50">
                  {current.timestamp}
                </div>
              </div>
            </div>
            <div className={`px-2 py-0.5 rounded text-xs font-medium ${
              current.type === 'first_visit'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {current.type === 'first_visit' ? 'First Visit' : `Visit #${current.conversationCount}`}
            </div>
          </div>

          {/* Context-Aware Welcome Message */}
          <div className="bg-white/5 rounded-xl p-3 mb-3">
            <div className="text-xs text-white/90 mb-2">
              {current.welcome}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Personalized based on {current.type === 'first_visit' ? 'page context' : 'previous visits'}</span>
            </div>
          </div>

          {/* Page Journey */}
          <div className="mb-3">
            <div className="text-xs text-white/60 mb-1.5">Page Journey</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {current.pages.map((page, idx) => (
                <React.Fragment key={idx}>
                  <div className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70">
                    {page}
                  </div>
                  {idx < current.pages.length - 1 && (
                    <svg className="w-3 h-3 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Sentiment (if available) */}
          {current.sentiment && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="text-xs text-white/60">Sentiment Analysis</div>
              <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                current.sentiment === 'positive'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {current.sentiment === 'positive' ? '😊 Positive' : '😐 Neutral'}
              </div>
            </div>
          )}
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">
              {sessions.filter(s => s.type === 'first_visit').length}
            </div>
            <div className="text-xs text-white/60">New</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">
              {sessions.filter(s => s.type === 'return_visit').length}
            </div>
            <div className="text-xs text-white/60">Returning</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">
              {sessions.reduce((acc, s) => acc + (s.conversationCount || 0), 0)}
            </div>
            <div className="text-xs text-white/60">Total Chats</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ContextDetection Component
function ContextDetection() {
  const [currentPage, setCurrentPage] = useState(0);

  const pageContexts = [
    {
      page: "/pricing",
      icon: "💰",
      suggestion: "I see you're checking our pricing! Would you like help choosing the right plan?",
      triggers: ["scroll_depth_75", "time_on_page_30s"]
    },
    {
      page: "/features",
      icon: "⚡",
      suggestion: "Exploring features? I can explain how each one works for your use case!",
      triggers: ["scroll_depth_50", "time_on_page_20s"]
    },
    {
      page: "/about",
      icon: "👥",
      suggestion: "Want to know more about our team or mission? Just ask!",
      triggers: ["first_visit", "scroll_depth_25"]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % pageContexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = pageContexts[currentPage];

  return (
    <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl p-6 flex flex-col justify-between">
      <div className="text-xs font-medium text-white mb-4 text-center">Context-Aware Messaging</div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {/* Current Page Context */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-2xl">{current.icon}</div>
            <div className="flex-1">
              <div className="text-xs font-mono text-white/90">
                {current.page}
              </div>
              <div className="text-xs text-white/50">User's current page</div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 mb-3">
            <div className="text-xs text-white/90">
              {current.suggestion}
            </div>
          </div>

          {/* Active Triggers */}
          <div className="space-y-1.5">
            <div className="text-xs text-white/60">Active Triggers</div>
            {current.triggers.map((trigger, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></div>
                <span className="text-white/70">{trigger.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Triggers Info */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
          <div className="text-xs font-semibold text-white mb-2">Available Triggers</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
              <span>First Visit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-green-400"></div>
              <span>Return Visit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-purple-400"></div>
              <span>Exit Intent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-yellow-400"></div>
              <span>Time Delay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-orange-400"></div>
              <span>Scroll Depth</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-pink-400"></div>
              <span>Page-specific</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionIntelligence() {
  return (
    <section className="relative py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="text-sm text-orange-500 font-semibold mb-2">Session Intelligence</div>
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
            Every visitor tracked, every conversation remembered
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Our AI tracks anonymous users across sessions, detects return visits, personalizes messages,
            and adapts to page context with smart triggers for perfect-timing engagement.
          </p>
        </div>

        {/* 2 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* Left: Session Timeline */}
          <div className="flex flex-col min-h-[500px]">
            <SessionTimeline />
          </div>

          {/* Right: Context Detection */}
          <div className="flex flex-col min-h-[500px]">
            <ContextDetection />
          </div>

        </div>

      </div>
    </section>
  );
}
