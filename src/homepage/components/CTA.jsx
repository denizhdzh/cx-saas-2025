import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="relative">
      {/* Section separator line */}
      <div className="w-full h-px bg-neutral-200 mb-24"></div>
      
      <div className="max-w-6xl mx-auto px-2 py-24 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          <div className="text-center">
            <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">
              GET STARTED
            </div>
            <h2 className="text-3xl lg:text-4xl font-thin text-neutral-900 mb-6 leading-tight max-w-3xl mx-auto">
              Ready to transform<br />
              your customer <span className="text-neutral-500">support</span>?
            </h2>
            <p className="text-neutral-600 text-base mb-12 leading-relaxed max-w-2xl mx-auto">
              Start with 100 free messages. No credit card required.
              Set up your AI agent in under 60 seconds.
            </p>

            <div className="max-w-md mx-auto mb-12">
              <button
                onClick={() => navigate('/signin')}
                className="px-8 py-4 text-base font-medium transition-colors rounded-xl text-white hover:opacity-90 cursor-pointer"
                style={{
                  borderWidth: '0.5px',
                  borderStyle: 'solid',
                  borderColor: 'rgb(20, 20, 20)',
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                  background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                }}
              >
                Get Started Free →
              </button>
              <p className="text-xs text-neutral-500 text-center mt-3">
                No spam, no tricks. Just smart AI that works.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-neutral-900 rounded-full mb-3"></div>
                <span className="text-sm text-neutral-600">100 free messages to start</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-neutral-900 rounded-full mb-3"></div>
                <span className="text-sm text-neutral-600">Setup in under 60 seconds</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-neutral-900 rounded-full mb-3"></div>
                <span className="text-sm text-neutral-600">No credit card required</span>
              </div>
            </div>
          </div>
          

        </div>
      </div>
    </section>
  );
}