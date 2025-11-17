import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="relative py-32">
      {/* Subtle top separator */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-800 to-transparent mb-32"></div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center">
          {/* Category Label */}
          <div className="text-[10px] font-light text-neutral-600 mb-8 tracking-[0.3em] uppercase">
            Start Today
          </div>

          {/* Main Heading */}
          <h2 className="text-5xl lg:text-7xl font-extralight text-neutral-50 mb-10 leading-[1.1] max-w-3xl mx-auto">
            Start converting visitors<br />
            into happy customers
          </h2>

          {/* Subtitle */}
          <p className="text-base text-neutral-500 mb-16 leading-relaxed max-w-xl mx-auto font-light">
            Join companies using AI that actually learns from gaps, not just logs messages.
          </p>

          {/* Stats highlight - Minimal */}
          <div className="mb-16 space-y-2">
            <div className="text-xl font-light text-neutral-300">
              Average response: <span className="text-green-400">0.8s</span>
            </div>
            <div className="text-sm text-neutral-600 font-light">
              While competitors make customers wait hours
            </div>
          </div>

          {/* CTA Button */}
          <div className="max-w-md mx-auto mb-16">
            <button
              onClick={() => navigate('/signin')}
              className="w-full bg-neutral-100 hover:bg-white text-neutral-900 px-8 py-4 rounded-lg text-sm font-light tracking-wide transition-all duration-300 hover:scale-[1.02]"
            >
              Get Started Free →
            </button>
            <p className="text-xs text-neutral-600 text-center mt-4 font-light">
              No spam, no tricks. Just smart AI that works.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            <div className="px-4 py-2 bg-neutral-900/50 border border-neutral-800/50 rounded-full text-xs text-neutral-400 font-light">
              No credit card
            </div>
            <div className="px-4 py-2 bg-neutral-900/50 border border-neutral-800/50 rounded-full text-xs text-neutral-400 font-light">
              60s setup
            </div>
            <div className="px-4 py-2 bg-neutral-900/50 border border-neutral-800/50 rounded-full text-xs text-neutral-400 font-light">
              Cancel anytime
            </div>
            <div className="px-4 py-2 bg-neutral-900/50 border border-neutral-800/50 rounded-full text-xs text-neutral-400 font-light">
              100 free messages
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom separator */}
      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-800 to-transparent mt-32"></div>
    </section>
  );
}