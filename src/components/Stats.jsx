import React from 'react';

export default function Stats() {
  return (
    <section className="relative py-24">
      <div className="max-w-5xl mx-auto px-2 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          {/* Question-based narrative */}
          <div className="text-center mb-20">
            <div className="text-xs text-neutral-400 mb-6 tracking-wider">PROOF OF CONCEPT</div>
            <h2 className="text-4xl font-thin text-neutral-900 mb-8 leading-tight">
              What if customer support<br />
              actually worked perfectly?
            </h2>
            <p className="text-lg text-neutral-600 font-light max-w-2xl mx-auto">
              Here's what happens when AI understands your business as well as you do.
            </p>
          </div>

          {/* Stats as a story */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-16">
            <div className="space-y-16">
              {/* Row 1 - Speed */}
              <div className="grid grid-cols-12 gap-8 items-center">
                <div className="col-span-5">
                  <div className="text-5xl font-thin text-neutral-900 mb-4">0.8 seconds</div>
                  <div className="text-sm text-neutral-500">Average response time</div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="w-px h-16 bg-neutral-200"></div>
                </div>
                <div className="col-span-5 text-right">
                  <div className="text-lg text-neutral-600 font-light">
                    Faster than typing "hello"
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-neutral-200"></div>

              {/* Row 2 - Accuracy */}
              <div className="grid grid-cols-12 gap-8 items-center">
                <div className="col-span-5">
                  <div className="text-5xl font-thin text-neutral-900 mb-4">94%</div>
                  <div className="text-sm text-neutral-500">Issues resolved instantly</div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="w-px h-16 bg-neutral-200"></div>
                </div>
                <div className="col-span-5 text-right">
                  <div className="text-lg text-neutral-600 font-light">
                    No waiting, no tickets, no frustration
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-neutral-200"></div>

              {/* Row 3 - Scale */}
              <div className="grid grid-cols-12 gap-8 items-center">
                <div className="col-span-5">
                  <div className="text-5xl font-thin text-neutral-900 mb-4">∞</div>
                  <div className="text-sm text-neutral-500">Concurrent conversations</div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="w-px h-16 bg-neutral-200"></div>
                </div>
                <div className="col-span-5 text-right">
                  <div className="text-lg text-neutral-600 font-light">
                    Handle Black Friday without breaking
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-16 pt-8 border-t border-neutral-200">
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