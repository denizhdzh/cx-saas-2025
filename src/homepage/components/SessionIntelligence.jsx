import React, { useState, useEffect } from "react";

// SessionTimeline Component
function SessionTimeline() {
  const [activeSession, setActiveSession] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const sessions = [
    {
      id: 1,
      type: "first_visit",
      user: "Visitor from San Francisco",
      timestamp: "Just now",
      pages: ["Homepage", "Features", "Pricing"],
      status: "active",
      welcome: "I see you're exploring our platform. Looking to automate your customer support?",
      sentiment: null
    },
    {
      id: 2,
      type: "return_visit",
      user: "E-commerce Manager",
      timestamp: "8 min ago",
      pages: ["Pricing", "Integrations", "API Docs"],
      status: "completed",
      welcome: "Welcome back! Last time you checked our Shopify integration. Want to see a demo?",
      sentiment: "positive",
      conversationCount: 3
    },
    {
      id: 3,
      type: "return_visit",
      user: "Product Manager",
      timestamp: "14 min ago",
      pages: ["Dashboard", "Analytics", "Settings"],
      status: "completed",
      welcome: "Welcome back! You checked our analytics last time. Ready to dive deeper into the data?",
      sentiment: "engaged",
      conversationCount: 8
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSession((prev) => (prev + 1) % sessions.length);
        setIsTransitioning(false);
      }, 300);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const current = sessions[activeSession];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-xs font-semibold text-neutral-400 mb-6 uppercase tracking-wider">Live Session Tracking</div>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {/* Active Session Card */}
        <div className={`bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5 transition-all duration-700 ease-in-out ${
          isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}>
          {/* User Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-500 ${
                current.type === 'first_visit' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
              }`}></div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  {current.user}
                </div>
                <div className="text-xs text-neutral-500">
                  {current.timestamp}
                </div>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-500 ${
              current.type === 'first_visit'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {current.type === 'first_visit' ? 'First Visit' : `Visit #${current.conversationCount}`}
            </div>
          </div>

          {/* Context-Aware Welcome Message */}
          <div className="bg-white border border-neutral-200/60 rounded-xl p-4 mb-4 shadow-sm">
            <div className="text-sm text-neutral-700 mb-2">
              {current.welcome}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Personalized based on {current.type === 'first_visit' ? 'page context' : 'previous visits'}</span>
            </div>
          </div>

          {/* Page Journey */}
          <div className="mb-4">
            <div className="text-xs font-medium text-neutral-500 mb-2">Page Journey</div>
            <div className="flex items-center gap-2 flex-wrap">
              {current.pages.map((page, idx) => (
                <React.Fragment key={idx}>
                  <div className="px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700">
                    {page}
                  </div>
                  {idx < current.pages.length - 1 && (
                    <svg className="w-3.5 h-3.5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Sentiment (if available) */}
          {current.sentiment && (
            <div className="flex items-center justify-between pt-3 border-t border-neutral-200/60">
              <div className="text-xs font-medium text-neutral-500">Engagement</div>
              <div className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-500 ${
                current.sentiment === 'positive'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : current.sentiment === 'engaged'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {current.sentiment === 'positive' ? 'Interested' : current.sentiment === 'engaged' ? 'Highly Active' : 'Exploring'}
              </div>
            </div>
          )}
        </div>

        {/* Session Stats - Dynamically calculated from actual sessions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-neutral-900">
              {sessions.filter(s => s.type === 'first_visit').length}
            </div>
            <div className="text-xs text-neutral-500 mt-1">New Visitors</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-neutral-900">
              {sessions.filter(s => s.type === 'return_visit').length}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Returning</div>
          </div>
          <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-4 text-center">
            <div className="text-xl font-bold text-neutral-900">
              {sessions.reduce((acc, s) => acc + (s.conversationCount || 1), 0)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Conversations</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ContextDetection Component
function ContextDetection() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const pageContexts = [
    {
      page: "/pricing",
      suggestion: "Checking our pricing? I can help you find the perfect plan for your team size and needs.",
      triggers: ["30s on page", "scrolled to comparison table"]
    },
    {
      page: "/features/integrations",
      suggestion: "Looking at integrations? Let me show you how we connect with your existing tools.",
      triggers: ["viewed 3 integrations", "exit intent detected"]
    },
    {
      page: "/docs/api",
      suggestion: "Need help with the API? I can guide you through authentication and your first request.",
      triggers: ["scrolled to code examples", "45s on page"]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPage((prev) => (prev + 1) % pageContexts.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = pageContexts[currentPage];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-xs font-semibold text-neutral-400 mb-6 uppercase tracking-wider">Context-Aware Messaging</div>

      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {/* Current Page Context */}
        <div className={`bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5 transition-all duration-700 ease-in-out ${
          isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <div className="flex-1">
              <div className="text-sm font-mono font-semibold text-neutral-900">
                {current.page}
              </div>
              <div className="text-xs text-neutral-500">User's current page</div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/60 rounded-xl p-4 mb-4 shadow-sm">
            <div className="text-sm text-neutral-700">
              {current.suggestion}
            </div>
          </div>

          {/* Active Triggers */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-500">Active Triggers</div>
            {current.triggers.map((trigger, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-neutral-700 font-medium">{trigger.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Triggers Info */}
        <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-4">
          <div className="text-xs font-semibold text-neutral-700 mb-3">Available Triggers</div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-neutral-600">First Visit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-neutral-600">Return Visit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span className="text-neutral-600">Exit Intent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
              <span className="text-neutral-600">Time Delay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span className="text-neutral-600">Scroll Depth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
              <span className="text-neutral-600">Page-specific</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionIntelligence() {
  return (
    <section id="session-intelligence" className="relative py-16 lg:py-24 bg-transparent">
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

        {/* Single Unified Card */}
        <div className="bg-gradient-to-br from-white to-neutral-50/80 rounded-3xl border border-neutral-200/60 shadow-2xl shadow-neutral-900/5 overflow-hidden">

          {/* 2 Column Grid Inside Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left: Session Timeline */}
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-neutral-200/50">
              <SessionTimeline />
            </div>

            {/* Right: Context Detection */}
            <div className="p-8 lg:p-12">
              <ContextDetection />
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
