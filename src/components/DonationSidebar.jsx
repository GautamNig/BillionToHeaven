// src/components/DonationSidebar.jsx
import React, { useState } from 'react';
import PayPalDonationButton from './PayPalDonationButton';
import DonationHistoryItem from './DonationHistoryItem';
import DonationBarGraph from './DonationBarGraph';
import { UIStrings } from '../config/uiStrings';

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
                <DonationOptions 
                    isClimbing={isClimbing}
                    directionInputRef={directionInputRef}
                    onDonationSuccess={onDonationSuccess}
                    customAmount={customAmount}
                    setCustomAmount={setCustomAmount}
                    showCustomInput={showCustomInput}
                    setShowCustomInput={setShowCustomInput}
                />

                {/* Donation History */}
                <DonationHistorySection 
                    donationHistory={donationHistory}
                    user={user}
                    showDonationHistory={showDonationHistory}
                    setShowDonationHistory={setShowDonationHistory}
                />

                {/* Bar Graph */}
                <DonationBarGraph 
                    isExpanded={true}
                    refreshTrigger={graphRefreshTrigger}
                    allDonations={allDonations}
                />
            </div>
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

export default DonationSidebar;