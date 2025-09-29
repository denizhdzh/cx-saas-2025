import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
    const docRef = await addDoc(collection(db, 'waitlist'), {
      email: email,
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