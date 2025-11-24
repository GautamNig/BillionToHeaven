// src/components/DonationHistoryItem.jsx
import React from 'react';
import { UIStrings, getUsername } from '../config/uiStrings';

const DonationHistoryItem = ({ donation, isCurrentUser, index }) => {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return UIStrings.HISTORY.TIME_AGO.JUST_NOW;
        if (diffMins < 60) return UIStrings.HISTORY.TIME_AGO.MINUTES_AGO(diffMins);
        if (diffHours < 24) return UIStrings.HISTORY.TIME_AGO.HOURS_AGO(diffHours);
        return date.toLocaleDateString();
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
                            {isCurrentUser ? UIStrings.GENERAL.YOU : getUsername(donation.user_email)}
                            {isAnonymous && ' 🎭'}
                        </div>
                    </div>

                    <div style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '10px',
                        lineHeight: '1.3'
                    }}>
                        {UIStrings.DONATION.HELPED_CLIMB(amount, isCurrentUser)}
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

export default DonationHistoryItem;