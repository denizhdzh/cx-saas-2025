import React from 'react';
import LiveActivitiesDemo from './LiveActivitiesDemo';

export default function BentoFeatures() {
  return (
    <section id="how-it-works" className="relative py-16 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-2 relative">
        {/* Vertical lines - hidden on mobile */}
        <div className="hidden lg:block absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="hidden lg:block absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-4 sm:mx-6">
          <div className="text-center mb-16 lg:mb-24">
            <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">HOW IT WORKS</div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-thin text-neutral-900 mb-6 lg:mb-8 leading-tight">
              Three simple steps to<br />
              intelligent customer support
            </h2>
            <p className="text-base lg:text-lg text-neutral-600 font-light max-w-2xl mx-auto">
              No complex setup. No lengthy training. Just upload, customize, and go live.
            </p>
          </div>
          
          {/* Three steps */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-thin text-neutral-900 mb-4">Upload your content</h3>
              <p className="text-neutral-600 font-light mb-8">
                Drag and drop your docs. Our AI understands everything instantly.
              </p>
              
              <div className="bg-neutral-900 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white text-sm">support-guide.pdf</span>
                    <span className="text-neutral-400 text-xs ml-auto">2.4 MB</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-800/30 rounded-xl">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-neutral-300 text-sm">product-manual.docx</span>
                    <span className="text-neutral-500 text-xs ml-auto">1.8 MB</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-neutral-800/20 rounded-xl">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-neutral-400 text-sm">faqs.txt</span>
                    <span className="text-neutral-600 text-xs ml-auto">124 KB</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2 mt-4 border-t border-neutral-700">
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-xs">3 files processed</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-thin text-neutral-900 mb-4">Set live activities</h3>
              <p className="text-neutral-600 font-light mb-8">
                Configure notifications and real-time updates for your users.
              </p>
              
              <LiveActivitiesDemo />
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-thin text-neutral-900 mb-4">Add to website</h3>
              <p className="text-neutral-600 font-light mb-8">
                Copy one line of code. Your AI goes live instantly.
              </p>
              
              <div className="space-y-4">
                <div className="bg-neutral-900 rounded-xl p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-neutral-400 ml-2">index.html</span>
                  </div>
                  <div className="text-green-400 font-mono text-xs leading-relaxed">
                    &lt;script src="orchis.ai/widget.js"<br />
                    &nbsp;&nbsp;data-key="your-key"&gt;<br />
                    &lt;/script&gt;
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Live in 60 seconds</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom message */}
          <div className="text-center mt-16 lg:mt-24">
            <div className="text-sm text-neutral-500">
              Total setup time: Under 60 seconds
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}