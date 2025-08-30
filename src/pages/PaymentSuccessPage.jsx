import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Star, ArrowRight, Crown } from 'phosphor-react';
import { Helmet } from 'react-helmet-async';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const toolId = searchParams.get('tool_id');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Optional: Verify payment with your backend
    const verifyPayment = async () => {
      try {
        // Here you could call a Firebase function to verify the payment
        console.log('Payment successful:', { sessionId, toolId });
        
        // Simulate verification delay
        setTimeout(() => {
          setIsVerifying(false);
        }, 2000);
      } catch (error) {
        console.error('Error verifying payment:', error);
        setIsVerifying(false);
      }
    };

    if (sessionId) {
      verifyPayment();
    } else {
      setIsVerifying(false);
    }
  }, [sessionId, toolId]);

  if (isVerifying) {
    return (
      <>
        <Helmet>
          <title>Processing Payment | tool/</title>
        </Helmet>
        
        <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-lime-500/20 border border-lime-500/40 rounded-full mb-6">
              <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <h1 className="text-2xl font-bold text-stone-100 mb-2">
              Processing Payment
            </h1>
            
            <p className="text-stone-400">
              Please wait while we confirm your payment...
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Payment Successful | tool/</title>
        <meta name="description" content="Your payment was successful! Your tool is now featured." />
      </Helmet>
      
      <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-lime-500/20 border border-lime-500/40 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-lime-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-stone-100 mb-2">
              Payment Successful!
            </h1>
            
            <p className="text-stone-400 mb-8">
              Your tool is now featured and will appear at the top of search results.
            </p>

            <div className="bg-gradient-to-r from-lime-500/10 to-lime-600/10 border border-lime-500/30 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-yellow-400" />
                <Star className="w-6 h-6 text-lime-400" />
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-lime-300 mb-2">
                Your Tool is Now Featured!
              </h3>
              
              <div className="text-sm text-stone-300 space-y-1">
                <p>✨ Premium placement in search results</p>
                <p>🏆 Featured badge for enhanced visibility</p>
                <p>📈 Higher ranking position</p>
                <p>📅 Valid for 365 days from today</p>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                to="/"
                className="w-full flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-600 text-stone-900 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                View Featured Tool
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/browse"
                className="w-full flex items-center justify-center gap-2 bg-stone-700 hover:bg-stone-600 text-stone-200 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Browse All Tools
              </Link>
            </div>

            <div className="mt-8 p-4 bg-stone-800/50 border border-stone-700 rounded-lg">
              <h3 className="text-sm font-medium text-stone-300 mb-2">
                What happens next?
              </h3>
              <div className="text-xs text-stone-500 space-y-1">
                <p>• Your tool will appear with a featured badge</p>
                <p>• It will rank higher in search results</p>
                <p>• Users will see it before non-featured tools</p>
                <p>• Your featured status lasts for 1 full year</p>
              </div>
            </div>

            {sessionId && (
              <div className="mt-6 p-3 bg-stone-900/50 border border-stone-800 rounded-lg">
                <p className="text-xs text-stone-600">
                  Transaction ID: {sessionId.slice(-8).toUpperCase()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 