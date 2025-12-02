// src/components/AuthModal.jsx
import React from 'react';
import { supabase } from '../lib/supabase';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const handleGoogleLogin= async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        {/* Close Button */}
        <button 
          className="auth-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Header */}
        <div className="auth-modal-header">
          <h2>Join the Journey! 🌟</h2>
          <p>Sign in to help NuNu climb to heaven</p>
        </div>

        {/* Google Login Button */}
        <div className="auth-social-buttons">
          <button
            type="button"
            className="auth-social-btn google-btn"
            onClick={handleGoogleLogin}
          >
            <span className="social-icon">🔍</span>
            Continue with Google
          </button>
        </div>

        {/* Guest Option */}
        <div className="auth-guest">
          <button 
            type="button" 
            className="guest-btn"
            onClick={onClose}
          >
            Continue as Guest 🙂
          </button>
          <p className="guest-note">
            You can still watch the animation, but signing in lets you donate and see your contributions!
          </p>
        </div>

        {/* Benefits */}
        <div className="auth-benefits">
          <h4>✨ Why Sign In?</h4>
          <ul>
            <li>🎁 Make donations to help NuNu climb</li>
            <li>📜 See your name in donation history</li>
            <li>🚀 Watch real-time animations from your donations</li>
            <li>💫 Join the community helping NuNu reach heaven</li>
          </ul>
        </div>
      </div>
    </div>
  );
}