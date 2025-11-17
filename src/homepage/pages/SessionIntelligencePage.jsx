import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CTA from '../components/CTA';

// Visitor Tracking Animation
function VisitorTrackingAnimation() {
  const [activeVisitor, setActiveVisitor] = useState(0);

  const visitors = [
    { id: 1, name: "Sarah Chen", location: "San Francisco", page: "/pricing", time: "2m ago" },
    { id: 2, name: "James Wilson", location: "London", page: "/features", time: "5m ago" },
    { id: 3, name: "Maria Garcia", location: "Madrid", page: "/docs", time: "8m ago" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVisitor((prev) => (prev + 1) % visitors.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = visitors[activeVisitor];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/50 rounded-xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-neutral-800/50 flex items-center justify-between">
        <div className="text-xs font-light text-neutral-400 uppercase tracking-wider">Live Activity</div>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
          <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 font-light">{visitors.length}</span>
        </div>
      </div>

      {/* Visitor Card */}
      <div className="p-5">
        <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                {current.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="text-sm font-light text-neutral-200">{current.name}</div>
                <div className="text-xs text-neutral-600 mt-0.5">{current.location}</div>
              </div>
            </div>
            <div className="text-xs text-neutral-600 font-light">{current.time}</div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900/40 border border-neutral-800/30 rounded-md">
            <div className="text-xs text-neutral-600">→</div>
            <div className="text-xs text-green-400 font-mono font-light">{current.page}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg px-3 py-2.5 text-center">
            <div className="text-lg font-light text-neutral-50">{visitors.length * 47}</div>
            <div className="text-[10px] text-neutral-600 uppercase tracking-widest mt-1">Today</div>
          </div>
          <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg px-3 py-2.5 text-center">
            <div className="text-lg font-light text-neutral-50">2.4m</div>
            <div className="text-[10px] text-neutral-600 uppercase tracking-widest mt-1">Time</div>
          </div>
          <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg px-3 py-2.5 text-center">
            <div className="text-lg font-light text-neutral-50">68%</div>
            <div className="text-[10px] text-neutral-600 uppercase tracking-widest mt-1">Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Return Visit Detection Animation
function ReturnVisitAnimation() {
  const [visit, setVisit] = useState(0);

  const visits = [
    {
      num: 1,
      date: "Today, 2:30 PM",
      pages: ["Homepage"],
      message: "Welcome! How can I help you today?",
      type: "new"
    },
    {
      num: 2,
      date: "Today, 4:15 PM",
      pages: ["Pricing", "Features"],
      message: "Welcome back! Still exploring our features?",
      type: "return"
    },
    {
      num: 5,
      date: "Tomorrow, 10:00 AM",
      pages: ["Dashboard", "Integrations", "API"],
      message: "Great to see you again! Ready to integrate?",
      type: "frequent"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisit((prev) => (prev + 1) % visits.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const current = visits[visit];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/50 rounded-xl overflow-hidden">
      {/* Header - User Info */}
      <div className="px-4 py-3 border-b border-neutral-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xs font-medium">
            JD
          </div>
          <div>
            <div className="text-sm font-light text-neutral-200">John Doe</div>
            <div className="text-xs text-neutral-600 mt-0.5">{current.date}</div>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-md text-xs font-light border ${
          current.type === 'new' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          current.type === 'return' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          'bg-purple-500/10 text-purple-400 border-purple-500/20'
        }`}>
          Visit #{current.num}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Page Journey */}
        <div className="mb-4 min-h-[44px]">
          <div className="text-[10px] font-light text-neutral-600 mb-2 uppercase tracking-widest">Journey</div>
          <div className="flex flex-wrap gap-2">
            {current.pages.map((page, idx) => (
              <div key={idx} className="px-2.5 py-1 bg-neutral-800/30 border border-neutral-800/40 text-green-400 rounded-md text-xs font-mono font-light">
                {page}
              </div>
            ))}
          </div>
        </div>

        {/* AI Response */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 min-h-[72px]">
          <div className="text-[10px] text-green-400 mb-1.5 uppercase tracking-widest font-light">Response</div>
          <div className="text-sm text-green-300 font-light leading-relaxed">{current.message}</div>
        </div>

        {/* Timeline - Fixed Height */}
        <div className="pt-4 mt-4 border-t border-neutral-800/30">
          <div className="text-[10px] font-light text-neutral-600 mb-2 uppercase tracking-widest">Timeline</div>
          <div className="space-y-2 min-h-[60px]">
            {visits.map((v, idx) => (
              <div key={idx} className={`flex items-center gap-3 transition-opacity duration-500 ${
                idx <= visit ? 'opacity-100' : 'opacity-30'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === visit ? 'bg-green-400 animate-pulse' : idx < visit ? 'bg-neutral-600' : 'bg-neutral-800'
                }`}></div>
                <div className="text-xs text-neutral-500 font-light">Visit #{v.num} · {v.pages.length} pages</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Context-Aware Messaging Animation
function ContextMessagingAnimation() {
  const [context, setContext] = useState(0);

  const contexts = [
    {
      page: "/pricing",
      scroll: "80%",
      time: "45s",
      message: "I see you're checking our pricing. Need help choosing the right plan?",
      triggers: ["Long page view", "Scroll depth"]
    },
    {
      page: "/integrations",
      scroll: "60%",
      time: "30s",
      message: "Looking for integrations? We support 50+ platforms including Shopify!",
      triggers: ["Section viewed", "External link"]
    },
    {
      page: "/docs/api",
      scroll: "45%",
      time: "2m 15s",
      message: "Need API help? I can guide you through authentication and setup.",
      triggers: ["Code block", "Extended time"]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setContext((prev) => (prev + 1) % contexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const current = contexts[context];

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/50 rounded-xl overflow-hidden">
      {/* Current Page */}
      <div className="px-4 py-3 border-b border-neutral-800/50 flex items-center gap-2">
        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
        <div className="text-xs font-mono font-light text-neutral-300">{current.page}</div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Behavior Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-3">
            <div className="text-[10px] text-neutral-600 mb-2 uppercase tracking-widest">Scroll</div>
            <div className="text-lg font-light text-neutral-50">{current.scroll}</div>
            <div className="w-full bg-neutral-900/50 rounded-full h-1 mt-2">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-1 rounded-full transition-all duration-1000"
                   style={{ width: current.scroll }}></div>
            </div>
          </div>
          <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-3">
            <div className="text-[10px] text-neutral-600 mb-2 uppercase tracking-widest">Time</div>
            <div className="text-lg font-light text-neutral-50">{current.time}</div>
          </div>
        </div>

        {/* AI Response */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 min-h-[88px]">
          <div className="text-[10px] text-green-400 mb-2 uppercase tracking-widest font-light">Message</div>
          <div className="text-sm text-green-300 font-light leading-relaxed">{current.message}</div>
        </div>

        {/* Active Triggers - Fixed Height */}
        <div className="pt-3 border-t border-neutral-800/30">
          <div className="text-[10px] font-light text-neutral-600 mb-2 uppercase tracking-widest">Triggers</div>
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {current.triggers.map((trigger, idx) => (
              <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-800/30 border border-neutral-800/40 rounded-md text-xs text-neutral-400 font-light">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                {trigger}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Smart Triggers Animation
function SmartTriggersAnimation() {
  const [activeTriggers, setActiveTriggers] = useState([]);

  const allTriggers = [
    { id: 1, name: "Exit Intent" },
    { id: 2, name: "Time Delay" },
    { id: 3, name: "Scroll Depth" },
    { id: 4, name: "Return Visit" },
    { id: 5, name: "Idle Time" },
    { id: 6, name: "Cart Abandon" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomTrigger = allTriggers[Math.floor(Math.random() * allTriggers.length)];
      setActiveTriggers(prev => {
        const exists = prev.find(t => t.id === randomTrigger.id);
        if (exists) return prev;
        return [randomTrigger, ...prev.slice(0, 2)];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Always render 3 slots
  const slots = [0, 1, 2].map(idx => activeTriggers[idx] || null);

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800/50 flex items-center justify-between">
        <span className="text-xs font-light text-neutral-400 uppercase tracking-wider">Active</span>
        <div className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-light text-green-400">
          {activeTriggers.length}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Active Trigger List - Fixed 3 Slots */}
        <div className="space-y-2 mb-4">
          {slots.map((trigger, idx) => (
            <div key={idx} className={`bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-3 h-[44px] flex items-center transition-all duration-500 ${
              trigger ? 'opacity-100' : 'opacity-30'
            }`}>
              {trigger ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="text-sm font-light text-neutral-200">{trigger.name}</div>
                  </div>
                  <div className="text-xs text-neutral-600 font-light">now</div>
                </div>
              ) : (
                <div className="text-xs text-neutral-700 font-light">—</div>
              )}
            </div>
          ))}
        </div>

        {/* Available Triggers */}
        <div className="pt-3 border-t border-neutral-800/30">
          <div className="text-[10px] font-light text-neutral-600 mb-3 uppercase tracking-widest">Available</div>
          <div className="grid grid-cols-3 gap-2">
            {allTriggers.map((trigger) => (
              <div key={trigger.id} className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg px-2.5 py-2 text-center">
                <div className="text-xs font-light text-neutral-400">{trigger.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionIntelligencePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <Header />

      {/* Hero Section with Background */}
      <div className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/nnnn.webp)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/60 to-neutral-950"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32">
          {/* Page Header */}
          <div className="mb-32 text-center">
            <div className="text-[10px] font-light text-neutral-500 mb-6 tracking-[0.3em] uppercase">Session Intelligence</div>
            <h1 className="text-6xl sm:text-8xl font-extralight text-neutral-50 mb-10 leading-[1.1] max-w-5xl mx-auto">
              Track Every Visitor,<br />Remember Every Interaction
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed font-light">
              Intelligent session tracking identifies anonymous visitors, detects return visits, and personalizes every conversation with context-aware messaging.
            </p>
          </div>

          {/* Hero Stats - Japanese Minimal */}
          <div className="mb-32 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="space-y-5 text-center md:text-left">
              <div className="text-7xl font-extralight text-neutral-100 tracking-tight">100%</div>
              <div className="text-[10px] font-light text-neutral-600 uppercase tracking-[0.25em] mb-3">Visitor Tracking</div>
              <div className="w-12 h-[1px] bg-gradient-to-r from-neutral-800 to-transparent mx-auto md:mx-0"></div>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">
                Track every visitor without login. Anonymous fingerprinting identifies users across sessions.
              </p>
            </div>
            <div className="space-y-5 text-center md:text-left">
              <div className="text-7xl font-extralight text-neutral-100 tracking-tight">12+</div>
              <div className="text-[10px] font-light text-neutral-600 uppercase tracking-[0.25em] mb-3">Smart Triggers</div>
              <div className="w-12 h-[1px] bg-gradient-to-r from-neutral-800 to-transparent mx-auto md:mx-0"></div>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">
                Automated engagement based on behavioral triggers including exit intent and scroll depth.
              </p>
            </div>
            <div className="space-y-5 text-center md:text-left">
              <div className="text-7xl font-extralight text-neutral-100 tracking-tight">Real-time</div>
              <div className="text-[10px] font-light text-neutral-600 uppercase tracking-[0.25em] mb-3">Context Detection</div>
              <div className="w-12 h-[1px] bg-gradient-to-r from-neutral-800 to-transparent mx-auto md:mx-0"></div>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">
                Messages adapt instantly to page content and user behavior with perfect timing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Section 1: Visitor Intelligence */}
        <div className="mb-32">
          <div className="mb-20 text-center">
            <div className="text-[10px] font-light text-neutral-600 mb-6 tracking-[0.25em] uppercase">01 — Visitor Intelligence</div>
            <h2 className="text-5xl font-extralight text-neutral-50 mb-4 leading-tight">Know who's visiting</h2>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visitor Tracking */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-2xl p-10 border border-neutral-800/30">
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-light mb-5">Built-In AI Support</div>
                <h3 className="text-3xl font-extralight text-neutral-50 mb-4 leading-tight">Anonymous Visitor Tracking</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-light">Track every visitor without requiring login or signup</p>
              </div>
              <VisitorTrackingAnimation />
            </div>

            {/* Return Visit Detection */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-2xl p-10 border border-neutral-800/30">
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-light mb-5">Session Memory</div>
                <h3 className="text-3xl font-extralight text-neutral-50 mb-4 leading-tight">Return Visit Detection</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-light">Recognize returning visitors and personalize their experience</p>
              </div>
              <ReturnVisitAnimation />
            </div>
          </div>
        </div>

        {/* Section 2: Context & Triggers */}
        <div className="mb-32">
          <div className="mb-20 text-center">
            <div className="text-[10px] font-light text-neutral-600 mb-6 tracking-[0.25em] uppercase">02 — Context & Triggers</div>
            <h2 className="text-5xl font-extralight text-neutral-50 mb-4 leading-tight">Perfect timing</h2>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Context-Aware Messaging */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-2xl p-10 border border-neutral-800/30">
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-light mb-5">Behavioral Insight</div>
                <h3 className="text-3xl font-extralight text-neutral-50 mb-4 leading-tight">Context-Aware Messaging</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-light">Messages adapt to page content and user behavior</p>
              </div>
              <ContextMessagingAnimation />
            </div>

            {/* Smart Triggers */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-2xl p-10 border border-neutral-800/30">
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-light mb-5">Automated Timing</div>
                <h3 className="text-3xl font-extralight text-neutral-50 mb-4 leading-tight">Smart Triggers</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-light">Automated engagement based on 12+ behavioral triggers</p>
              </div>
              <SmartTriggersAnimation />
            </div>
          </div>
        </div>
      </div>

      <CTA />
      <Footer />
    </div>
  );
}
