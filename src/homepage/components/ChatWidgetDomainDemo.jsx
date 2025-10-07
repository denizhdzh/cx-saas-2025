import React, { useState, useEffect } from 'react';

export default function ChatWidgetDomainDemo() {
  const domains = [
    { name: 'shop.com', message: 'Welcome to our shop! Browse our latest collection.' },
    { name: 'pricing.com', message: 'Interested in pricing? Let me show you our plans.' },
    { name: 'support.com', message: 'Need help? I\'m here to assist you 24/7.' }
  ];

  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentDomainIndex((prev) => (prev + 1) % domains.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentDomain = domains[currentDomainIndex];

  return (
    <div className="relative w-full max-w-[22rem] mx-auto">
      {/* Domain Badge - Above widget */}
      <div className="mb-3 flex items-center justify-center">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 flex items-center gap-2 animate-[pulse_2s_ease-in-out_infinite]">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-orange-600 font-semibold">
            {currentDomain.name}
          </span>
        </div>
      </div>

      {/* Chat Widget */}
      <div
        className="rounded-[25px] w-full overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.1)_inset,0_1px_2px_rgba(255,255,255,0.05)_inset] flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 22, 22, 0.95) 0%, rgba(44, 44, 44, 0.92) 100%)',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          border: '0.5px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-3 bg-transparent">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden bg-white/10 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Orchis"
              className="w-8 h-8 object-cover rounded-xl"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/85 text-xs font-semibold tracking-tight">
              ORCHIS AI
            </div>
            <div className="text-white/50 text-xs">
              Online now
            </div>
          </div>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
        </div>

        {/* Messages - Dynamic based on domain */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0 min-h-[200px]">
          <div className="mb-0">
            <div className="text-white/45 text-[11px] font-semibold mb-1 uppercase tracking-wide">
              ORCHIS AI
            </div>
            <div
              className={`text-white/75 text-sm leading-relaxed transition-all duration-300 ${
                isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
            >
              {currentDomain.message}
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="p-1 bg-transparent">
          <div className="bg-transparent rounded-[20px] p-1.5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask anything about ORCHIS..."
                className="flex-1 px-3 py-2 text-sm bg-transparent text-white/85 border-none rounded-lg outline-none placeholder:text-white/35"
                disabled
              />
              <button
                className="px-4 py-2 text-black bg-white/90 rounded-full cursor-pointer transition-all text-xs font-semibold hover:bg-white/70 flex items-center justify-center"
                disabled
              >
                send
              </button>
            </div>
          </div>
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-1 px-0.5 py-2 pb-2 text-[10px] text-white/80">
          <img src="/logo.png" alt="Orchis" className="w-3 h-3 rounded" />
          <span>
            Powered by{' '}
            <a href="https://orchis.app" target="_blank" rel="noopener noreferrer" className="text-white/70 underline font-bold hover:text-white transition-colors">
              ORCHIS
            </a>
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
