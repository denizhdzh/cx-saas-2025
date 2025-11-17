import React, { useState, useEffect } from "react";

// DocsPreview Component
function DocsPreview() {
  const fakeDocuments = [
    { name: "Product Guide.pdf", icon: "📄" },
    { name: "FAQ.docx", icon: "📄" },
    { name: "Privacy Policy.pdf", icon: "📄" },
    { name: "Terms of Service.pdf", icon: "📄" }
  ];

  return (
    <div className="w-full">
      <div className="text-xs font-medium text-white mb-3 text-center">Training Content</div>

      <div className="space-y-2">
        {/* Uploaded Documents */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2">
          <div className="text-xs font-medium text-white/90 mb-1.5">📄 Documents</div>
          <div className="space-y-1">
            {fakeDocuments.slice(0, 2).map((file, idx) => (
              <div key={idx} className="text-xs text-white/70 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-400"></div>
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Training Text */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2">
          <div className="text-xs font-medium text-white/90 mb-1">📝 Training Text</div>
          <div className="text-xs text-white/70">
            5,247 characters
          </div>
        </div>

        {/* Policy Links */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2">
          <div className="text-xs font-medium text-white/90 mb-1">🔗 Policy Links</div>
          <div className="space-y-1">
            <div className="text-xs text-white/70 flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
              <span className="truncate">Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// DynamicContentPreview Component
function DynamicContentPreview() {
  const contentVariants = [
    {
      type: 'discount',
      title: 'Special Offer',
      message: 'Get 20% off with code',
      code: 'SAVE20'
    },
    {
      type: 'video',
      title: 'Watch Our Demo',
      message: 'See how it works in 2 minutes'
    },
    {
      type: 'link',
      title: 'New Feature Alert',
      message: 'Check out our latest update',
      link: 'orchis.app/features'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % contentVariants.length);
        setIsTransitioning(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentContent = contentVariants[currentIndex];

  return (
    <div className="w-full">
      <div className="text-xs font-bold text-white mb-3 text-center">Live Preview</div>

      {/* Mini Widget */}
      <div className="relative mx-auto bg-gradient-to-br from-stone-900/60 to-stone-800/40 backdrop-blur-md border border-stone-700/50 rounded-2xl p-3 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-stone-700/50 flex items-center justify-center overflow-hidden">
            <img src="/logo.webp" alt="Orchis" className="w-6 h-6 object-cover rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              ORCHIS AI
            </div>
            <div className="text-xs text-stone-400">Online</div>
          </div>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        </div>

        {/* Dynamic Popup Preview */}
        <div className={`mb-2 px-2 py-2 transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-6 bg-white rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold mb-0.5 transition-all duration-700">
                {currentContent.title}
              </div>
              <div className="text-white/75 text-xs transition-all duration-700">
                {currentContent.type === 'discount' ? (
                  <>
                    {currentContent.message}{' '}
                    <strong className="text-white font-bold font-mono">{currentContent.code}</strong>
                  </>
                ) : currentContent.type === 'video' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-12 h-9 rounded flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: "url('/livepreview6.webp')" }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold mb-0.5">Watch Now</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">
                    <div className="mb-1 text-xs">{currentContent.message}</div>
                    <div className="flex items-center gap-1 text-blue-400 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                      </svg>
                      <span className="truncate text-xs">orchis.app</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="text-white/50 hover:text-white/80 text-sm leading-none flex-shrink-0">
              ×
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white/5 rounded-xl p-1.5 flex items-center gap-2">
          <input
            type="text"
            disabled
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-xs text-stone-300 placeholder:text-stone-500 border-none outline-none"
          />
          <div className="px-2 py-1 bg-white/90 text-black rounded-full text-xs font-semibold">
            send
          </div>
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-stone-400">
          <img src="https://orchis.app/logo.webp" alt="Orchis" className="w-2.5 h-2.5 rounded" />
          <span className="text-xs">Powered by <span className="font-bold">ORCHIS</span></span>
        </div>
      </div>
    </div>
  );
}

// KnowledgeGapPreview Component
function KnowledgeGapPreview() {
  const [fillingGap, setFillingGap] = useState(null);

  const knowledgeGaps = [
    {
      id: 1,
      question: "What are your business hours?",
      timestamp: "2 min ago",
      status: "pending"
    },
    {
      id: 2,
      question: "Do you offer international shipping?",
      timestamp: "15 min ago",
      status: "pending"
    }
  ];

  const handleFillGap = (id) => {
    setFillingGap(id);
    setTimeout(() => {
      setFillingGap(null);
    }, 2000);
  };

  return (
    <div className="w-full">
      <div className="text-xs font-medium text-white mb-3 text-center">Knowledge Gaps</div>

      {/* Knowledge Gap Items */}
      <div className="space-y-2">
        {knowledgeGaps.map((gap) => (
          <div
            key={gap.id}
            className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 transition-all duration-300 ${
              fillingGap === gap.id ? 'bg-green-500/10 border-green-500/20' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/90 mb-0.5">
                  {gap.question}
                </div>
                <div className="text-xs text-white/50">
                  {gap.timestamp}
                </div>
              </div>
              <div className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                gap.status === 'filled'
                  ? 'bg-green-500/20 text-green-400'
                  : fillingGap === gap.id
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/10 text-white/60'
              }`}>
                {fillingGap === gap.id ? 'Filling...' : gap.status === 'filled' ? 'Filled' : 'Pending'}
              </div>
            </div>

            {gap.status === 'pending' && fillingGap !== gap.id && (
              <button
                onClick={() => handleFillGap(gap.id)}
                className="w-full mt-1 px-2 py-1 bg-white/90 hover:bg-white text-black rounded-lg text-xs font-semibold transition-colors"
              >
                Fill Gap
              </button>
            )}

            {fillingGap === gap.id && (
              <div className="mt-1 text-xs text-green-400 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></div>
                <span>Adding to knowledge base...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="mt-3 text-xs font-bold text-white text-center">
        {knowledgeGaps.filter(g => g.status === 'pending').length} pending · {knowledgeGaps.length} total
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-16 lg:py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="text-[10px] font-light text-neutral-600 mb-6 tracking-[0.25em] uppercase">Features</div>
          <h2 className="text-5xl font-extralight text-neutral-50 mb-6 leading-tight">
            Everything you need in one platform
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent mx-auto mb-8"></div>
          <p className="text-base text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
            AI-powered features designed to transform your customer support
          </p>
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

          {/* Feature 1: Brand-aligned AI */}
          <div className="flex flex-col">
            {/* Content Box */}
            <div
              className="relative bg-cover bg-center bg-no-repeat rounded-3xl p-6 min-h-[320px] flex items-center justify-center mb-6"
              style={{backgroundImage: "url('/livepreview.webp')"}}
            >
              <div className="absolute inset-0 bg-stone-900/20 rounded-3xl"></div>
              <div className="relative z-10 w-full">
                <DocsPreview />
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center">
              <div className="text-[10px] text-green-500 font-light mb-3 uppercase tracking-widest">Brand-aligned AI</div>
              <h3 className="text-2xl font-extralight text-neutral-50 mb-3">
                Trained on your files
              </h3>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                AI answers using only your documents. Creates tickets when needed and logs to dashboard for real-time follow-up.
              </p>
            </div>
          </div>

          {/* Feature 2: Dynamic Offers */}
          <div className="flex flex-col">
            {/* Content Box */}
            <div
              className="relative bg-cover bg-center bg-no-repeat rounded-3xl p-6 min-h-[320px] flex items-center justify-center mb-6"
              style={{backgroundImage: "url('/livepreview5.webp')"}}
            >
              <div className="absolute inset-0 bg-stone-900/20 rounded-3xl"></div>
              <div className="relative z-10 w-full">
                <DynamicContentPreview />
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center">
              <div className="text-[10px] text-green-500 font-light mb-3 uppercase tracking-widest">Dynamic Offer</div>
              <h3 className="text-2xl font-extralight text-neutral-50 mb-3">
                In-chat offers that convert
              </h3>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                Context-aware offers similar to Apple Live Activities. Configure for first-time and returning users to boost engagement.
              </p>
            </div>
          </div>

          {/* Feature 3: Knowledge Gap */}
          <div className="flex flex-col">
            {/* Content Box */}
            <div
              className="relative bg-cover bg-center bg-no-repeat rounded-3xl p-6 min-h-[320px] flex items-center justify-center mb-6"
              style={{backgroundImage: "url('/livepreview6.webp')"}}
            >
              <div className="absolute inset-0 bg-stone-900/20 rounded-3xl"></div>
              <div className="relative z-10 w-full">
                <KnowledgeGapPreview />
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-center">
              <div className="text-[10px] text-green-500 font-light mb-3 uppercase tracking-widest">Knowledge Gap</div>
              <h3 className="text-2xl font-extralight text-neutral-50 mb-3">
                Single-click knowledge fill
              </h3>
              <p className="text-sm text-neutral-500 font-light leading-relaxed">
                System creates knowledge gap entries instantly. Fill from dashboard with one click so AI learns and improves quickly.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
