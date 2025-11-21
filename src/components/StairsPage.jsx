// src/components/StairsPage.jsx
import React from 'react';

export default function StairsPage({ user, onSignOut }) {
  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-content">
          <h1 className="chat-title">Stairs To Heaven</h1>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <button onClick={onSignOut} className="sign-out-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="chat-main">
        <div className="chat-placeholder">
          <div className="fire-emoji">🔥</div>
          <h2>Welcome to StairsPage!</h2>
          <p>Stairs functionality coming soon...</p>
        </div>
      </main>
    </div>
  );
}