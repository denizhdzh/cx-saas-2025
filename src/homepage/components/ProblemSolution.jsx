import React from 'react';

export default function ProblemSolution() {
  return (
    <section id="before-after" className="relative py-16 lg:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="text-sm text-orange-500 font-semibold mb-2">Before & After</div>
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
            Before and after ORCHIS
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            See how AI transforms customer support from frustration to satisfaction
          </p>
        </div>

        {/* Single Unified Card */}
        <div className="bg-gradient-to-br from-white to-neutral-50/80 rounded-3xl border border-neutral-200/60 shadow-2xl shadow-neutral-900/5 overflow-hidden">

          {/* 2 Column Grid Inside Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Problem Side */}
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-neutral-200/50">
              <div className="text-xs font-semibold text-neutral-400 mb-6 uppercase tracking-wider">The Reality</div>

              <h3 className="text-lg font-bold text-neutral-900 mb-6 leading-tight">
                Your support team is drowning in repetitive tickets
              </h3>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900 mb-1">Customer needs help with integration</div>
                      <div className="text-xs text-neutral-600">Creates support ticket, waits for response</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 pl-5">9:15 AM</div>
                </div>

                {/* Step 2 */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900 mb-1">Support agent researches answer</div>
                      <div className="text-xs text-neutral-600">Spends 20 minutes finding the same info again</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 pl-5">2:45 PM</div>
                </div>

                {/* Step 3 */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900 mb-1">Customer gets frustrated</div>
                      <div className="text-xs text-neutral-600">Considers switching to competitor's solution</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 pl-5">Next day</div>
                </div>
              </div>
            </div>

            {/* Solution Side */}
            <div className="p-8 lg:p-12">
              <div className="text-xs font-semibold text-neutral-400 mb-6 uppercase tracking-wider">The Solution</div>

              <h3 className="text-lg font-bold text-neutral-900 mb-6 leading-tight">
                AI agents that know your SaaS inside and out
              </h3>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900 mb-1">Customer asks about integration</div>
                      <div className="text-xs text-neutral-600">AI instantly provides step-by-step guide with links</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 pl-5">9:15 AM</div>
                </div>

                {/* Step 2 */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900 mb-1">Follow-up question</div>
                      <div className="text-xs text-neutral-600">AI provides API documentation and code samples</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 pl-5">9:16 AM</div>
                </div>

                {/* Step 3 */}
                <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-5">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5"></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900 mb-1">Customer successfully integrates</div>
                      <div className="text-xs text-neutral-600">Upgrades to higher plan, refers new customers</div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400 pl-5">Same day</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-neutral-200/60">
                <p className="text-xs text-neutral-500 text-center">
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