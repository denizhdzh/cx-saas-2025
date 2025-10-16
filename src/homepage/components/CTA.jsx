import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section className="relative">
      {/* Section separator line */}
      <div className="w-full h-px bg-transparent mb-24"></div>

      <div className="max-w-6xl mx-auto px-2 py-24 relative">

        <div className="mx-6">
          <div className="text-center">
            <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">
              START AUTOMATING TODAY
            </div>
            <h2 className="text-3xl lg:text-4xl font-thin text-neutral-900 mb-6 leading-tight max-w-3xl mx-auto">
              Start converting visitors<br />
              into <span className="text-neutral-500">happy customers</span>
            </h2>
            <p className="text-neutral-600 text-base mb-8 leading-relaxed max-w-2xl mx-auto">
              Join companies using AI that actually learns from gaps, not just logs messages.
            </p>

            {/* Stats highlight */}
            <div className="mb-12">
              <div className="text-2xl font-thin text-neutral-900 mb-2">
                Average response time: <span className="text-orange-600">0.8 seconds</span>
              </div>
              <div className="text-sm text-neutral-500">
                While your competitors make customers wait hours
              </div>
            </div>

            <div className="max-w-md mx-auto mb-12">
              <button
                onClick={() => navigate('/signin')}
                className="btn-landing"
              >
                Get Started Free →
              </button>
              <p className="text-xs text-neutral-500 text-center mt-3">
                No spam, no tricks. Just smart AI that works.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="text-lg font-medium text-neutral-900 mb-1">✓</div>
                <span className="text-sm text-neutral-600">No credit card</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-lg font-medium text-neutral-900 mb-1">✓</div>
                <span className="text-sm text-neutral-600">60s setup</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-lg font-medium text-neutral-900 mb-1">✓</div>
                <span className="text-sm text-neutral-600">Cancel anytime</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-lg font-medium text-neutral-900 mb-1">✓</div>
                <span className="text-sm text-neutral-600">100 free messages</span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}