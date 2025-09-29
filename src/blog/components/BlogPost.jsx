import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import BlogLayout from './BlogLayout';
import { getBlogPostBySlug, getPublishedBlogPosts } from '../../utils/firebaseFunctions';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const blogPost = await getBlogPostBySlug(slug);
        if (blogPost) {
          setPost({
            ...blogPost,
            date: blogPost.createdAt?.toDate()?.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) || 'Recent'
          });

          // Get related posts
          const allPosts = await getPublishedBlogPosts();
          const related = allPosts
            .filter(p => p.slug !== slug && p.category === blogPost.category)
            .slice(0, 2)
            .map(p => ({
              ...p,
              date: p.createdAt?.toDate()?.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) || 'Recent'
            }));
          setRelatedPosts(related);
        }
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <BlogLayout
        title="Loading..."
        description="Loading blog post..."
        canonicalUrl={`https://orchis.app/blog/${slug}`}
      >
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading post...</p>
        </div>
      </BlogLayout>
    );
  }

  if (!post) {
    return (
      <BlogLayout
        title="Post Not Found"
        description="The blog post you're looking for doesn't exist."
        canonicalUrl={`https://orchis.app/blog/${slug}`}
      >
        <div className="text-center py-16">
          <h1 className="text-4xl font-thin text-neutral-900 mb-4">Post Not Found</h1>
          <p className="text-neutral-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="text-orange-600 hover:text-orange-700">
            ← Back to Blog
          </Link>
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout
      title={post.title}
      description={post.excerpt}
      keywords={post.keywords}
      canonicalUrl={`https://orchis.app/blog/${post.slug}`}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-neutral-500 mb-8">
        <Link to="/blog" className="hover:text-neutral-900">Blog</Link>
        <span>→</span>
        <Link to={`/blog/category/${post.category}`} className="hover:text-neutral-900 capitalize">
          {post.category}
        </Link>
        <span>→</span>
        <span className="text-neutral-900">{post.title}</span>
      </nav>

      {/* Article Header */}
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-orange-600 font-bold tracking-wider">
            {post.category.toUpperCase()}
          </span>
          {post.featured && (
            <span className="text-xs bg-neutral-900 text-white px-2 py-0.5 rounded-full">
              FEATURED
            </span>
          )}
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-thin text-neutral-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {post.featuredImage && (
          <div className="mb-8">
            <div className="aspect-video overflow-hidden rounded-xl">
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.description}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Photo by{' '}
              <a
                href={post.featuredImage.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 hover:text-neutral-900"
              >
                {post.featuredImage.author}
              </a>
              {' '}on Unsplash
            </div>
          </div>
        )}
        
        <p className="text-xl text-neutral-600 mb-6 leading-relaxed">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-sm text-neutral-500 border-t border-neutral-200 pt-6">
          <div className="flex items-center gap-4">
            <span>Published {post.date}</span>
            <span>•</span>
            <span>{post.readTime} min read</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-neutral-900 transition-colors">Share</button>
          </div>
        </div>
      </header>

      {/* Article Content */}
      <article className="blog-content">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>

      {/* Article Footer */}
      <footer className="mt-16 pt-8 border-t border-neutral-200">
        <div className="bg-neutral-50 rounded-xl p-8 text-center mb-12">
          <h3 className="text-xl font-medium text-neutral-900 mb-4">
            Ready to try Orchis?
          </h3>
          <p className="text-neutral-600 mb-6">
            Experience AI customer service that understands context and speaks like humans.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Join Waitlist
          </Link>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section>
            <h3 className="text-2xl font-thin text-neutral-900 mb-8">Related Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <article key={relatedPost.slug} className="group">
                  <Link to={`/blog/${relatedPost.slug}`} className="block">
                    <div className="bg-neutral-50 rounded-xl p-6 hover:bg-neutral-100 transition-colors">
                      <div className="text-xs text-orange-600 font-bold tracking-wider mb-3">
                        {relatedPost.category.toUpperCase()}
                      </div>
                      <h4 className="text-lg font-medium text-neutral-900 mb-3 group-hover:text-orange-600 transition-colors">
                        {relatedPost.title}
                      </h4>
                      <p className="text-neutral-600 text-sm mb-4">
                        {relatedPost.excerpt}
                      </p>
                      <div className="text-xs text-neutral-500">
                        {relatedPost.readTime} min read
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </footer>
    </BlogLayout>
  );
}