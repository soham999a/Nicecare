/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { COLLECTIONS } from '../backend/firestore/collections';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name in Firebase Auth
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Wait for the auth token to be ready before writing to Firestore
    // This ensures the user is fully authenticated
    await user.reload();
    
    // Create user profile document in Firestore
    try {
      await setDoc(doc(db, COLLECTIONS.CRM_INTERNAL_USER_PROFILES, user.uid), {
        email: user.email,
        displayName: displayName || '',
        createdAt: serverTimestamp(),
      });
    } catch (firestoreError) {
      console.error('Firestore write error:', firestoreError);
      // Continue even if Firestore write fails - user is still created
    }

    // Send email verification
    await sendEmailVerification(user);

    return user;
  }

  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function resendVerificationEmail() {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
    throw new Error('No user logged in');
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
