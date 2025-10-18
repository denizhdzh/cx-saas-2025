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
    <section className="relative py-20 lg:py-20 overflow-hidden">

      {/* Noise/Pattern for blur to work on */}
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Glass Cards Background Layer */}
      <div className="absolute inset-0 flex">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full backdrop-blur-2xl bg-black/0 border-r border-black/1 shadow-2xl shadow-neutral-200/70"
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">

        {/* Main Hero Card */}
        <div className="bg-transparent rounded-3xl overflow-hidden">

          <div className="relative p-8 sm:p-12 lg:p-16 text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-neutral-200/60 bg-neutral-50 rounded-full px-4 py-2 mb-6 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.1s_forwards]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Powered by AI</span>
            </div>

            {/* Headline - Conversion focused */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-5 tracking-tight leading-[1.15] opacity-0 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards]">
              Stop losing money to
              <br />
              <span className="text-orange-500 inline-block transition-all duration-500 ease-in-out">
                {features[currentFeature]}
              </span>
            </h1>

            {/* Subheadline - Benefit driven */}
            <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed opacity-0 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]">
              AI chatbot that remembers every visitor, learns from every conversation,
              and converts 3x more than traditional support.
            </p>

            {/* CTA */}
            <div className="flex items-center justify-center mb-6 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards]">
              <button
                onClick={() => navigate('/signin')}
                className="btn-landing text-base"
              >
                Start Converting Now
              </button>
            </div>

            {/* Trust Signals - More concrete */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-600 mb-8 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards]">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 opacity-0 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards]">
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
          <div className="grid grid-cols-3 gap-0 border-t border-neutral-200/50 bg-white/15 rounded-3xl backdrop-blur-md opacity-0 animate-[fadeInUp_0.6s_ease-out_0.7s_forwards]">
            <div className="p-5 text-center border-r border-neutral-200/50">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900">3x</div>
              <div className="text-xs sm:text-sm text-neutral-500 mt-1">Higher Conversion</div>
            </div>
            <div className="p-5 text-center border-r border-neutral-200/50">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900">&lt;100ms</div>
              <div className="text-xs sm:text-sm text-neutral-500 mt-1">Load Time</div>
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
