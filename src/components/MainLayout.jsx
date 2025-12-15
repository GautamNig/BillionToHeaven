// src/components/MainLayout.jsx - UPDATED
import React, { useState } from 'react';
import RiveAnimation from './RiveAnimation';
import { UIStrings } from '../config/uiStrings';
import useAuth from '../hooks/useAuth';
import { AuthService } from '../lib/auth';
import NotificationBell from './NotificationBell';
import BottleInventory from './BottleInventory';
import BottleInboxTab from './BottleInboxTab'; // Add this import
import BottleDe

const MainLayout = () => {
    const [activeTab, setActiveTab] = useState('animation');
    const [showBottleInbox, setShowBottleInbox] = useState(false); // Add state for inbox
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    // Function to open bottle inbox from notifications
    const handleOpenBottleInbox = () => {
        setShowBottleInbox(true);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#2b0c5c',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Global Navigation Header with Auth */}
            <div style={{
                background: 'rgba(0, 0, 0, 0.95)',
                borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                padding: '10px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000,
                height: '60px', // Fixed height
                boxSizing: 'border-box'
            }}>
                {/* Logo/Title */}
                <div style={{
                    color: '#FFD93D',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span>🌟</span>
                    Billion To Heaven
                    <span>✨</span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    {/* Navigation Tabs */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                        <button
                            onClick={() => setActiveTab('animation')}
                            style={{
                                background: activeTab === 'animation' 
                                    ? 'linear-gradient(135deg, #FFD93D, #FF6B6B)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                color: activeTab === 'animation' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            🎮 Watch NuNu Climb
                        </button>
                    </div>

                    {/* Auth Buttons in Main Header */}
                    {user ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            {/* Update NotificationBell to open inbox */}
                            <NotificationBell 
                                onOpenInbox={handleOpenBottleInbox} 
                            />
                            <BottleInventory />
                            <div style={{
                                background: 'rgba(107, 207, 127, 0.2)',
                                padding: '8px 16px',
                                borderRadius: '15px',
                                border: '1px solid rgba(107, 207, 127, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    background: '#6bcf7f',
                                    borderRadius: '50%',
                                    animation: 'pulse 2s infinite'
                                }} />
                                <div style={{
                                    color: '#6bcf7f',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    {user.email.split('@')[0]}
                                </div>
                            </div>

                            <button
                                onClick={handleSignOut}
                                style={{
                                    background: 'rgba(255, 107, 107, 0.2)',
                                    color: '#ff6b6b',
                                    border: '1px solid rgba(255, 107, 107, 0.3)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {UIStrings.AUTH.SIGN_OUT}
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <button
                                onClick={AuthService.signInWithGoogle}
                                style={{
                                    background: 'linear-gradient(135deg, #8a7fff, #6366f1)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.transform = 'translateY(-1px)';
                                    e.target.style.boxShadow = '0 4px 12px rgba(138, 127, 255, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                {UIStrings.AUTH.SIGN_IN}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                position: 'relative',
                overflow: 'hidden',
                height: 'calc(100vh - 80px)' // Subtract header height
            }}>
                {/* RiveAnimation - Always mounted but hidden when not active */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: activeTab === 'animation' ? 'block' : 'none'
                }}>
                    <RiveAnimation />
                </div>
            </div>

            {/* Bottle Inbox Tab */}
            <BottleInboxTab
                isOpen={showBottleInbox}
                onClose={() => setShowBottleInbox(false)}
            />
        </div>
    );
};

export default MainLayout;