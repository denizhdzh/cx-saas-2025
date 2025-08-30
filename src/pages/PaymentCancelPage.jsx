import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'phosphor-react';
import { Helmet } from 'react-helmet-async';

export default function PaymentCancelPage() {
  const [searchParams] = useSearchParams();
  const toolId = searchParams.get('tool_id');

  useEffect(() => {
    // Optional: Track cancel event for analytics
    console.log('Payment cancelled for tool:', toolId);
  }, [toolId]);

  return (
    <>
      <Helmet>
        <title>Payment Cancelled | tool/</title>
        <meta name="description" content="Your payment was cancelled. You can try again anytime." />
      </Helmet>
      
      <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-full mb-6">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-stone-100 mb-2">
              Payment Cancelled
            </h1>
            
            <p className="text-stone-400 mb-8">
              Your payment was cancelled. No charges were made to your account.
            </p>

            <div className="space-y-4">
              <Link
                to="/"
                className="w-full flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-600 text-stone-900 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </Link>

              <Link
                to="/?featured=true"
                className="w-full flex items-center justify-center gap-2 bg-stone-700 hover:bg-stone-600 text-stone-200 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Try Again
              </Link>
            </div>

            <div className="mt-8 p-4 bg-stone-800/50 border border-stone-700 rounded-lg">
              <h3 className="text-sm font-medium text-stone-300 mb-2">
                Still want to feature your tool?
              </h3>
              <p className="text-xs text-stone-500 mb-3">
                Featured tools get premium placement and higher visibility in search results.
              </p>
              <Link
                to="/"
                className="inline-flex items-center text-xs text-lime-400 hover:text-lime-300 underline"
              >
                Learn more about featuring →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 