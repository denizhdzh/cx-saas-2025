import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function BlogLayout({ children, title, description, keywords, canonicalUrl }) {
  return (
    <>
      <Helmet>
        <title>{title} | Orchis Blog</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta property="og:title" content={`${title} | Orchis Blog`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${title} | Orchis Blog`} />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Blog Header */}
        <header className="border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/logonaked.png" alt="Orchis" className="h-8 w-auto" />
                <span className="text-sm text-neutral-500">/</span>
                <span className="text-sm font-medium text-neutral-900">Blog</span>
              </Link>
              
              <nav className="flex items-center space-x-6">
                <Link to="/blog" className="text-sm text-neutral-600 hover:text-neutral-900">
                  All Posts
                </Link>
                <Link to="/blog/category/comparisons" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Comparisons
                </Link>
                <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900">
                  Home
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Blog Footer */}
        <footer className="border-t border-neutral-200 mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-sm text-neutral-500">
                © 2024 Orchis. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}