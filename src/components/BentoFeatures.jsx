import React from 'react';

export default function BentoFeatures() {
  return (
    <section className="relative py-24">
      <div className="max-w-5xl mx-auto px-2 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          <div className="text-center mb-24">
            <div className="text-xs text-neutral-400 mb-6 tracking-wider">HOW IT WORKS</div>
            <h2 className="text-4xl font-thin text-neutral-900 mb-8 leading-tight">
              Three simple steps to<br />
              intelligent customer support
            </h2>
            <p className="text-lg text-neutral-600 font-light max-w-2xl mx-auto">
              No complex setup. No lengthy training. Just upload, customize, and go live.
            </p>
          </div>
          
          {/* Process flow */}
          <div className="space-y-16">
            {/* Step 1 */}
            <div className="flex items-center gap-12">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <h3 className="text-2xl font-thin text-neutral-900">Upload your content</h3>
                </div>
                <div className="pl-14">
                  <p className="text-neutral-600 mb-6 font-light">
                    Drag and drop your documentation, FAQs, product guides, or policies. 
                    Our AI reads everything and understands your business in seconds.
                  </p>
                  <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-neutral-600">customer-support-guide.pdf</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-neutral-600">shipping-policy.txt</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm text-neutral-600">product-documentation.md</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center justify-center">
              <div className="w-px h-12 bg-neutral-200"></div>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-12">
              <div className="flex-1 flex justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <h3 className="text-2xl font-thin text-neutral-900">Customize the design</h3>
                </div>
                <div className="pl-14">
                  <p className="text-neutral-600 mb-6 font-light">
                    Make it yours with brand colors, custom messaging, and positioning. 
                    Or keep it minimal with our beautiful default design.
                  </p>
                  <div className="bg-white rounded-xl p-6 border border-neutral-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-neutral-500 mb-2">Brand Color</div>
                        <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 mb-2">Position</div>
                        <div className="text-sm text-neutral-700">Bottom Right</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center justify-center">
              <div className="w-px h-12 bg-neutral-200"></div>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-12">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <h3 className="text-2xl font-thin text-neutral-900">Add to your website</h3>
                </div>
                <div className="pl-14">
                  <p className="text-neutral-600 mb-6 font-light">
                    Copy one line of code and paste it anywhere on your site. 
                    Your AI agent goes live instantly and starts helping customers.
                  </p>
                  <div className="bg-neutral-900 rounded-xl p-6 text-green-400 font-mono text-sm">
                    {"<script src=\"candela.ai/widget.js\" data-key=\"your-key\"></script>"}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom message */}
          <div className="text-center mt-24">
            <div className="text-sm text-neutral-500">
              Total setup time: Under 60 seconds
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}