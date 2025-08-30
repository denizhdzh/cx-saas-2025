import { Link } from 'react-router-dom';
import { ArrowRight, SquaresFour as CategoryIcon, Money as PriceIcon, Star, ArrowUpRight, Crown } from 'phosphor-react';

export default function ToolItem({ tool, variant = 'detailed', featured = false }) {
  if (!tool || !tool.name) {
    return null; 
  }

  const displayCategory = tool.categories && tool.categories.length > 0 ? tool.categories[0] : 'General';
  const displayPricing = tool.pricingModel || 'Not specified';

  // Compact variant for HomePage and featured sections
  if (variant === 'compact') {
    const CompactCard = () => (
      <div className={`group cursor-pointer ${featured ? 'border-l-2 border-lime-600 pl-4' : ''}`}>
        <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-stone-800/30 transition-colors duration-200">
          <div className="w-10 h-10 bg-stone-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {tool.logoUrl ? (
              <img src={tool.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-2 h-2 bg-stone-500 rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-stone-200 truncate">{tool.name}</h3>
                  {tool.isFeatured && (
                    <div className="flex items-center gap-1 bg-lime-500/20 border border-lime-500/40 rounded-full px-1.5 py-0.5">
                      <Star className="w-2.5 h-2.5 text-lime-400 fill-lime-400" />
                      <span className="text-xs text-lime-300 font-medium">${tool.featuredPrice}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-1 line-clamp-2">{tool.tagline}</p>
              </div>
              <ArrowUpRight className="w-3 h-3 text-stone-500 group-hover:text-stone-300 transition-colors flex-shrink-0 mt-0.5" />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-stone-500 bg-stone-800/50 px-2 py-0.5 rounded">
                {displayCategory}
              </span>
              <span className="text-xs text-stone-500">{displayPricing}</span>
            </div>
          </div>
        </div>
      </div>
    );

    // Always try to go to ToolDetailPage first
    if (tool.slug) {
      return (
        <Link to={`/tool/${tool.slug}`} className="block">
          <CompactCard />
        </Link>
      );
    } else if (tool.id) {
      // Fallback to id if no slug
      return (
        <Link to={`/tool/${tool.id}`} className="block">
          <CompactCard />
        </Link>
      );
    } else {
      // Only if no slug and no id, go to external site
  return (
        <a href={tool.websiteUrl || '#'} target="_blank" rel="noopener noreferrer" className="block">
          <CompactCard />
        </a>
      );
    }
  }

  // Detailed variant for BrowsePage
  const cardContent = (
    <div className="p-5 relative">
      {tool.isFeatured && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-lime-500/20 to-lime-500/20 border border-lime-500/40 rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-lime-400" />
          <span className="text-sm text-lime-300 font-medium">Featured ${tool.featuredPrice}</span>
        </div>
      )}
      
        <div className="flex items-start gap-4">
          {tool.logoUrl ? (
            <img 
              src={tool.logoUrl} 
              alt={`${tool.name} logo`} 
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-stone-600/50 shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-stone-700 flex items-center justify-center text-lime-400 text-xl font-bold flex-shrink-0 border border-stone-600/50 shadow-sm">
              {tool.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className={`text-base font-semibold transition-colors truncate pr-2 ${
                tool.isFeatured 
                  ? 'text-lime-100 group-hover:text-lime-200' 
                  : 'text-stone-100 group-hover:text-lime-300'
              }`}>
                    {tool.name}
                </h3>
                <ArrowRight className="w-5 h-5 text-stone-500 group-hover:text-lime-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 duration-200 ease-in-out" />
            </div>
            <p className="text-xs text-stone-400 mt-1 line-clamp-2">
              {tool.tagline}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-stone-700/50 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {tool.categories && tool.categories.length > 0 && (
            <span className="inline-flex items-center gap-1 text-stone-400">
              <CategoryIcon className="w-3.5 h-3.5 text-lime-500/80" />
              {displayCategory}
            </span>
          )}
          {tool.pricingModel && (
             <span className="inline-flex items-center gap-1 text-stone-400">
                <PriceIcon className="w-3.5 h-3.5 text-lime-500/80" />
                {displayPricing}
             </span>
          )}
        </div>
      </div>
  );

  const cardClassName = `block group transition-all duration-200 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-stone-900 rounded-xl shadow-lg ${
    tool.isFeatured 
      ? 'bg-gradient-to-br from-lime-900/20 to-stone-800/40 hover:from-lime-800/30 hover:to-stone-700/60 border-2 border-lime-500/40 hover:border-lime-400/60' 
      : 'bg-stone-800/40 hover:bg-stone-700/60 border border-stone-700/60 hover:border-lime-500/30'
  }`;

  // Always try to go to ToolDetailPage first
  if (tool.slug) {
    return (
      <Link 
        to={`/tool/${tool.slug}`}
        className={cardClassName}
        aria-label={`View details for ${tool.name}`}
      >
        {cardContent}
      </Link>
    );
  } else if (tool.id) {
    // Fallback to id if no slug
    return (
      <Link 
        to={`/tool/${tool.id}`}
        className={cardClassName}
        aria-label={`View details for ${tool.name}`}
      >
        {cardContent}
    </Link>
  );
  } else {
    // Only if no slug and no id, go to external site
    return (
      <a 
        href={tool.websiteUrl || '#'}
        target="_blank" 
        rel="noopener noreferrer"
        className={cardClassName}
        aria-label={`Visit ${tool.name} website`}
      >
        {cardContent}
      </a>
    );
  }
} 