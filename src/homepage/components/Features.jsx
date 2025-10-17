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
      <div className="text-xs font-medium text-white mb-4 text-center">Training Content</div>

      <div className="space-y-3">
        {/* Uploaded Documents */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
          <div className="text-xs font-medium text-white/90 mb-2">📄 Documents</div>
          <div className="space-y-1.5">
            {fakeDocuments.map((file, idx) => (
              <div key={idx} className="text-xs text-white/70 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-400"></div>
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Training Text */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
          <div className="text-xs font-medium text-white/90 mb-2">📝 Training Text</div>
          <div className="text-xs text-white/70">
            5,247 characters
          </div>
        </div>

        {/* Policy Links */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3">
          <div className="text-xs font-medium text-white/90 mb-2">🔗 Policy Links</div>
          <div className="space-y-1.5">
            <div className="text-xs text-white/70 flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
              <span className="truncate">Privacy Policy</span>
            </div>
            <div className="text-xs text-white/70 flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
              <span className="truncate">Terms of Service</span>
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
      <div className="text-xs font-bold text-white mb-4 text-center">Live Preview</div>

      {/* Mini Widget */}
      <div className="relative mx-auto bg-gradient-to-br from-stone-900/60 to-stone-800/40 backdrop-blur-md border border-stone-700/50 rounded-3xl p-4 shadow-2xl" style={{width: '380px'}}>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-stone-700/50 flex items-center justify-center overflow-hidden">
            <img src="/logo.webp" alt="Orchis" className="w-8 h-8 object-cover rounded-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              ORCHIS AI
            </div>
            <div className="text-xs text-stone-400">Online now</div>
          </div>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        </div>

        {/* Dynamic Popup Preview */}
        <div className={`mb-3 px-3 py-2.5 transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-0.5 h-8 bg-white rounded-full flex-shrink-0"></div>
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
                      className="w-16 h-12 rounded flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: "url('/livepreview6.webp')" }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold mb-0.5">Watch Now</div>
                      <div className="text-white/75 text-xs">{currentContent.message}</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">
                    <div className="mb-1">{currentContent.message}</div>
                    <div className="flex items-center gap-1 text-blue-400 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                      </svg>
                      <span className="truncate">{currentContent.link}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="text-white/50 hover:text-white/80 text-lg leading-none flex-shrink-0">
              ×
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white/5 rounded-2xl p-2 flex items-center gap-2">
          <input
            type="text"
            disabled
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-xs text-stone-300 placeholder:text-stone-500 border-none outline-none"
          />
          <div className="px-3 py-1.5 bg-white/90 text-black rounded-full text-xs font-semibold">
            send
          </div>
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-stone-400">
          <img src="https://orchis.app/logo.webp" alt="Orchis" className="w-3 h-3 rounded" />
          <span>Powered by <span className="font-bold">ORCHIS</span></span>
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
    },
    {
      id: 3,
      question: "What's your refund policy?",
      timestamp: "1 hour ago",
      status: "filled"
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
      <div className="text-xs font-medium text-white mb-4 text-center">Knowledge Gaps Dashboard</div>

      {/* Knowledge Gap Items */}
      <div className="space-y-3">
        {knowledgeGaps.map((gap) => (
          <div
            key={gap.id}
            className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 transition-all duration-300 ${
              fillingGap === gap.id ? 'bg-green-500/10 border-green-500/20' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/90 mb-1">
                  {gap.question}
                </div>
                <div className="text-xs text-white/50">
                  {gap.timestamp}
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
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
                className="w-full mt-2 px-3 py-1.5 bg-white/90 hover:bg-white text-black rounded-lg text-xs font-semibold transition-colors"
              >
                Fill Gap
              </button>
            )}

            {fillingGap === gap.id && (
              <div className="mt-2 text-xs text-green-400 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></div>
                <span>Adding to knowledge base...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="mt-4 text-xs font-bold text-white text-center">
        {knowledgeGaps.filter(g => g.status === 'pending').length} pending · {knowledgeGaps.length} total
      </div>
    </div>
  );
}

export default function ThreeFeatureStack() {
  return (
    <section id="features" className="relative py-16 lg:py-24 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-2">

          {/* Feature 1: content on RIGHT */}
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-32 mt-12 sm:mt-24 lg:mt-48">
            {/* Left: labels */}
            <div className="lg:w-1/2">
              <div className="text-sm text-orange-500 font-semibold mb-2">Brand-aligned AI</div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-3">
                Fully branded AI trained on your files
              </h3>
              <p className="text-base text-neutral-700 font-light">
                The AI answers users using only your uploaded and trained documents. When
                required (complaint, feedback, dissatisfaction, etc.) it politely asks the
                user for their email and details, creates a ticket immediately, and logs it
                to the dashboard so your team can follow up in real time.
              </p>
            </div>

            {/* Right: content box */}
            <div className="lg:w-1/2 w-full max-w-md sm:max-w-lg lg:max-w-none mx-auto">
              <div
                className="relative bg-cover bg-center bg-no-repeat rounded-4xl p-10 min-h-[500px] flex items-center justify-center"
                style={{backgroundImage: "url('/livepreview.webp')"}}
              >
                <div className="absolute inset-0 bg-stone-900/20 rounded-4xl"></div>
                <div className="relative z-10 w-full max-w-[500px] mx-auto">
                  <DocsPreview />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: content on LEFT */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-8 sm:gap-12 lg:gap-32 my-12 sm:my-24 lg:my-32">
            {/* Right (visual labels area) */}
            <div className="lg:w-1/2">
              <div className="text-sm text-orange-500 font-semibold mb-2">Dynamic Offer</div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-3">
                In-chat dynamic offers that boost conversion
              </h3>
              <p className="text-base text-neutral-700 font-light">
                Our chatbot supports highly dynamic, context-aware offers — similar to Apple
                Live Activities. Configure offers for first-time visitors and returning users
                to increase conversions and engagement.
              </p>
            </div>

            {/* Left: content box */}
            <div className="lg:w-1/2 w-full max-w-md sm:max-w-lg lg:max-w-none mx-auto">
              <div
                className="relative bg-cover bg-center bg-no-repeat rounded-4xl p-10 min-h-[500px] flex items-center justify-center"
                style={{backgroundImage: "url('/livepreview5.webp')"}}
              >
                <div className="absolute inset-0 bg-stone-900/20 rounded-4xl"></div>
                <div className="relative z-10 w-full max-w-[500px] mx-auto">
                  <DynamicContentPreview />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: content on RIGHT */}
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-32 mb-12 sm:mb-24 lg:mb-48">
            {/* Left: labels */}
            <div className="lg:w-1/2">
              <div className="text-sm text-orange-500 font-semibold mb-2">Knowledge Gap</div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-3">
                Instant knowledge-gap creation & single-click fill
              </h3>
              <p className="text-base text-neutral-700 font-light">
                If a user asks something our knowledge doesn't cover, the system creates a
                knowledge gap entry instantly — you can fill it from the dashboard with a
                single click so the AI learns and improves quickly.
              </p>
            </div>

            {/* Right: content box */}
            <div className="lg:w-1/2 w-full max-w-md sm:max-w-lg lg:max-w-none mx-auto">
              <div
                className="relative bg-cover bg-center bg-no-repeat rounded-4xl p-10 min-h-[500px] flex items-center justify-center"
                style={{backgroundImage: "url('/livepreview6.webp')"}}
              >
                <div className="absolute inset-0 bg-stone-900/20 rounded-4xl"></div>
                <div className="relative z-10 w-full max-w-[500px] mx-auto">
                  <KnowledgeGapPreview />
                </div>
              </div>
            </div>
          </div>

        </div>
    </section>
  );
}