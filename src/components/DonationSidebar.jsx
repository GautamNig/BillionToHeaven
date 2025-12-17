// src/components/DonationSidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import PayPalDonationButton from './PayPalDonationButton';
import DonationHistoryItem from './DonationHistoryItem';
import { UIStrings } from '../config/uiStrings';
import { supabase } from '../lib/supabase';

const DonationSidebar = ({
    isExpanded,
    totalMoney,
    currentGoal,
    donationHistory,
    allDonations,
    graphRefreshTrigger,
    isClimbing,
    directionInputRef,
    user,
    onDonationSuccess,
    sidebarWidth = '350px'
}) => {
    const [customAmount, setCustomAmount] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [showDonationHistory, setShowDonationHistory] = useState(false);
    const [showWormGraph, setShowWormGraph] = useState(false);
    const [donationHistoryData, setDonationHistoryData] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [maxTotal, setMaxTotal] = useState(0);
    const canvasRef = useRef(null);

    // Format large numbers with commas
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Fetch donation history for the graph
    const fetchDonationHistoryForGraph = async () => {
        const { data, error } = await supabase
            .from('donations')
            .select('created_at, amount')
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('Error fetching donation history:', error);
            throw error;
        }
        return data || [];
    };

    // Load donation history when modal opens
    useEffect(() => {
        const loadDonationHistory = async () => {
            if (showWormGraph) {
                setIsLoadingHistory(true);
                try {
                    const history = await fetchDonationHistoryForGraph();
                    setDonationHistoryData(history);
                    
                    // Calculate max total for scaling
                    let cumulative = 0;
                    let max = 0;
                    history.forEach(donation => {
                        cumulative += parseFloat(donation.amount);
                        if (cumulative > max) max = cumulative;
                    });
                    setMaxTotal(max);
                    
                } catch (error) {
                    console.error('Error loading donation history:', error);
                } finally {
                    setIsLoadingHistory(false);
                }
            }
        };

        loadDonationHistory();
    }, [showWormGraph]);

    // Draw worm graph (cricket style) - REMOVED LABELS ONLY
    const drawWormGraph = () => {
        if (!canvasRef.current || !donationHistoryData.length) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const padding = { top: 50, right: 40, bottom: 60, left: 60 };
        const graphWidth = canvas.width - padding.left - padding.right;
        const graphHeight = canvas.height - padding.top - padding.bottom;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate cumulative data
        let cumulativeTotal = 0;
        const plotPoints = donationHistoryData.map((donation, index) => {
            cumulativeTotal += parseFloat(donation.amount);
            return {
                x: padding.left + (index / (donationHistoryData.length - 1 || 1)) * graphWidth,
                y: canvas.height - padding.bottom - (cumulativeTotal / maxTotal) * graphHeight,
                cumulative: cumulativeTotal,
                donation: parseFloat(donation.amount),
                date: new Date(donation.created_at)
            };
        });
        
        // Draw grid (KEPT, but removed labels)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines (KEPT, no labels)
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = canvas.height - padding.bottom - (i / ySteps) * graphHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(canvas.width - padding.right, y);
            ctx.stroke();
        }
        
        // Vertical grid lines (KEPT, no labels)
        const xSteps = Math.min(10, donationHistoryData.length - 1);
        for (let i = 0; i <= xSteps; i++) {
            const x = padding.left + (i / xSteps) * graphWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, canvas.height - padding.bottom);
            ctx.stroke();
        }
        
        // Draw worm line (KEPT)
        ctx.beginPath();
        ctx.moveTo(plotPoints[0].x, plotPoints[0].y);
        
        for (let i = 1; i < plotPoints.length; i++) {
            ctx.lineTo(plotPoints[i].x, plotPoints[i].y);
        }
        
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw data points (KEPT)
        plotPoints.forEach((point, index) => {
            // Small circle for each donation
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#4a90e2';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Highlight final point (KEPT, but removed label)
            if (index === plotPoints.length - 1) {
                // Larger circle for current total
                ctx.beginPath();
                ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#ffd93d';
                ctx.fill();
                ctx.strokeStyle = '#ffd93d';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
        
        // Draw axes (KEPT, but removed labels)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, canvas.height - padding.bottom);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding.left, canvas.height - padding.bottom);
        ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
        ctx.stroke();
        
        // Graph title (KEPT)
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Donation Progress', canvas.width / 2, 30);
    };

    // Draw graph when data changes
    useEffect(() => {
        if (showWormGraph && donationHistoryData.length > 0) {
            drawWormGraph();
        }
    }, [showWormGraph, donationHistoryData, maxTotal]);

    if (!isExpanded) {
        return (
            <div style={{
                width: '60px',
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
            </div>
        );
    }

    const percentageFunded = (totalMoney / currentGoal) * 100;

    return (
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
            {/* Header */}
            <div style={{
                padding: '15px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'center',
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

            {/* Content */}
            <div style={{
                flex: 1,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto'
            }}>

                {!user ? (
                    <div style={{
                        background: 'rgba(255, 215, 0, 0.1)',
                        padding: '20px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            marginBottom: '10px'
                        }}>
                            🔒
                        </div>
                        <div style={{
                            color: '#FFD93D',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '10px'
                        }}>
                            Sign in to Donate
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '12px',
                            marginBottom: '15px',
                            lineHeight: '1.4'
                        }}>
                            Create an account to donate, drop message bottles, and find bottles from other donors
                        </div>
                    </div>
                ) : (
                    // Show donation options only if user is logged in
                    <DonationOptions 
                        isClimbing={isClimbing}
                        directionInputRef={directionInputRef}
                        onDonationSuccess={onDonationSuccess}
                        customAmount={customAmount}
                        setCustomAmount={setCustomAmount}
                        showCustomInput={showCustomInput}
                        setShowCustomInput={setShowCustomInput}
                    />
                )}

                                {/* Progress Display */}
                <div>
                    {/* Worm Graph Button */}
                    <button
                        onClick={() => setShowWormGraph(true)}
                        style={{
                            background: 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 20px rgba(138, 127, 255, 0.3)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <span>📈</span>
                        View Donation Graph
                    </button>
                </div>

                {/* Donation History */}
                <DonationHistorySection 
                    donationHistory={donationHistory}
                    user={user}
                    showDonationHistory={showDonationHistory}
                    setShowDonationHistory={setShowDonationHistory}
                />
            </div>

            {/* Worm Graph Modal */}
            {showWormGraph && (
                <WormGraphModal
                    isOpen={showWormGraph}
                    onClose={() => setShowWormGraph(false)}
                    totalMoney={totalMoney}
                    donationHistoryData={donationHistoryData}
                    isLoadingHistory={isLoadingHistory}
                    canvasRef={canvasRef}
                />
            )}
        </div>
    );
};

// Sub-component for Donation Options
const DonationOptions = ({
    isClimbing,
    directionInputRef,
    onDonationSuccess,
    customAmount,
    setCustomAmount,
    showCustomInput,
    setShowCustomInput
}) => {
    return (
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
                            onDonationSuccess={onDonationSuccess}
                            disabled={isClimbing || !directionInputRef.current}
                        />
                    </div>
                ))}

                {/* Custom Amount Option */}
                <CustomAmountInput
                    customAmount={customAmount}
                    setCustomAmount={setCustomAmount}
                    showCustomInput={showCustomInput}
                    setShowCustomInput={setShowCustomInput}
                    isClimbing={isClimbing}
                    directionInputRef={directionInputRef}
                    onDonationSuccess={onDonationSuccess}
                />
            </div>
        </div>
    );
};

// Sub-component for Custom Amount Input
const CustomAmountInput = ({
    customAmount,
    setCustomAmount,
    showCustomInput,
    setShowCustomInput,
    isClimbing,
    directionInputRef,
    onDonationSuccess
}) => {
    return (
        <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 215, 0, 0.3)'
        }}>
            {!showCustomInput ? (
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
                                onDonationSuccess(amount, details);
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
    );
};

// Sub-component for Donation History Section
const DonationHistorySection = ({
    donationHistory,
    user,
    showDonationHistory,
    setShowDonationHistory
}) => {
    return (
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
    );
};

// Worm Graph Modal Component - REMOVED LABELS ONLY
const WormGraphModal = ({ 
    isOpen, 
    onClose, 
    totalMoney,
    donationHistoryData,
    isLoadingHistory,
    canvasRef
}) => {
    if (!isOpen) return null;
    
    // Calculate stats
    const totalDonations = donationHistoryData.length;
    const averageDonation = totalDonations > 0 ? totalMoney / totalDonations : 0;
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
        }}>
            <div style={{
                background: '#0a0a1a',
                borderRadius: '12px',
                padding: '20px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: '1px solid rgba(74, 144, 226, 0.3)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    ×
                </button>
                
                <h2 style={{ 
                    color: 'white', 
                    margin: '0 0 15px 0', 
                    textAlign: 'center',
                    fontSize: '20px'
                }}>
                    Donation Progress Graph
                </h2>
                
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    {isLoadingHistory ? (
                        <div style={{ 
                            textAlign: 'center', 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            padding: '50px' 
                        }}>
                            Loading graph data...
                        </div>
                    ) : donationHistoryData.length === 0 ? (
                        <div style={{ 
                            textAlign: 'center', 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            padding: '50px' 
                        }}>
                            No donation data available yet
                        </div>
                    ) : (
                        <>
                            <canvas
                                ref={canvasRef}
                                width={700}
                                height={400}
                                style={{
                                    width: '100%',
                                    height: '400px',
                                    borderRadius: '5px',
                                    background: '#0a0a1a'
                                }}
                            />
                            {/* Timeline markers - REMOVED DATES */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '15px',
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                                <span>Start</span>
                                <span>Current</span>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Simple Stats (KEPT - this is outside the graph) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px'
                }}>
                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <div style={{ color: '#4a90e2', fontSize: '18px', fontWeight: 'bold' }}>
                            {totalDonations}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                            Donations
                        </div>
                    </div>
            
                    
                </div>
                
                {/* Close Button */}
                <div style={{
                    marginTop: '20px',
                    display: 'flex',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '6px',
                            padding: '8px 20px',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DonationSidebar;