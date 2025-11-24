// src/App.jsx - UPDATED
import React from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import MainLayout from './components/MainLayout';
import './App.css';
import './styles/animations.css';

// Move PayPal provider options outside component to avoid re-renders
const paypalOptions = {
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX,
    currency: "USD",
    intent: "capture",
};

function App() {
    return (
        <PayPalScriptProvider options={paypalOptions}>
            <div className="app">
                <MainLayout />
            </div>
        </PayPalScriptProvider>
    );
}

export default App;