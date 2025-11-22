// src/components/RiveAnimation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useRive } from '@rive-app/react-webgl2';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { DonationsService } from '../lib/donationsService';
import useAuth from '../hooks/useAuth';
import DonationBarGraph from './DonationBarGraph';
import { AppSettings } from '../config/settings';
import DonationThankYouTooltip from './DonationThankYouTooltip';

// Add this to the top of your RiveAnimation.jsx, after the imports
const DONATION_MESSAGES_CONFIG = {
    DISPLAY_DURATION: 5000, // 5 seconds
    POSITIONS: [
        { x: 50, y: 20 },  // Top center  
        { x: 50, y: 90 },  // Bottom center
    ]
};

// Component to handle PayPal loading states
function PayPalDonationButton({ amount, onDonationSuccess, disabled }) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    const createOrder = (data, actions) => {
        return actions.order.create({
            purchase_units: [
                {
                    amount: {
                        value: amount.toString(),
                        currency_code: "USD"
                    },
                    description: `Donation for ${amount} stair${amount > 1 ? 's' : ''}`
                }
            ]
        });
    };

    const onApprove = (data, actions) => {
        return actions.order.capture().then((details) => {
            console.log('🎉 PayPal donation approved:', details);
            onDonationSuccess(amount, details);
        });
    };

    const onError = (err) => {
        console.error('❌ PayPal error:', err);
    };

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
    const { user, signOut } = useAuth();
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

    const { RiveComponent, rive } = useRive({
        src: '/8866-17054-stairs-marcelo-bazani.riv',
        autoplay: true,
        stateMachines: ["State Machine 1"],
    });

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
        intensity: 0.4,      // Increased intensity for stronger glow
        size: '95%',         // Slightly larger glow container
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
        }, DONATION_MESSAGES_CONFIG.DISPLAY_DURATION);
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

    useEffect(() => {
        console.log('🎯 Setting up combined real-time subscription...');

        const subscription = DonationsService.subscribeToDonations(async (payload) => {
            console.log('📡 Real-time event received:', payload);

            if (payload.eventType === 'INSERT' && payload.new) {
                const donation = payload.new;
                console.log('💰 New donation detected for real-time update');

                // Update stats immediately
                try {
                    // Update total amount
                    const newTotal = await DonationsService.getTotalAmount();
                    setTotalMoney(newTotal);

                    // Update recent donations
                    const newRecent = await DonationsService.getRecentDonations(5);
                    setDonationHistory(newRecent);

                    // Update graph data
                    const newAllDonations = await DonationsService.getAllDonations();
                    setAllDonations(newAllDonations);
                    setGraphRefreshTrigger(prev => prev + 1);

                    console.log('✅ Real-time stats updated');
                } catch (error) {
                    console.error('❌ Error in real-time update:', error);
                }

                // 2. SHOW THANK YOU MESSAGE ONLY FOR OTHER USERS (not the donor)
                const isOurOwnDonation = user && donation.user_email === user.email;

                console.log('🔍 Real-time debug:', {
                        donationUser: donation.user_email,
                        currentUser: user?.email,
                        isOurOwnDonation: user && donation.user_email === user.email,
                        shouldShowMessage: !(user && donation.user_email === user.email)
                        });

                if (!isOurOwnDonation) {
                    console.log('💌 Showing thank you message for OTHER user');
                    showThankYouMessage(donation);
                } else {
                    console.log('🔄 Skipping message - our own donation (handled locally)');
                }

                // PLAY ANIMATION ONLY FOR OTHER USERS


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
        });

        return () => {
            console.log('🧹 Cleaning up real-time subscription');
            if (subscription) {
                DonationsService.unsubscribe(subscription);
            }
        };
    }, [user, isClimbing]);

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

                    {/* Info Section */}
                    <div style={{
                        background: 'rgba(107, 207, 127, 0.1)',
                        padding: '15px',
                        borderRadius: '10px',
                        border: '1px solid rgba(107, 207, 127, 0.3)',
                        position: 'absolute',
                        top: '20px',
                        right: isSidebarExpanded ? '370px' : '80px',
                        zIndex: 1000
                    }}>
                        <div style={{ color: '#6bcf7f', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                            💡 How it works
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px', lineHeight: '1.4' }}>
                            Each $1 donation makes the ball climb 1 stair towards heaven.
                            <br /><br />
                            <strong>Help reach the magical door!</strong>
                        </div>
                    </div>


                </div>

                {/* Fantasy Door Image - Glow Only (No Frame) */}
                <div style={{
                    width: '35%',
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
                        padding: '30px' // More padding for glow space
                    }}>

                        {/* Main Door Image - No Border, Just Glow */}
                        <img
                            src="/src/assets/door-stretching-into-fantasy-world.jpg"
                            alt="Fantasy World Door"
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
                {/* Sidebar Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '80px'
                }}>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                        💝 Donate
                    </div>
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

                        {/* Bar Graph */}
                        <DonationBarGraph isExpanded={isSidebarExpanded}
                            refreshTrigger={graphRefreshTrigger}
                            allDonations={allDonations} />

                        {/* User Info with Signout Button */}
                        {user && (
                            <div style={{
                                background: 'rgba(107, 207, 127, 0.1)',
                                padding: '15px',
                                borderRadius: '10px',
                                border: '1px solid rgba(107, 207, 127, 0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ color: '#6bcf7f', fontSize: '11px', fontWeight: 'bold' }}>
                                        👤 Logged in as:
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        style={{
                                            background: 'rgba(255, 107, 107, 0.2)',
                                            color: '#ff6b6b',
                                            border: '1px solid rgba(255, 107, 107, 0.3)',
                                            borderRadius: '5px',
                                            padding: '4px 8px',
                                            fontSize: '10px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.background = 'rgba(255, 107, 107, 0.3)';
                                            e.target.style.color = '#ff8e8e';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.background = 'rgba(255, 107, 107, 0.2)';
                                            e.target.style.color = '#ff6b6b';
                                        }}
                                    >
                                        Sign Out
                                    </button>
                                </div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '10px', wordBreak: 'break-all' }}>
                                    {user.email}
                                </div>
                            </div>
                        )}

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
                                {[1, 5, 10, 20].map(amount => (
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
                            </div>
                        </div>


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