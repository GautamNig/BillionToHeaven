// src/components/RiveAnimation.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRive } from '@rive-app/react-webgl2';
import { DonationsService } from '../lib/donationsService';
import useAuth from '../hooks/useAuth';
import DonationBarGraph from './DonationBarGraph';
import { AppSettings } from '../config/settings';
import DonationThankYouTooltip from './DonationThankYouTooltip';
import AuthModal from './AuthModal';
import { UIStrings, getUsername, formatTimeAgo } from '../config/uiStrings';
import PayPalDonationButton from './PayPalDonationButton';
import DonationHistoryItem from './DonationHistoryItem';
import HowItWorks from './HowItWorks';

// Add this to the top of your RiveAnimation.jsx, after the imports
const DONATION_MESSAGES_CONFIG = {
    POSITIONS: [
        { x: 50, y: 20 },  // Top center  
        { x: 50, y: 90 },  // Bottom center
    ]
};

export default function RiveAnimation({ activeTab }) {
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
    const [allDonations, setAllDonations] = useState([]);
    const [graphData, setGraphData] = useState([]);
    const [graphRefreshTrigger, setGraphRefreshTrigger] = useState(0);
    const [donationMessages, setDonationMessages] = useState([]);
    const [customAmount, setCustomAmount] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [showDonationHistory, setShowDonationHistory] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [riveLoaded, setRiveLoaded] = useState(false);

    const { user, signOut, showAuthModal, openAuthModal, closeAuthModal } = useAuth();

    const { RiveComponent, rive } = useRive({
        src: `${import.meta.env.BASE_URL}rive/8866-17054-stairs-marcelo-bazani.riv`,
        autoplay: true,
        stateMachines: ["State Machine 1"],
        onLoad: () => {
            setRiveLoaded(true);
        },
        onLoadError: (error) => {
            setRiveLoaded(true);
        },
    });

    // ======================
    // CONFIGURABLE SETTINGS
    // ======================

    // Tilt Configuration
    const tiltConfig = {
        perspective: 1000,
        rotateY: -35,
        rotateX: 0,
        scale: 1.0
    };

    // Glow Configuration
    const glowConfig = {
        innerGlow: {
            color: 'rgba(255, 215, 0, 0.6)',
            blur: 25,
            spread: 0
        },
        middleGlow: {
            color: 'rgba(255, 215, 0, 0.4)',
            blur: 50,
            spread: 0
        },
        outerGlow: {
            color: 'rgba(255, 215, 0, 0.2)',
            blur: 100,
            spread: 0
        },
        insetGlow: {
            color: 'rgba(255, 215, 0, 0)',
            blur: 0,
            spread: 0
        }
    };

    // Border Configuration
    const borderConfig = {
        width: 0,
        color: 'transparent',
        radius: 10
    };

    // Hover Effect Configuration
    const hoverConfig = {
        rotateY: -10,
        rotateX: 3,
        scale: 1.02,
        glowBoost: 1.5
    };

    // Background Glow Configuration
    const backgroundGlowConfig = {
        intensity: 0.9,
        size: '120%',
        borderRadius: 15
    };

    // Filter Effects
    const filterConfig = {
        brightness: 1.1,
        contrast: 1.1,
        saturate: 1.2
    };

    const getTransform = (config) => {
        return `perspective(${config.perspective}px) rotateY(${config.rotateY}deg) rotateX(${config.rotateX}deg) scale(${config.scale})`;
    };

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

    const showThankYouMessage = (donation) => {
        const messageId = `donation-${donation.id}-${Date.now()}`;
        const randomPosition = DONATION_MESSAGES_CONFIG.POSITIONS[
            Math.floor(Math.random() * DONATION_MESSAGES_CONFIG.POSITIONS.length)
        ];

        const messageWithPosition = {
            ...donation,
            id: messageId,
            position: randomPosition
        };

        setDonationMessages(prev => [...prev, messageWithPosition]);

        setTimeout(() => {
            setDonationMessages(prev => prev.filter(msg => msg.id !== messageId));
        }, AppSettings.DONATION_MESSAGES.DISPLAY_DURATION);
    };

    const getFilters = () => {
        return `brightness(${filterConfig.brightness}) contrast(${filterConfig.contrast}) saturate(${filterConfig.saturate})`;
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            // Error handling without console.log
        }
    };

    // Initialize Rive input
    useEffect(() => {
        if (rive) {
            if (rive.stateMachineInputs) {
                const inputs = rive.stateMachineInputs("State Machine 1");
                if (inputs && inputs.length > 0) {
                    directionInputRef.current = inputs[0];
                    setDebugInfo(UIStrings.DEBUG.DIRECTION_INPUT_FOUND);
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
            }
        }
    }, [rive]);

    const startClimbingAnimation = (duration) => {
        if (!directionInputRef.current) {
            setDebugInfo(UIStrings.DEBUG.NO_DIRECTION_INPUT);
            return;
        }

        setIsClimbing(true);

        try {
            directionInputRef.current.value = 1;
            setDebugInfo(UIStrings.DEBUG.CLIMBING_ANIMATION(currentDonation, duration));

            setTimeout(() => {
                directionInputRef.current.value = 0;
                setIsClimbing(false);
                setCurrentDonation(0);
                setDebugInfo(UIStrings.DEBUG.ANIMATION_COMPLETED);
            }, duration * 1000);

        } catch (error) {
            setDebugInfo(`${UIStrings.DEBUG.ANIMATION_ERROR} ${error.message}`);
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

    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);

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

            } catch (error) {
                // Error handling without console.log
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, []);

    const handleRealTimeUpdate = useCallback(async (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
            const donation = payload.new;

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
                // Error handling without console.log
            }

            // Handle animation for other users
            const isOurOwnDonation = user && donation.user_email === user.email;
            if (!isOurOwnDonation) {
                showThankYouMessage(donation);
            }

            if (!isOurOwnDonation && !isClimbing) {
                const duration = (donation.amount * 3) / 5;
                setCurrentDonation(donation.amount);
                startClimbingAnimation(duration);
            }
        }
    }, [user, isClimbing]);

    useEffect(() => {
        const subscription = DonationsService.subscribeToDonations(handleRealTimeUpdate);

        return () => {
            if (subscription) {
                DonationsService.unsubscribe(subscription);
            }
        };
    }, [handleRealTimeUpdate]);

    // Handle successful PayPal donation
    const handleDonationSuccess = async (amount, paypalDetails) => {
        try {
            setCurrentDonation(amount);
            setDebugInfo(UIStrings.DONATION.DONATION_RECEIVED(amount));

            // Save donation to database
            const donationRecord = await DonationsService.addDonation(
                amount,
                user?.id,
                user?.email
            );

            // Refresh all data
            const newTotal = await DonationsService.getTotalAmount();
            setTotalMoney(newTotal);

            const newRecent = await DonationsService.getRecentDonations(5);
            setDonationHistory(newRecent);
            setGraphRefreshTrigger(prev => prev + 1);

            const newAllDonations = await DonationsService.getAllDonations();
            setAllDonations(newAllDonations);

            // Show thank you message for current user immediately
            showThankYouMessage({
                ...donationRecord,
                user_email: user?.email,
                amount: amount
            });

            // Calculate animation duration
            const stairsToClimb = amount;
            const duration = (stairsToClimb * 3) / 5;

            startClimbingAnimation(duration);

        } catch (error) {
            setDebugInfo(`${UIStrings.DEBUG.PROCESSING_DONATION_ERROR} ${error.message}`);
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
                {UIStrings.GENERAL.LOADING}
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: '60px',
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
                                {UIStrings.ANIMATION.LOADING}
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
                            {UIStrings.DONATION.CLIMBING_STATUS(currentDonation)}
                        </div>
                    )}

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
                        background: `radial-gradient(ellipse at center, 
      rgba(255,215,0,${backgroundGlowConfig.intensity}) 0%, 
      rgba(255,215,0,${backgroundGlowConfig.intensity * 0.5}) 50%, 
      transparent 80%)`,
                        borderRadius: `${backgroundGlowConfig.borderRadius}px`,
                        padding: '0px'
                    }}>

                        {/* Main Door Image - No Border, Just Glow */}
                        <img
                            src={`${import.meta.env.BASE_URL}assets/door-stretching-into-fantasy-world.jpg`}
                            alt={UIStrings.DOOR.ALT_TEXT}
                            onLoad={() => {
                                setImageLoaded(true);
                            }}
                            onError={() => { }}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                transform: getTransform(tiltConfig),
                                borderRadius: `${borderConfig.radius}px`,
                                border: 'none',
                                boxShadow: getGlowShadow(glowConfig),
                                filter: getFilters(),
                                transition: 'all 0.5s ease'
                            }}
                            onMouseEnter={(e) => {
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
                                e.target.style.transform = getTransform(tiltConfig);
                                e.target.style.boxShadow = getGlowShadow(glowConfig);
                            }}
                        />

                        {/* Enhanced Glow Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: '-20px',
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
                            {UIStrings.DOOR.LOADING_TEXT}
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
                        <span style={{ fontWeight: 'bold', color: '#FFD93D' }}>{UIStrings.ATTRIBUTION.ANIMATION}</span>
                    </div>
                    <div style={{ lineHeight: '1.3' }}>
                        "{UIStrings.ATTRIBUTION.BY}" <strong>{UIStrings.ATTRIBUTION.CREATOR}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <a
                                href={UIStrings.ATTRIBUTION.LICENSE_URL}
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
                                <span>{UIStrings.ATTRIBUTION.LICENSE}</span>
                            </a>
                            <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
                            <a
                                href={UIStrings.ATTRIBUTION.RIVE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#FFD93D',
                                    textDecoration: 'none'
                                }}
                            >
                                {UIStrings.ATTRIBUTION.VIEW_ON_RIVE}
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
                <div style={{
    padding: '15px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'center', // Center the title
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
</div>

                {/* Sidebar Content - ALWAYS SHOW DONATION CONTENT (no tab logic) */}
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
                                {UIStrings.GOAL.RAISED_OF_GOAL(formatCurrency(totalMoney), formatCurrency(currentGoal))}
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
                                {UIStrings.GOAL.PERCENT_FUNDED(formatPercentage(totalMoney, currentGoal))}
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
                                {UIStrings.DONATION.CHOOSE_AMOUNT}
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
                                            {UIStrings.DONATION.STAIR_CONVERSION(amount)}
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
                                            {UIStrings.DONATION.CUSTOM_AMOUNT}
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
                                                {UIStrings.DONATION.ENTER_CUSTOM_AMOUNT}
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
                                                    {UIStrings.DONATION.CANCEL}
                                                </button>
                                            </div>

                                            {customAmount && parseFloat(customAmount) < 1 && (
                                                <div style={{
                                                    color: '#FF6B6B',
                                                    fontSize: '12px',
                                                    textAlign: 'center',
                                                    marginTop: '5px'
                                                }}>
                                                    {UIStrings.DONATION.MINIMUM_DONATION}
                                                </div>
                                            )}

                                            {!customAmount && (
                                                <div style={{
                                                    color: 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: '12px',
                                                    textAlign: 'center',
                                                    marginTop: '5px'
                                                }}>
                                                    {UIStrings.DONATION.ENTER_AMOUNT_PROMPT}
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
                                    {UIStrings.HISTORY.RECENT_DONATIONS}
                                    {donationHistory.length > 0 && (
                                        <span style={{
                                            background: 'rgba(138, 127, 255, 0.3)',
                                            color: '#8a7fff',
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            minWidth: '20px'
                                        }}>
                                            {UIStrings.HISTORY.DONATION_COUNT(donationHistory.length)}
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
                                                {UIStrings.HISTORY.NO_DONATIONS_YET}
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