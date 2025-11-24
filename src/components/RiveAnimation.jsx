// src/components/RiveAnimation.jsx - REFACTORED WITH CUSTOM HOOKS
import React, { useState, useEffect, useRef } from 'react';
import { DonationsService } from '../lib/donationsService';
import useAuth from '../hooks/useAuth';
import useDonations from '../hooks/useDonations';
import useRiveAnimation from '../hooks/useRiveAnimation';
import useThankYouMessages from '../hooks/useThankYouMessages';
import DonationBarGraph from './DonationBarGraph';
import DonationThankYouTooltip from './DonationThankYouTooltip';
import AuthModal from './AuthModal';
import { UIStrings } from '../config/uiStrings';
import PayPalDonationButton from './PayPalDonationButton';
import DonationHistoryItem from './DonationHistoryItem';
import { AppSettings } from '../config/settings';
import DonationSidebar from './DonationSidebar';

// Configuration objects
const DOOR_CONFIG = {
    tilt: {
        perspective: 1000,
        rotateY: -35,
        rotateX: 0,
        scale: 1.0
    },
    glow: {
        innerGlow: { color: 'rgba(255, 215, 0, 0.6)', blur: 25, spread: 0 },
        middleGlow: { color: 'rgba(255, 215, 0, 0.4)', blur: 50, spread: 0 },
        outerGlow: { color: 'rgba(255, 215, 0, 0.2)', blur: 100, spread: 0 },
        insetGlow: { color: 'rgba(255, 215, 0, 0)', blur: 0, spread: 0 }
    },
    border: { width: 0, color: 'transparent', radius: 10 },
    hover: { rotateY: -10, rotateX: 3, scale: 1.02, glowBoost: 1.5 },
    backgroundGlow: { intensity: 0.9, size: '120%', borderRadius: 15 },
    filters: { brightness: 1.1, contrast: 1.1, saturate: 1.2 }
};

export default function RiveAnimation() {
    // Custom Hooks
    const { user } = useAuth();
    const {
        totalMoney,
        currentGoal,
        donationHistory,
        allDonations,
        isLoading,
        graphRefreshTrigger,
        handleRealTimeUpdate,
        addDonation,
        refreshDonationData
    } = useDonations(user);

    const {
        RiveComponent,
        rive,
        isClimbing,
        currentDonation,
        debugInfo,
        riveLoaded,
        startClimbingAnimation,
        directionInputRef
    } = useRiveAnimation();

    const {
        donationMessages,
        showThankYouMessage
    } = useThankYouMessages();

    // Local State
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [customAmount, setCustomAmount] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [showDonationHistory, setShowDonationHistory] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const riveContainerRef = useRef();

    // Real-time subscription for donations
    useEffect(() => {
        const handleRealTimeDonation = async (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
                const donation = payload.new;

                // Update stats and graph
                const updatedDonation = await handleRealTimeUpdate(payload);

                // Handle animation for other users
                const isOurOwnDonation = user && donation.user_email === user.email;
                if (!isOurOwnDonation) {
                    showThankYouMessage(donation);
                }

                if (!isOurOwnDonation && !isClimbing) {
                    startClimbingAnimation(donation.amount);
                }
            }
        };

        const subscription = DonationsService.subscribeToDonations(handleRealTimeDonation);

        return () => {
            if (subscription) {
                DonationsService.unsubscribe(subscription);
            }
        };
    }, [user, isClimbing, handleRealTimeUpdate, showThankYouMessage, startClimbingAnimation]);

    // Disable mouse events on the Rive canvas
    useEffect(() => {
        if (riveContainerRef.current) {
            const canvas = riveContainerRef.current.querySelector('canvas');
            if (canvas) {
                canvas.style.pointerEvents = 'none';
            }
        }
    }, [rive]);

    // Handle successful PayPal donation
    const handleDonationSuccess = async (amount, paypalDetails) => {
        try {
            // Save donation to database
            const donationRecord = await addDonation(amount, paypalDetails);

            // Show thank you message for current user immediately
            showThankYouMessage({
                ...donationRecord,
                user_email: user?.email,
                amount: amount
            });

            // Start climbing animation
            startClimbingAnimation(amount);

        } catch (error) {
            // Error handling
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

    // Door image styling helpers
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

    const getFilters = () => {
        return `brightness(${DOOR_CONFIG.filters.brightness}) contrast(${DOOR_CONFIG.filters.contrast}) saturate(${DOOR_CONFIG.filters.saturate})`;
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
                        width: DOOR_CONFIG.backgroundGlow.size,
                        height: DOOR_CONFIG.backgroundGlow.size,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `radial-gradient(ellipse at center, 
      rgba(255,215,0,${DOOR_CONFIG.backgroundGlow.intensity}) 0%, 
      rgba(255,215,0,${DOOR_CONFIG.backgroundGlow.intensity * 0.5}) 50%, 
      transparent 80%)`,
                        borderRadius: `${DOOR_CONFIG.backgroundGlow.borderRadius}px`,
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
                                transform: getTransform(DOOR_CONFIG.tilt),
                                borderRadius: `${DOOR_CONFIG.border.radius}px`,
                                border: 'none',
                                boxShadow: getGlowShadow(DOOR_CONFIG.glow),
                                filter: getFilters(),
                                transition: 'all 0.5s ease'
                            }}
                            onMouseEnter={(e) => {
                                const hoverTransform = getTransform({
                                    ...DOOR_CONFIG.tilt,
                                    rotateY: DOOR_CONFIG.hover.rotateY,
                                    rotateX: DOOR_CONFIG.hover.rotateX,
                                    scale: DOOR_CONFIG.hover.scale
                                });

                                e.target.style.transform = hoverTransform;
                                e.target.style.boxShadow = getGlowShadow(DOOR_CONFIG.glow, DOOR_CONFIG.hover.glowBoost);
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = getTransform(DOOR_CONFIG.tilt);
                                e.target.style.boxShadow = getGlowShadow(DOOR_CONFIG.glow);
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
        rgba(255,215,0,${DOOR_CONFIG.backgroundGlow.intensity * 0.3}) 60%, 
        rgba(255,215,0,${DOOR_CONFIG.backgroundGlow.intensity * 0.1}) 100%)`,
                            borderRadius: `${DOOR_CONFIG.backgroundGlow.borderRadius + 10}px`,
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
                            borderRadius: `${DOOR_CONFIG.backgroundGlow.borderRadius + 5}px`,
                            pointerEvents: 'none',
                            animation: 'float 8s ease-in-out infinite'
                        }} />

                    </div>

                    {/* Gradient Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50px',
                        height: '100%',
                        background: 'linear-gradient(90deg, #2b0c5c, transparent)',
                        pointerEvents: 'none'
                    }} />

                    {/* Loading State for Door Image */}
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

            <DonationSidebar
                isExpanded={isSidebarExpanded}
                totalMoney={totalMoney}
                currentGoal={currentGoal}
                donationHistory={donationHistory}
                allDonations={allDonations}
                graphRefreshTrigger={graphRefreshTrigger}
                isClimbing={isClimbing}
                directionInputRef={directionInputRef}
                user={user}
                onDonationSuccess={handleDonationSuccess}
                sidebarWidth={sidebarWidth}
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