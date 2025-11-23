// src/App.jsx
import React from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import RiveAnimation from './components/RiveAnimation';
import './App.css';

function App() {
  return (
    <PayPalScriptProvider 
      options={{
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX,
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="app">
        {/* Always show RiveAnimation - it will handle the auth modal internally */}
        <RiveAnimation />
      </div>
    </PayPalScriptProvider>
  );
}

export default App;