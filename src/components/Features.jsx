import React from 'react';

export default function Features() {
  return (
    <section className="relative py-24">
      <div className="max-w-5xl mx-auto px-2 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          <div className="text-center mb-24">
            <div className="text-xs text-neutral-400 mb-6 tracking-wider">WHY IT WORKS</div>
            <h2 className="text-4xl font-thin text-neutral-900 mb-8 leading-tight">
              Built different from the ground up
            </h2>
            <p className="text-lg text-neutral-600 font-light max-w-2xl mx-auto">
              While others focus on features, we focus on the fundamentals that actually matter.
            </p>
          </div>

          {/* Feature comparison narrative */}
          <div className="space-y-20">
            {/* Smart vs Dumb */}
            <div className="bg-neutral-50 rounded-2xl p-12">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-xs text-neutral-400 mb-2">TRADITIONAL CHATBOTS</div>
                  <div className="text-lg text-neutral-600 font-light">
                    Pre-written responses that rarely match what customers actually need
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-2">CANDELA AI</div>
                  <div className="text-lg text-neutral-900 font-medium">
                    Understands context, learns from your content, adapts to every conversation
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
            <div className="bg-white rounded-2xl border border-neutral-200 p-12">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-xs text-neutral-400 mb-2">TYPICAL WIDGETS</div>
                  <div className="text-lg text-neutral-600 font-light">
                    Clunky popup boxes that look like they're from 2010
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-2">TOAST DESIGN</div>
                  <div className="text-lg text-neutral-900 font-medium">
                    Modern, minimal interface that customers love to interact with
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
            <div className="bg-neutral-50 rounded-2xl p-12">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-xs text-neutral-400 mb-2">COMPLEX SETUP</div>
                  <div className="text-lg text-neutral-600 font-light">
                    Weeks of configuration, training, and hoping it works
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-2">ONE LINE OF CODE</div>
                  <div className="text-lg text-neutral-900 font-medium">
                    Copy, paste, done. Your AI agent is live and learning immediately
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
          <div className="text-center mt-24">
            <div className="w-16 h-px bg-neutral-900 mx-auto mb-8"></div>
            <p className="text-lg text-neutral-600 font-light italic">
              "Most AI tools make simple things complicated.<br />
              We make complicated things simple."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}