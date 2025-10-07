import { useState, useEffect, useRef } from 'react';

export default function ChatWidgetMockup() {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [showAnalyzeMode, setShowAnalyzeMode] = useState(false);
  const [analyzeMode, setAnalyzeMode] = useState(false);
  const inputRef = useRef(null);
  const timeoutsRef = useRef([]);
  const intervalsRef = useRef([]);

  useEffect(() => {
    const runAnimation = () => {
      // Clear all existing timeouts and intervals
      timeoutsRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
      timeoutsRef.current = [];
      intervalsRef.current = [];

      // Reset state
      setMessages([]);
      setUserInput('');
      setShowAnalyzeMode(false);
      setAnalyzeMode(false);

      const timeline = [
        // Step 1: Type "hello" in input
        { delay: 500, action: () => {
          typeText('hello', setUserInput, () => {
            const t = setTimeout(() => {
              setMessages([{ type: 'user', text: 'hello' }]);
              setUserInput('');
            }, 200);
            timeoutsRef.current.push(t);
          });
        }},

        // Step 2: AI responds immediately
        { delay: 800, action: () => {
          setShowAnalyzeMode(true);
          setAnalyzeMode(false);
          setMessages(prev => [...prev, { type: 'ai', text: 'Hi there! How can I help you today?' }]);
        }},

        // Step 3: Type complaint in input
        { delay: 1200, action: () => {
          typeText('I ordered premium subscription 2 weeks ago but I\'m still being charged the basic plan rate and missing features', setUserInput, () => {
            const t = setTimeout(() => {
              setMessages(prev => [...prev, { type: 'user', text: 'I ordered premium subscription 2 weeks ago but I\'m still being charged the basic plan rate and missing features' }]);
              setUserInput('');
            }, 200);
            timeoutsRef.current.push(t);
          });
        }},

        // Step 4: Analyze Mode ON
        { delay: 6000, action: () => {
          setAnalyzeMode(true);
        }},

        // Step 5: AI responds
        { delay: 1200, action: () => {
          setMessages(prev => [...prev, { type: 'ai', text: 'I understand your frustration with the billing issue. According to our upgrade guide, you can manage your subscription at orchis.app/dashboard/billing or contact support@orchis.app for immediate assistance with premium features.' }]);
        }},

        // Step 6: Wait before loop restart
        { delay: 4000, action: () => {} }
      ];

      let cumulativeDelay = 0;

      timeline.forEach(({ delay, action }) => {
        cumulativeDelay += delay;
        const t = setTimeout(action, cumulativeDelay);
        timeoutsRef.current.push(t);
      });

      return cumulativeDelay;
    };

    // Run first animation
    const totalDuration = runAnimation();

    // Set up loop
    const loopInterval = setInterval(() => {
      runAnimation();
    }, totalDuration + 1000);

    return () => {
      clearInterval(loopInterval);
      timeoutsRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  const typeText = (text, setter, onComplete) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setter(text.slice(0, index));
        index++;
        // Auto scroll input to show cursor
        if (inputRef.current) {
          inputRef.current.scrollLeft = inputRef.current.scrollWidth;
        }
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 40);
    intervalsRef.current.push(interval);
  };

  return (
    <div className="relative w-full max-w-[22rem] mx-auto">
      {/* Analyze Mode Badge */}
      {showAnalyzeMode && (
        <div className="mb-3 flex justify-center">
          <div className={`border rounded-full px-4 py-1.5 flex items-center gap-2 transition-all duration-500 ${
            analyzeMode
              ? 'bg-orange-500/20 border-orange-500/40'
              : 'bg-gray-500/10 border-gray-500/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              analyzeMode ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className={`text-[10px] font-mono font-semibold transition-colors duration-500 ${
              analyzeMode ? 'text-orange-600' : 'text-gray-500'
            }`}>
              analyze mode: {analyzeMode ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      )}

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

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[60px] scrollbar-hide">
          {messages.length > 0 && (
            messages.map((msg, idx) => (
              <div key={idx} className="animate-[messageIn_0.3s_ease-out]">
                {msg.type === 'user' && (
                  <div>
                    <div className="text-white/45 text-[11px] font-semibold mb-1 uppercase tracking-wide">
                      YOU
                    </div>
                    <div className="text-white/85 text-sm leading-relaxed font-medium">
                      {msg.text}
                    </div>
                  </div>
                )}
                {msg.type === 'ai' && (
                  <div>
                    <div className="text-white/45 text-[11px] font-semibold mb-1 uppercase tracking-wide">
                      ORCHIS AI
                    </div>
                    <div className="text-white/75 text-sm leading-relaxed" dangerouslySetInnerHTML={{
                      __html: msg.text.replace(
                        /(orchis\.app\/[^\s]+|[^\s]+@orchis\.app)/g,
                        '<a href="https://$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline transition-colors">$1</a>'
                      ).replace('href="https://support@orchis.app"', 'href="mailto:support@orchis.app"')
                    }} />
                  </div>
                )}
                {msg.type === 'ai-typing' && (
                  <div>
                    <div className="text-white/45 text-[11px] font-semibold mb-1 uppercase tracking-wide">
                      ORCHIS AI
                    </div>
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_both]" style={{ animationDelay: '-0.32s' }}></div>
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_both]" style={{ animationDelay: '-0.16s' }}></div>
                      <div className="w-2 h-2 bg-white/30 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_both]"></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Section */}
        <div className="p-1 bg-transparent">
          <div className="bg-transparent rounded-[20px] p-1.5">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
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
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

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

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
