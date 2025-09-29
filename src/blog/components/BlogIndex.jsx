import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BlogLayout from './BlogLayout';
import { getPublishedBlogPosts } from '../../utils/firebaseFunctions';

export default function BlogIndex() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const publishedPosts = await getPublishedBlogPosts();
        setPosts(publishedPosts.map(post => ({
          ...post,
          date: post.createdAt?.toDate()?.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) || 'Recent'
        })));
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const featuredPosts = posts.filter(post => post.featured);
  const recentPosts = posts.slice(0, 6);

  if (loading) {
    return (
      <BlogLayout
        title="AI Customer Service Insights & Comparisons"
        description="Discover the latest insights on AI customer service, chatbot comparisons, and industry best practices."
        keywords="AI customer service, chatbot comparison, customer support automation"
        canonicalUrl="https://orchis.app/blog"
      >
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading blog posts...</p>
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout
      title="AI Customer Service Insights & Comparisons"
      description="Discover the latest insights on AI customer service, chatbot comparisons, and industry best practices. Compare Orchis with competitors like Fin.ai, Intercom, and Zendesk."
      keywords="AI customer service, chatbot comparison, Orchis vs competitors, customer support automation, AI agents"
      canonicalUrl="https://orchis.app/blog"
    >
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-thin text-neutral-900 mb-6">
          AI Customer Service
          <br />
          <span className="text-neutral-500">Insights & Comparisons</span>
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Deep dives into AI customer service, competitive analysis, and industry insights 
          to help you make informed decisions about your customer support strategy.
        </p>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-thin text-neutral-900 mb-8">Featured Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredPosts.map((post) => (
              <article key={post.slug} className="group">
                <Link to={`/blog/${post.slug}`} className="block">
                  <div className="bg-neutral-50 rounded-xl overflow-hidden hover:bg-neutral-100 transition-colors">
                    {post.featuredImage && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.featuredImage.url}
                          alt={post.featuredImage.description}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-orange-600 font-bold tracking-wider">
                          {post.category.toUpperCase()}
                        </span>
                        {post.featured && (
                          <span className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded-full">
                            FEATURED
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-medium text-neutral-900 mb-3 group-hover:text-orange-600 transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-neutral-600 text-sm mb-4">
                        {post.excerpt.length > 150 ? post.excerpt.substring(0, 150) + '...' : post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{post.date}</span>
                        <span>{post.readTime} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* All Posts */}
      <section>
        <h2 className="text-2xl font-thin text-neutral-900 mb-8">Latest Articles</h2>
        <div className="space-y-8">
          {recentPosts.map((post) => (
            <article key={post.slug} className="group">
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="border-b border-neutral-200 pb-8 hover:border-neutral-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-orange-600 font-bold tracking-wider">
                      {post.category.toUpperCase()}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500">{post.date}</span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500">{post.readTime} min read</span>
                  </div>
                  <h3 className="text-2xl font-thin text-neutral-900 mb-4 group-hover:text-orange-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed mb-4">
                    {post.excerpt}
                  </p>
                  <div className="text-sm text-orange-600 group-hover:text-orange-700 transition-colors">
                    Read article →
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="mt-16 bg-neutral-50 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-medium text-neutral-900 mb-4">
          Stay Updated
        </h3>
        <p className="text-neutral-600 mb-6">
          Get the latest insights on AI customer service delivered to your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
            Subscribe
          </button>
        </div>
      </section>
    </BlogLayout>
  );
}