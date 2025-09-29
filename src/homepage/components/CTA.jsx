import React, { useState } from 'react';
import { addToWaitlist } from '../../utils/firebaseFunctions';

export default function CTA() {
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
      {/* Section separator line */}
      <div className="w-full h-px bg-neutral-200 mb-24"></div>
      
      <div className="max-w-6xl mx-auto px-2 py-24 relative">
        {/* Vertical lines */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        <div className="absolute right-6 top-0 bottom-0 w-px bg-neutral-200"></div>
        
        <div className="mx-6">
          <div className="text-center">
            <div className="text-xs text-orange-600 font-bold mb-6 tracking-wider">
              COMING SOON
            </div>
            <h2 className="text-3xl lg:text-4xl font-thin text-neutral-900 mb-6 leading-tight max-w-3xl mx-auto">
              Be among the first to experience<br />
              <span className="text-neutral-500">conversations</span> that matter
            </h2>
            <p className="text-neutral-600 text-base mb-12 leading-relaxed max-w-2xl mx-auto">
              Join our waitlist and get early access to AI agents that understand 
              your business context and speak like real humans.
            </p>
            
            <div className="max-w-md mx-auto mb-12">
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                Join the Waitlist
              </h3>
              
              <div className="space-y-4">
                {isSubmitted ? (
                  <div className="text-center">
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
                        className="px-6 py-3 text-sm font-medium transition-colors rounded-xl text-white hover:opacity-90 whitespace-nowrap cursor-pointer"
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
                    <p className="text-xs text-neutral-500 text-center">
                      Be the first to know when we launch. No spam, unsubscribe anytime.
                    </p>
                  </form>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-neutral-900 rounded-full mb-3"></div>
                <span className="text-sm text-neutral-600">Priority access when we launch</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-neutral-900 rounded-full mb-3"></div>
                <span className="text-sm text-neutral-600">Exclusive updates on development</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-neutral-900 rounded-full mb-3"></div>
                <span className="text-sm text-neutral-600">Special launch pricing</span>
              </div>
            </div>
          </div>
          

        </div>
      </div>
    </section>
  );
}