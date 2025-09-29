const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export const searchUnsplashPhotos = async (query, page = 1, perPage = 20) => {
  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results.map(photo => ({
      id: photo.id,
      url: photo.urls.regular,
      smallUrl: photo.urls.small,
      thumbUrl: photo.urls.thumb,
      description: photo.description || photo.alt_description || 'Unsplash image',
      author: photo.user.name,
      authorUrl: photo.user.links.html,
      downloadUrl: photo.links.download_location,
    }));
  } catch (error) {
    console.error('Error fetching Unsplash photos:', error);
    throw error;
  }
};

export const getFeaturedPhotos = async (page = 1, perPage = 20) => {
  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/photos?page=${page}&per_page=${perPage}&order_by=popular&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    return data.map(photo => ({
      id: photo.id,
      url: photo.urls.regular,
      smallUrl: photo.urls.small,
      thumbUrl: photo.urls.thumb,
      description: photo.description || photo.alt_description || 'Unsplash image',
      author: photo.user.name,
      authorUrl: photo.user.links.html,
      downloadUrl: photo.links.download_location,
    }));
  } catch (error) {
    console.error('Error fetching featured photos:', error);
    throw error;
  }
};

export const triggerDownload = async (downloadUrl) => {
  try {
    // Trigger download tracking as per Unsplash API guidelines
    await fetch(downloadUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });
  } catch (error) {
    console.error('Error triggering download:', error);
  }
};

export const getPhotosByCategory = async (category, page = 1, perPage = 20) => {
  const categoryQueries = {
    business: 'business office professional',
    technology: 'technology computer software',
    people: 'people team collaboration',
    abstract: 'abstract geometric pattern',
    nature: 'nature landscape minimal',
  };

  const query = categoryQueries[category] || category;
  return searchUnsplashPhotos(query, page, perPage);
};