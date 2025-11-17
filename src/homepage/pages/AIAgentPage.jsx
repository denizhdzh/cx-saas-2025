import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CTA from '../components/CTA';

// Natural Language Processing Animation
function NLPAnimation() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { text: "What's your pricing?", analysis: "Intent: Pricing inquiry", response: "Let me show you our plans..." },
    { text: "Can you integrate with Shopify?", analysis: "Intent: Integration question", response: "Yes! We have native Shopify integration..." },
    { text: "I need help with setup", analysis: "Intent: Support request", response: "I'll guide you through the setup..." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = steps[currentStep];

  return (
    <div className="space-y-3">
      <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-4">
        <div className="text-[10px] text-neutral-600 mb-2 uppercase tracking-widest font-light">Input</div>
        <div className="text-sm text-neutral-200 font-light">{current.text}</div>
      </div>

      <div className="flex justify-center py-2">
        <div className="flex gap-1">
          {[1, 2, 3].map((dot) => (
            <div key={dot} className="w-1 h-1 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: `${dot * 0.2}s` }}></div>
          ))}
        </div>
      </div>

      <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-4">
        <div className="text-[10px] text-neutral-600 mb-2 uppercase tracking-widest font-light">Analysis</div>
        <div className="text-sm text-green-400 font-light">{current.analysis}</div>
      </div>

      <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-4">
        <div className="text-[10px] text-neutral-600 mb-2 uppercase tracking-widest font-light">Response</div>
        <div className="text-sm text-neutral-200 font-light">{current.response}</div>
      </div>
    </div>
  );
}

