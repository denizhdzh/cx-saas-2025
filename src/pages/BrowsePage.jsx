import { useState, useEffect } from 'react';
import { Link as RouterLink, useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import ToolItem from '../components/ToolItem';
import { Helmet } from 'react-helmet-async';
import { Funnel as FilterIcon, SortAscending as Sort, Hash as TagIcon, GridFour as CategoryIconAlt, ArrowUpRight } from 'phosphor-react';

const Breadcrumbs = ({ items }) => (
  <nav aria-label="breadcrumb" className="mb-6 text-sm text-stone-500">
    <ol className="flex items-center space-x-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-center">
          {item.link ? (
            <RouterLink to={item.link} className="hover:text-lime-400 transition-colors">{item.name}</RouterLink>
          ) : (
            <span className="text-stone-400">{item.name}</span>
          )}
          {index < items.length - 1 && <span className="mx-2">/</span>}
        </li>
      ))}
    </ol>
  </nav>
);

const SORT_OPTIONS = {
  createdAt_desc: 'Latest',
  createdAt_asc: 'Oldest',
  name_asc: 'Name A-Z',
  name_desc: 'Name Z-A',
};

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();
  const [allTools, setAllTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesWithCounts, setCategoriesWithCounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Category mapping for URL-friendly names
  const CATEGORY_MAPPING = {
    'all': null,
    'ai': 'AI & Machine Learning',
    'productivity': 'Productivity', 
    'design': 'Design',
    'development': 'Development',
    'marketing': 'Marketing',
    'analytics': 'Analytics',
    'communication': 'Communication',
    'finance': 'Finance',
    'ecommerce': 'E-commerce',
    'education': 'Education',
    'health': 'Health',
    'entertainment': 'Entertainment',
    'security': 'Security',
    'social': 'Social Media',
    'content': 'Content Creation',
    'support': 'Customer Support',
    'utilities': 'Utilities'
  };

  // Function to validate if a category is legitimate (not garbage)
  const isValidCategory = (category) => {
    if (!category || typeof category !== 'string') return false;
    const trimmed = category.trim();
    
    // Filter out garbage categories
    if (trimmed.length < 2) return false; // Too short
    if (/^\d+$/.test(trimmed)) return false; // Only numbers
    if (/^[a-z]$/.test(trimmed)) return false; // Single letter
    if (trimmed.includes('undefined') || trimmed.includes('null')) return false; // Invalid values
    if (/^[^a-zA-Z]*$/.test(trimmed)) return false; // No letters at all
    
    return true;
  };

  // Function to create URL-friendly slug from category name
  const categoryToSlug = (category) => {
    return category
      .toLowerCase()
      .replace(/[&\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Function to find category from slug
  const slugToCategory = (slug, availableCategories) => {
    // First check hardcoded mappings
    if (CATEGORY_MAPPING[slug]) {
      return CATEGORY_MAPPING[slug];
    }
    
    // Then check dynamic categories
    return availableCategories.find(cat => categoryToSlug(cat) === slug) || null;
  };



  const SORT_MAPPING = {
    'recent': 'createdAt_desc',
    'oldest': 'createdAt_asc', 
    'name': 'name_asc',
    'name-desc': 'name_desc'
  };

  // Get current filter and sort from URL params
  const urlFilter = params.filter;
  const urlSort = params.sort;
  
  // Get current category filter (will be set after categories are loaded)
  const [selectedCategory, setSelectedCategory] = useState(null);
  const currentSort = urlSort && SORT_MAPPING[urlSort] ? SORT_MAPPING[urlSort] : 'createdAt_desc';

  useEffect(() => {
    const fetchToolsAndCategories = async () => {
      setIsLoading(true);
      console.log('🔄 Starting to fetch tools...');
      try {
        const toolsSnapshot = await getDocs(query(
          collection(db, 'tools'), 
          orderBy('createdAt', 'desc')
        ));
        const toolsList = toolsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(tool => tool.status === 'verified' || tool.status === 'approved');
        
        console.log('📊 Fetched tools:', toolsList.length);
        console.log('📊 First few tools:', toolsList.slice(0, 3));
        setAllTools(toolsList);

        // Get categories with their tool counts (filter out garbage categories)
        const categoryCount = {};
        const invalidCategories = new Set();
        
        toolsList.forEach(tool => {
          if (tool.categories) {
            tool.categories.forEach(category => {
              if (isValidCategory(category)) {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
              } else {
                // Track invalid categories for debugging
                invalidCategories.add(category);
              }
            });
          }
        });

        if (invalidCategories.size > 0) {
          console.log('⚠️ Invalid categories filtered out:', Array.from(invalidCategories));
        }

        // Only include valid categories that have tools
        const categoriesWithTools = Object.keys(categoryCount)
          .filter(category => categoryCount[category] > 0)
          .sort();
        
        console.log('📂 Valid categories found:', categoriesWithTools);
        console.log('📂 Valid category counts:', categoryCount);
        console.log('📂 Invalid categories filtered out');
        
        setCategories(categoriesWithTools);
        setCategoriesWithCounts(categoryCount);
        
      } catch (error) {
        console.error("Error fetching tools or categories: ", error);
      } finally {
      setIsLoading(false);
      }
    };
    fetchToolsAndCategories();
  }, []);

  // Set selected category when categories are loaded and URL params change
  useEffect(() => {
    if (categories.length > 0 && urlFilter) {
      const category = slugToCategory(urlFilter, categories);
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
  }, [categories, urlFilter]);

  useEffect(() => {
    let toolsToFilter = [...allTools];

    if (selectedCategory) {
      toolsToFilter = toolsToFilter.filter(tool => 
        tool.categories && tool.categories.includes(selectedCategory)
      );
    }

    if (SORT_OPTIONS[currentSort]) {
        toolsToFilter.sort((a, b) => {
            // First, prioritize featured tools
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            
            // Then apply the selected sort
            if (currentSort === 'createdAt_desc') {
                return (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0);
            } else if (currentSort === 'createdAt_asc') {
                return (a.createdAt?.toDate() || 0) - (b.createdAt?.toDate() || 0);
            } else if (currentSort === 'name_asc') {
                return a.name.localeCompare(b.name);
            } else if (currentSort === 'name_desc') {
                return b.name.localeCompare(a.name);
            }
      return 0;
    });
    }

    setFilteredTools(toolsToFilter);
  }, [allTools, selectedCategory, currentSort]);

  const handleFilterChange = (filterType, value) => {
    const getSlugFromValue = (value) => {
      if (!value) return 'all';
      
      // First check hardcoded mappings
      const hardcodedEntry = Object.entries(CATEGORY_MAPPING).find(([key, val]) => val === value);
      if (hardcodedEntry) return hardcodedEntry[0];
      
      // Then create dynamic slug
      return categoryToSlug(value);
    };

    const getSortSlug = (sortValue) => {
      const entry = Object.entries(SORT_MAPPING).find(([key, val]) => val === sortValue);
      return entry ? entry[0] : 'recent';
    };

    let newFilter = 'all';
    
    if (filterType === 'category') {
      newFilter = getSlugFromValue(value);
    }

    const sortSlug = getSortSlug(currentSort);
    
    // Navigate to new URL
    if (newFilter === 'all' && sortSlug === 'recent') {
      navigate('/browse');
    } else if (sortSlug === 'recent') {
      navigate(`/browse/${newFilter}`);
    } else {
      navigate(`/browse/${newFilter}/${sortSlug}`);
    }
  };

  const handleSortChange = (e) => {
    const newSortValue = e.target.value;
    const sortSlug = Object.entries(SORT_MAPPING).find(([key, val]) => val === newSortValue)?.[0] || 'recent';
    const filterSlug = urlFilter || 'all';
    
    if (filterSlug === 'all' && sortSlug === 'recent') {
      navigate('/browse');
    } else if (sortSlug === 'recent') {
      navigate(`/browse/${filterSlug}`);
    } else {
      navigate(`/browse/${filterSlug}/${sortSlug}`);
    }
  };
  
  const baseTitle = selectedCategory
    ? `${selectedCategory} Tools`
    : 'All Tools';
  
  const sortText = (urlSort && urlSort !== 'recent' && SORT_MAPPING[urlSort]) 
    ? `(${Object.entries(SORT_OPTIONS).find(([key, val]) => key === SORT_MAPPING[urlSort])?.[1] || urlSort})` 
    : '';

  const pageTitle = `Browse ${baseTitle} ${sortText} | tool/`.replace(/\s+/g, ' ').trim();
  
  const metaDescription = `Discover and filter from ${filteredTools.length} ${baseTitle.toLowerCase()} ${sortText ? sortText.toLowerCase() : ''} on tool/. Find the best tools for your needs, sorted ${sortText ? SORT_OPTIONS[currentSort].toLowerCase() : 'by latest'}.`;

  const breadcrumbItems = [
    { name: 'Home', link: '/' },
    { name: 'Browse', link: !urlFilter && !urlSort ? null : '/browse' },
    ...(urlFilter && urlFilter !== 'all' ? [{ name: CATEGORY_MAPPING[urlFilter] || urlFilter }] : []),
    ...(urlSort && urlSort !== 'recent' ? [{ name: SORT_OPTIONS[SORT_MAPPING[urlSort]] || urlSort }] : [])
  ];

  const featuredTools = filteredTools.filter(tool => tool.isFeatured);
  const regularTools = filteredTools.filter(tool => !tool.isFeatured);
  
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <div className="min-h-screen bg-stone-900">
        <main className="max-w-6xl mx-auto px-6 py-8">
        <Breadcrumbs items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-100 mb-3">
              {baseTitle} {sortText}
          </h1>
            <p className="text-stone-400 text-lg max-w-2xl">
              Explore our curated collection of tools. Filter by category to find exactly what you need.
            </p>
          </div>

          {/* Tools Grid */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-6 h-6 border border-stone-700 border-t-stone-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-stone-500 text-sm">Loading...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Filters Sidebar - Left */}
              <aside className="lg:col-span-3 space-y-6 mb-8 lg:mb-0 lg:sticky lg:top-8 self-start">
                <div className="bg-stone-800/40 p-5 rounded-lg border border-stone-700/50">
                  <h3 className="text-sm font-semibold text-stone-300 mb-3 flex items-center">
                    <Sort className="w-4 h-4 mr-2 text-lime-400" /> Sort By
                  </h3>
                  <select 
                    value={currentSort}
                    onChange={handleSortChange}
                    className="w-full bg-stone-700/60 border border-stone-600 rounded-md py-2 px-3 text-sm text-stone-200 focus:ring-lime-500 focus:border-lime-500"
                  >
                    {Object.entries(SORT_OPTIONS).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-stone-800/40 p-5 rounded-lg border border-stone-700/50">
                  <h3 className="text-sm font-semibold text-stone-300 mb-3 flex items-center">
                    <CategoryIconAlt className="w-4 h-4 mr-2 text-lime-400" /> Categories
                  </h3>
                  <ul className="space-y-1 max-h-60 overflow-y-auto">
                    <li>
                      <button 
                        onClick={() => handleFilterChange('category', null)}
                        className={`w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors ${!selectedCategory ? 'bg-lime-500/20 text-lime-300' : 'text-stone-400 hover:bg-stone-700/70 hover:text-stone-200'}`}
                      >
                        All Categories
                      </button>
                    </li>
                    {categories.map(category => (
                      <li key={category}>
                        <button 
                          onClick={() => handleFilterChange('category', category)}
                          className={`w-full text-left text-xs px-2 py-1.5 rounded-md transition-colors flex justify-between items-center ${selectedCategory === category ? 'bg-lime-500/20 text-lime-300' : 'text-stone-400 hover:bg-stone-700/70 hover:text-stone-200'}`}
                        >
                          <span>{category}</span>
                          <span className="text-xs text-stone-500">({categoriesWithCounts[category] || 0})</span>
                        </button>
                    </li>
                    ))}
                </ul>
                </div>


          </aside>

              {/* Main Tools - Center */}
              <div className="lg:col-span-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-200 mb-1">
                      {selectedCategory ? 'Filtered Results' : 'All Tools'}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {regularTools.length} tools found
                    </p>
                  </div>
                </div>

                {regularTools.length > 0 ? (
                  <div className="grid gap-1">
                    {regularTools.map((tool) => (
                      <ToolItem key={tool.id} tool={tool} variant="compact" />
                    ))}
              </div>
            ) : (
                  <div className="text-center py-20 border border-dashed border-stone-700 rounded-lg">
                    <TagIcon className="w-12 h-12 mx-auto mb-4 text-stone-600" />
                    <p className="text-lg font-semibold text-stone-300 mb-2">
                      No tools found
                    </p>
                    <p className="text-sm text-stone-500 mb-6">
                      Try adjusting your filters or browse all tools.
                    </p>
                    <button 
                        onClick={() => navigate('/browse')}
                        className="bg-lime-500 hover:bg-lime-600 text-stone-900 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Clear Filters
                </button>
              </div>
            )}
              </div>

              {/* Featured Tools - Right Sidebar */}
              <div className="lg:col-span-3">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-stone-200 mb-1">Featured</h2>
                  <p className="text-sm text-stone-500">Editor's picks</p>
                </div>
                
                <div className="space-y-1">
                  {featuredTools.slice(0, 8).map((tool) => (
                    <ToolItem key={tool.id} tool={tool} variant="compact" featured={true} />
                  ))}
                  
                  {featuredTools.length === 0 && (
                    <div className="text-center py-8 text-stone-600">
                      <p className="text-xs">No featured tools for current filters</p>
                    </div>
            )}
          </div>
        </div>
            </div>
          )}
      </main>
      </div>
    </>
  );
} 