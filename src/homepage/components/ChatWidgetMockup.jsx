import { useState, useEffect } from 'react';

export default function ChatWidgetMockup() {
  const [timeLeft, setTimeLeft] = useState(600); // 10:00 in seconds

  useEffect(() => {
    // Timer for countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-[22rem] mx-auto">
      {/* Chat Widget */}
      <div
        className="rounded-[25px] w-full overflow-hidden flex flex-col"
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
              src="/logo.webp"
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

        {/* Offer Banner */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-px h-8 bg-white flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[13px] font-semibold mb-0.5 flex items-center gap-2">
                Welcome back!
                <span className={`inline-flex items-center bg-white/15 px-1.5 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide ${
                  timeLeft < 60 ? 'animate-pulse bg-red-500/20' : ''
                }`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="text-white/75 text-xs leading-tight">
                Get 15% off with code{' '}
                <span className="inline-flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                  <strong className="text-white font-bold">WELCOME15</strong>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </span>
              </div>
            </div>
            <button className="text-white/50 text-xl w-5 h-5 flex items-center justify-center flex-shrink-0 hover:text-white transition-colors">
              ×
            </button>
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
                readOnly
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
          <img src="/logo.webp" alt="Orchis" className="w-3 h-3 rounded" />
          <span>
            Powered by{' '}
            <a href="https://orchis.app" target="_blank" rel="noopener noreferrer" className="text-white/70 underline font-bold hover:text-white transition-colors">
              ORCHIS
            </a>
          </span>
        </div>
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
