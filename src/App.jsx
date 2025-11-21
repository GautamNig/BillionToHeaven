// src/App.jsx
import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import AuthPage from './components/AuthPage';
import RiveAnimation from './components/RiveAnimation';
import useAuth from './hooks/useAuth';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error.message);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#2b0c5c',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider 
      options={{
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX,
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="app">
        {!user ? (
          <AuthPage onSignIn={handleSignIn} />
        ) : (
          <RiveAnimation />
        )}
      </div>
    </PayPalScriptProvider>
  );
}

export default App;