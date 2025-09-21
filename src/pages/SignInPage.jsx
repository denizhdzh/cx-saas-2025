import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function SignInPage() {
  const { user } = useAuth();

  // Redirect if already signed in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In - Candela AI</title>
        <meta name="description" content="Sign in to Candela AI customer support platform" />
      </Helmet>
      <div className="min-h-screen bg-white">
        {/* Grid Layout */}
        <div className="min-h-screen grid grid-cols-12">
          {/* Left Content - 8 columns */}
          <div className="col-span-8 p-24 flex items-center">
            <div className="max-w-xl">
              {/* Minimal Brand */}
              <div className="mb-16">
                <div className="text-xs text-neutral-400 mb-8">
                  Candela
                </div>
                <h1 className="text-7xl font-thin text-neutral-900 leading-[0.9] mb-12">
                  AI that<br />
                  speaks<br />
                  human
                </h1>
                <div className="w-16 h-px bg-neutral-900 mb-8"></div>
                <p className="text-xl text-neutral-600 leading-relaxed font-light">
                  Intelligent customer support that understands context, learns from interactions, and scales with your business.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mb-16">
                <div>
                  <div className="text-2xl font-light text-neutral-900 mb-1">94%</div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">Resolution Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-neutral-900 mb-1">1.2s</div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">Response Time</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-neutral-900 mb-1">24/7</div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">Availability</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center space-x-8 text-xs text-neutral-400">
                <span>Privacy</span>
                <span>Terms</span>
                <span>Support</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar - 4 columns */}
          <div className="col-span-4 bg-neutral-50 border-l border-neutral-200">
            <div className="p-16 h-full flex items-center">
              <div className="w-full">
                {/* Auth Section */}
                <div className="mb-16">
                  <div className="text-xs text-neutral-400 mb-8">
                    Sign in
                  </div>
                  <h2 className="text-2xl font-thin text-neutral-900 mb-8">
                    Continue to<br />
                    workspace
                  </h2>
                  
                  <button 
                    onClick={handleGoogleSignIn}
                    className="w-full px-6 py-3 text-sm font-medium transition-colors rounded-xl text-white flex items-center justify-center gap-3 hover:opacity-90 cursor-pointer"
                    style={{
                      borderWidth: '0.5px',
                      borderStyle: 'solid',
                      borderColor: 'rgb(20, 20, 20)',
                      backgroundColor: 'rgba(0, 0, 0, 0)',
                      boxShadow: 'rgba(255, 255, 255, 0.15) 0px 2px 0px 0px inset',
                      background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(40, 40, 40, 0.9) 100%)'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC04"/>
                      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                    </svg>
                    Sign in with Google
                  </button>
                </div>

                {/* Legal */}
                <div className="text-xs text-neutral-400 leading-relaxed">
                  Secure authentication powered by Google. Your data remains private and protected.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}