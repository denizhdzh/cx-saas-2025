import React from 'react';

export default function ProblemSolution() {
  return (
    <section className="relative py-24">
      <div className="max-w-5xl mx-auto px-2 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          {/* Story progression */}
          <div className="space-y-32">
            {/* Problem narrative */}
            <div className="text-center">
              <div className="text-xs text-neutral-400 mb-6 tracking-wider">THE REALITY</div>
              <h2 className="text-4xl font-thin text-neutral-900 mb-12 leading-tight">
                Your customers are asking the same<br />
                questions over and over again
              </h2>
              
              {/* Timeline of frustration */}
              <div className="bg-neutral-50 rounded-2xl p-12 max-w-3xl mx-auto">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-sm font-medium">1</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900 font-medium">Customer visits your site</div>
                      <div className="text-sm text-neutral-600">Has a simple question about shipping</div>
                    </div>
                    <div className="text-xs text-neutral-400">3:24 PM</div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 text-sm font-medium">2</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900 font-medium">Searches your FAQ</div>
                      <div className="text-sm text-neutral-600">Finds nothing useful, gets frustrated</div>
                    </div>
                    <div className="text-xs text-neutral-400">3:27 PM</div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-sm font-medium">3</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900 font-medium">Abandons cart</div>
                      <div className="text-sm text-neutral-600">Buys from your competitor instead</div>
                    </div>
                    <div className="text-xs text-neutral-400">3:31 PM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution narrative */}
            <div className="text-center">
              <div className="text-xs text-neutral-400 mb-6 tracking-wider">THE SOLUTION</div>
              <h2 className="text-4xl font-thin text-neutral-900 mb-12 leading-tight">
                AI that answers like your<br />
                best customer service rep
              </h2>
              
              {/* Success timeline */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 max-w-3xl mx-auto">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm font-medium">1</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900 font-medium">Customer visits your site</div>
                      <div className="text-sm text-neutral-600">AI agent proactively offers help</div>
                    </div>
                    <div className="text-xs text-neutral-400">3:24 PM</div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm font-medium">2</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900 font-medium">Asks about shipping</div>
                      <div className="text-sm text-neutral-600">Gets instant, accurate answer with tracking link</div>
                    </div>
                    <div className="text-xs text-neutral-400">3:24 PM</div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-sm font-medium">3</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900 font-medium">Completes purchase</div>
                      <div className="text-sm text-neutral-600">Becomes a repeat customer</div>
                    </div>
                    <div className="text-xs text-neutral-400">3:26 PM</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-sm text-neutral-500">
                Same customer. Same question. Different outcome.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}