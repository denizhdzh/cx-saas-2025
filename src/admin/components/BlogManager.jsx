import React, { useState, useEffect } from 'react';
import { 
  getBlogPosts, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost 
} from '../../utils/firebaseFunctions';
import ImagePicker from './ImagePicker';

export default function BlogManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'insights',
    keywords: '',
    featured: false,
    published: false,
    featuredImage: null
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const blogPosts = await getBlogPosts();
      setPosts(blogPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
      ...(name === 'title' && { slug: generateSlug(value) })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPost) {
        await updateBlogPost(editingPost.id, formData);
      } else {
        await createBlogPost({
          ...formData,
          readTime: Math.ceil(formData.content.split(' ').length / 200)
        });
      }
      
      await loadPosts();
      setShowForm(false);
      setEditingPost(null);
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'insights',
        keywords: '',
        featured: false,
        published: false,
        featuredImage: null
      });
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || 'insights',
      keywords: post.keywords || '',
      featured: post.featured || false,
      published: post.published || false,
      featuredImage: post.featuredImage || null
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteBlogPost(id);
        await loadPosts();
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const togglePublished = async (post) => {
    try {
      await updateBlogPost(post.id, { published: !post.published });
      await loadPosts();
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  if (loading && posts.length === 0) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-thin text-neutral-900">Blog Posts</h2>
          <p className="text-neutral-600">Manage your blog content</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          New Post
        </button>
      </div>

      {/* Blog Post Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="insights">Insights</option>
                  <option value="comparisons">Comparisons</option>
                  <option value="guides">Guides</option>
                  <option value="news">News</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Keywords (comma separated)
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="AI, customer service, comparison"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Excerpt
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <ImagePicker
              selectedImage={formData.featuredImage}
              onImageSelect={(image) => setFormData(prev => ({ ...prev, featuredImage: image }))}
            />

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Content (HTML)
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={20}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 font-mono text-sm"
                required
                placeholder="<h2>Introduction</h2>
<p>Your content here...</p>

<h3>Key Features</h3>
<ul>
<li>Feature 1</li>
<li>Feature 2</li>
</ul>"
              />
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Featured Post
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Published
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="bg-neutral-900 text-white px-6 py-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {editingPost ? 'Update Post' : 'Create Post'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPost(null);
                  setFormData({
                    title: '',
                    slug: '',
                    excerpt: '',
                    content: '',
                    category: 'insights',
                    keywords: '',
                    featured: false,
                    published: false,
                    featuredImage: null
                  });
                }}
                className="border border-neutral-200 text-neutral-700 px-6 py-2 rounded-lg hover:border-neutral-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No blog posts yet. Create your first post!
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {posts.map((post) => (
              <div key={post.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        post.published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                      {post.featured && (
                        <span className="text-xs bg-neutral-900 text-white px-2 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                      <span className="text-xs text-neutral-500 capitalize">
                        {post.category}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">
                      {post.title}
                    </h3>
                    
                    <p className="text-sm text-neutral-600 mb-2">
                      {post.excerpt}
                    </p>
                    
                    <div className="text-xs text-neutral-500">
                      Slug: /{post.slug}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => togglePublished(post)}
                      className={`text-xs px-3 py-1 rounded transition-colors cursor-pointer ${
                        post.published
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {post.published ? 'Unpublish' : 'Publish'}
                    </button>
                    
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-xs bg-neutral-100 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}