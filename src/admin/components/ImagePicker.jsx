import React, { useState, useEffect } from 'react';
import { searchUnsplashPhotos, getFeaturedPhotos, triggerDownload } from '../../utils/unsplashApi';

export default function ImagePicker({ onImageSelect, selectedImage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('featured');

  useEffect(() => {
    if (isOpen && activeTab === 'featured') {
      loadFeaturedImages();
    }
  }, [isOpen, activeTab]);

  const loadFeaturedImages = async () => {
    setLoading(true);
    try {
      const photos = await getFeaturedPhotos(1, 15);
      console.log('Featured photos loaded:', photos); // Debug
      setImages(photos);
    } catch (error) {
      console.error('Error loading featured images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setActiveTab('search');
    try {
      const photos = await searchUnsplashPhotos(searchQuery, 1, 15);
      setImages(photos);
    } catch (error) {
      console.error('Error searching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (image) => {
    try {
      // Trigger download tracking
      await triggerDownload(image.downloadUrl);
      
      // Call the parent callback
      onImageSelect({
        url: image.url,
        thumbUrl: image.thumbUrl,
        description: image.description,
        author: image.author,
        authorUrl: image.authorUrl,
        unsplashId: image.id
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  const categories = [
    { id: 'business', label: 'Business', query: 'business office professional' },
    { id: 'technology', label: 'Technology', query: 'technology computer software' },
    { id: 'people', label: 'People', query: 'people team collaboration' },
    { id: 'abstract', label: 'Abstract', query: 'abstract geometric pattern' },
  ];

  const handleCategoryClick = async (category) => {
    setLoading(true);
    setActiveTab('category');
    setSearchQuery(category.query);
    
    try {
      const photos = await searchUnsplashPhotos(category.query, 1, 15);
      setImages(photos);
    } catch (error) {
      console.error('Error loading category images:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">
        Featured Image
      </label>
      
      {selectedImage ? (
        <div className="relative group">
          <img
            src={selectedImage.thumbUrl}
            alt={selectedImage.description}
            className="w-full h-48 object-cover rounded-lg border border-neutral-200"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="bg-white text-neutral-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Change Image
            </button>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Photo by{' '}
            <a
              href={selectedImage.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-700 hover:text-neutral-900"
            >
              {selectedImage.author}
            </a>
            {' '}on Unsplash
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full h-48 border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center hover:border-neutral-400 transition-colors cursor-pointer"
        >
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-sm font-medium text-neutral-700">Select Featured Image</div>
            <div className="text-xs text-neutral-500 mt-1">Browse from Unsplash</div>
          </div>
        </button>
      )}

      {/* Image Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-900">Select Featured Image</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search & Categories */}
            <div className="p-6 border-b border-neutral-200">
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for images..."
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('featured');
                    loadFeaturedImages();
                  }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors cursor-pointer ${
                    activeTab === 'featured'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Featured
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryClick(category)}
                    className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Images Grid */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
                </div>
              ) : images.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="w-full h-32 border border-gray-300 rounded overflow-hidden">
                      <img
                        src={image.smallUrl}
                        alt={image.description}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                        onClick={() => handleImageSelect(image)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  No images found. Try a different search term.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}