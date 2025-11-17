import React from 'react';

export default function ProblemSolution() {
  return (
    <section id="before-after" className="relative py-16 lg:py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="text-[10px] font-light text-neutral-600 mb-6 tracking-[0.25em] uppercase">Before & After</div>
          <h2 className="text-5xl font-extralight text-neutral-50 mb-6 leading-tight">
            Before and after ORCHIS
          </h2>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-neutral-700 to-transparent mx-auto mb-8"></div>
          <p className="text-base text-neutral-400 max-w-3xl mx-auto font-light leading-relaxed">
            See how AI transforms customer support from frustration to satisfaction
          </p>
        </div>

        {/* Single Unified Card */}
        <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800/50 rounded-3xl border border-neutral-800/30 overflow-hidden">

          {/* 2 Column Grid Inside Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Problem Side */}
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-neutral-800/50">
              <div className="text-[10px] font-light text-neutral-600 mb-6 uppercase tracking-widest">The Reality</div>

              <h3 className="text-xl font-extralight text-neutral-50 mb-6 leading-tight">
                Your support team is drowning in repetitive tickets
              </h3>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="text-sm font-light text-neutral-200 mb-1">Customer needs help with integration</div>
                      <div className="text-xs text-neutral-500 font-light">Creates support ticket, waits for response</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-600 pl-5 font-light">9:15 AM</div>
                </div>

                {/* Step 2 */}
                <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="text-sm font-light text-neutral-200 mb-1">Support agent researches answer</div>
                      <div className="text-xs text-neutral-500 font-light">Spends 20 minutes finding the same info again</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-600 pl-5 font-light">2:45 PM</div>
                </div>

                {/* Step 3 */}
                <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="text-sm font-light text-neutral-200 mb-1">Customer gets frustrated</div>
                      <div className="text-xs text-neutral-500 font-light">Considers switching to competitor's solution</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-600 pl-5 font-light">Next day</div>
                </div>
              </div>
            </div>

            {/* Solution Side */}
            <div className="p-8 lg:p-12">
              <div className="text-[10px] font-light text-neutral-600 mb-6 uppercase tracking-widest">The Solution</div>

              <h3 className="text-xl font-extralight text-neutral-50 mb-6 leading-tight">
                AI agents that know your SaaS inside and out
              </h3>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="text-sm font-light text-neutral-200 mb-1">Customer asks about integration</div>
                      <div className="text-xs text-neutral-500 font-light">AI instantly provides step-by-step guide with links</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-600 pl-5 font-light">9:15 AM</div>
                </div>

                {/* Step 2 */}
                <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="text-sm font-light text-neutral-200 mb-1">Follow-up question</div>
                      <div className="text-xs text-neutral-500 font-light">AI provides API documentation and code samples</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-600 pl-5 font-light">9:16 AM</div>
                </div>

                {/* Step 3 */}
                <div className="bg-neutral-800/30 border border-neutral-800/40 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1"></div>
                    <div className="flex-1">
                      <div className="text-sm font-light text-neutral-200 mb-1">Customer successfully integrates</div>
                      <div className="text-xs text-neutral-500 font-light">Upgrades to higher plan, refers new customers</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-600 pl-5 font-light">Same day</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-800/30">
                <p className="text-xs text-neutral-500 text-center font-light">
                  Same question. Instant solution. Happy customer.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}