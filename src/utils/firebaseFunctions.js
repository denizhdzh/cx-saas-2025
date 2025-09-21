import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Process document
export const processDocument = httpsCallable(functions, 'processDocument');

// Chat with agent
export const chatWithAgent = httpsCallable(functions, 'chatWithAgent');

// Get agent conversations
export const getAgentConversations = httpsCallable(functions, 'getAgentConversations');

// Delete document
export const deleteDocument = httpsCallable(functions, 'deleteDocument');

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