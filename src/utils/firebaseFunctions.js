import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc as firestoreDeleteDoc,
  query,
  orderBy,
  where,
  limit
} from 'firebase/firestore';

const functions = getFunctions();

// Process document
export const processDocument = httpsCallable(functions, 'processDocument');

// Chat with agent
export const chatWithAgent = httpsCallable(functions, 'chatWithAgent');

// Get agent conversations
export const getAgentConversations = httpsCallable(functions, 'getAgentConversations');

// Delete document
export const deleteDocument = httpsCallable(functions, 'deleteDocument');

// Add email to waitlist
export const addToWaitlist = async (email) => {
  try {
    // Check if email already exists
    const q = query(
      collection(db, 'waitlist'),
      where('email', '==', email.toLowerCase().trim())
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      throw new Error('DUPLICATE_EMAIL');
    }

    const docRef = await addDoc(collection(db, 'waitlist'), {
      email: email.toLowerCase().trim(),
      timestamp: serverTimestamp(),
      source: 'website'
    });
    console.log('Email added to waitlist with ID: ', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding email to waitlist: ', error);
    throw error;
  }
};

// Helper function to convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:type;base64, prefix
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// Admin authentication
export const adminLogin = async (email, password) => {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  
  console.log('Admin env check:', { adminEmail, adminPassword: adminPassword ? '***' : 'undefined' }); // Debug
  
  if (email === adminEmail && password === adminPassword) {
    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem('adminAuthTime', Date.now().toString());
    return { success: true };
  } else {
    throw new Error('Invalid credentials');
  }
};

export const isAdminAuthenticated = () => {
  const isAuth = localStorage.getItem('adminAuth') === 'true';
  const authTime = localStorage.getItem('adminAuthTime');
  
  // Session expires after 24 hours
  if (isAuth && authTime) {
    const timeDiff = Date.now() - parseInt(authTime);
    if (timeDiff > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminAuthTime');
      return false;
    }
  }
  
  return isAuth;
};

export const adminLogout = () => {
  localStorage.removeItem('adminAuth');
  localStorage.removeItem('adminAuthTime');
};

// Blog post functions
export const createBlogPost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, 'admin/blog/posts'), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      published: false
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating blog post: ', error);
    throw error;
  }
};

export const getBlogPosts = async () => {
  try {
    const q = query(
      collection(db, 'admin/blog/posts'), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting blog posts: ', error);
    throw error;
  }
};

export const getPublishedBlogPosts = async () => {
  try {
    const q = query(
      collection(db, 'admin/blog/posts'), 
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting published blog posts: ', error);
    throw error;
  }
};

export const getBlogPostBySlug = async (slug) => {
  try {
    const q = query(
      collection(db, 'admin/blog/posts'), 
      where('slug', '==', slug),
      where('published', '==', true),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting blog post by slug: ', error);
    throw error;
  }
};

export const updateBlogPost = async (id, updateData) => {
  try {
    const docRef = doc(db, 'admin/blog/posts', id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating blog post: ', error);
    throw error;
  }
};

export const deleteBlogPost = async (id) => {
  try {
    await firestoreDeleteDoc(doc(db, 'admin/blog/posts', id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting blog post: ', error);
    throw error;
  }
};

// Admin stats function
export const getAdminStats = httpsCallable(functions, 'getAdminStats');