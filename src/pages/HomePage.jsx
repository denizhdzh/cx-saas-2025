import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { MagnifyingGlass, Star } from 'phosphor-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ToolItem from '../components/ToolItem';
import FeaturedModal from '../components/FeaturedModal';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const toolsQuery = query(
          collection(db, 'tools'),
          orderBy("createdAt", "desc"),
          limit(50) // Increased limit to get more tools for sorting
        );
        const snapshot = await getDocs(toolsQuery);
        const toolsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort tools: Featured first (by price descending), then regular tools by creation date
        const sortedTools = toolsList.sort((a, b) => {
          // Both featured - sort by price (higher price first)
          if (a.isFeatured && b.isFeatured) {
            return (b.featuredPrice || 0) - (a.featuredPrice || 0);
          }
          // One featured, one not - featured first
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          // Both not featured - sort by creation date (newest first)
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
        
        setTools(sortedTools);
      } catch (error) {
        console.error("Error fetching tools: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTools();
  }, []);

  // Check for featured query parameter and open modal
  useEffect(() => {
    if (searchParams.get('featured') === 'true') {
      setShowFeaturedModal(true);
      // Remove the query parameter from URL after opening modal
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (homeSearchQuery.trim()) {
      // Track search term from homepage
      trackSearchFromHome(homeSearchQuery.trim());
      navigate(`/search/${encodeURIComponent(homeSearchQuery.trim())}`);
    }
  };

  // Track search terms from homepage
  const trackSearchFromHome = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    try {
      const searchTermDoc = doc(db, 'searchTerms', searchTerm.toLowerCase());
      await setDoc(searchTermDoc, {
        term: searchTerm.toLowerCase(),
        searchCount: increment(1),
        lastSearched: serverTimestamp(),
        source: 'homepage',
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error tracking search term:', error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900">
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
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-3xl font-bold text-stone-100 mb-3">
            Discover tools for your next project
          </h1>
          <p className="text-stone-400 text-lg mb-8 max-w-2xl">
            A curated collection of software, AI tools, and platforms to help you build better products.
          </p>
          
          <div className="max-w-md">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input 
                  type="search" 
                  value={homeSearchQuery}
                  onChange={(e) => setHomeSearchQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="w-full pl-10 pr-4 py-3 bg-stone-800/50 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:border-stone-600 focus:outline-none text-sm"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Tools Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-6 h-6 border border-stone-700 border-t-stone-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-stone-500 text-sm">Loading...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-8">
            
            {/* Featured Tools - Left Sidebar */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                <h2 className="text-lg font-semibold text-stone-200 mb-1">Featured</h2>
                  <p className="text-sm text-stone-500">Premium placements</p>
                </div>
                <button
                  onClick={() => setShowFeaturedModal(true)}
                  className="inline-flex items-center gap-1.5 bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/40 hover:border-lime-400/60 text-lime-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                >
                  <Star className="w-3.5 h-3.5" />
                  Get Featured
                </button>
              </div>
              
              <div className="space-y-1">
                {tools.filter(tool => tool.isFeatured).slice(0, 6).map((tool) => (
                  <ToolItem key={tool.id} tool={tool} variant="compact" featured={true} />
                ))}
                
                {tools.filter(tool => tool.isFeatured).length === 0 && (
                  <div className="text-center py-8 text-stone-600 border border-dashed border-stone-700 rounded-lg">
                    <Star className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                    <p className="text-xs mb-3">No featured tools yet</p>
                    <button
                      onClick={() => setShowFeaturedModal(true)}
                      className="text-xs text-lime-400 hover:text-lime-300 underline"
                    >
                      Be the first →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Tools - Main Content */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-stone-200 mb-1">Latest</h2>
                  <p className="text-sm text-stone-500">Recently added tools</p>
                </div>
                <Link 
                  to="/submit-tool" 
                  className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
                >
                  Submit tool →
                </Link>
              </div>

              {tools.length > 0 ? (
                <div className="grid gap-1">
                  {tools.slice(0, 8).map((tool) => (
                    <ToolItem key={tool.id} tool={tool} variant="compact" />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-stone-500 text-sm mb-4">No tools yet</p>
                  <Link 
                    to="/submit-tool" 
                    className="inline-block bg-stone-800 hover:bg-stone-700 text-stone-200 px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Submit the first tool
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <FeaturedModal 
        isOpen={showFeaturedModal} 
        onClose={() => setShowFeaturedModal(false)} 
      />
    </div>
  );
} 