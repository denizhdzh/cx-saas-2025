import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, X, CreditCard, MagnifyingGlass } from 'phosphor-react';
import { db, functions } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function FeaturedModal({ isOpen, onClose }) {
  const [featuredPrice, setFeaturedPrice] = useState(19);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tools, setTools] = useState([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);

  const fetchTools = async () => {
    setIsLoadingTools(true);
    try {
      const toolsQuery = query(
        collection(db, 'tools'),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      const snapshot = await getDocs(toolsQuery);
      const toolsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Show only non-featured tools
      setTools(toolsList.filter(tool => !tool.isFeatured));
    } catch (error) {
      console.error("Error fetching tools: ", error);
    } finally {
      setIsLoadingTools(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTools();
    }
  }, [isOpen]);

  const handleFeaturedPayment = async () => {
    if (!selectedTool) {
      alert('Please select a tool to feature');
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      console.log('Calling createCheckoutSession with:', {
        toolId: selectedTool.id,
        amount: featuredPrice,
      });
      
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckoutSession({
        toolId: selectedTool.id,
        amount: featuredPrice,
      });

      console.log('Firebase function result:', result);
      console.log('Data from result:', result.data);
      console.log('SessionId from data:', result.data?.sessionId);

      if (!result.data?.sessionId) {
        throw new Error('No session ID received from Firebase function');
      }

      const stripe = await stripePromise;
      console.log('Stripe instance:', stripe);
      console.log('About to redirect with sessionId:', result.data.sessionId);
      
      const { error } = await stripe.redirectToCheckout({ sessionId: result.data.sessionId });

      if (error) {
        console.error("Stripe checkout error:", error);
        alert(`Payment error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error calling Firebase function or redirecting to Stripe:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      alert(`Error: ${error.message || 'Could not initiate payment.'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getPriorityLevel = (price) => {
    if (price >= 1000) return "Premium Tier";
    if (price >= 500) return "High Tier";
    if (price >= 100) return "Medium Tier";
    return "Standard Tier";
  };

  const getRankingPosition = (price) => {
    return `Ranked by payment amount (Higher = Better)`;
  };

  const filteredTools = tools.filter(tool => 
    tool.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        .slider-custom::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: rgb(132, 204, 22);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider-custom::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: rgb(132, 204, 22);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider-custom:focus {
          outline: none;
        }
        
        .slider-custom:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 2px rgba(132, 204, 22, 0.5);
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Safari and Chrome */
        }
      `}</style>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-stone-800 rounded-xl max-w-2xl w-full p-6 relative border border-stone-700 max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-lime-400 hover:text-lime-300"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-lime-500/20 border border-lime-500/40 rounded-full mb-4">
              <Star className="w-6 h-6 text-lime-400" />
            </div>
            <h3 className="text-xl font-bold text-stone-100 mb-2">Feature Your Tool</h3>
            <p className="text-stone-400 text-sm">Select a tool and boost its ranking for 1 full year</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Tool Selection */}
            <div>
              <h4 className="text-sm font-medium text-stone-300 mb-3">Select Tool to Feature</h4>
              
              {/* Search */}
              <div className="relative mb-4">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded-lg text-stone-200 text-sm focus:border-lime-500 focus:outline-none"
                  placeholder="Search your tools..."
                />
              </div>

              {/* Tools List */}
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                {isLoadingTools ? (
                  <div className="text-center py-8">
                    <div className="w-5 h-5 border border-stone-600 border-t-lime-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-stone-500 text-xs">Loading tools...</p>
                  </div>
                ) : filteredTools.length > 0 ? (
                  filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => setSelectedTool(tool)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedTool?.id === tool.id
                          ? 'border-lime-500 bg-lime-500/10'
                          : 'border-stone-700 hover:border-stone-600 bg-stone-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-stone-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {tool.logoUrl ? (
                            <img src={tool.logoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-2 h-2 bg-stone-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-stone-200 truncate">{tool.name}</h5>
                          <p className="text-xs text-stone-400 truncate">{tool.tagline}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    <p className="text-xs">No tools found</p>
                    <Link to="/submit-tool" className="text-xs text-lime-400 hover:text-lime-300 underline">
                      Submit a tool first →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Pricing & Details */}
            <div>
              <h4 className="text-sm font-medium text-stone-300 mb-3">Investment & Ranking</h4>
              
              {/* Investment Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-300 mb-3">
                  💰 Investment Amount (Higher = Better Ranking)
                </label>
                
                {/* Number Input */}
                <div className="mb-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                    <input
                      type="number"
                      min="19"
                      max="5000"
                      value={featuredPrice}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 19;
                        setFeaturedPrice(Math.max(19, value));
                      }}
                      className="w-full pl-8 pr-4 py-2.5 bg-stone-700 border border-stone-600 rounded-lg text-stone-200 text-sm focus:border-lime-500 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                
                {/* Slider */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="range"
                      min="19"
                      max="5000"
                      value={featuredPrice}
                      onChange={(e) => setFeaturedPrice(Math.max(19, parseInt(e.target.value)))}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer slider-custom"
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>$19</span>
                    <span>$5000+</span>
                  </div>
                </div>
              </div>

              {/* Ranking Preview */}
              <div className="bg-gradient-to-r from-lime-500/10 to-lime-600/10 border border-lime-500/30 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-lime-400 mb-1">${featuredPrice}</div>
                  <div className="text-sm font-medium text-lime-300 mb-2">{getRankingPosition(featuredPrice)}</div>
                  <div className="text-xs text-stone-300">{getPriorityLevel(featuredPrice)}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-lime-500/20">
                  <p className="text-xs text-center text-stone-400">
                    💡 Highest paying tools appear first. Your position = your investment vs others.
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-stone-900/50 rounded-lg p-4 mb-4">
                <h5 className="text-xs font-medium text-stone-300 mb-2">Featured Benefits:</h5>
                <div className="text-xs text-stone-500 space-y-1">
                  <p>🚀 Top placement in search results</p>
                  <p>⭐ Featured badge & enhanced visibility</p>
                  <p>📈 Higher investment = higher ranking</p>
                  <p>📅 Valid for 365 days from payment</p>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handleFeaturedPayment}
                disabled={isProcessingPayment || !selectedTool}
                className="w-full flex items-center justify-center gap-2 bg-lime-500 hover:bg-lime-600 text-stone-900 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-5 h-5" />
                {isProcessingPayment ? 'Processing Payment...' : `Feature for $${Math.max(19, featuredPrice)}`}
              </button>
              
              {!selectedTool && (
                <p className="text-xs text-stone-500 text-center mt-2">Select a tool above to continue</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 