// Personalized Response Animation
function PersonalizationAnimation() {
  const [user, setUser] = useState(0);

  const users = [
    { name: "Sarah", visits: 1, response: "Hi Sarah! Welcome to Orchis. Let me show you around..." },
    { name: "John", visits: 5, response: "Welcome back, John! Ready to explore our new analytics features?" },
    { name: "Emma", visits: 12, response: "Great to see you again, Emma! Your team's engagement is looking fantastic!" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setUser((prev) => (prev + 1) % users.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const current = users[user];

  return (
    <div className="space-y-3">
      <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white text-xs font-medium">
              {current.name[0]}
            </div>
            <div>
              <div className="text-sm font-light text-neutral-200">{current.name}</div>
              <div className="text-xs text-neutral-600 font-light">Visit #{current.visits}</div>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-md text-xs font-light border ${
            current.visits === 1 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            current.visits <= 5 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            'bg-purple-500/10 text-purple-400 border-purple-500/20'
          }`}>
            {current.visits === 1 ? 'New' : current.visits <= 5 ? 'Regular' : 'Loyal'}
          </div>
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 min-h-[64px]">
        <div className="text-sm text-green-300 font-light">{current.response}</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-neutral-600 uppercase tracking-widest">Location</div>
          <div className="text-sm text-neutral-300 mt-1 font-light">SF</div>
        </div>
        <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-neutral-600 uppercase tracking-widest">Device</div>
          <div className="text-sm text-neutral-300 mt-1 font-light">Desktop</div>
        </div>
        <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-neutral-600 uppercase tracking-widest">Score</div>
          <div className="text-sm text-neutral-300 mt-1 font-light">{current.visits * 15}</div>
        </div>
      </div>
    </div>
  );
}

// Multi-language Animation
function MultiLanguageAnimation() {
  const [lang, setLang] = useState(0);

  const languages = [
    { code: "EN", text: "How can I help you today?", name: "English" },
    { code: "ES", text: "¿Cómo puedo ayudarte hoy?", name: "Spanish" },
    { code: "FR", text: "Comment puis-je vous aider aujourd'hui?", name: "French" },
    { code: "DE", text: "Wie kann ich Ihnen heute helfen?", name: "German" },
    { code: "TR", text: "Bugün size nasıl yardımcı olabilirim?", name: "Turkish" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLang((prev) => (prev + 1) % languages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const current = languages[lang];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {languages.map((l, idx) => (
          <div key={idx} className={`px-3 py-1.5 rounded-md text-xs font-light transition-all duration-300 ${
            idx === lang
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-neutral-800/30 text-neutral-600 border border-neutral-800/40'
          }`}>
            {l.code}
          </div>
        ))}
      </div>

      <div className="border-l border-neutral-800 pl-4 py-3 min-h-[72px]">
        <div className="text-[10px] text-neutral-600 mb-2 uppercase tracking-widest font-light">{current.name}</div>
        <div className="text-base text-neutral-200 font-light">{current.text}</div>
      </div>

      <div className="text-xs text-neutral-600 font-light">
        Auto-detects user language and responds accordingly
      </div>
    </div>
  );
}

// Continuous Learning Animation
function LearningAnimation() {
  const [step, setStep] = useState(0);

  const learningSteps = [
    { phase: "Question Asked", count: 1, knowledge: 20 },
    { phase: "Answer Provided", count: 5, knowledge: 35 },
    { phase: "Feedback Collected", count: 12, knowledge: 60 },
    { phase: "Knowledge Updated", count: 25, knowledge: 85 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % learningSteps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = learningSteps[step];

  return (
    <div className="space-y-3">
      <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-light text-neutral-200">{current.phase}</div>
          <div className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-xs font-light">
            {step + 1}/4
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-600 font-light">Questions</span>
            <span className="text-neutral-300 font-light">{current.count}</span>
          </div>
          <div className="w-full bg-neutral-900/50 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-1000"
                 style={{ width: `${(current.count / 25) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-light">Accuracy</span>
          <span className="text-lg font-light text-neutral-50">{current.knowledge}%</span>
        </div>
        <div className="w-full bg-neutral-900/50 rounded-full h-2">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000 flex items-center justify-end pr-1.5"
               style={{ width: `${current.knowledge}%` }}>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg p-3 text-center">
          <div className="text-[10px] text-neutral-600 mb-1 uppercase tracking-widest">Conversations</div>
          <div className="text-lg font-light text-neutral-200">{current.count * 10}</div>
        </div>
        <div className="bg-neutral-800/20 border border-neutral-800/30 rounded-lg p-3 text-center">
          <div className="text-[10px] text-neutral-600 mb-1 uppercase tracking-widest">Improvements</div>
          <div className="text-lg font-light text-neutral-200">{current.count * 2}</div>
        </div>
      </div>
    </div>
  );
}

export default function AIAgentPage() {
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
            <div className="text-[10px] font-light text-neutral-500 mb-6 tracking-[0.3em] uppercase">AI Agent</div>
            <h1 className="text-6xl sm:text-8xl font-extralight text-neutral-50 mb-10 leading-[1.1] max-w-5xl mx-auto">
              Intelligent Conversations,<br />Powered by Advanced AI
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed font-light">
              AI that understands context, learns from every interaction, and delivers personalized responses across 50+ languages.
            </p>
          </div>

          {/* Hero Stats - Japanese Minimal */}
          <div className="mb-32 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="space-y-5 text-center md:text-left">
              <div className="text-7xl font-extralight text-neutral-100 tracking-tight">95%</div>
              <div className="text-[10px] font-light text-neutral-600 uppercase tracking-[0.25em] mb-3">Accuracy Rate</div>
              <div className="w-12 h-[1px] bg-gradient-to-r from-neutral-800 to-transparent mx-auto md:mx-0"></div>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">
                95% accuracy in understanding user intent, trained on millions of conversations.
              </p>
            </div>
            <div className="space-y-5 text-center md:text-left">
              <div className="text-7xl font-extralight text-neutral-100 tracking-tight">50+</div>
              <div className="text-[10px] font-light text-neutral-600 uppercase tracking-[0.25em] mb-3">Languages</div>
              <div className="w-12 h-[1px] bg-gradient-to-r from-neutral-800 to-transparent mx-auto md:mx-0"></div>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">
                Global reach with auto-detection and seamless translation capabilities.
              </p>
            </div>
            <div className="space-y-5 text-center md:text-left">
              <div className="text-7xl font-extralight text-neutral-100 tracking-tight">&lt;300ms</div>
              <div className="text-[10px] font-light text-neutral-600 uppercase tracking-[0.25em] mb-3">Response Time</div>
              <div className="w-12 h-[1px] bg-gradient-to-r from-neutral-800 to-transparent mx-auto md:mx-0"></div>
              <p className="text-sm text-neutral-500 leading-relaxed font-light">
                Lightning-fast responses with two-phase architecture for instant replies.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Section 1: Understanding & Response */}
        <div className="mb-32">
          <div className="mb-20 text-center">
            <div className="text-[10px] font-light text-neutral-600 mb-6 tracking-[0.25em] uppercase">01 — Understanding & Response</div>
            <h2 className="text-5xl font-extralight text-neutral-50 mb-4 leading-tight">Natural language processing</h2>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Natural Language Processing */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-2xl p-10 border border-neutral-800/30">
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-light mb-5">Intent Recognition</div>
                <h3 className="text-3xl font-extralight text-neutral-50 mb-4 leading-tight">Natural Language Processing</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-light">AI understands user intent, context, and sentiment to deliver accurate responses</p>
              </div>
              <NLPAnimation />
            </div>

            {/* Personalized Responses */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-2xl p-10 border border-neutral-800/30">
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-light mb-5">Adaptive Engagement</div>
                <h3 className="text-3xl font-extralight text-neutral-50 mb-4 leading-tight">Personalized Responses</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-light">Every response adapts to user history, behavior, and preferences</p>
              </div>
              <PersonalizationAnimation />
            </div>
          </div>
        </div>

        {/* Section 2: Scale & Intelligence */}
        <div className="mb-32">
          <div className="mb-20 text-center">
            <div className="text-[10px] font-light text-neutral-600 mb-6 tracking-[0.25em] uppercase">02 — Scale & Intelligence</div>
            <h2 className="text-5xl font-extralight text-neutral-50 mb-4 leading-tight">Global reach</h2>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Multi-language Support */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-2xl p-10 border border-neutral-800/30">
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-light mb-5">50+ Languages</div>
                <h3 className="text-3xl font-extralight text-neutral-50 mb-4 leading-tight">Multi-language Support</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-light">Communicate with users in their native language automatically</p>
              </div>
              <MultiLanguageAnimation />
            </div>

            {/* Continuous Learning */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-2xl p-10 border border-neutral-800/30">
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-600 font-light mb-5">Self-Improving</div>
                <h3 className="text-3xl font-extralight text-neutral-50 mb-4 leading-tight">Continuous Learning</h3>
                <p className="text-sm text-neutral-500 leading-relaxed font-light">AI improves with every conversation, getting smarter over time</p>
              </div>
              <LearningAnimation />
            </div>
          </div>
        </div>
      </div>

      <CTA />
      <Footer />
    </div>
  );
}
