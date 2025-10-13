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
      // AuthContext will automatically create user document if needed
    } catch (error) {
      console.error('❌ Sign in failed:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In - Orchis</title>
        <meta name="description" content="Sign in to Orchis AI customer support platform" />
      </Helmet>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
        {/* Grid Layout */}
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12">
          {/* Left Content - 8 columns */}
          <div className="col-span-1 lg:col-span-8 p-4 lg:p-24 flex items-center">
            <div className="max-w-xl w-full">
              {/* Minimal Brand */}
              <div className="mb-8 lg:mb-16">
                <div className="flex items-center gap-2 mb-6 lg:mb-8">
                  <img src="/logo.webp" alt="Orchis Logo" className="w-5 h-5" />
                  <span className="text-xs text-stone-400 dark:text-stone-500 font-bold">
                    ORCHIS
                  </span>
                </div>
                <h1 className="text-4xl lg:text-7xl font-thin text-stone-900 dark:text-stone-50 leading-[0.9] mb-6 lg:mb-12 hidden lg:block">
                  AI that<br />
                  speaks<br />
                  human
                </h1>
                <div className="w-16 h-px bg-stone-900 dark:bg-stone-50 mb-6 lg:mb-8 hidden lg:block"></div>
                <p className="text-base lg:text-xl text-stone-600 dark:text-stone-400 leading-relaxed font-light hidden lg:block">
                  Intelligent customer support that understands context, learns from interactions, and scales with your business.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 lg:gap-8 mb-8 lg:mb-16">
                <div>
                  <div className="text-xl lg:text-2xl font-light text-stone-900 dark:text-stone-50 mb-1">Up to 70%</div>
                  <div className="text-[10px] lg:text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Resolution</div>
                </div>
                <div>
                  <div className="text-xl lg:text-2xl font-light text-stone-900 dark:text-stone-50 mb-1">0.8s</div>
                  <div className="text-[10px] lg:text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Response</div>
                </div>
                <div>
                  <div className="text-xl lg:text-2xl font-light text-stone-900 dark:text-stone-50 mb-1">24/7</div>
                  <div className="text-[10px] lg:text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Available</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center space-x-8 text-xs text-stone-400 dark:text-stone-500 hidden lg:flex">
                <span>Privacy</span>
                <span>Terms</span>
                <span>Support</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar - 4 columns */}
          <div className="col-span-1 lg:col-span-4 bg-white dark:bg-stone-800/50 border-l border-stone-200 dark:border-stone-800">
            <div className="p-12 lg:p-16 h-full flex items-center">
              <div className="w-full">
                {/* Auth Section */}
                <div className="mb-16">
                  <div className="text-xs text-stone-400 dark:text-stone-500 mb-8">
                    Sign in
                  </div>
                  <h2 className="text-2xl font-thin text-stone-900 dark:text-stone-50 mb-8">
                    Continue to<br />
                    workspace
                  </h2>

                  <button
                    onClick={handleGoogleSignIn}
                    className="btn-primary w-full flex items-center justify-center gap-3"
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
                <div className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
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
