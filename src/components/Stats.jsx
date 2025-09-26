import React from 'react';

export default function Stats() {
  return (
    <section className="relative py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-2 relative">
        {/* Vertical lines - hidden on mobile */}
        <div className="hidden lg:block absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="hidden lg:block absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-4 sm:mx-6">
          {/* Question-based narrative */}
          <div className="text-center mb-12 lg:mb-20">
            <div className="text-xs text-neutral-400 mb-6 tracking-wider">PROOF OF CONCEPT</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-neutral-900 mb-6 lg:mb-8 leading-tight">
              What if customer support<br />
              actually worked perfectly?
            </h2>
            <p className="text-base lg:text-lg text-neutral-600 font-light max-w-2xl mx-auto">
              Here's what happens when AI understands your business as well as you do.
            </p>
          </div>

          {/* Stats as a story */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 lg:p-16">
            <div className="space-y-8 lg:space-y-16">
              {/* Row 1 - Speed */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 text-center lg:text-left">
                <div className="lg:col-span-5">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-thin text-neutral-900 mb-2 lg:mb-4">0.8 seconds</div>
                  <div className="text-sm text-neutral-500">Average response time</div>
                </div>
                <div className="hidden lg:flex lg:col-span-2 justify-center">
                  <div className="w-px h-16 bg-neutral-200"></div>
                </div>
                <div className="lg:col-span-5 lg:text-right mt-4 lg:mt-0">
                  <div className="text-base lg:text-lg text-neutral-600 font-light">
                    Faster than typing "hello"
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-neutral-200"></div>

              {/* Row 2 - Accuracy */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 text-center lg:text-left">
                <div className="lg:col-span-5">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-thin text-neutral-900 mb-2 lg:mb-4">94%</div>
                  <div className="text-sm text-neutral-500">Issues resolved instantly</div>
                </div>
                <div className="hidden lg:flex lg:col-span-2 justify-center">
                  <div className="w-px h-16 bg-neutral-200"></div>
                </div>
                <div className="lg:col-span-5 lg:text-right mt-4 lg:mt-0">
                  <div className="text-base lg:text-lg text-neutral-600 font-light">
                    No waiting, no tickets, no frustration
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-neutral-200"></div>

              {/* Row 3 - Scale */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 text-center lg:text-left">
                <div className="lg:col-span-5">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-thin text-neutral-900 mb-2 lg:mb-4">∞</div>
                  <div className="text-sm text-neutral-500">Concurrent conversations</div>
                </div>
                <div className="hidden lg:flex lg:col-span-2 justify-center">
                  <div className="w-px h-16 bg-neutral-200"></div>
                </div>
                <div className="lg:col-span-5 lg:text-right mt-4 lg:mt-0">
                  <div className="text-base lg:text-lg text-neutral-600 font-light">
                    Handle Black Friday without breaking
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-neutral-200">
              <div className="text-sm text-neutral-500">
                Traditional support can't do this. AI can.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}