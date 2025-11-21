// src/components/RiveAnimation.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useRive } from '@rive-app/react-webgl2';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { DonationsService } from '../lib/donationsService';
import useAuth from '../hooks/useAuth';
import DonationBarGraph from './DonationBarGraph';

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

    const { RiveComponent, rive } = useRive({
        src: '/8866-17054-stairs-marcelo-bazani.riv',
        autoplay: true,
        stateMachines: ["State Machine 1"],
    });


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

    // Load initial data and set up real-time subscriptions
    useEffect(() => {
        let donationsSubscription;
        let goalsSubscription;

        const initializeData = async () => {
            try {
                setIsLoading(true);

                // Load total amount
                const total = await DonationsService.getTotalAmount();
                setTotalMoney(total);

                // Load current goal
                const goal = await DonationsService.getCurrentGoal();
                setCurrentGoal(parseFloat(goal.target_amount));

                // Load recent donations
                const recent = await DonationsService.getRecentDonations(5);
                setDonationHistory(recent);

                // Load ALL donations for the graph
                const allDonationsData = await DonationsService.getAllDonations();
                setAllDonations(allDonationsData);

            } catch (error) {
                console.error('Error initializing data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();

        // Set up real-time subscription for donations
        donationsSubscription = DonationsService.subscribeToDonations(async (payload) => {
            console.log('📡 Real-time donation update received:', payload);

            if (payload.eventType === 'INSERT') {
                console.log('🔄 New donation detected, refreshing all data...');

                // Refresh ALL data
                const newTotal = await DonationsService.getTotalAmount();
                setTotalMoney(newTotal);

                const newRecent = await DonationsService.getRecentDonations(5);
                setDonationHistory(newRecent);

                const newAllDonations = await DonationsService.getAllDonations();
                setAllDonations(newAllDonations);

                console.log('✅ All UI data updated with new donation');
            }
        });

        // ... goals subscription remains the same

        return () => {
            if (donationsSubscription) {
                DonationsService.unsubscribe(donationsSubscription);
            }
            if (goalsSubscription) {
                DonationsService.unsubscribe(goalsSubscription);
            }
        };
    }, []);

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

    // Manual test function
    const testAnimation = () => {
        console.log('🧪 Manual test triggered');
        startClimbingAnimation(3); // Test with 3 seconds
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

                {/* Fantasy Door Image - Right Side */}
                <div style={{
                    width: '35%',
                    minWidth: '400px',
                    position: 'relative',
                    background: '#2b0c5c',
                    overflow: 'hidden'
                }}>
                    <img
                        src="/src/assets/door-stretching-into-fantasy-world.jpg"
                        alt="Fantasy World Door"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            filter: 'brightness(0.9) contrast(1.1)',
                            borderLeft: '3px solid rgba(255, 215, 0, 0.3)'
                        }}
                    />

                    {/* Overlay to blend with animation */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50px',
                        height: '100%',
                        background: 'linear-gradient(90deg, #2b0c5c, transparent)',
                        pointerEvents: 'none'
                    }} />



                    {/* Destination Text */}
                    <div style={{
                        position: 'absolute',
                        bottom: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#ffd93d',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        🏰 Heaven Awaits
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
        </div>
    );
}