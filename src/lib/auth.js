// src/lib/auth.js
import { supabase } from './supabase';

export const AuthService = {
  async signInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL || ''}`,
          skipBrowserRedirect: false
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  async signOut() {
    await supabase.auth.signOut();
  }
};