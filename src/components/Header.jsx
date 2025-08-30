import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star } from 'phosphor-react';
import FeaturedModal from './FeaturedModal';

export default function Header() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);

  // Check for featured query parameter and open modal
  useEffect(() => {
    if (searchParams.get('featured') === 'true') {
      setShowFeaturedModal(true);
      // Remove the query parameter from URL after opening modal
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <header className="border-b border-stone-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-lg font-semibold text-stone-100">
              tool<span className="text-lime-400">/</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link 
                to="/browse"
                className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Browse
              </Link>
              <button
                onClick={() => setShowFeaturedModal(true)}
                className="inline-flex items-center gap-1.5 bg-lime-500/20 hover:bg-lime-500/30 border border-lime-500/40 hover:border-lime-400/60 text-lime-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              >
                <Star className="w-3.5 h-3.5" />
                Get Featured
              </button>
              <Link 
                to="/submit-tool" 
                className="text-sm bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Submit
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <FeaturedModal 
        isOpen={showFeaturedModal} 
        onClose={() => setShowFeaturedModal(false)} 
      />
    </>
  );
} 