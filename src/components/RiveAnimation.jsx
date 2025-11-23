// src/components/RiveAnimation.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRive } from '@rive-app/react-webgl2';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { DonationsService } from '../lib/donationsService';
import useAuth from '../hooks/useAuth';
import DonationBarGraph from './DonationBarGraph';
import { AppSettings } from '../config/settings';
import DonationThankYouTooltip from './DonationThankYouTooltip';
import AuthModal from './AuthModal';

// Add this to the top of your RiveAnimation.jsx, after the imports
const DONATION_MESSAGES_CONFIG = {
    POSITIONS: [
        { x: 50, y: 20 },  // Top center  
        { x: 50, y: 90 },  // Bottom center
    ]
};

// Your existing PayPalDonationButton component should handle any amount
function PayPalDonationButton({ amount, onDonationSuccess, disabled }) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    const createOrder = (data, actions) => {
        // Validate amount
        const validAmount = Math.max(1, parseFloat(amount) || 1);

        return actions.order.create({
            purchase_units: [
                {
                    amount: {
                        value: validAmount.toString(),
                        currency_code: "USD"
                    },
                    description: `Donation for ${validAmount} stair${validAmount > 1 ? 's' : ''}`
                }
            ]
        });
    };

    const onApprove = (data, actions) => {
        return actions.order.capture().then((details) => {
            console.log('🎉 PayPal donation approved:', details);
            const validAmount = Math.max(1, parseFloat(amount) || 1);
            onDonationSuccess(validAmount, details);
        });
    };

    const onError = (err) => {
        console.error('❌ PayPal error:', err);
    };

    // Rest of your existing PayPalDonationButton code...
    if (isRejected) {
        return (
            <div style={{
                color: '#ff6b6b',
                fontSize: '12px',
                textAlign: 'center',
                padding: '10px'
            }}>
                PayPal failed to load
            </div>
        );
    }

    if (isPending) {
        return (
            <div style={{
                color: '#ffd93d',
                fontSize: '12px',
                textAlign: 'center',
                padding: '10px'
            }}>
                Loading PayPal...
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            <PayPalButtons
                createOrder={createOrder}
                onApprove={onApprove}
                onError={onError}
                style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'pill',
                    label: 'donate',
                    height: 40
                }}
                disabled={disabled}
            />
        </div>
    );
}

