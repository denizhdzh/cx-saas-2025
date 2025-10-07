import { useState, useEffect } from 'react';

export default function ChatWidgetOfferDemo() {
  const [timeLeft, setTimeLeft] = useState(600); // 10:00 in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-[22rem] mx-auto">
      {/* Return User Log - Above widget */}
      <div className="mb-3 flex items-center justify-center">
        <div className="bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-semibold text-green-600">
            Return User Detected
          </span>
        </div>
      </div>

      {/* Chat Widget */}
      <div
        className="rounded-[25px] w-full overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.1)_inset,0_1px_2px_rgba(255,255,255,0.05)_inset] flex flex-col animate-[slideIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 22, 22, 0.95) 0%, rgba(44, 44, 44, 0.92) 100%)',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          border: '0.5px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-transparent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden bg-white/10 flex-shrink-0">
              <img
                src="/logo.png"
                alt="Orchis"
                className="w-8 h-8 object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="text-white/85 text-xs font-semibold tracking-tight">
                ORCHIS AI
              </div>
              <div className="text-white/50 text-xs">
                Online now
              </div>
            </div>
          </div>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
        </div>

        {/* Offer Banner */}
        <div
          className="px-4 py-3 animate-[offerSlideIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]"
        >
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
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes offerSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scaleY(0.8);
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
            max-height: 100px;
            padding-top: 12px;
            padding-bottom: 12px;
          }
        }
      `}</style>
    </div>
  );
}
