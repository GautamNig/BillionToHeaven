// src/hooks/useAuth.js - UPDATED VERSION
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [autoShowModal, setAutoShowModal] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) setError(sessionError);
        }
        
        if (mounted) {
          console.log('👤 Session user:', session?.user?.id);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, 'user:', session?.user?.id);
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove autoShowModal from dependencies

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('👋 Signing out user:', user?.id);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Reset states
      setUser(null);
      setAutoShowModal(true);
      console.log('✅ Signed out successfully');
      
    } catch (error) {
      console.error('❌ Error signing out:', error.message);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
    authMode,
    setAuthMode,
    autoShowModal,
    setAutoShowModal
  };
}