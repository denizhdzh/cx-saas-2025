import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Hero() {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    'unanswered questions',
    'slow response times',
    'generic support',
    'lost opportunities'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-20 lg:py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Hero Card */}
        <div className="bg-gradient-to-br from-white to-neutral-50/80 rounded-3xl border border-neutral-200/60 shadow-2xl shadow-neutral-900/5 overflow-hidden">

          <div className="relative p-8 sm:p-12 lg:p-16 text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-neutral-200/60 bg-neutral-50 rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Powered by AI</span>
            </div>

            {/* Headline - Conversion focused */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-5 tracking-tight leading-[1.15]">
              Stop losing money to
              <br />
              <span className="text-orange-500 inline-block transition-all duration-500 ease-in-out">
                {features[currentFeature]}
              </span>
            </h1>

            {/* Subheadline - Benefit driven */}
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              AI chatbot that remembers every visitor, learns from every conversation,
              and converts 3x more than traditional support.
            </p>

            {/* CTA */}
            <div className="flex items-center justify-center mb-6">
              <button
                onClick={() => navigate('/signin')}
                className="btn-landing text-base"
              >
                Start Converting Now
              </button>
            </div>

            {/* Trust Signals - More concrete */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-600 mb-8">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Setup in 90 seconds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No credit card</span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-neutral-200/60">
              <div className="flex -space-x-2">
                <img src="/lungoai.webp" alt="LungoAI" className="w-8 h-8 rounded-lg border-2 border-white object-cover shadow-sm" />
                <img src="/simplelister.webp" alt="SimpleLister" className="w-8 h-8 rounded-lg border-2 border-white object-cover shadow-sm" />
                <img src="/toolslash.webp" alt="ToolSlash" className="w-8 h-8 rounded-lg border-2 border-white object-cover shadow-sm" />
                <img src="/unit3media.webp" alt="Unit3Media" className="w-8 h-8 rounded-lg border-2 border-white object-cover shadow-sm" />
              </div>
              <p className="text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">127 teams</span> converted visitors this week
              </p>
            </div>


          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-0 border-t border-neutral-200/50 bg-white/50">
            <div className="p-5 text-center border-r border-neutral-200/50">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900">3x</div>
              <div className="text-xs sm:text-sm text-neutral-500 mt-1">Higher Conversion</div>
            </div>
            <div className="p-5 text-center border-r border-neutral-200/50">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900">90s</div>
              <div className="text-xs sm:text-sm text-neutral-500 mt-1">To Go Live</div>
            </div>
            <div className="p-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900">24/7</div>
              <div className="text-xs sm:text-sm text-neutral-500 mt-1">Always Online</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
