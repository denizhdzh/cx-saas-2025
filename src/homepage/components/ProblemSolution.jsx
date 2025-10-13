import React from 'react';

export default function ProblemSolution() {
  return (
    <section className="relative py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-2 relative">

        <div className="mx-4 sm:mx-6">
          {/* Story progression */}
          <div className="space-y-20 lg:space-y-32">
            {/* Problem narrative */}
            <div className="text-center">
              <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">THE REALITY</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-neutral-900 mb-8 lg:mb-12 leading-tight">
                Your support team is drowning<br />
                in repetitive tickets
              </h2>
              
              {/* Timeline of frustration */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 lg:p-12 max-w-4xl mx-auto">
                <div className="space-y-6 lg:space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-sm font-medium">1</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 font-medium">Customer needs help with integration</div>
                      <div className="text-sm text-neutral-600">Creates support ticket, waits for response</div>
                    </div>
                    <div className="text-xs text-neutral-400 flex-shrink-0">9:15 AM</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 text-sm font-medium">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 font-medium">Support agent researches answer</div>
                      <div className="text-sm text-neutral-600">Spends 20 minutes finding the same info again</div>
                    </div>
                    <div className="text-xs text-neutral-400 flex-shrink-0">2:45 PM</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-sm font-medium">3</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 font-medium">Customer gets frustrated</div>
                      <div className="text-sm text-neutral-600">Considers switching to competitor's solution</div>
                    </div>
                    <div className="text-xs text-neutral-400 flex-shrink-0">Next day</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution narrative */}
            <div className="text-center">
              <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">THE SOLUTION</div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-neutral-900 mb-8 lg:mb-12 leading-tight">
                AI agents that know your<br />
                SaaS inside and out
              </h2>
              
              {/* Success timeline */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 lg:p-12 max-w-4xl mx-auto">
                <div className="space-y-6 lg:space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm font-medium">1</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 font-medium">Customer asks about integration</div>
                      <div className="text-sm text-neutral-600">AI instantly provides step-by-step guide with links</div>
                    </div>
                    <div className="text-xs text-neutral-400 flex-shrink-0">9:15 AM</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm font-medium">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 font-medium">Follow-up question</div>
                      <div className="text-sm text-neutral-600">AI provides API documentation and code samples</div>
                    </div>
                    <div className="text-xs text-neutral-400 flex-shrink-0">9:16 AM</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm font-medium">3</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-900 font-medium">Customer successfully integrates</div>
                      <div className="text-sm text-neutral-600">Upgrades to higher plan, refers new customers</div>
                    </div>
                    <div className="text-xs text-neutral-400 flex-shrink-0">Same day</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 lg:mt-8 text-sm text-neutral-500">
                Same question. Instant solution. Happy customer.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}