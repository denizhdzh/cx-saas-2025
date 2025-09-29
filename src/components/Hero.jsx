import React, { useState } from 'react';
import ToastDemo from './ToastDemo';
import { addToWaitlist } from '../utils/firebaseFunctions';

export default function Hero() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await addToWaitlist(email);
      setIsSubmitted(true);
      console.log('Email submitted to Firestore:', email);
    } catch (error) {
      setError('Failed to join waitlist. Please try again.');
      console.error('Error submitting email:', error);
    }
  };

  return (
    <section className="relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-2 pt-20 sm:pt-24 lg:pt-32 pb-12 lg:pb-16 relative">
        {/* Vertical lines - hidden on mobile */}
        <div className="hidden lg:block absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="hidden lg:block absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-4 sm:mx-6">
          <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-end lg:min-h-[70vh]">
            {/* Left side - Content */}
            <div className="text-center lg:text-left pl-6">
              <div className="text-sm font-bold text-orange-600 mb-6 lg:mb-8 tracking-wider">
                ORCHIS
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-thin text-neutral-900 leading-tight lg:leading-[0.95] mb-6 lg:mb-8">
                Your customers deserve<br />
                <span className="text-neutral-500">conversations</span><br />
                not confusion
              </h1>
              
              <div className="w-12 lg:w-16 h-px bg-neutral-900 mb-6 lg:mb-8 mx-auto lg:mx-0"></div>
              
              <p className="text-lg lg:text-xl text-neutral-600 font-light mb-8 lg:mb-12 leading-relaxed max-w-lg mx-auto lg:mx-0">
                AI agents that actually understand context, learn from your business, 
                and speak like humans do.
              </p>
              
              {/* Waitlist signup */}
              <div className="max-w-md mx-auto lg:mx-0">
                {isSubmitted ? (
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                      <span className="text-sm text-green-700 font-medium">✓ Thanks! We'll be in touch soon.</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email for early access"
                          className={`w-full px-4 py-3 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors ${
                            error ? 'border-red-500 bg-red-50' : 'border-neutral-200'
                          }`}
                        />
                      </div>
                      <button 
                        type="submit"
                        className="px-6 py-3 text-sm font-medium transition-colors rounded-xl text-white hover:opacity-90 whitespace-nowrap"
                        style={{
                          borderWidth: '0.5px',
                          borderStyle: 'solid',
                          borderColor: 'rgb(20, 20, 20)',
                          backgroundColor: 'rgba(0, 0, 0, 0)',
                          boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                          background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                        }}
                      >
                        Join Waitlist
                      </button>
                    </div>
                    {error && (
                      <p className="text-xs text-red-600 mt-2 px-1">{error}</p>
                    )}
                    <p className="text-xs text-neutral-500 text-center sm:text-left">
                      Be the first to know when we launch. No spam, unsubscribe anytime.
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* Right side - Desktop only, bottom aligned */}
            <div className="hidden lg:flex lg:items-end lg:justify-center">
              <div className="w-full max-w-sm">
                <ToastDemo />
              </div>
            </div>
          </div>
          
          {/* Mobile ToastDemo - Below content */}
          <div className="lg:hidden mt-12 flex justify-center">
            <div className="w-full max-w-sm">
              <ToastDemo />
            </div>
          </div>
          
          {/* Stats - Below both sides */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 text-center mt-16 lg:mt-24 pt-12 lg:pt-16 border-t border-neutral-200">
            <div>
              <div className="text-2xl lg:text-3xl font-light text-neutral-900 mb-2">94%</div>
              <div className="text-sm text-neutral-500">Resolution Rate</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-neutral-900 mb-2">60s</div>
              <div className="text-sm text-neutral-500">Setup Time</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-light text-neutral-900 mb-2">24/7</div>
              <div className="text-sm text-neutral-500">Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}