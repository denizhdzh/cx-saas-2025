import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { db, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CheckCircle, X, Lightning, Lock, Globe } from 'phosphor-react';

export default function AdminAddToolPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });
  const [productHuntUrl, setProductHuntUrl] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    const adminUser = import.meta.env.VITE_ADMIN_USER;
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    
    if (loginData.username === adminUser && loginData.password === adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      setLoginError('Invalid username or password!');
    }
  };

  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  };

  const analyzeProductHuntUrl = async () => {
    if (!productHuntUrl.trim()) {
      setSubmitStatus({ message: 'Please enter a Product Hunt URL!', type: 'error' });
      return;
    }

    if (!productHuntUrl.includes('producthunt.com')) {
      setSubmitStatus({ message: 'Please enter a valid Product Hunt URL!', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ message: 'Analyzing Product Hunt URL...', type: 'info' });

    try {
      console.log('🔗 Starting Product Hunt URL analysis:', productHuntUrl);

      let html = '';

      const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(productHuntUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(productHuntUrl)}`,
        `https://cors-anywhere.herokuapp.com/${productHuntUrl}`
      ];
      
      let lastError = null;
      
      for (const proxyUrl of proxies) {
        try {
          console.log('🔄 Trying proxy:', proxyUrl);
          
          const response = await fetch(proxyUrl, {
          headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.ok) {
            html = await response.text();
            console.log('✅ Proxy successful!');
            setSubmitStatus({ message: 'Successfully fetched page content...', type: 'info' });
            break;
          } else {
            throw new Error(`Status: ${response.status}`);
          }
        } catch (proxyError) {
          console.warn('⚠️ Proxy failed:', proxyError.message);
          lastError = proxyError;
          continue;
        }
      }
      
      if (!html) {
        throw new Error(`All proxy services failed. Last error: ${lastError?.message}`);
      }

      setSubmitStatus({ message: 'Extracting tool information...', type: 'info' });

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const getMetaContent = (name) => {
        const meta = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
        return meta ? meta.getAttribute('content') : '';
      };

      const cleanText = (text) => {
        return text ? text.replace(/\s+/g, ' ').trim() : '';
      };

      const title = doc.querySelector('title')?.textContent || getMetaContent('og:title') || '';
      const description = getMetaContent('og:description') || getMetaContent('description') || '';
      
      let toolName = title.split(' - ')[0].replace(' | Product Hunt', '').trim();
      
      const h1Element = doc.querySelector('h1[data-sentry-component="LegacyText"]');
      if (h1Element) {
        toolName = cleanText(h1Element.textContent);
        console.log('🏷️ Tool name found:', toolName);
      }
      
      const descriptionContainer = doc.querySelector('[data-sentry-component="Description"]');
      let detailedDescription = description;
      
      if (descriptionContainer) {
        const descText = descriptionContainer.querySelector('p');
        if (descText) {
          detailedDescription = cleanText(descText.textContent);
          console.log('📝 Description found:', detailedDescription);
        }
      }

      let tagline = description.substring(0, 150);
      const h2Element = doc.querySelector('h2.text-18.text-gray-700');
      if (h2Element) {
        tagline = cleanText(h2Element.textContent);
        console.log('🎯 Tagline found:', tagline);
      }

      let websiteUrl = '';
      
      const websiteButton = doc.querySelector('[data-test="visit-website-button"]');
      if (websiteButton) {
        const onclick = websiteButton.getAttribute('onclick');
        if (onclick) {
          const urlMatch = onclick.match(/window\.open\(['"]([^'"]+)['"]/);
          if (urlMatch && urlMatch[1] && !urlMatch[1].includes('producthunt.com')) {
            websiteUrl = urlMatch[1];
            console.log('🌐 ✅ Website URL found from onclick:', websiteUrl);
          }
        }
        
        if (!websiteUrl && websiteButton.href && !websiteButton.href.includes('producthunt.com')) {
          websiteUrl = websiteButton.href;
          console.log('🌐 ⚠️ Website URL found from href (might be redirect):', websiteUrl);
        }
      }

      let logoUrl = '';
      
      const thumbnailImg = doc.querySelector('img[data-test*="-thumbnail"]');
      if (thumbnailImg) {
        if (thumbnailImg.srcset) {
          const srcsetEntries = thumbnailImg.srcset.split(',').map(entry => entry.trim());
          const highest = srcsetEntries.find(entry => entry.includes('3x')) || 
                         srcsetEntries.find(entry => entry.includes('2x')) || 
                         srcsetEntries[0];
          logoUrl = highest ? highest.split(' ')[0] : thumbnailImg.src;
        } else {
          logoUrl = thumbnailImg.src;
        }
        console.log('🎨 ✅ Logo found:', logoUrl);
      }

      const categoriesContainer = doc.querySelector('[data-sentry-component="Categories"]');
      let topics = [];

      if (categoriesContainer) {
        const categoryLinks = categoriesContainer.querySelectorAll('a[href*="/categories/"]');
        topics = Array.from(categoryLinks).map(el => {
          const categoryText = cleanText(el.textContent);
          console.log('📂 Category found:', categoryText);
          return categoryText;
        }).filter(Boolean);
        console.log('📂 All categories:', topics);
      }

      const mappedCategories = topics.map(topic => {
        const lower = topic.toLowerCase();
        
        if (lower === 'investing') return 'Finance';
        if (lower === 'fundraising resources') return 'Finance';  
        if (lower === 'artificial intelligence') return 'AI & Machine Learning';
        if (lower === 'productivity') return 'Productivity';
        if (lower === 'design tools') return 'Design';
        if (lower === 'developer tools') return 'Development';
        if (lower === 'marketing') return 'Marketing';
        if (lower === 'analytics') return 'Analytics';
        if (lower === 'communication') return 'Communication';
        if (lower === 'fintech') return 'Finance';
        if (lower === 'e-commerce') return 'E-commerce';
        if (lower === 'education') return 'Education';
        if (lower === 'health & fitness') return 'Health';
        if (lower === 'entertainment') return 'Entertainment';
        if (lower === 'cybersecurity') return 'Security';
        if (lower === 'social media') return 'Social Media';
        if (lower === 'content creation') return 'Content Creation';
        if (lower === 'customer support') return 'Customer Support';
        
        if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('artificial')) return 'AI & Machine Learning';
        if (lower.includes('invest') || lower.includes('finance') || lower.includes('fund')) return 'Finance';
        if (lower.includes('product') || lower.includes('efficiency')) return 'Productivity';
        if (lower.includes('design') || lower.includes('ui') || lower.includes('ux')) return 'Design';
        if (lower.includes('develop') || lower.includes('code') || lower.includes('programming')) return 'Development';
        if (lower.includes('market') || lower.includes('advertis')) return 'Marketing';
        if (lower.includes('analytic') || lower.includes('data') || lower.includes('metric')) return 'Analytics';
        if (lower.includes('chat') || lower.includes('message') || lower.includes('communicate')) return 'Communication';
        if (lower.includes('commerce') || lower.includes('shop') || lower.includes('store')) return 'E-commerce';
        if (lower.includes('learn') || lower.includes('course') || lower.includes('education')) return 'Education';
        if (lower.includes('health') || lower.includes('fitness') || lower.includes('medical')) return 'Health';
        if (lower.includes('game') || lower.includes('fun') || lower.includes('entertainment')) return 'Entertainment';
        if (lower.includes('security') || lower.includes('privacy') || lower.includes('safe')) return 'Security';
        if (lower.includes('social') || lower.includes('network')) return 'Social Media';
        if (lower.includes('content') || lower.includes('media') || lower.includes('video') || lower.includes('writing')) return 'Content Creation';
        if (lower.includes('support') || lower.includes('help') || lower.includes('service')) return 'Customer Support';
        
        return topic;
      }).slice(0, 3);

      if (!toolName) {
        throw new Error('Tool name not found');
      }

      let cleanWebsiteUrl = websiteUrl;
      let finalLogoUrl = logoUrl;
      
      if (cleanWebsiteUrl && cleanWebsiteUrl.startsWith('http')) {
        try {
          const url = new URL(cleanWebsiteUrl);
          url.searchParams.delete('ref');
          url.searchParams.set('ref', 'toolslash');
          cleanWebsiteUrl = url.toString();
          
          if (!logoUrl || logoUrl.includes('placeholder')) {
            finalLogoUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
          }
          
          console.log('🔗 Cleaned URL:', cleanWebsiteUrl);
          console.log('🎨 Final Logo URL:', finalLogoUrl);
        } catch (urlError) {
          console.warn('⚠️ URL parse error:', urlError);
        }
      }

      setSubmitStatus({ message: 'Taking website screenshot...', type: 'info' });

      let screenshotUrl = '';
      if (cleanWebsiteUrl) {
        try {
          console.log('📸 Taking website screenshot:', cleanWebsiteUrl);
          
          const functions = getFunctions();
          const takeScreenshotFunction = httpsCallable(functions, 'takeScreenshot');
          
          const screenshotResult = await takeScreenshotFunction({
            url: cleanWebsiteUrl,
            toolId: `temp_${Date.now()}`
          });
          
          if (screenshotResult.data && screenshotResult.data.screenshotUrl) {
            screenshotUrl = screenshotResult.data.screenshotUrl;
            console.log('📸 ✅ Screenshot captured:', screenshotUrl);
          }
        } catch (screenshotError) {
          console.warn('📸 ⚠️ Screenshot failed:', screenshotError.message);
        }
      }

      setSubmitStatus({ message: 'Saving to database...', type: 'info' });

      const finalSlug = generateSlug(toolName);
    if (!finalSlug) {
        throw new Error('Could not generate slug from tool name');
    }

      const toolData = {
        name: toolName,
        slug: finalSlug,
        tagline: tagline,
        description: detailedDescription || description,
        websiteUrl: cleanWebsiteUrl,
        logoUrl: finalLogoUrl,
        screenshotUrl: screenshotUrl,
        categories: mappedCategories,
        tags: [],
        platforms: [],
        pricingModel: '',
        pricingDetails: '',
        features: [],
        useCases: [],
        integrations: [],
        targetAudience: [],
        status: 'approved',
        isFeatured: false,
        upvotesCount: 0,
        commentsCount: 0,
        source: 'product_hunt_import',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      console.log('💾 Saving to Firebase:', toolData);
      
      const docRef = await addDoc(collection(db, 'tools'), toolData);
      console.log('✅ Successfully saved to Firebase! Doc ID:', docRef.id);
      
      setSubmitStatus({ 
        message: `🎉 "${toolName}" successfully imported and saved!`, 
        type: 'success' 
      });
      
      setProductHuntUrl('');
      
    } catch (error) {
      console.error('❌ Product Hunt URL analysis error:', error);
      setSubmitStatus({ 
        message: `Import failed: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>Admin Login | tool/</title>
        </Helmet>
        <main className="min-h-screen flex items-center justify-center bg-stone-900 px-4">
          <div className="max-w-md w-full bg-stone-800/50 p-8 rounded-lg border border-stone-700 shadow-xl">
            <div className="text-center mb-8">
              <Lock className="w-12 h-12 text-lime-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-stone-100">Admin Login</h1>
              <p className="text-stone-400 text-sm mt-2">Login to access the tool import panel</p>
            </div>
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-900/50 text-red-200 border border-red-700/60 rounded text-sm">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
    <div>
                <label htmlFor="username" className="block text-sm font-medium text-stone-300 mb-1">
                  Username
                </label>
      <input
        type="text"
                  id="username"
                  value={loginData.username}
                  onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-800/50 border border-stone-700 rounded text-stone-200 focus:border-lime-400 focus:outline-none"
                  required
      />
    </div>
    <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-300 mb-1">
                  Password
                </label>
            <input
                  type="password"
                  id="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-800/50 border border-stone-700 rounded text-stone-200 focus:border-lime-400 focus:outline-none"
                  required
                />
      </div>
              <button
                type="submit"
                className="w-full bg-lime-500 hover:bg-lime-600 text-stone-900 py-2.5 rounded font-semibold transition-colors"
              >
                Login
              </button>
            </form>
    </div>
        </main>
      </>
  );
  }

  return (
    <>
      <Helmet>
        <title>Import Tools | Admin Panel | tool/</title>
      </Helmet>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-stone-100 mb-4">
            <span className="text-lime-400">Admin</span> Tool Import
          </h1>
          <p className="text-xl text-stone-400 max-w-2xl mx-auto">
            Import tools directly from Product Hunt URLs. Automatically extracts all information and saves to database.
          </p>
        </div>

        {isSubmitting && (
          <div className="p-8 mb-8 rounded-xl text-center bg-gradient-to-br from-lime-900/30 to-green-900/30 border border-lime-500/50">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="text-2xl font-bold text-lime-300">🔄 Importing Tool...</p>
                <p className="text-sm text-lime-200 mt-1">Please wait while we extract and save the data</p>
              </div>
            </div>
            
            {submitStatus.message && submitStatus.type === 'info' && (
              <div className="mt-4 p-3 bg-lime-800/30 border border-lime-600/50 rounded-lg">
                <p className="text-lime-200 text-sm font-medium">{submitStatus.message}</p>
              </div>
            )}
          </div>
        )}

        {submitStatus.message && submitStatus.type !== 'info' && (
          <div className={`p-4 mb-8 rounded-lg text-sm flex items-center gap-3 ${
            submitStatus.type === 'success' 
              ? 'bg-lime-900/50 text-lime-200 border border-lime-700/60' 
              : 'bg-red-900/50 text-red-200 border border-red-700/60'
          }`}>
            {submitStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {submitStatus.message}
          </div>
        )}

        <div className="bg-gradient-to-br from-lime-900/20 to-green-900/20 p-8 rounded-xl border border-lime-700/40 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-lime-500/20 rounded-lg">
              <Lightning className="w-8 h-8 text-lime-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-100">Product Hunt Import</h2>
              <p className="text-stone-400">
                Paste any Product Hunt URL to automatically extract and import the tool
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
              <div>
              <label htmlFor="productHuntUrl" className="block text-sm font-semibold text-stone-300 mb-3">
                <Globe className="w-4 h-4 inline mr-2" />
                Product Hunt URL
                </label>
              <div className="flex gap-4">
                  <input
                  type="url"
                  id="productHuntUrl"
                  value={productHuntUrl}
                  onChange={(e) => setProductHuntUrl(e.target.value)}
                  className="flex-1 px-4 py-4 bg-stone-800/50 border border-stone-600 rounded-lg text-stone-200 placeholder-stone-500 focus:border-lime-400 focus:outline-none text-lg"
                  placeholder="https://www.producthunt.com/posts/your-tool-name"
                  disabled={isSubmitting}
                    />
                    <button
                      type="button"
                  onClick={analyzeProductHuntUrl}
                  disabled={isSubmitting || !productHuntUrl.trim()}
                  className={`flex items-center justify-center gap-3 px-8 py-4 rounded-lg text-lg font-bold transition-all duration-200 min-w-[220px] ${
                    isSubmitting 
                      ? 'bg-lime-600/70 text-lime-100 border-2 border-lime-400 cursor-not-allowed shadow-lg' 
                      : 'bg-lime-500 hover:bg-lime-600 text-stone-900 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                  >
                  {isSubmitting ? (
                      <>
                      <div className="w-6 h-6 border-3 border-lime-100 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-black">IMPORTING...</span>
                      </>
                    ) : (
                      <>
                      <Lightning className="w-6 h-6" />
                      <span className="font-bold">Import Tool</span>
                      </>
                    )}
                  </button>
              </div>
              <p className="text-stone-500 text-sm mt-3">
                Example: https://www.producthunt.com/posts/example-tool-name
              </p>
            </div>

            <div className="bg-stone-800/30 rounded-lg p-6 border border-stone-700/50">
              <h3 className="text-lg font-semibold text-stone-200 mb-3">What happens during import:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-stone-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  Extracts tool name, description, and tagline
            </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  Gets website URL and logo
            </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  Maps categories automatically
            </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  Takes website screenshot
            </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  Adds ref=toolslash to website URLs
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-lime-400 rounded-full"></div>
                  Saves to Firebase database
                </div>
                </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 