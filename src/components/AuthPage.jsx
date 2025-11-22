// src/components/AuthPage.jsx
import React from "react";
import GoogleIcon from "./GoogleIcon";

export default function AuthPage({ onSignIn }) {
  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Billion To Heaven</h1>
            <p className="auth-subtitle">Help NuNu reach heaven.</p>
          </div>
          
          <div className="auth-animation">
            <div className="fire-animation">
              <span className="fire-emoji">🔥</span>
            </div>
          </div>
          
          <button 
            onClick={onSignIn} 
            className="google-signin-btn"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
          
          <p className="auth-security-note">
            Secure authentication powered by Google
          </p>
        </div>
      </div>
    </div>
  );
}