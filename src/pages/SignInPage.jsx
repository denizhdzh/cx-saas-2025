import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { signInWithGoogle } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// DynamicContentPreview Component (from Features.jsx)
function DynamicContentPreview() {
  const contentVariants = [
    {
      type: 'discount',
      title: 'Special Offer',
      message: 'Get 20% off with code',
      code: 'SAVE20'
    },
    {
      type: 'video',
      title: 'Watch Our Demo',
      message: 'See how it works in 2 minutes'
    },
    {
      type: 'link',
      title: 'New Feature Alert',
      message: 'Check out our latest update',
      link: 'orchis.app/features'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % contentVariants.length);
        setIsTransitioning(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentContent = contentVariants[currentIndex];

  return (
    <div className="w-full">
      <div className="text-xs font-bold text-white mb-3 text-center">Live Preview</div>

      {/* Mini Widget */}
      <div className="relative mx-auto bg-gradient-to-br from-stone-900/60 to-stone-800/40 backdrop-blur-md border border-stone-700/50 rounded-2xl p-3 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-stone-700/50 flex items-center justify-center overflow-hidden">
            <img src="/logo.webp" alt="Orchis" className="w-6 h-6 object-cover rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">
              ORCHIS AI
            </div>
            <div className="text-xs text-stone-400">Online</div>
          </div>
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        </div>

        {/* Dynamic Popup Preview */}
        <div className={`mb-2 px-2 py-2 transition-all duration-700 ease-in-out ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-6 bg-white rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold mb-0.5 transition-all duration-700">
                {currentContent.title}
              </div>
              <div className="text-white/75 text-xs transition-all duration-700">
                {currentContent.type === 'discount' ? (
                  <>
                    {currentContent.message}{' '}
                    <strong className="text-white font-bold font-mono">{currentContent.code}</strong>
                  </>
                ) : currentContent.type === 'video' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-12 h-9 rounded flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: "url('/livepreview6.webp')" }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold mb-0.5">Watch Now</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">
                    <div className="mb-1 text-xs">{currentContent.message}</div>
                    <div className="flex items-center gap-1 text-blue-400 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                      </svg>
                      <span className="truncate text-xs">orchis.app</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button className="text-white/50 hover:text-white/80 text-sm leading-none flex-shrink-0">
              ×
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white/5 rounded-xl p-1.5 flex items-center gap-2">
          <input
            type="text"
            disabled
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-xs text-stone-300 placeholder:text-stone-500 border-none outline-none"
          />
          <div className="px-2 py-1 bg-white/90 text-black rounded-full text-xs font-semibold">
            send
          </div>
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-stone-400">
          <img src="https://orchis.app/logo.webp" alt="Orchis" className="w-2.5 h-2.5 rounded" />
          <span className="text-xs">Powered by <span className="font-bold">ORCHIS</span></span>
        </div>
      </div>
    </div>
  );
}

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

      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-4 sm:p-6">
        {/* Main Container */}
        <div className="max-w-6xl w-full mx-auto bg-neutral-500/3 dark:bg-neutral-500/3 rounded-2xl sm:rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* Left Column - Image + Preview */}
            <div
              className="relative bg-cover bg-center bg-no-repeat p-6 lg:p-10 min-h-[400px] lg:min-h-[700px] flex items-center justify-center"
              style={{backgroundImage: "url('/livepreview5.webp')"}}
            >
              <div className="absolute inset-0 bg-stone-900/20"></div>
              <div className="relative z-10 w-full max-w-md">
                <DynamicContentPreview />
              </div>
            </div>

            {/* Right Column - Sign In Form */}
            <div className="p-6 lg:p-10 flex flex-col justify-center min-h-[400px] lg:min-h-[700px] bg-white dark:bg-stone-800/50">
              <div className="w-full max-w-md mx-auto">

                {/* Brand */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-6">
                    <img src="/logo.webp" alt="Orchis Logo" className="w-5 h-5" />
                    <span className="text-xs text-stone-400 dark:text-stone-500 font-bold">
                      ORCHIS
                    </span>
                  </div>

                  <h1 className="text-3xl lg:text-4xl font-thin text-stone-900 dark:text-stone-50 mb-3">
                    Continue to<br />
                    workspace
                  </h1>

                  <p className="text-sm text-stone-600 dark:text-stone-400">
                    Sign in to access your AI customer support platform
                  </p>
                </div>

                {/* Sign In Button */}
                <button
                  onClick={handleGoogleSignIn}
                  className="btn-primary w-full flex items-center justify-center gap-3 mb-6"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC04"/>
                    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>

                {/* Footer Text */}
                <div className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
                  Secure authentication powered by Google. By signing in, you agree to our{' '}
                  <a
                    href="https://orchis.app/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 underline transition-colors"
                  >
                    Privacy Policy
                  </a>
                  {' '}and{' '}
                  <a
                    href="https://orchis.app/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 underline transition-colors"
                  >
                    Terms of Service
                  </a>.
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
