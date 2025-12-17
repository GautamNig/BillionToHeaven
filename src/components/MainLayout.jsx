import { UIStrings } from '../config/uiStrings';
import useAuth from '../hooks/useAuth';
import { AuthService } from '../lib/auth';
import NotificationBell from './NotificationBell';
import BottleInventory from './BottleInventory';
import BottleInboxTab from './BottleInboxTab';
import SentBottlesTab from './SentBottlesTab';
import { MessageBottleService } from '../lib/messageBottleService';
import { supabase } from '../lib/supabase';
import InspirationTab from './InspirationTab';
import React, { useState, useEffect } from 'react';
import RiveAnimation from './RiveAnimation';


const MainLayout = () => {
    const [activeTab, setActiveTab] = useState('animation');
    const [showBottleInbox, setShowBottleInbox] = useState(false);
    const [showSentBottles, setShowSentBottles] = useState(false);
    const [unreadRepliesCount, setUnreadRepliesCount] = useState(0);
    const [viewedBottleIds, setViewedBottleIds] = useState(new Set()); // Track viewed bottles
    // Add state for the tab:
    const [showInspirationTab, setShowInspirationTab] = useState(false);

    const { user, signOut } = useAuth();

    // Load viewed bottles from localStorage on mount
    useEffect(() => {
        if (user) {
            const storedViewed = localStorage.getItem(`viewed_bottles_${user.id}`);
            if (storedViewed) {
                try {
                    const viewedIds = new Set(JSON.parse(storedViewed));
                    setViewedBottleIds(viewedIds);
                    console.log(`📋 Loaded ${viewedIds.size} viewed bottles from localStorage`);
                } catch (error) {
                    console.error('Error loading viewed bottles from localStorage:', error);
                }
            }
        }
    }, [user]);

    // Function to load reply counts - ONLY count unviewed bottles with replies
    const loadReplyCounts = async () => {
        if (!user) return;

        try {
            const bottles = await MessageBottleService.getUserBottles(user.id);
            const sentBottles = bottles.sent || [];

            // Count only bottles with replies that haven't been viewed yet
            const newRepliesCount = sentBottles.filter(b =>
                b.has_replies && !viewedBottleIds.has(b.id)
            ).length;

            setUnreadRepliesCount(newRepliesCount);
            console.log(`📊 Badge count: ${newRepliesCount} (${sentBottles.filter(b => b.has_replies).length} total with replies, ${viewedBottleIds.size} viewed)`);

        } catch (error) {
            console.error('Error loading reply counts:', error);
        }
    };

    // Mark a bottle as viewed and save to localStorage
    const markBottleAsViewed = (bottleId) => {
        setViewedBottleIds(prev => {
            const newSet = new Set([...prev, bottleId]);
            // Save to localStorage
            if (user) {
                localStorage.setItem(`viewed_bottles_${user.id}`, JSON.stringify([...newSet]));
            }
            console.log(`✅ Marked bottle ${bottleId} as viewed. Total viewed: ${newSet.size}`);
            return newSet;
        });

        // Reload counts after marking as viewed
        setTimeout(loadReplyCounts, 100); // Small delay to ensure state updates
    };

    // Load reply counts on user change and regularly
    useEffect(() => {
        if (user) {
            loadReplyCounts();

            // Subscribe to reply updates
            const subscription = supabase
                .channel('reply-counts-updates')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'bottle_replies'
                    },
                    () => {
                        console.log('🔄 New reply detected, updating badge count');
                        setTimeout(loadReplyCounts, 500); // Small delay to ensure DB updates
                    }
                )
                .on('postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'message_bottles'
                    },
                    (payload) => {
                        // Check if this is an update to has_replies
                        if (payload.new.has_replies) {
                            console.log('🔄 Bottle has_replies updated, updating badge count');
                            setTimeout(loadReplyCounts, 500);
                        }
                    }
                )
                .subscribe();

            return () => subscription.unsubscribe();
        }
    }, [user]);

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

    // Clear badge when opening sent bottles tab
    const handleOpenSentBottles = () => {
        setShowSentBottles(true);
        console.log('📤 Opening sent bottles tab');
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
                height: '60px',
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
                        {/* NEW INSPIRATION BUTTON */}
                        <button
                            onClick={() => setShowInspirationTab(true)}
                            style={{
                                background: showInspirationTab
                                    ? 'linear-gradient(135deg, #6bcf7f, #4a90e2)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                color: showInspirationTab ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                if (!showInspirationTab) {
                                    e.target.style.background = 'rgba(107, 207, 127, 0.2)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!showInspirationTab) {
                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                }
                            }}
                        >
                            💫 Why Donate?
                        </button>
                    </div>

                    {/* Auth Buttons in Main Header */}
                    {user ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            {/* Notification Bell */}
                            <NotificationBell
                                onOpenInbox={handleOpenBottleInbox}
                            />

                            {/* Bottle Inventory */}
                            <BottleInventory />

                            {/* Sent Bottles Button with Badge */}
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={handleOpenSentBottles}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        position: 'relative',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'transparent';
                                    }}
                                    title={`View your sent bottles${unreadRepliesCount > 0 ? ` (${unreadRepliesCount} new replies)` : ''}`}
                                >
                                    📤
                                    {unreadRepliesCount > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '-5px',
                                            background: '#ff6b6b',
                                            color: 'white',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            minWidth: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '2px',
                                            border: '2px solid rgba(0, 0, 0, 0.95)',
                                            animation: 'pulse 2s infinite'
                                        }}>
                                            {unreadRepliesCount > 9 ? '9+' : unreadRepliesCount}
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* User Info */}
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

                            {/* Sign Out Button */}
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
                                onMouseOver={(e) => {
                                    e.target.style.background = 'rgba(255, 107, 107, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'rgba(255, 107, 107, 0.2)';
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
                height: 'calc(100vh - 80px)'
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

            {/* Sent Bottles Tab */}
            <SentBottlesTab
                isOpen={showSentBottles}
                onClose={() => {
                    setShowSentBottles(false);
                    // Reload counts when closing the tab
                    setTimeout(loadReplyCounts, 100);
                }}
                onBottleViewed={markBottleAsViewed}
                user={user}
            />
            <InspirationTab
                isOpen={showInspirationTab}
                onClose={() => setShowInspirationTab(false)}
            />
        </div>
    );
};

export default MainLayout;