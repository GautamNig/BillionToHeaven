// src/hooks/useAuth.js - UPDATED VERSION
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [autoShowModal, setAutoShowModal] = useState(true); // Control auto-show behavior

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Only show auth modal if no user and auto-show is enabled
      if (!session?.user && autoShowModal) {
        setShowAuthModal(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Close modal when user logs in
      if (session?.user) {
        setShowAuthModal(false);
        setAutoShowModal(true); // Reset for next time
      } else {
        // Only auto-show modal on sign-out if it's the first time
        // Don't force show if user manually closed it
        if (autoShowModal) {
          setShowAuthModal(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [autoShowModal]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Reset auto-show flag on sign out
      setAutoShowModal(true);
    } catch (error) {
      console.error('Error signing out:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    setAutoShowModal(true); // Re-enable auto-show when manually opening
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAutoShowModal(false); // Disable auto-show when manually closed
  };

  return {
    user,
    loading,
    signOut,
    showAuthModal,
    authMode,
    openAuthModal,
    closeAuthModal,
    setAuthMode
  };
}