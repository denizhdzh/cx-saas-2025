import { useState, useEffect, useMemo } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where, limit, doc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { MagnifyingGlass, Wrench as ToolsIcon, SquaresFour as CategoryIcon, Star, TrendUp, Lightbulb, Sparkle } from 'phosphor-react';
import ToolItem from '../components/ToolItem';
import { Helmet } from 'react-helmet-async';
import Breadcrumbs from '../components/Breadcrumbs';

export default function SearchPage() {
  const { searchTerm: urlSearchTerm } = useParams();
  const navigate = useNavigate();

  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredTools, setFeaturedTools] = useState([]);
  const [popularTools, setPopularTools] = useState([]);
  const [relatedTools, setRelatedTools] = useState([]);

  const decodedSearchTerm = useMemo(() => urlSearchTerm ? decodeURIComponent(urlSearchTerm) : '', [urlSearchTerm]);
  const [currentSearchTermInput, setCurrentSearchTermInput] = useState(decodedSearchTerm);

  useEffect(() => {
    setCurrentSearchTermInput(decodedSearchTerm);
  }, [decodedSearchTerm]);

  // Track search terms in Firestore
  const trackSearchTerm = async (searchTerm, resultCount) => {
    if (!searchTerm || searchTerm.length < 2) return;
    
    try {
      const searchTermDoc = doc(db, 'searchTerms', searchTerm.toLowerCase());
      await setDoc(searchTermDoc, {
        term: searchTerm.toLowerCase(),
        searchCount: increment(1),
        lastSearched: serverTimestamp(),
        resultCount: resultCount,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error tracking search term:', error);
    }
  };

  useEffect(() => {
    if (!decodedSearchTerm) {
      setIsLoading(false);
      setSearchResults([]);
      setFeaturedTools([]);
      setPopularTools([]);
      setRelatedTools([]);
      return;
    }

    const fetchSearchResults = async () => {
      setIsLoading(true);
      setSearchResults([]);
      setFeaturedTools([]);
      setPopularTools([]);
      setRelatedTools([]);
      
      try {
        const toolsRef = collection(db, 'tools');
        const searchTermLower = decodedSearchTerm.toLowerCase();

        // Get all approved tools for search
        const q = query(toolsRef, where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        
        const results = [];
        const featured = [];
        
        querySnapshot.forEach((doc) => {
          const tool = { id: doc.id, ...doc.data() };
          let score = 0;
          
          // Split search term into individual words for better matching
          const searchWords = searchTermLower.split(/\s+/).filter(word => word.length > 0);
          
          // Search in name (highest priority)
          if (tool.name) {
            const nameLower = tool.name.toLowerCase();
            // Exact phrase match gets highest score
            if (nameLower.includes(searchTermLower)) score += 5;
            // Individual word matches
            searchWords.forEach(word => {
              if (nameLower.includes(word)) score += 3;
            });
          }
          
          // Search in tagline
          if (tool.tagline) {
            const taglineLower = tool.tagline.toLowerCase();
            // Exact phrase match
            if (taglineLower.includes(searchTermLower)) score += 3;
            // Individual word matches
            searchWords.forEach(word => {
              if (taglineLower.includes(word)) score += 2;
            });
          }
          
          // Search in description
          if (tool.description) {
            const descriptionLower = tool.description.toLowerCase();
            // Exact phrase match
            if (descriptionLower.includes(searchTermLower)) score += 2;
            // Individual word matches
            searchWords.forEach(word => {
              if (descriptionLower.includes(word)) score += 1;
            });
          }
          
          // Search in categories
          if (tool.categories) {
            tool.categories.forEach(category => {
              const categoryLower = category.toLowerCase();
              if (categoryLower.includes(searchTermLower)) score += 3;
              searchWords.forEach(word => {
                if (categoryLower.includes(word)) score += 2;
              });
            });
          }
          
          // Search in tags
          if (tool.tags) {
            tool.tags.forEach(tag => {
              const tagLower = tag.toLowerCase();
              if (tagLower.includes(searchTermLower)) score += 2;
              searchWords.forEach(word => {
                if (tagLower.includes(word)) score += 1;
              });
            });
          }
          
          // Lower threshold - show results even with partial matches
          if (score > 0) {
            results.push({ ...tool, searchScore: score });
          }
          
          if (tool.isFeatured) {
            featured.push(tool);
          }
        });
        
        results.sort((a, b) => {
          if (b.searchScore !== a.searchScore) {
            return b.searchScore - a.searchScore;
          }
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          if (a.isFeatured && b.isFeatured) {
            return (b.featuredPrice || 0) - (a.featuredPrice || 0);
          }
          return 0;
        });
        setSearchResults(results);
        
        // Track this search term
        trackSearchTerm(decodedSearchTerm, results.length);
        
        featured.sort((a, b) => (b.featuredPrice || 0) - (a.featuredPrice || 0));
        console.log('Featured tools found on SearchPage:', featured.length, featured.map(t => t.name));
        setFeaturedTools(featured);

        // Get tools for "Popular Tools" section, ordered by creation date (like HomePage)
        const popularCandidateQuery = query(
          collection(db, 'tools'),
          where('status', '==', 'approved'), // Still good to ensure only approved tools are candidates
          orderBy('createdAt', 'desc'), 
          limit(50) // Fetch a decent number of recent tools as candidates
        );
        const popularCandidateSnapshot = await getDocs(popularCandidateQuery);
        let popularCandidates = popularCandidateSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter out tools already in search results or featured tools (to avoid duplicates in sidebar)
        popularCandidates = popularCandidates.filter(pc => 
          !results.find(r => r.id === pc.id) && 
          !featured.find(f => f.id === pc.id)
        );

        // Now, sort these candidates by upvotesCount on the client-side
        popularCandidates.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
        
        setPopularTools(popularCandidates.slice(0, 5)); // Take top 5 for display
        console.log('Popular tools for SearchPage sidebar:', popularCandidates.slice(0,5).map(t=>t.name));

        // Get related tools based on first result's category
        if (results.length > 0 && results[0].categories && results[0].categories.length > 0) {
          const firstResultCategory = results[0].categories[0];
          const relatedQuery = query(
            collection(db, 'tools'), 
            where('status', '==', 'approved'),
            where('categories', 'array-contains', firstResultCategory),
            orderBy('upvotesCount', 'desc'), // Related can still be by upvotes for relevance
            limit(8)
          );
          const relatedSnapshot = await getDocs(relatedQuery);
          const related = relatedSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(t => 
              !results.find(r => r.id === t.id) && 
              !featured.find(f => f.id === t.id) &&
              !popularCandidates.slice(0,5).find(p => p.id === t.id) // Exclude from current popular tools as well
            )
            .slice(0, 6);
          setRelatedTools(related);
          console.log('Related tools for SearchPage sidebar:', related.map(t=>t.name));
        }

      } catch (err) {
        console.error("Error fetching search results:", err);
      }
      setIsLoading(false);
    };

    fetchSearchResults();
  }, [decodedSearchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (currentSearchTermInput.trim()) {
      navigate(`/search/${encodeURIComponent(currentSearchTermInput.trim())}`);
    }
  };

  const pageTitle = decodedSearchTerm ? `Search results for "${decodedSearchTerm}" | tool/` : 'Search Tools | tool/';
  const metaDescription = decodedSearchTerm 
    ? `Find ${decodedSearchTerm} tools and software. Browse ${searchResults.length} tools related to "${decodedSearchTerm}" with reviews, features, and comparisons.` 
    : 'Search our comprehensive directory of tools, software, and platforms. Find the perfect solution for your needs.';

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Search' }
  ];
  if (decodedSearchTerm) {
    breadcrumbItems[breadcrumbItems.length - 1].path = '/search'; 
    breadcrumbItems.push({ label: `"${decodedSearchTerm}"` });
  }
  
  if (!decodedSearchTerm && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Helmet>
          <title>Search Tools | tool/</title>
          <meta name="description" content="Search our comprehensive directory to find the perfect tools and software for your needs." />
        </Helmet>
        <Breadcrumbs items={breadcrumbItems} />
        
        <div className="text-center mb-12">
          <MagnifyingGlass className="w-16 h-16 text-lime-400 mx-auto mb-6 mt-8" />
          <h1 className="text-4xl font-bold text-stone-100 mb-4">Search Our Tools Directory</h1>
          <p className="text-lg text-stone-400 mb-8 max-w-2xl mx-auto">
            Find exactly what you need from our curated collection of tools and software.
          </p>
          
          <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto">
            <div className="relative">
              <input 
                type="search" 
                value={currentSearchTermInput}
                onChange={(e) => setCurrentSearchTermInput(e.target.value)}
                placeholder="e.g., AI writer, project management, design tools..."
                className="w-full pl-4 pr-12 py-4 bg-stone-800/70 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 focus:outline-none text-base transition-colors"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-lime-400 hover:text-lime-300">
                <MagnifyingGlass className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>

        {/* Popular Search Suggestions */}
        <div className="bg-stone-800/30 rounded-lg p-6 border border-stone-700/50">
          <h2 className="text-lg font-semibold text-stone-200 mb-4">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {['AI tools', 'Project management', 'Design software', 'Analytics', 'Marketing automation', 'Code editors'].map((term) => (
              <RouterLink
                key={term}
                to={`/search/${encodeURIComponent(term)}`}
                className="px-3 py-1.5 bg-stone-700/60 hover:bg-lime-500/20 text-stone-300 hover:text-lime-300 rounded-md text-sm transition-colors"
              >
                {term}
              </RouterLink>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={breadcrumbItems} />
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-stone-100 sm:text-4xl mb-4">
            Search Results for: <span className="text-lime-400">"{decodedSearchTerm}"</span>
          </h1>
          
          <p className="text-lg text-stone-400 mb-6 max-w-3xl">
            {searchResults.length > 0 
              ? `Found ${searchResults.length} tools related to "${decodedSearchTerm}"`
              : `No tools found for "${decodedSearchTerm}"`
            }
          </p>
          
          <form onSubmit={handleSearchSubmit} className="max-w-xl">
            <div className="relative">
              <input 
                type="search" 
                value={currentSearchTermInput}
                onChange={(e) => setCurrentSearchTermInput(e.target.value)}
                placeholder="Try different keywords..."
                className="w-full pl-4 pr-12 py-3 bg-stone-800/70 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 focus:outline-none text-sm transition-colors"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-lime-400 hover:text-lime-300">
                <MagnifyingGlass className="w-5 h-5" />
              </button>
            </div>
          </form>
        </header>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-stone-700 border-t-lime-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-stone-400">Searching for "{decodedSearchTerm}"...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Main Search Results - Left */}
            <div className="lg:col-span-8">
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {searchResults.map(tool => (
                    <ToolItem key={tool.id} tool={tool} variant="compact" featured={tool.isFeatured} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <MagnifyingGlass className="w-16 h-16 text-stone-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold text-stone-100 mb-3">
                    No results found
                  </h2>
                  <p className="text-stone-400 mb-8 max-w-md mx-auto">
                    Try different keywords or browse our categories.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <RouterLink 
                      to="/browse" 
                      className="inline-flex items-center gap-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 border border-lime-500/40 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
                    >
                      <CategoryIcon className="w-4 h-4" />
                      Browse All Tools
                    </RouterLink>
                    <RouterLink 
                      to="/submit" 
                      className="inline-flex items-center gap-2 bg-stone-700/60 hover:bg-stone-700/80 text-stone-200 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
                    >
                      <ToolsIcon className="w-4 h-4" />
                      Submit Tool
                    </RouterLink>
                  </div>
                </div>
              )}

              {/* Related Tools Section */}
              {relatedTools.length > 0 && (
                <div className="mt-12 pt-8 border-t border-stone-700/60">
                  <h2 className="text-xl font-semibold text-stone-200 mb-6 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Related Tools
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {relatedTools.map(tool => (
                      <ToolItem key={tool.id} tool={tool} variant="compact" featured={tool.isFeatured} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Featured & Popular Tools - Right Sidebar */}
            <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 self-start">
              {/* Featured Tools (from HomePage logic) */}
              {featuredTools.length > 0 && (
                <div className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 p-6 rounded-lg border border-lime-500/20">
                  <h3 className="text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-lime-400" />
                    Featured Tools
                  </h3>
                  <p className="text-xs text-stone-400 mb-5">
                    Premium tools with enhanced visibility and priority placement.
                  </p>
                  <div className="space-y-3">
                    {featuredTools.slice(0, 4).map(tool => (
                      <ToolItem key={tool.id} tool={tool} variant="compact" featured={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Tools (styled EXACTLY like HomePage's Featured Tools) */}
              {popularTools.length > 0 && (
                <div className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 p-6 rounded-lg border border-lime-500/20">
                  <h3 className="text-lg font-semibold text-stone-100 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-lime-400" />
                    Featured
                  </h3>
                  <p className="text-xs text-stone-400 mb-5">
                    Community favorites: Highly upvoted tools based on user feedback and popularity.
                  </p>
                  <div className="space-y-3">
                    {popularTools.slice(0, 5).map(tool => (
                      <div key={tool.id} className="bg-stone-900/50 p-3 rounded-lg border border-stone-700/50 hover:border-lime-500/30 transition-colors">
                        <RouterLink to={`/tool/${tool.slug}`} className="block">
                          <div className="flex items-center gap-3">
                            {tool.logoUrl ? (
                              <img src={tool.logoUrl} alt={`${tool.name} logo`} className="w-10 h-10 rounded-md object-contain p-0.5 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-lime-500/20 flex items-center justify-center text-lime-400 font-bold text-sm flex-shrink-0">
                                {tool.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold text-stone-100 truncate">{tool.name}</h4>
                                <Sparkle className="w-3 h-3 text-lime-400 flex-shrink-0" />
                              </div>
                              <p className="text-xs text-stone-400 truncate">{tool.tagline}</p>
                            </div>
                          </div>
                        </RouterLink>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Section */}
              <div className="bg-stone-800/40 p-6 rounded-lg border border-stone-700/50 text-center">
                <h3 className="text-lg font-semibold text-stone-100 mb-2">Can't Find What You Need?</h3>
                <p className="text-sm text-stone-400 mb-4">
                  Submit your tool to help others discover it.
                </p>
                <RouterLink 
                  to="/submit" 
                  className="block w-full bg-lime-500/20 hover:bg-lime-500/30 text-lime-200 border border-lime-500/40 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
                >
                  Submit a Tool
                </RouterLink>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
} 