export default function RiveAnimation() {
    const [totalMoney, setTotalMoney] = useState(0);
    const [currentGoal, setCurrentGoal] = useState(1000000000);
    const [isClimbing, setIsClimbing] = useState(false);
    const [currentDonation, setCurrentDonation] = useState(0);
    const [donationHistory, setDonationHistory] = useState([]);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState('');
    const directionInputRef = useRef();
    const riveContainerRef = useRef();
    // In RiveAnimation.jsx - Add these states
    const [allDonations, setAllDonations] = useState([]);
    const [graphData, setGraphData] = useState([]);
    const [graphRefreshTrigger, setGraphRefreshTrigger] = useState(0);
    const [donationMessages, setDonationMessages] = useState([]);
    const [customAmount, setCustomAmount] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);
    const [showDonationHistory, setShowDonationHistory] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [riveLoaded, setRiveLoaded] = useState(false);

    const { user, signOut, showAuthModal, openAuthModal, closeAuthModal } = useAuth();

    const { RiveComponent, rive } = useRive({
        src: `${import.meta.env.BASE_URL}rive/8866-17054-stairs-marcelo-bazani.riv`,
        autoplay: true,
        stateMachines: ["State Machine 1"],
        onLoad: () => {
            console.log('✅ Rive animation loaded');
            setRiveLoaded(true);
        },
        onLoadError: (error) => {
            console.error('❌ Rive loading error:', error);
            setRiveLoaded(true); // Still set to true to show fallback
        },
    });

    // Donation History Item Component
    const DonationHistoryItem = ({ donation, isCurrentUser, index }) => {
        const formatTime = (timestamp) => {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            return date.toLocaleDateString();
        };

        const getUsername = (email) => {
            if (!email) return 'Anonymous';
            return email.split('@')[0];
        };

        const amount = parseFloat(donation.amount);
        const isAnonymous = !donation.user_email;

        return (
            <div key={`donation-${donation.id}-${index}`} style={{
                background: isCurrentUser
                    ? 'rgba(255, 217, 61, 0.1)'
                    : isAnonymous
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isCurrentUser ? 'rgba(255, 217, 61, 0.3)' :
                        isAnonymous ? 'rgba(255, 255, 255, 0.1)' :
                            'rgba(138, 127, 255, 0.3)'
                    }`,
                borderRadius: '8px',
                padding: '10px 12px',
                animation: `slideIn 0.3s ease ${index * 0.1}s forward`
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px'
                }}>
                    {/* Left side - User and Message */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px'
                        }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                background: isCurrentUser ? '#FFD93D' :
                                    isAnonymous ? 'rgba(255, 255, 255, 0.3)' : '#8a7fff',
                                borderRadius: '50%',
                                flexShrink: 0
                            }} />
                            <div style={{
                                color: isCurrentUser ? '#FFD93D' :
                                    isAnonymous ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                                fontSize: '11px',
                                fontWeight: isAnonymous ? '400' : '600',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontStyle: isAnonymous ? 'italic' : 'normal'
                            }}>
                                {isCurrentUser ? 'You' : getUsername(donation.user_email)}
                                {isAnonymous && ' 🎭'}
                            </div>
                        </div>

                        <div style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '10px',
                            lineHeight: '1.3'
                        }}>
                            Helped NuNu climb {amount} stair{amount > 1 ? 's' : ''} {isCurrentUser ? '🎉' : '✨'}
                        </div>
                    </div>

                    {/* Right side - Amount and Time */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '4px',
                        flexShrink: 0
                    }}>
                        <div style={{
                            background: isCurrentUser
                                ? 'rgba(255, 217, 61, 0.2)'
                                : isAnonymous
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(138, 127, 255, 0.2)',
                            color: isCurrentUser ? '#FFD93D' :
                                isAnonymous ? 'rgba(255, 255, 255, 0.7)' : '#8a7fff',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            minWidth: '45px',
                            textAlign: 'center',
                            border: isAnonymous ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                        }}>
                            ${amount}
                        </div>

                        <div style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '9px',
                            whiteSpace: 'nowrap'
                        }}>
                            {formatTime(donation.created_at)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ======================
    // CONFIGURABLE SETTINGS
    // ======================

    // Tilt Configuration
    const tiltConfig = {
        perspective: 1000,    // Higher = more dramatic 3D effect
        rotateY: -35,         // Negative = facing left, Positive = facing right
        rotateX: 0,           // Negative = leaning back, Positive = leaning forward
        scale: 1.0            // Image size (1.0 = normal, 1.1 = slightly larger)
    };

    // Glow Configuration - Enhanced for glow-only effect
    const glowConfig = {
        // Inner glow (close to image edges)
        innerGlow: {
            color: 'rgba(255, 215, 0, 0.6)',  // Brighter inner glow
            blur: 25,                         // px - inner glow spread
            spread: 0                         // px - no spread for clean edges
        },
        // Middle glow
        middleGlow: {
            color: 'rgba(255, 215, 0, 0.4)',
            blur: 50,
            spread: 0
        },
        // Outer glow (soft halo)
        outerGlow: {
            color: 'rgba(255, 215, 0, 0.2)',
            blur: 100,
            spread: 0
        },
        // No inset glow since we're removing the frame
        insetGlow: {
            color: 'rgba(255, 215, 0, 0)',
            blur: 0,
            spread: 0
        }
    };

    // Border Configuration - REMOVED (set to transparent/zero)
    const borderConfig = {
        width: 0,                           // No border
        color: 'transparent',               // Transparent color
        radius: 10                          // Keep some radius for the image itself
    };

    // Hover Effect Configuration
    const hoverConfig = {
        rotateY: -10,        // Less tilt on hover
        rotateX: 3,          // Less vertical tilt on hover  
        scale: 1.02,         // Slight zoom on hover
        glowBoost: 1.5       // More glow boost on hover (1.5 = 50% brighter)
    };

    // Background Glow Configuration - Enhanced for glow-only
    const backgroundGlowConfig = {
        intensity: 0.9,      // Increased intensity for stronger glow
        size: '120%',         // Slightly larger glow container
        borderRadius: 15     // Match image borderRadius
    };

    // Filter Effects
    const filterConfig = {
        brightness: 1.1,     // 1.0 = normal, >1.0 = brighter
        contrast: 1.1,       // 1.0 = normal, >1.0 = more contrast
        saturate: 1.2        // 1.0 = normal, >1.0 = more saturated
    };

    const getTransform = (config) => {
        return `perspective(${config.perspective}px) rotateY(${config.rotateY}deg) rotateX(${config.rotateX}deg) scale(${config.scale})`;
    };

    // Helper function to generate glow shadows
    const getGlowShadow = (glowConfig, hoverMultiplier = 1) => {
        const inner = glowConfig.innerGlow;
        const middle = glowConfig.middleGlow;
        const outer = glowConfig.outerGlow;
        const inset = glowConfig.insetGlow;

        return `
      0 0 ${inner.blur * hoverMultiplier}px ${inner.spread}px ${inner.color},
      0 0 ${middle.blur * hoverMultiplier}px ${middle.spread}px ${middle.color},
      0 0 ${outer.blur * hoverMultiplier}px ${outer.spread}px ${outer.color},
      inset 0 0 ${inset.blur * hoverMultiplier}px ${inset.spread}px ${inset.color}
    `;
    };

    // Add this function to show a thank you message
    const showThankYouMessage = (donation) => {
        const messageId = `donation-${donation.id}-${Date.now()}`;
        const randomPosition = DONATION_MESSAGES_CONFIG.POSITIONS[
            Math.floor(Math.random() * DONATION_MESSAGES_CONFIG.POSITIONS.length)
        ];

        // Add message to state
        const messageWithPosition = {
            ...donation,
            id: messageId,
            position: randomPosition
        };

        setDonationMessages(prev => [...prev, messageWithPosition]);

        // Remove message after configured duration
        setTimeout(() => {
            setDonationMessages(prev => prev.filter(msg => msg.id !== messageId));
        }, AppSettings.DONATION_MESSAGES.DISPLAY_DURATION);
    };

    // Helper function to generate filters
    const getFilters = () => {
        return `brightness(${filterConfig.brightness}) contrast(${filterConfig.contrast}) saturate(${filterConfig.saturate})`;
    };


    // Add this signout handler function
    const handleSignOut = async () => {
        try {
            await signOut();
            console.log('👋 User signed out successfully');
            // You can add any additional cleanup or redirect logic here
        } catch (error) {
            console.error('❌ Failed to sign out:', error);
        }
    };

    // Initialize Rive input
    useEffect(() => {
        if (rive) {
            console.log('🔄 Rive instance available');

            if (rive.stateMachineInputs) {
                const inputs = rive.stateMachineInputs("State Machine 1");
                console.log('🔍 State Machine Inputs:', inputs);

                if (inputs && inputs.length > 0) {
                    directionInputRef.current = inputs[0];
                    console.log('✅ Direction input found');
                    setDebugInfo('Rive input initialized successfully');
                }
            }
        }
    }, [rive]);

    // Disable mouse events on the Rive canvas
    useEffect(() => {
        if (riveContainerRef.current) {
            const canvas = riveContainerRef.current.querySelector('canvas');
            if (canvas) {
                canvas.style.pointerEvents = 'none';
                console.log('✅ Mouse interactions disabled on Rive canvas');
            }
        }
    }, [rive]);

    const startClimbingAnimation = (duration) => {
        console.log('🎬 Starting climbing animation...');

        if (!directionInputRef.current) {
            console.log('❌ No direction input reference');
            setDebugInfo('No direction input reference');
            return;
        }

        console.log('🎯 Setting direction to 1');
        setIsClimbing(true);

        try {
            // Start climbing
            directionInputRef.current.value = 1;
            console.log('✅ Direction set to 1');
            setDebugInfo(`Climbing ${currentDonation} stairs for ${duration}s`);

            // Stop after duration
            setTimeout(() => {
                console.log('🛑 Setting direction to 0');
                directionInputRef.current.value = 0;
                setIsClimbing(false);
                setCurrentDonation(0);
                setDebugInfo('Animation completed');
                console.log('✅ Direction set to 0');
            }, duration * 1000);

        } catch (error) {
            console.error('❌ Error controlling animation:', error);
            setDebugInfo(`Animation error: ${error.message}`);
        }
    };

    // Format large numbers with commas
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Format percentage
    const formatPercentage = (current, goal) => {
        const percentage = (current / goal) * 100;
        return Math.min(percentage, 100).toFixed(6);
    };

    const formatDonationTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };


    useEffect(() => {
        const initializeData = async () => {
            try {
                console.log('📥 Loading initial data...');
                setIsLoading(true);

                // Load all data in parallel for better performance
                const [total, goal, recent, allDonationsData] = await Promise.all([
                    DonationsService.getTotalAmount(),
                    DonationsService.getCurrentGoal(),
                    DonationsService.getRecentDonations(5),
                    DonationsService.getAllDonations()
                ]);

                setTotalMoney(total);
                setCurrentGoal(parseFloat(goal.target_amount));
                setDonationHistory(recent);
                setAllDonations(allDonationsData);

                console.log('✅ Initial data loaded successfully');

            } catch (error) {
                console.error('❌ Error loading initial data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, []);

    const handleRealTimeUpdate = useCallback(async (payload) => {
        console.log('📡 Real-time donation event:', payload);

        if (payload.eventType === 'INSERT' && payload.new) {
            const donation = payload.new;
            console.log('💫 New donation detected:', donation);

            // Update stats and graph
            try {
                const newTotal = await DonationsService.getTotalAmount();
                setTotalMoney(newTotal);

                const newRecent = await DonationsService.getRecentDonations(5);
                setDonationHistory(newRecent);

                const newAllDonations = await DonationsService.getAllDonations();
                setAllDonations(newAllDonations);

                setGraphRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('❌ Error updating stats:', error);
            }

            // Handle animation for other users
            const isOurOwnDonation = user && donation.user_email === user.email;
            if (!isOurOwnDonation) {
                console.log('💌 Showing thank you message for OTHER user');
                showThankYouMessage(donation);
            } else {
                console.log('🔄 Skipping message - our own donation (handled locally)');
            }

            if (!isOurOwnDonation && !isClimbing) {
                console.log(`🎬 Playing remote animation: $${donation.amount}`);
                const duration = (donation.amount * 3) / 5;
                setCurrentDonation(donation.amount);
                startClimbingAnimation(duration);
            } else if (isOurOwnDonation) {
                console.log('🔄 Skipping animation - our own donation');
            } else if (isClimbing) {
                console.log('⏳ Skipping animation - already climbing');
            }
        }
    }, [user, isClimbing]);

    useEffect(() => {
        console.log('🎯 Setting up real-time subscription...');

        const subscription = DonationsService.subscribeToDonations(handleRealTimeUpdate);

        return () => {
            console.log('🧹 Cleaning up real-time subscription');
            if (subscription) {
                DonationsService.unsubscribe(subscription);
            }
        };
    }, [handleRealTimeUpdate]);

    // Handle successful PayPal donation
    const handleDonationSuccess = async (amount, paypalDetails) => {
        try {
            console.log('💰 Donation success:', amount, paypalDetails);
            setCurrentDonation(amount);
            setDebugInfo(`Donation received: $${amount}`);

            // Save donation to database
            const donationRecord = await DonationsService.addDonation(
                amount,
                user?.id,
                user?.email
            );
            console.log('💾 Donation saved to DB:', donationRecord);

            // FORCE REFRESH ALL DATA IMMEDIATELY
            console.log('🔄 Force refreshing ALL UI data...');

            // Refresh total amount
            const newTotal = await DonationsService.getTotalAmount();
            setTotalMoney(newTotal);

            // Refresh recent donations
            const newRecent = await DonationsService.getRecentDonations(5);
            setDonationHistory(newRecent);
            setGraphRefreshTrigger(prev => prev + 1);
            // Refresh ALL donations for graph
            const newAllDonations = await DonationsService.getAllDonations();
            setAllDonations(newAllDonations);

            console.log('✅ ALL UI data force refreshed');

            // Show thank you message for current user immediately
            showThankYouMessage({
                ...donationRecord,
                user_email: user?.email,
                amount: amount
            });

            // Calculate animation duration
            const stairsToClimb = amount;
            const duration = (stairsToClimb * 3) / 5;

            console.log(`⏱️ Starting animation: ${stairsToClimb} stairs for ${duration} seconds`);
            startClimbingAnimation(duration);


        } catch (error) {
            console.error('❌ Error processing donation:', error);
            setDebugInfo(`Error: ${error.message}`);
        }
    };

    const sidebarWidth = isSidebarExpanded ? '350px' : '60px';

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: '#2b0c5c',
                color: 'white',
                fontSize: '18px'
            }}>
                Loading donation data...
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#2b0c5c',
            display: 'flex',
            overflow: 'hidden'
        }}>
            {/* Main Animation Area - Takes remaining space */}
            <div style={{
                flex: 1,
                position: 'relative',
                background: '#2b0c5c',
                display: 'flex'
            }}>
                {/* Rive Animation Container - Left Side */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    background: '#2b0c5c'
                }}>
                    {/* Rive Container with disabled pointer events */}
                    <div
                        ref={riveContainerRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none'
                        }}
                    >
                        <RiveComponent style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            pointerEvents: 'none'
                        }} />

                        {!riveLoaded && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: '#ffd93d',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                background: 'rgba(0, 0, 0, 0.7)',
                                padding: '20px',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 215, 0, 0.3)'
                            }}>
                                ⚡ Loading Animation...
                            </div>
                        )}
                    </div>

                    {/* Climbing Status - Bottom Center */}
                    {isClimbing && (
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            color: '#ffd93d',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            background: 'rgba(255, 217, 61, 0.1)',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 217, 61, 0.3)',
                            backdropFilter: 'blur(10px)',
                            pointerEvents: 'none'
                        }}>
                            🎯 Climbing {currentDonation} stair{currentDonation > 1 ? 's' : ''}...
                        </div>
                    )}

{/* Magical How It Works Section - Enhanced with Scroll */}
<div style={{
    background: 'linear-gradient(135deg, rgba(107, 207, 127, 0.15), rgba(138, 127, 255, 0.15))',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 1000,
    maxWidth: '380px',
    maxHeight: '80vh', // Limit height to viewport
    backdropFilter: 'blur(20px)',
    overflow: 'hidden', // Keep hidden for container
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.3),
        0 2px 8px rgba(107, 207, 127, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `
}}>
    {/* Animated Background Particles */}
    <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
            radial-gradient(4px 4px at 20% 30%, rgba(255,215,0,0.6), transparent),
            radial-gradient(3px 3px at 80% 70%, rgba(107,207,127,0.5), transparent),
            radial-gradient(2px 2px at 40% 20%, rgba(138,127,255,0.4), transparent),
            radial-gradient(3px 3px at 60% 80%, rgba(255,107,107,0.3), transparent)
        `,
        pointerEvents: 'none',
        animation: 'float 6s ease-in-out infinite'
    }} />

    {/* Header - Magical Button */}
    <button
        onClick={() => setShowHowItWorks(!showHowItWorks)}
        style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(107, 207, 127, 0.2), rgba(138, 127, 255, 0.2))',
            border: 'none',
            padding: '16px 20px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        }}
        onMouseOver={(e) => {
            e.target.style.background = 'linear-gradient(135deg, rgba(107, 207, 127, 0.3), rgba(138, 127, 255, 0.3))';
            e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
            e.target.style.background = 'linear-gradient(135deg, rgba(107, 207, 127, 0.2), rgba(138, 127, 255, 0.2))';
            e.target.style.transform = 'translateY(0)';
        }}
    >
        {/* Animated Sparkle Effect */}
        <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transition: 'left 0.6s ease',
            pointerEvents: 'none'
        }} 
        onMouseOver={(e) => {
            e.target.style.left = '100%';
        }}
        />
        
        <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
            <span style={{
                fontSize: '18px',
                animation: 'bounce 2s infinite'
            }}>✨</span>
            The Magical Journey
            <span style={{
                fontSize: '18px',
                animation: 'bounce 2s infinite 0.5s'
            }}>🌟</span>
        </span>
        <span style={{
            fontSize: '14px',
            transform: showHowItWorks ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            ▼
        </span>
    </button>

    {/* Expandable Content with Scroll */}
    {showHowItWorks && (
        <div style={{
            maxHeight: 'calc(80vh - 80px)', // Subtract header height
            overflowY: 'auto', // Enable scrolling
            background: 'rgba(0, 0, 0, 0.4)',
            animation: 'magicReveal 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }} className="how-it-works-scrollable">
            
            {/* Header Section */}
            <div style={{
                padding: '20px 20px 16px',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(107,207,127,0.1))',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center'
            }}>
                <div style={{
                    color: '#FFD93D',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    textShadow: '0 2px 8px rgba(255,215,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <span style={{ animation: 'pulse 2s infinite' }}>🎯</span>
                    NuNu's Epic Adventure to Heaven
                    <span style={{ animation: 'pulse 2s infinite 1s' }}>⚡</span>
                </div>
                <div style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '12px',
                    lineHeight: '1.4'
                }}>
                    Every donation brings us closer to the magical door!
                </div>
            </div>

            {/* Steps Container */}
            <div style={{ padding: '20px' }}>
                {/* Step 1 - Money to Stairs */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'rgba(255, 217, 61, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 217, 61, 0.2)',
                    transition: 'all 0.3s ease',
                    animation: 'slideInLeft 0.6s ease 0.1s both'
                }} 
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 217, 61, 0.15)';
                    e.currentTarget.style.transform = 'translateX(8px)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 217, 61, 0.08)';
                    e.currentTarget.style.transform = 'translateX(0)';
                }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #FFD93D, #FF6B6B)',
                        borderRadius: '10px',
                        padding: '10px',
                        fontSize: '16px',
                        minWidth: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'bounce 3s infinite'
                    }}>
                        💰
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            color: '#FFD93D',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '6px'
                        }}>
                            Magic Conversion
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '13px',
                            lineHeight: '1.5'
                        }}>
                            Every <strong style={{color: '#FFD93D'}}>$1</strong> magically transforms into <strong style={{color: '#6bcf7f'}}>1 stair</strong> for NuNu to climb!
                        </div>
                    </div>
                </div>

                {/* Step 2 - Charity Impact */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'rgba(107, 207, 127, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(107, 207, 127, 0.2)',
                    transition: 'all 0.3s ease',
                    animation: 'slideInLeft 0.6s ease 0.2s both'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 207, 127, 0.15)';
                    e.currentTarget.style.transform = 'translateX(8px)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 207, 127, 0.08)';
                    e.currentTarget.style.transform = 'translateX(0)';
                }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #6bcf7f, #8a7fff)',
                        borderRadius: '10px',
                        padding: '10px',
                        fontSize: '16px',
                        minWidth: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'bounce 3s infinite 0.3s'
                    }}>
                        🌍
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            color: '#6bcf7f',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '6px'
                        }}>
                            Heartfelt Impact
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '13px',
                            lineHeight: '1.5'
                        }}>
                            <strong style={{color: '#6bcf7f'}}>50%</strong> of all donations directly support Humans, Animals, and Trees in need.
                        </div>
                    </div>
                </div>

                {/* Step 3 - Future Support */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    marginBottom: '20px',
                    padding: '16px',
                    background: 'rgba(138, 127, 255, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(138, 127, 255, 0.2)',
                    transition: 'all 0.3s ease',
                    animation: 'slideInLeft 0.6s ease 0.3s both'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(138, 127, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateX(8px)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(138, 127, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateX(0)';
                }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #8a7fff, #FF6B6B)',
                        borderRadius: '10px',
                        padding: '10px',
                        fontSize: '16px',
                        minWidth: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'bounce 3s infinite 0.6s'
                    }}>
                        🔄
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            color: '#8a7fff',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '6px'
                        }}>
                            Pay It Forward
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '13px',
                            lineHeight: '1.5'
                        }}>
                            When NuNu reaches heaven, <strong style={{color: '#8a7fff'}}>YOU</strong> could be next! The site will help donors raise funds for their chosen causes.
                        </div>
                    </div>
                </div>

                {/* Step 4 - Mindful Giving */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '16px',
                    background: 'rgba(255, 107, 107, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 107, 107, 0.2)',
                    transition: 'all 0.3s ease',
                    animation: 'slideInLeft 0.6s ease 0.4s both'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 107, 0.15)';
                    e.currentTarget.style.transform = 'translateX(8px)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 107, 0.08)';
                    e.currentTarget.style.transform = 'translateX(0)';
                }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)',
                        borderRadius: '10px',
                        padding: '10px',
                        fontSize: '16px',
                        minWidth: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'bounce 3s infinite 0.9s'
                    }}>
                        💖
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            color: '#FF6B6B',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '6px'
                        }}>
                            Give with Joy
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '13px',
                            lineHeight: '1.5'
                        }}>
                            Donate only what feels light and joyful. Let love flow through you effortlessly.
                        </div>
                    </div>
                </div>
            </div>

            {/* Magical Call to Action */}
            <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(138,127,255,0.15))',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
                animation: 'pulse-glow 4s ease-in-out infinite'
            }}>
                <div style={{
                    color: '#FFD93D',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <span style={{ animation: 'spin 3s linear infinite' }}>🚀</span>
                    Join the Magical Journey!
                    <span style={{ animation: 'spin 3s linear infinite reverse' }}>🌈</span>
                </div>
                <div style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '12px',
                    fontStyle: 'italic'
                }}>
                    Every step brings magic to the world
                </div>
            </div>
        </div>
    )}
</div>


                </div>

                {/* Fantasy Door Image - Glow Only (No Frame) */}
                <div style={{
                    width: '65%',
                    height: '120%',
                    minWidth: '400px',
                    position: 'relative',
                    background: '#2b0c5c',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>

                    {/* Enhanced Glow Container */}
                    <div style={{
                        position: 'relative',
                        width: backgroundGlowConfig.size,
                        height: backgroundGlowConfig.size,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        // Stronger background glow
                        background: `radial-gradient(ellipse at center, 
      rgba(255,215,0,${backgroundGlowConfig.intensity}) 0%, 
      rgba(255,215,0,${backgroundGlowConfig.intensity * 0.5}) 50%, 
      transparent 80%)`,
                        borderRadius: `${backgroundGlowConfig.borderRadius}px`,
                        padding: '0px' // More padding for glow space
                    }}>

                        {/* Main Door Image - No Border, Just Glow */}
                        <img
                            src={`${import.meta.env.BASE_URL}assets/door-stretching-into-fantasy-world.jpg`}
                            alt="Fantasy World Door"
                            onLoad={() => {
                                console.log('✅ Door image loaded');
                                setImageLoaded(true);
                            }}
                            onError={() => console.error('❌ Failed to load door image')}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                // Configurable transform
                                transform: getTransform(tiltConfig),
                                // No border, just image with rounded corners
                                borderRadius: `${borderConfig.radius}px`,
                                border: 'none', // Explicitly no border
                                // Enhanced glow-only effect
                                boxShadow: getGlowShadow(glowConfig),
                                // Configurable filters
                                filter: getFilters(),
                                // Smooth transitions
                                transition: 'all 0.5s ease'
                            }}
                            onMouseEnter={(e) => {
                                // Enhanced hover effect - stronger glow
                                const hoverTransform = getTransform({
                                    ...tiltConfig,
                                    rotateY: hoverConfig.rotateY,
                                    rotateX: hoverConfig.rotateX,
                                    scale: hoverConfig.scale
                                });

                                e.target.style.transform = hoverTransform;
                                e.target.style.boxShadow = getGlowShadow(glowConfig, hoverConfig.glowBoost);
                            }}
                            onMouseLeave={(e) => {
                                // Return to original state
                                e.target.style.transform = getTransform(tiltConfig);
                                e.target.style.boxShadow = getGlowShadow(glowConfig);
                            }}
                        />

                        {/* Enhanced Glow Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: '-20px', // Extend beyond image for glow
                            left: '-20px',
                            right: '-20px',
                            bottom: '-20px',
                            background: `radial-gradient(ellipse at center, 
        transparent 20%, 
        rgba(255,215,0,${backgroundGlowConfig.intensity * 0.3}) 60%, 
        rgba(255,215,0,${backgroundGlowConfig.intensity * 0.1}) 100%)`,
                            borderRadius: `${backgroundGlowConfig.borderRadius + 10}px`,
                            pointerEvents: 'none',
                            animation: 'pulse-glow 4s ease-in-out infinite'
                        }} />

                        {/* Floating Golden Particles */}
                        <div style={{
                            position: 'absolute',
                            top: '-10px',
                            left: '-10px',
                            right: '-10px',
                            bottom: '-10px',
                            background: `
        radial-gradient(3px 3px at 10% 20%, rgba(255,215,0,0.9), transparent),
        radial-gradient(3px 3px at 30% 80%, rgba(255,215,0,0.7), transparent),
        radial-gradient(2px 2px at 50% 10%, rgba(255,215,0,0.8), transparent),
        radial-gradient(2px 2px at 70% 60%, rgba(255,215,0,0.6), transparent),
        radial-gradient(3px 3px at 90% 30%, rgba(255,215,0,0.9), transparent),
        radial-gradient(2px 2px at 20% 70%, rgba(255,215,0,0.7), transparent)
      `,
                            borderRadius: `${backgroundGlowConfig.borderRadius + 5}px`,
                            pointerEvents: 'none',
                            animation: 'float 8s ease-in-out infinite'
                        }} />

                    </div>

                    {/* Rest remains the same */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50px',
                        height: '100%',
                        background: 'linear-gradient(90deg, #2b0c5c, transparent)',
                        pointerEvents: 'none'
                    }} />
                    {!imageLoaded && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(45deg, #2b0c5c, #4a1b9d)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffd93d',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            🏰 Loading Heaven's Door...
                        </div>
                    )}

                </div>

                {/* CC BY Attribution */}
                <div style={{
                    position: 'fixed',
                    bottom: '2px',
                    left: '2px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '9px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    zIndex: 1000,
                    maxWidth: '200px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span>🎨</span>
                        <span style={{ fontWeight: 'bold', color: '#FFD93D' }}>Animation:</span>
                    </div>
                    <div style={{ lineHeight: '1.3' }}>
                        "stairs" by <strong>Marcelo Bazani</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <a
                                href="https://creativecommons.org/licenses/by/4.0/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#FFD93D',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                }}
                            >
                                <span>CC BY 4.0</span>
                            </a>
                            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
                            <a
                                href="https://rive.app/community/8866-17054-stairs-marcelo-bazani"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#FFD93D',
                                    textDecoration: 'none'
                                }}
                            >
                                View on Rive
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar - Right Side */}
            <div style={{
                width: sidebarWidth,
                background: 'rgba(0, 0, 0, 0.95)',
                borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 1000
            }}>
                {/* Sidebar Header with User Info */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '60px',
                    background: 'rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        💝 Donate
                    </div>

                    {/* User Info in Header */}
                    {user ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <div style={{
                                background: 'rgba(107, 207, 127, 0.2)',
                                padding: '6px 12px',
                                borderRadius: '15px',
                                border: '1px solid rgba(107, 207, 127, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    background: '#6bcf7f',
                                    borderRadius: '50%',
                                    animation: 'pulse 2s infinite'
                                }} />
                                <div style={{
                                    color: '#6bcf7f',
                                    fontSize: '11px',
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
                                    borderRadius: '6px',
                                    padding: '6px 8px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <button
                                onClick={() => openAuthModal('login')}
                                style={{
                                    background: 'linear-gradient(135deg, #8a7fff, #6366f1)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    fontSize: '11px',
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
                                🔐 Sign In
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar Content */}

                {isSidebarExpanded && (
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        overflowY: 'auto'
                    }}>
                        {/* Total Raised */}
                        <div style={{
                            background: 'rgba(255, 217, 61, 0.1)',
                            padding: '15px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 217, 61, 0.3)',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#ffd93d', fontSize: '20px', fontWeight: 'bold', marginBottom: '5px' }}>
                                ${formatCurrency(totalMoney)}
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px' }}>
                                Raised of ${formatCurrency(currentGoal)} goal
                            </div>
                            <div style={{
                                width: '100%',
                                height: '6px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '3px',
                                marginTop: '8px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${Math.min((totalMoney / currentGoal) * 100, 100)}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #ff6b6b, #ffd93d)',
                                    borderRadius: '3px',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '10px', marginTop: '5px' }}>
                                {formatPercentage(totalMoney, currentGoal)}% funded
                            </div>
                        </div>

                        {/* Donation Options */}
                        <div>
                            <div style={{
                                color: 'white',
                                fontSize: '14px',
                                marginBottom: '15px',
                                textAlign: 'center'
                            }}>
                                Choose donation amount:
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Fixed Amount Buttons */}
                                {[5, 10].map(amount => (
                                    <div key={amount} style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <div style={{
                                            color: 'white',
                                            fontSize: '14px',
                                            textAlign: 'center',
                                            marginBottom: '10px'
                                        }}>
                                            ${amount} = {amount} stair{amount > 1 ? 's' : ''}
                                        </div>
                                        <PayPalDonationButton
                                            amount={amount}
                                            onDonationSuccess={handleDonationSuccess}
                                            disabled={isClimbing || !directionInputRef.current}
                                        />
                                    </div>
                                ))}

                                {/* Custom Amount Option */}
                                <div style={{
                                    background: 'rgba(255, 215, 0, 0.1)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 215, 0, 0.3)'
                                }}>
                                    {!showCustomInput ? (
                                        // Show "Custom Amount" button
                                        <button
                                            onClick={() => setShowCustomInput(true)}
                                            style={{
                                                width: '100%',
                                                background: 'linear-gradient(135deg, #FFD93D, #FF6B6B)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.background = 'linear-gradient(135deg, #FFE869, #FF8E8E)';
                                                e.target.style.transform = 'scale(1.02)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.background = 'linear-gradient(135deg, #FFD93D, #FF6B6B)';
                                                e.target.style.transform = 'scale(1)';
                                            }}
                                        >
                                            💫 Custom Amount
                                        </button>
                                    ) : (
                                        // Show custom amount input WITH PAYPAL BUTTON
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{
                                                color: '#FFD93D',
                                                fontSize: '14px',
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                marginBottom: '5px'
                                            }}>
                                                Enter Custom Amount
                                            </div>

                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>$</span>
                                                <input
                                                    type="number"
                                                    value={customAmount}
                                                    onChange={(e) => setCustomAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    min="1"
                                                    step="0.01"
                                                    style={{
                                                        flex: 1,
                                                        background: 'rgba(255, 255, 255, 0.1)',
                                                        border: '1px solid rgba(255, 215, 0, 0.5)',
                                                        borderRadius: '6px',
                                                        padding: '10px',
                                                        color: 'white',
                                                        fontSize: '14px',
                                                        outline: 'none'
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                                        e.target.style.borderColor = '#FFD93D';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                                        e.target.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                                                    }}
                                                />
                                            </div>

                                            {/* PayPal Button for Custom Amount */}
                                            {customAmount && parseFloat(customAmount) >= 1 && (
                                                <PayPalDonationButton
                                                    amount={parseFloat(customAmount)}
                                                    onDonationSuccess={(amount, details) => {
                                                        handleDonationSuccess(amount, details);
                                                        setShowCustomInput(false);
                                                        setCustomAmount('');
                                                    }}
                                                    disabled={isClimbing || !directionInputRef.current}
                                                />
                                            )}

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => {
                                                        setShowCustomInput(false);
                                                        setCustomAmount('');
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(255, 255, 255, 0.1)',
                                                        color: 'white',
                                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                                        borderRadius: '6px',
                                                        padding: '10px',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>

                                            {customAmount && parseFloat(customAmount) < 1 && (
                                                <div style={{
                                                    color: '#FF6B6B',
                                                    fontSize: '12px',
                                                    textAlign: 'center',
                                                    marginTop: '5px'
                                                }}>
                                                    Minimum donation is $1
                                                </div>
                                            )}

                                            {!customAmount && (
                                                <div style={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: '12px',
                                                    textAlign: 'center',
                                                    marginTop: '5px'
                                                }}>
                                                    Enter an amount to see PayPal options
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Donation History Section */}
                        <div style={{
                            background: 'rgba(107, 207, 127, 0.1)',
                            borderRadius: '10px',
                            border: '1px solid rgba(107, 207, 127, 0.3)',
                        }}>
                            {/* Header - Always Visible */}
                            <button
                                onClick={() => setShowDonationHistory(!showDonationHistory)}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '12px 15px',
                                    color: '#6bcf7f',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = 'rgba(107, 207, 127, 0.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'transparent';
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Recent Donations
                                    {donationHistory.length > 0 && (  // FIXED: Removed showDonationHistory &&
                                        <span style={{
                                            background: 'rgba(138, 127, 255, 0.3)',
                                            color: '#8a7fff',
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            minWidth: '20px'
                                        }}>
                                            {donationHistory.length}
                                        </span>
                                    )}
                                </span>
                                <span style={{
                                    fontSize: '12px',
                                    transform: showDonationHistory ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}>
                                    ▼
                                </span>
                            </button>

                            {/* Expandable Content */}
                            {showDonationHistory && (
                                <div style={{
                                    borderTop: '1px solid rgba(107, 207, 127, 0.2)',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    maxHeight: '400px',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Donation History - Scrollable Section */}
                                    <div style={{
                                        flex: 1,
                                        padding: '15px',
                                        maxHeight: '250px',
                                        overflowY: 'auto'
                                    }} className="donation-history-scrollable">
                                        {donationHistory.length === 0 ? (
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.5)',
                                                fontSize: '11px',
                                                textAlign: 'center',
                                                padding: '20px',
                                                fontStyle: 'italic'
                                            }}>
                                                No donations yet. Be the first to help NuNu climb! 🎉
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}>
                                                {donationHistory.map((donation, index) => (
                                                    <DonationHistoryItem
                                                        key={donation.id}
                                                        donation={donation}
                                                        isCurrentUser={user && donation.user_email === user.email}
                                                        index={index}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bar Graph */}
                        <DonationBarGraph isExpanded={isSidebarExpanded}
                            refreshTrigger={graphRefreshTrigger}
                            allDonations={allDonations} />

                    </div>
                )}

                {/* Collapsed Sidebar Content */}
                {!isSidebarExpanded && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '15px',
                        padding: '20px'
                    }}>
                        <div style={{ color: '#ffd93d', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>
                            ${formatCurrency(totalMoney)}
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '10px',
                            textAlign: 'center',
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)'
                        }}>
                            Click to donate
                        </div>
                    </div>
                )}
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal && !user}
                onClose={closeAuthModal}
            />

            {/* CSS Animation for glowing effect */}
            <style>
                {`
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 
                0 0 30px rgba(255, 215, 0, 0.3),
                0 0 60px rgba(255, 215, 0, 0.2),
                0 0 90px rgba(255, 215, 0, 0.1);
            }
            50% {
              box-shadow: 
                0 0 40px rgba(255, 215, 0, 0.4),
                0 0 80px rgba(255, 215, 0, 0.3),
                0 0 120px rgba(255, 215, 0, 0.2);
            }
          }
            @keyframes slideDown {
      from {
        opacity: 0;
        max-height: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        max-height: 500px;
        transform: translateY(0);
      }
    }
      @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Custom scrollbar for donation history */
    .donation-history-scrollable::-webkit-scrollbar {
      width: 4px;
    }

    .donation-history-scrollable::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
    }

    .donation-history-scrollable::-webkit-scrollbar-thumb {
      background: rgba(138, 127, 255, 0.3);
      border-radius: 2px;
    }

    .donation-history-scrollable::-webkit-scrollbar-thumb:hover {
      background: rgba(138, 127, 255, 0.5);
    }

    /* Smooth scrolling */
    .donation-history-scrollable {
      scroll-behavior: smooth;
    }
      @keyframes magicReveal {
    from {
        opacity: 0;
        max-height: 0;
        transform: translateY(-20px) scale(0.95);
    }
    to {
        opacity: 1;
        max-height: 800px;
        transform: translateY(0) scale(1);
    }
}

@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-5px);
    }
    60% {
        transform: translateY(-3px);
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}
        `}
            </style>
            {/* Donation Thank You Messages */}
            {donationMessages.map(donation => (
                <DonationThankYouTooltip
                    key={donation.id}
                    donation={donation}
                    position={donation.position}
                    currentUser={user}
                />
            ))}
        </div>
    );
}