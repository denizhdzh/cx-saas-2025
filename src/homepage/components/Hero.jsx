import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// DynamicContentPreview Component (from SignInPage - Glassy Design)
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
      <div className="relative mx-auto bg-stone-950/40 backdrop-blur-md border border-stone-700/50 rounded-3xl p-3 shadow-2xl" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-stone-700/50 flex items-center justify-center overflow-hidden">
            <img src="/logo.webp" alt="Orchis" className="w-8 h-8 object-cover rounded-lg" />
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
          <img src="https://orchis.app/logo.webp" alt="Orchis" className="w-4 h-4 rounded" />
          <span className="text-xs">Powered by <span className="font-bold">ORCHIS</span></span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative py-12 lg:py-12 overflow-hidden">

      <div className="relative max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 z-10">

        {/* Main Container */}
        <div className="bg-stone-800/50 rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-700/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left Column - Hero Content */}
            <div className="p-8 lg:p-12 flex flex-col justify-center min-h-[600px]">
              <div className="w-full max-w-md mx-auto lg:mx-0">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 mb-6 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.1s_forwards]">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold text-stone-100 uppercase tracking-wider">Powered by AI</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl font-bold text-stone-100 mb-5 tracking-tight leading-[1.15] opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
                  Beyond Chatbots: The Smartest<br />
                  <span className="text-green-500">Interactive Widget</span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg text-stone-100 mb-8 leading-relaxed opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
                  AI chatbot that remembers every visitor, learns from every conversation, and converts 8x more than traditional support.
                </p>

                {/* CTA */}
                <div className="mb-8 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
                  <button
                    onClick={() => navigate('/signin')}
                    className="btn-landing text-base"
                  >
                    Start Converting Now
                  </button>
                </div>

                {/* Trust Signals */}
                <div className="space-y-3 mb-8 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]">
                  <div className="flex items-center gap-2 text-sm text-stone-100">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Free forever plan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-100">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Setup in 90 seconds</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-100">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>No credit card required</span>
                  </div>
                </div>

                {/* Social Proof */}
                <div className="flex items-center gap-3 pt-6 border-t border-stone-700 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
                  <div className="flex -space-x-2">
                    <img src="/lungoai.webp" alt="LungoAI" className="w-8 h-8 rounded-lg border-1 border-white/50 object-cover shadow-sm" />
                    <img src="/simplelister.webp" alt="SimpleLister" className="w-8 h-8 rounded-lg border-1 border-white/50 object-cover shadow-sm" />
                    <img src="/toolslash.webp" alt="ToolSlash" className="w-8 h-8 rounded-lg border-1 border-white/50 object-cover shadow-sm" />
                    <img src="/unit3media.webp" alt="Unit3Media" className="w-8 h-8 rounded-lg border-1 border-white/50 object-cover shadow-sm" />
                  </div>
                  <p className="text-sm text-stone-100">
                    <span className="font-semibold text-stone-100">300+ makers</span> converted visitors this week
                  </p>
                </div>

              </div>
            </div>

            {/* Right Column - Chatbot Preview */}
            <div className="relative bg-gradient-to-br from-green-950 to-stone-950 p-8 lg:p-12 flex items-center justify-center min-h-[600px]">
              <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('/nnnn.webp')"}}></div>
              <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/20 to-stone-950/60"></div>
              <div className="relative z-10 w-full max-w-sm opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
                <DynamicContentPreview />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
