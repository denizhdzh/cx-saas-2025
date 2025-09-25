import React from 'react';
import ToastDemo from './ToastDemo';

export default function Hero() {
  return (
    <section className="relative">
      <div className="max-w-5xl mx-auto px-2 pt-32 pb-16 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
            {/* Left side - Content */}
            <div>
              <div className="text-xs text-neutral-400 mb-8 tracking-wider">
                CANDELA
              </div>
              
              <h1 className="text-6xl font-thin text-neutral-900 leading-[0.95] mb-8">
                Your customers deserve<br />
                <span className="text-neutral-500">conversations</span><br />
                not confusion
              </h1>
              
              <div className="w-16 h-px bg-neutral-900 mb-8"></div>
              
              <p className="text-xl text-neutral-600 font-light mb-12 leading-relaxed">
                AI agents that actually understand context, learn from your business, 
                and speak like humans do.
              </p>
              
              <div className="flex items-center gap-6">
                <button 
                  className="px-8 py-3 text-sm font-medium transition-colors rounded-xl text-white flex items-center justify-center gap-3 hover:opacity-90"
                  style={{
                    borderWidth: '0.5px',
                    borderStyle: 'solid',
                    borderColor: 'rgb(20, 20, 20)',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                    background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                  }}
                >
                  Start Building
                </button>
                <button className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
                  Watch Demo →
                </button>
              </div>
            </div>

            {/* Right side - Support Bot */}
            <div className="flex items-center justify-center">

                <ToastDemo />

            </div>
          </div>
          
          {/* Stats - Below both sides */}
          <div className="grid grid-cols-3 gap-8 text-center mt-24 pt-16 border-t border-neutral-200">
            <div>
              <div className="text-3xl font-light text-neutral-900 mb-2">94%</div>
              <div className="text-sm text-neutral-500">Resolution Rate</div>
            </div>
            <div>
              <div className="text-3xl font-light text-neutral-900 mb-2">60s</div>
              <div className="text-sm text-neutral-500">Setup Time</div>
            </div>
            <div>
              <div className="text-3xl font-light text-neutral-900 mb-2">24/7</div>
              <div className="text-sm text-neutral-500">Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}