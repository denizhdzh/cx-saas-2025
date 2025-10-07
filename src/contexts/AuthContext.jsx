import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChange, auth, db, functions } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (authUser) => {
    if (authUser) {
      try {
        // Call backend function to initialize/verify user document
        const initializeUser = httpsCallable(functions, 'initializeUser');
        const result = await initializeUser();

        console.log('🔥 User initialization result:', result.data);

        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Merge Firestore data with auth user
          setUser({
            ...authUser,
            photoURL: userData.photoURL || authUser.photoURL,
            displayName: userData.displayName || authUser.displayName
          });
        } else {
          setUser(authUser);
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
        setUser(authUser);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      await loadUserData(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await loadUserData(auth.currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};