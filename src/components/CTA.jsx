import React from 'react';

export default function CTA() {
  return (
    <section className="relative">
      {/* Section separator line */}
      <div className="w-full h-px bg-neutral-200 mb-24"></div>
      
      <div className="max-w-6xl mx-auto px-2 py-24 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          <div className="grid lg:grid-cols-3 gap-8 items-end">
            {/* Left - Urgency */}
            <div>
              <div className="text-sm font-medium text-red-600 mb-4">
                LIMITED TIME OFFER
              </div>
              <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
                Setup fee waived for first 100 customers
              </h3>
              <p className="text-neutral-600 text-sm">
                Save $499 setup fee. Offer expires soon.
              </p>
            </div>
            
            {/* Center - Main CTA */}
            <div className="lg:text-center">
              <h2 className="text-4xl font-semibold text-neutral-900 mb-6">
                Start in 60 Seconds
              </h2>
              
              <div className="space-y-4">
                <button 
                  className="w-full px-8 py-4 text-sm font-medium transition-colors rounded-xl text-white"
                  style={{
                    borderWidth: '0.5px',
                    borderStyle: 'solid',
                    borderColor: 'rgb(20, 20, 20)',
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                    background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                  }}
                >
                  Start Free Trial →
                </button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-neutral-600">
                  <span>✓ No credit card</span>
                  <span>•</span>
                  <span>✓ 14-day trial</span>
                  <span>•</span>
                  <span>✓ Cancel anytime</span>
                </div>
              </div>
            </div>
            
            {/* Right - Social Proof */}
            <div className="lg:text-right">
              <div className="text-sm font-medium text-green-600 mb-4">
                TRUSTED BY 2,500+ BUSINESSES
              </div>
              <div className="space-y-2 text-sm text-neutral-600">
                <div>• Shopify stores</div>
                <div>• SaaS companies</div>
                <div>• Financial services</div>
                <div>• Healthcare providers</div>
              </div>
              
              {/* IMAGE PLACEHOLDER */}
              <div className="mt-6 p-6 border-2 border-dashed border-neutral-300 rounded-lg">
                <p className="text-neutral-500 font-mono text-xs text-center">
                  [IMAGE: Customer logos grid]
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-600 mb-4">
              Still have questions? We're here to help.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <button className="text-neutral-900 hover:underline">
                Schedule Demo
              </button>
              <button className="text-neutral-900 hover:underline">
                Contact Sales
              </button>
              <button className="text-neutral-900 hover:underline">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}