// src/components/RiveAnimation.jsx - REFACTORED WITH CUSTOM HOOKS
import React, { useState, useEffect, useRef } from 'react';
import { DonationsService } from '../lib/donationsService';
import useAuth from '../hooks/useAuth';
import useDonations from '../hooks/useDonations';
import useRiveAnimation from '../hooks/useRiveAnimation';
import useThankYouMessages from '../hooks/useThankYouMessages';
import DonationBarGraph from './DonationBarGraph';
import DonationThankYouTooltip from './DonationThankYouTooltip';
import { UIStrings } from '../config/uiStrings';
import PayPalDonationButton from './PayPalDonationButton';
import DonationHistoryItem from './DonationHistoryItem';
import { AppSettings } from '../config/settings';
import DonationSidebar from './DonationSidebar';
import HeavenDoor from './HeavenDoor';
import AnimationAttribution from './AnimationAttribution';

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

                <HeavenDoor />
                <AnimationAttribution />
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