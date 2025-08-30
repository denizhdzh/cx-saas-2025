import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { Helmet } from 'react-helmet-async';
import Breadcrumbs from '../components/Breadcrumbs';
import ToolItem from '../components/ToolItem'; // For related tools
import { 
    ArrowSquareOut, Check, Link as LinkIconPhosphor, 
    Heart, Clock
} from 'phosphor-react';

// Machine ID'yi al (localStorage'da sakla)
const getMachineId = () => {
  let machineId = localStorage.getItem('machineId');
  if (!machineId) {
    machineId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('machineId', machineId);
  }
  return machineId;
};

export default function ToolDetailPage() {
  const { slug } = useParams();
  const [tool, setTool] = useState(null);
  const [relatedTools, setRelatedTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(0);

  useEffect(() => {
    const fetchToolData = async () => {
      if (!slug) return;
      setIsLoading(true);
      setError(null);
      try {
        const toolsRef = collection(db, 'tools');

        // First try to find by slug
        let q = query(toolsRef, where('slug', '==', slug), limit(1));
        let snapshot = await getDocs(q);

        // If not found by slug, try to find by id using doc() method
        if (snapshot.empty) {
          try {
            const docRef = doc(db, 'tools', slug);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const toolData = { id: docSnap.id, ...docSnap.data() };
              setTool(toolData);
              setLocalUpvotes(toolData.upvotesCount || 0);

              // Like durumunu kontrol et
              const machineId = getMachineId();
              const likedTools = JSON.parse(localStorage.getItem('likedTools') || '[]');
              setIsLiked(likedTools.includes(toolData.id));
              
              // Fetch related tools
              if (toolData.categories && toolData.categories.length > 0) {
                const primaryCategory = toolData.categories[0];
                const relatedQuery = query(
                  toolsRef,
                  where('categories', 'array-contains', primaryCategory),
                  orderBy('createdAt', 'desc'),
                  limit(4)
                );
                const relatedSnapshot = await getDocs(relatedQuery);
                setRelatedTools(
                  relatedSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(t => t.id !== toolData.id)
                    .slice(0, 3)
                );
              }
              setIsLoading(false);
              return;
            }
          } catch (idError) {
            console.log('Error searching by ID:', idError);
          }
        } else {
          const toolData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setTool(toolData);
          setLocalUpvotes(toolData.upvotesCount || 0);

          // Like durumunu kontrol et
          const machineId = getMachineId();
          const likedTools = JSON.parse(localStorage.getItem('likedTools') || '[]');
          setIsLiked(likedTools.includes(toolData.id));

          // Fetch related tools
          if (toolData.categories && toolData.categories.length > 0) {
            const primaryCategory = toolData.categories[0];
            const relatedQuery = query(
              toolsRef,
              where('categories', 'array-contains', primaryCategory),
              orderBy('createdAt', 'desc'),
              limit(4)
            );
            const relatedSnapshot = await getDocs(relatedQuery);
            setRelatedTools(
              relatedSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(t => t.id !== toolData.id)
                .slice(0, 3)
            );
          }
          setIsLoading(false);
          return;
        }

        setError('Tool not found.');
        setTool(null);
      } catch (err) {
        console.error("Error fetching tool data:", err);
        setError('Failed to load tool details. Please try again.');
      }
      setIsLoading(false);
    };

    fetchToolData();
  }, [slug]);

  // Like/Unlike fonksiyonu
  const handleLike = async () => {
    if (!tool || isLiking) return;

    setIsLiking(true);
    const machineId = getMachineId();
    
    try {
      const toolRef = doc(db, 'tools', tool.id);
      const likedTools = JSON.parse(localStorage.getItem('likedTools') || '[]');
      
      if (isLiked) {
        // Unlike
        await updateDoc(toolRef, {
          upvotesCount: increment(-1)
        });
        
        // localStorage'dan kaldır
        const updatedLikes = likedTools.filter(id => id !== tool.id);
        localStorage.setItem('likedTools', JSON.stringify(updatedLikes));
        
        setIsLiked(false);
        setLocalUpvotes(prev => prev - 1);
      } else {
        // Like
        await updateDoc(toolRef, {
          upvotesCount: increment(1)
        });
        
        // localStorage'a ekle
        const updatedLikes = [...likedTools, tool.id];
        localStorage.setItem('likedTools', JSON.stringify(updatedLikes));
        
        setIsLiked(true);
        setLocalUpvotes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Like işlemi başarısız:', error);
      // Hata durumunda geri al
      setIsLiked(!isLiked);
      setLocalUpvotes(prev => isLiked ? prev + 1 : prev - 1);
    }
    
    // 2 saniye sonra enabled yap
    setTimeout(() => {
      setIsLiking(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-stone-700 border-t-lime-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <Helmet>
          <title>Error | tool/</title>
        </Helmet>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Error' }]} />
        <h1 className="text-3xl font-bold text-red-400 mb-4">Something went wrong</h1>
        <p className="text-stone-300 text-lg">{error}</p>
        <Link to="/" className="mt-8 inline-block bg-lime-500 hover:bg-lime-600 text-stone-900 px-6 py-2.5 rounded-md font-medium transition-colors">
          Go to Homepage
        </Link>
      </div>
    );
  }

  if (!tool) {
    // This case should ideally be handled by the error state if a slug is present but tool not found.
    // If slug is somehow undefined, this could be a fallback.
    return (
        <div className="max-w-2xl mx-auto text-center py-12 px-4">
            <Helmet><title>Tool Not Found | tool/</title></Helmet>
            <Breadcrumbs items={[{ label: 'Home', path: '/' }, {label: 'Browse', path: '/browse/all'}, { label: 'Not Found' }]} />
            <h1 className="text-3xl font-bold text-stone-100 mb-4">Tool Not Found</h1>
            <p className="text-stone-300 text-lg">The tool you are looking for does not exist or is no longer available.</p>
            <Link to="/browse/all" className="mt-8 inline-block bg-lime-500 hover:bg-lime-600 text-stone-900 px-6 py-2.5 rounded-md font-medium transition-colors">
                Browse All Tools
            </Link>
        </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Browse', path: '/browse/all' }, 
    // Optionally add category breadcrumb if desired
    // { label: tool.categories[0], path: `/browse/c_${tool.categories[0].replace(/\s+/g, '-')}` },
    { label: tool.name }
  ];

  return (
    <>
      <Helmet>
        <title>{`${tool.name} - ${tool.tagline} | tool/`}</title>
        <meta name="description" content={tool.description ? tool.description.substring(0, 160) : tool.tagline} />
      </Helmet>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Hero Section - Minimal like HomePage */}
        <div className="flex items-start gap-6 mb-12">
          {tool.logoUrl ? (
            <img src={tool.logoUrl} alt={`${tool.name} logo`} className="w-16 h-16 rounded-xl object-contain flex-shrink-0 border border-stone-700" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-stone-800 flex items-center justify-center text-lime-400 text-2xl font-bold flex-shrink-0 border border-stone-700">
              {tool.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-stone-100 mb-2">
              {tool.name}
            </h1>
            <p className="text-lg text-stone-300 mb-4">
              {tool.tagline}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a 
                href={tool.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-stone-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Visit Website <ArrowSquareOut className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-1 transition-all duration-200 hover:text-red-400 ${
                    isLiked ? 'text-red-400' : 'text-stone-500'
                  } ${isLiking ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Heart 
                    className={`w-4 h-4 transition-all duration-200 ${
                      isLiked ? 'fill-red-400' : ''
                    } ${isLiking ? 'animate-pulse scale-110' : ''}`}
                  /> 
                  {localUpvotes}
                </button>

                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4"/> {tool.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left: Quick Info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-stone-800/40 p-5 rounded-lg border border-stone-700/50">
              <h3 className="text-sm font-semibold text-stone-300 mb-4">Quick Info</h3>
              <div className="space-y-4">
                {tool.categories && tool.categories.length > 0 && (
                  <div>
                    <div className="text-xs text-stone-500 mb-1">Category</div>
                    <div className="flex flex-wrap gap-1">
                      {tool.categories.slice(0, 2).map((cat, i) => (
                        <span key={i} className="text-xs bg-stone-700/70 text-stone-300 px-2 py-1 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {tool.pricingModel && (
                  <div>
                    <div className="text-xs text-stone-500 mb-1">Pricing</div>
                    <div className="text-sm text-stone-200">{tool.pricingModel}</div>
                  </div>
                )}
                {tool.platforms && tool.platforms.length > 0 && (
                  <div>
                    <div className="text-xs text-stone-500 mb-1">Platforms</div>
                    <div className="flex flex-wrap gap-1">
                      {tool.platforms.slice(0, 3).map((platform, i) => (
                        <span key={i} className="text-xs bg-stone-700/70 text-stone-300 px-2 py-1 rounded-full">
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {tool.tags && tool.tags.length > 0 && (
              <div className="bg-stone-800/40 p-5 rounded-lg border border-stone-700/50">
                <h3 className="text-sm font-semibold text-stone-300 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {tool.tags.slice(0, 8).map((tag, i) => (
                    <span key={i} className="text-xs bg-stone-700/70 text-stone-300 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tool Info */}
            <div className="bg-stone-800/40 p-5 rounded-lg border border-stone-700/50">
              <h3 className="text-sm font-semibold text-stone-300 mb-4">Tool Info</h3>
              <div className="space-y-3">
                  <div>
                  <div className="text-xs text-stone-500 mb-1">Status</div>
                  <div className={`text-sm ${tool.status === 'approved' ? 'text-lime-300' : 'text-yellow-300'}`}>
                    {tool.status === 'approved' ? '✅ Verified' : '⏳ Pending'}
                  </div>
                  </div>
                {tool.isFeatured && (
                  <div>
                    <div className="text-xs text-stone-500 mb-1">Featured</div>
                    <div className="text-sm text-lime-300">⭐ Featured Tool</div>
                  </div>
                )}
                {tool.createdAt && (
                  <div>
                    <div className="text-xs text-stone-500 mb-1">Added</div>
                    <div className="text-sm text-stone-200">
                      {tool.createdAt.toDate().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Center: Main Content */}
          <div className="lg:col-span-6 space-y-8">
            {/* Screenshot */}
            {tool.screenshotUrl && (
              <div>
                <h2 className="text-xl font-semibold text-stone-100 mb-4">Preview</h2>
                <div className="bg-stone-800/40 p-4 rounded-lg border border-stone-700/50">
                  <img 
                    src={tool.screenshotUrl} 
                    alt={`${tool.name} screenshot`} 
                    className="w-full h-auto rounded-lg shadow-lg border border-stone-600/50"
                  />
                </div>
              </div>
            )}

            {tool.description && (
              <div>
                <h2 className="text-xl font-semibold text-stone-100 mb-4">About</h2>
                <div className="text-stone-300 leading-relaxed space-y-3" 
                     dangerouslySetInnerHTML={{ __html: tool.description.replace(/\n/g, '<br />') }} />
              </div>
            )}

            {tool.features && tool.features.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-stone-100 mb-4">Features</h2>
                <div className="grid gap-3">
                  {tool.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-stone-800/30 rounded-lg">
                      <Check className="w-4 h-4 text-lime-400 flex-shrink-0 mt-0.5" /> 
                      <span className="text-stone-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tool.useCases && tool.useCases.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-stone-100 mb-4">Use Cases</h2>
                <div className="flex flex-wrap gap-2">
                  {tool.useCases.map((useCase, i) => (
                    <span key={i} className="text-sm bg-lime-900/20 border border-lime-500/30 text-lime-300 px-3 py-1.5 rounded-lg">
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Info Sections */}
            {tool.targetAudience && tool.targetAudience.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-stone-100 mb-4">Target Audience</h2>
                <div className="flex flex-wrap gap-2">
                  {tool.targetAudience.map((audience, i) => (
                    <span key={i} className="text-sm bg-stone-800/50 text-stone-300 px-3 py-1.5 rounded-lg border border-stone-700/50">
                      {audience}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tool.integrations && tool.integrations.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-stone-100 mb-4">Integrations</h2>
                <div className="grid grid-cols-2 gap-3">
                  {tool.integrations.map((integration, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-stone-800/30 rounded-lg">
                      <LinkIconPhosphor className="w-4 h-4 text-lime-400" />
                      <span className="text-sm text-stone-300">{integration}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Details - sadece varsa göster */}
            {tool.pricingDetails && (
              <div>
                <h2 className="text-xl font-semibold text-stone-100 mb-4">Pricing Details</h2>
                <div className="bg-stone-800/30 p-4 rounded-lg border border-stone-700/50">
                  <p className="text-stone-300 text-sm leading-relaxed">{tool.pricingDetails}</p>
                </div>
            </div>
            )}
        </div>

          {/* Right: Related Tools */}
          <div className="lg:col-span-3">
        {relatedTools.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-stone-200 mb-4">Related Tools</h3>
                <div className="space-y-1">
              {relatedTools.map(relatedTool => (
                    <ToolItem key={relatedTool.id} tool={relatedTool} variant="compact" />
              ))}
            </div>
              </div>
        )}
          </div>
        </div>
      </main>
    </>
  );
} 