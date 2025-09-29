import React, { useState, useEffect } from 'react';

export default function Features() {
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 0) {
          return 30 * 60; // Reset to 30 minutes when it reaches 0
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0')
    };
  };

  const { minutes, seconds } = formatTime(timeLeft);
  const progress = ((30 * 60 - timeLeft) / (30 * 60)) * 100;

  return (
    <section id="features" className="relative py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-2 relative">
        {/* Vertical lines - hidden on mobile */}
        <div className="hidden lg:block absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="hidden lg:block absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-4 sm:mx-6">
          <div className="text-center mb-16 lg:mb-24">
            <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">WHY IT WORKS</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-neutral-900 mb-6 lg:mb-8 leading-tight">
              Built different from the ground up
            </h2>
            <p className="text-base lg:text-lg text-neutral-600 font-light max-w-2xl mx-auto">
              While others focus on features, we focus on the fundamentals that actually matter.
            </p>
          </div>

          {/* Feature comparison narrative */}
          <div className="space-y-12 lg:space-y-20">
            {/* Smart vs Dumb */}
            <div className="bg-neutral-50 rounded-2xl p-6 sm:p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
                <div>
                  <div className="text-xs text-neutral-400 mb-2">TRADITIONAL CHATBOTS</div>
                  <div className="text-base lg:text-lg text-neutral-600 font-light mb-4">
                    Generic responses that make customers more frustrated
                  </div>
                  {/* Traditional chat conversation */}
                  <div className="bg-white border rounded-lg p-3 max-w-xs space-y-2">
                    <div className="text-xs text-neutral-500">Customer:</div>
                    <div className="bg-blue-50 p-2 rounded text-xs">How do I set up SSO?</div>
                    <div className="text-xs text-neutral-500">Bot:</div>
                    <div className="bg-neutral-100 p-2 rounded text-xs">Sorry, I don't understand. Please contact support.</div>
                    <div className="text-xs text-neutral-500">Customer:</div>
                    <div className="bg-blue-50 p-2 rounded text-xs">Single sign-on configuration</div>
                    <div className="text-xs text-neutral-500">Bot:</div>
                    <div className="bg-neutral-100 p-2 rounded text-xs">I can help with general questions. Try rephrasing.</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-2">ORCHIS AI</div>
                  <div className="text-base lg:text-lg text-neutral-900 font-medium mb-4">
                    Contextual understanding that actually solves problems
                  </div>
                  {/* Exact ToastDemo with our response */}
                  <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-3 w-full max-w-sm sm:max-w-md lg:max-w-sm xl:max-w-md" style={{boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'}}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-neutral-800 rounded-full flex items-center justify-center">
                        <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-xs font-medium">Orchis AI</div>
                        <div className="text-neutral-400 text-xs">Just now</div>
                      </div>
                    </div>
                    <div className="text-white text-xs mb-2">How do I set up SSO authentication for my team?</div>
                    <div className="bg-neutral-800 rounded-lg p-2">
                      <div className="text-neutral-200 text-xs leading-relaxed mb-2">
                        Enable SSO in your admin dashboard under Security Settings. Choose your identity provider (Google, Azure AD, Okta), configure the SAML endpoints, and invite team members.
                      </div>
                      <div className="text-neutral-400 text-xs">
                        → orchisai.com/docs/sso-setup
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-neutral-500">
                  Intelligence you can actually see in action
                </div>
              </div>
            </div>

            {/* Beautiful vs Ugly */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
                <div>
                  <div className="text-xs text-neutral-400 mb-2">TYPICAL WIDGETS</div>
                  <div className="text-base lg:text-lg text-neutral-600 font-light mb-4">
                    Blue popup corner boxes with "Need help?" flashing buttons that interrupt user experience
                  </div>
                  {/* Traditional circle chatbot */}
                  <div className="relative max-w-xs">
                    {/* Chat bubble */}
                    <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-bl-sm mb-2 relative">
                      <div className="text-xs font-medium mb-1">Hey there! 👋</div>
                      <div className="text-xs">Need help? I'm here to assist you!</div>
                      {/* Bubble tail */}
                      <div className="absolute -bottom-1 left-3 w-3 h-3 bg-blue-500 transform rotate-45"></div>
                    </div>
                    
                    {/* Circle avatar */}
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg relative">
                        <span className="text-white text-sm font-bold">?</span>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-neutral-900">ChatBot</div>
                        <div className="text-xs text-green-600">● Online</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-2">ORCHIS DESIGN</div>
                  <div className="text-base lg:text-lg text-neutral-900 font-medium mb-4">
                    Elegant Live Activity-style interface that feels native to your website
                  </div>
                  {/* Live Activities discount offer */}
                  <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-3 w-full max-w-sm sm:max-w-md lg:max-w-sm xl:max-w-md" style={{boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'}}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-neutral-800 rounded-full flex items-center justify-center">
                        <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-xs font-medium">Special Offer</div>
                        <div className="text-neutral-400 text-xs">Limited time</div>
                      </div>
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="text-neutral-300 text-xs leading-relaxed mb-3">
                      Get 20% off your first month of Orchis AI! Perfect time to upgrade your customer support.
                    </div>
                    <div className="rounded-xl p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-orange-400 text-xs font-medium">20% OFF</div>
                        <div className="text-orange-300 text-xs font-mono flex gap-1">
                          <span className="bg-neutral-800 px-1 rounded">{minutes[0]}</span>
                          <span className="bg-neutral-800 px-1 rounded">{minutes[1]}</span>
                          <span className="text-orange-400">:</span>
                          <span className="bg-neutral-800 px-1 rounded">{seconds[0]}</span>
                          <span className="bg-neutral-800 px-1 rounded">{seconds[1]}</span>
                        </div>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-1 mt-2">
                        <div className="bg-orange-500 h-1 rounded-full transition-all duration-1000 ease-linear" style={{width: `${100 - progress}%`}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-neutral-500">
                  Design that doesn't fight against your brand
                </div>
              </div>
            </div>

            {/* Hard vs Easy */}
            <div className="bg-neutral-50 rounded-2xl p-6 sm:p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
                <div>
                  <div className="text-xs text-neutral-400 mb-2">COMPLEX SETUP</div>
                  <div className="text-base lg:text-lg text-neutral-600 font-light mb-4">
                    Weeks of configuration, multiple services, endless debugging
                  </div>
                  {/* Complex setup visualization */}
                  <div className="space-y-2 max-w-xs">
                    <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                      ❌ npm install 47 dependencies
                    </div>
                    <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                      ❌ Configure OpenAI API keys
                    </div>
                    <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                      ❌ Set up vector database
                    </div>
                    <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                      ❌ Train embeddings (3+ weeks)
                    </div>
                    <div className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                      ❌ Debug hallucinations
                    </div>
                    <div className="text-xs text-neutral-500 mt-2">Still not working after 2 months...</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-2">ORCHIS SETUP</div>
                  <div className="text-base lg:text-lg text-neutral-900 font-medium mb-4">
                    One line of code, live in 60 seconds
                  </div>
                  {/* Simple code block */}
                  <div className="bg-neutral-900 rounded-xl p-4 w-full max-w-xs sm:max-w-sm">
                    <div className="text-green-400 font-mono text-sm leading-relaxed">
                      &lt;script src="orchis.ai/widget.js"<br />
                      &nbsp;&nbsp;data-key="your-key"&gt;<br />
                      &lt;/script&gt;
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-700">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="text-green-400 text-xs font-medium">Live in 60 seconds</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-neutral-500">
                  Simple enough for anyone, powerful enough for everything
                </div>
              </div>
            </div>
          </div>

          {/* Bottom insight */}
          <div className="text-center mt-16 lg:mt-24">
            <div className="w-12 lg:w-16 h-px bg-neutral-900 mx-auto mb-6 lg:mb-8"></div>
            <p className="text-base lg:text-lg text-neutral-600 font-light italic">
              "Most AI tools make simple things complicated.<br />
              We make complicated things simple."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}