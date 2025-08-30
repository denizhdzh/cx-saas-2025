import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { db } from '../../firebase'; // Firebase db import, path updated
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Plus, Layout, ListBullets, Star, Lock, Download, Spinner } from 'phosphor-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ totalTools: 0, approvedTools: 0, pendingTools: 0, featuredTools: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isScrapingPH, setIsScrapingPH] = useState(false);
  const [scrapingResult, setScrapingResult] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    const adminUser = import.meta.env.VITE_ADMIN_USER;
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
    
    if (loginData.username === adminUser && loginData.password === adminPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      setLoginError('Kullanıcı adı veya şifre hatalı!');
    }
  };

  const handleProductHuntScraping = async () => {
    setIsScrapingPH(true);
    setScrapingResult(null);
    setError(null);
    
    try {
      const functions = getFunctions();
      const scrapeProductHuntManual = httpsCallable(functions, 'scrapeProductHuntManual');
      
      const result = await scrapeProductHuntManual();
      setScrapingResult(result.data);
      
      // Refresh stats after scraping
      await fetchStats();
    } catch (err) {
      console.error('Error scraping Product Hunt:', err);
      setError(`Product Hunt scraping failed: ${err.message}`);
    } finally {
      setIsScrapingPH(false);
    }
  };

  useEffect(() => {
    // Check if already authenticated
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const toolsCollectionRef = collection(db, 'tools');
        
        const allToolsSnapshot = await getDocs(toolsCollectionRef);
        const approvedToolsSnapshot = await getDocs(query(toolsCollectionRef, where('status', '==', 'approved')));
        const pendingToolsSnapshot = await getDocs(query(toolsCollectionRef, where('status', '==', 'pending')));
        const featuredToolsSnapshot = await getDocs(query(toolsCollectionRef, where('isFeatured', '==', true)));

        setStats({
          totalTools: allToolsSnapshot.size,
          approvedTools: approvedToolsSnapshot.size,
          pendingTools: pendingToolsSnapshot.size,
          featuredTools: featuredToolsSnapshot.size
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError("Failed to load dashboard statistics. Please try again later.");
      }
      setIsLoading(false);
    };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchStats();
  }, [isAuthenticated]);

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div className={`bg-stone-800/70 p-6 rounded-xl shadow-lg border border-stone-700/60 flex items-center gap-5 ${colorClass || 'border-stone-700/60'}`}>
      <div className={`p-3 rounded-lg bg-stone-700/50`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-stone-400 font-medium">{title}</p>
        {isLoading ? (
             <div className="h-8 w-12 bg-stone-700 rounded animate-pulse mt-1"></div>
        ) : (
            <p className="text-3xl font-bold text-stone-100">{value}</p>
        )}
      </div>
    </div>
  );

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
              <h1 className="text-2xl font-bold text-stone-100">Admin Girişi</h1>
              <p className="text-stone-400 text-sm mt-2">Admin paneline erişmek için giriş yapın</p>
            </div>
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-900/50 text-red-200 border border-red-700/60 rounded text-sm">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-stone-300 mb-1">
                  Kullanıcı Adı
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
                  Şifre
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
                Giriş Yap
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
        <title>Admin Dashboard | tool/</title>
      </Helmet>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-100 sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-lg text-stone-400">
              Overview of the platform and quick actions.
            </p>
          </div>
          <Link
            to="/admin/add-tool"
            className="mt-4 sm:mt-0 flex items-center gap-2 bg-lime-500 hover:bg-lime-600 text-stone-900 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-lime-500"
          >
            <Plus className="w-4 h-4" /> Add New Tool
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 text-red-200 border border-red-700/60 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Tools" value={stats.totalTools} icon={<Layout className="w-6 h-6 text-lime-400" />} />
          <StatCard title="Approved Tools" value={stats.approvedTools} icon={<ListBullets className="w-6 h-6 text-sky-400" />} /> 
          <StatCard title="Pending Review" value={stats.pendingTools} icon={<ListBullets className="w-6 h-6 text-amber-400" />} />
          <StatCard title="Featured Tools" value={stats.featuredTools} icon={<Star className="w-6 h-6 text-fuchsia-400" />} />
        </div>

        {/* Product Hunt Scraping Section */}
        <div className="bg-stone-800/50 p-6 rounded-lg shadow-md border border-stone-700/60 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-stone-100 mb-2">Product Hunt Scraping</h2>
              <p className="text-stone-400 text-sm">
                Manually trigger Product Hunt scraping or view automatic scraping status.
              </p>
            </div>
            <button
              onClick={handleProductHuntScraping}
              disabled={isScrapingPH}
              className="mt-4 sm:mt-0 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {isScrapingPH ? (
                <>
                  <Spinner className="w-4 h-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Scrape Product Hunt
                </>
              )}
            </button>
          </div>
          
          {scrapingResult && (
            <div className="mt-4 p-4 bg-green-900/50 border border-green-700/60 rounded-lg">
              <h3 className="text-green-200 font-medium mb-2">Scraping Completed Successfully!</h3>
              <div className="text-sm text-green-100 space-y-1">
                <p>• Found {scrapingResult.urlsFound} tool URLs on Product Hunt</p>
                <p>• Processed {scrapingResult.toolsProcessed} tools successfully</p>
                <p>• Saved {scrapingResult.savedCount} new tools to database</p>
                <p>• Completed at: {new Date(scrapingResult.timestamp).toLocaleString()}</p>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-xs text-stone-400">
            <p>🕐 Automatic scraping runs daily at 13:00 Amsterdam time</p>
            <p>📊 Only new tools (not already in database) will be added</p>
            <p>🔄 Website URLs automatically get referral tracking (ref=toolslash)</p>
          </div>
        </div>
        
        {/* Placeholder for future admin sections, e.g., list of tools, manage users etc. */}
        <div className="bg-stone-800/50 p-6 rounded-lg shadow-md border border-stone-700/60">
            <h2 className="text-xl font-semibold text-stone-100 mb-4">Future Admin Sections</h2>
            <p className="text-stone-400">
                This area can be expanded to include tables for managing tools (edit, delete), user management, viewing contact submissions, etc.
            </p>
        </div>

      </main>
    </>
  );
} 