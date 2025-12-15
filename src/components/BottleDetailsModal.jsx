// src/components/BottleDetailsModal.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { MessageBottleService } from '../lib/messageBottleService';
import { supabase } from '../lib/supabase';

const BottleDetailsModal = ({ bottle, onClose, user }) => {
    const [replyMessage, setReplyMessage] = useState('');
    const [isAnonymousReply, setIsAnonymousReply] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replySent, setReplySent] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [hasReplied, setHasReplied] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [userDonationIds, setUserDonationIds] = useState([]);

    // Load user's donation IDs on mount
    useEffect(() => {
        const loadUserDonations = async () => {
            if (!user) return;
            
            try {
                const { data: donations } = await supabase
                    .from('donations')
                    .select('id')
                    .eq('user_id', user.id);
                
                if (donations) {
                    const ids = donations.map(d => d.id);
                    setUserDonationIds(ids);
                    
                    // Check if user has already replied to this bottle
                    if (replies.length > 0) {
                        const userHasReplied = replies.some(reply => 
                            ids.includes(reply.sender_donation_id)
                        );
                        setHasReplied(userHasReplied);
                    }
                }
            } catch (error) {
                console.error('Error loading user donations:', error);
            }
        };
        
        loadUserDonations();
    }, [user]);

    const getDonorInfo = () => {
        if (bottle.is_anonymous) {
            return {
                name: "Anonymous Donor",
                showAmount: false,
                avatar: "🎭",
                description: "You found an anonymous bottle in the ocean"
            };
        }
        
        const donorEmail = bottle.donations?.user_email;
        const username = donorEmail ? donorEmail.split('@')[0] : "Unknown";
        
        return {
            name: username,
            showAmount: bottle.show_donation_amount,
            amount: bottle.donations?.amount,
            avatar: "👤",
            description: `Message from ${username}`
        };
    };

    const donorInfo = getDonorInfo();

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString([], {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const loadReplies = async () => {
        setLoadingReplies(true);
        try {
            const bottleWithReplies = await MessageBottleService.getBottleWithReplies(bottle.id);
            setReplies(bottleWithReplies.replies || []);
            setShowReplies(true);
            
            // Check if current user has already replied
            if (userDonationIds.length > 0 && bottleWithReplies.replies) {
                const userHasReplied = bottleWithReplies.replies.some(reply => 
                    userDonationIds.includes(reply.sender_donation_id)
                );
                setHasReplied(userHasReplied);
            }
            
        } catch (error) {
            console.error('Error loading replies:', error);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !bottle.allow_reply || hasReplied) return;
        
        setIsSubmitting(true);
        setReplyError('');
        
        try {
            // Get user's most recent donation for this reply
            const { data: userDonations, error } = await supabase
                .from('donations')
                .select('id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (error) throw error;
            
            // Send reply
            await MessageBottleService.addReply(
                bottle.id,
                userDonations.id,
                replyMessage,
                isAnonymousReply
            );
            
            setReplySent(true);
            setHasReplied(true);
            setReplyMessage('');
            
            // Refresh replies
            await loadReplies();
            
        } catch (error) {
            console.error('Error sending reply:', error);
            setReplyError(error.message || 'Failed to send reply. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

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
            backdropFilter: 'blur(10px)',
            padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a0b3a, #2b0c5c)',
                borderRadius: '20px',
                padding: '25px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: '2px solid rgba(74, 144, 226, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                position: 'relative'
            }}>
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        zIndex: 10
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                    }}
                >
                    ×
                </button>

                {/* Bottle Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '20px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        {donorInfo.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '4px'
                        }}>
                            {donorInfo.name}
                            {donorInfo.showAmount && donorInfo.amount && (
                                <span style={{
                                    color: '#ffd93d',
                                    fontSize: '14px',
                                    marginLeft: '8px'
                                }}>
                                    ${donorInfo.amount}
                                </span>
                            )}
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '12px'
                        }}>
                            {donorInfo.description}
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '11px',
                            marginTop: '4px'
                        }}>
                            Found on {formatDate(bottle.found_at || bottle.created_at)}
                        </div>
                    </div>
                </div>

                {/* Bottle Color Indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '15px',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px'
                }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        background: bottle.bottle_color === 'blue' ? '#4a90e2' :
                                   bottle.bottle_color === 'green' ? '#6bcf7f' :
                                   bottle.bottle_color === 'purple' ? '#8a7fff' :
                                   bottle.bottle_color === 'gold' ? '#ffd93d' : 'linear-gradient(45deg, #4a90e2, #6bcf7f, #8a7fff, #ffd93d)',
                        borderRadius: '50%'
                    }} />
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '11px'
                    }}>
                        {bottle.bottle_color.charAt(0).toUpperCase() + bottle.bottle_color.slice(1)} bottle
                    </div>
                </div>

                {/* Message Content */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '25px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {bottle.message}
                    </div>
                </div>

                {/* Replies Section */}
                {bottle.allow_reply && (
                    <>
                        {replySent ? (
                            <div style={{
                                background: 'rgba(107, 207, 127, 0.1)',
                                border: '1px solid rgba(107, 207, 127, 0.3)',
                                borderRadius: '10px',
                                padding: '15px',
                                marginBottom: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    color: '#6bcf7f',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    marginBottom: '5px'
                                }}>
                                    ✓ Reply Sent!
                                </div>
                                <div style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '12px'
                                }}>
                                    Your reply has been sent to the bottle's sender
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    marginBottom: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <span>💬</span> Send a Reply
                                </div>

                                {/* Show error message if any */}
                                {replyError && (
                                    <div style={{
                                        background: 'rgba(255, 107, 107, 0.1)',
                                        border: '1px solid rgba(255, 107, 107, 0.3)',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        marginBottom: '15px',
                                        color: '#ff6b6b',
                                        fontSize: '12px'
                                    }}>
                                        {replyError}
                                    </div>
                                )}

                                {/* Reply Form */}
                                <div style={{
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '20px',
                                    opacity: hasReplied ? 0.6 : 1
                                }}>
                                    {hasReplied ? (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '20px',
                                            color: 'rgba(255, 255, 255, 0.7)'
                                        }}>
                                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>✅</div>
                                            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>
                                                You've already replied to this bottle
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                                Only one reply per person is allowed
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <textarea
                                                value={replyMessage}
                                                onChange={(e) => {
                                                    if (e.target.value.length <= 280) {
                                                        setReplyMessage(e.target.value);
                                                    }
                                                }}
                                                placeholder="Write your reply to the bottle sender..."
                                                style={{
                                                    width: '100%',
                                                    minHeight: '80px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    resize: 'vertical',
                                                    outline: 'none',
                                                    fontFamily: 'inherit',
                                                    marginBottom: '15px',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onFocus={(e) => {
                                                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                                    e.target.style.borderColor = '#4a90e2';
                                                }}
                                                onBlur={(e) => {
                                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                }}
                                            />
                                            
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '15px'
                                            }}>
                                                <label style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isAnonymousReply}
                                                        onChange={(e) => setIsAnonymousReply(e.target.checked)}
                                                        style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: 'rgba(255, 255, 255, 0.8)',
                                                        fontSize: '13px'
                                                    }}>
                                                        Send anonymously 🎭
                                                    </span>
                                                </label>
                                                
                                                <div style={{
                                                    color: replyMessage.length > 250 ? '#ff6b6b' : 'rgba(255, 255, 255, 0.6)',
                                                    fontSize: '12px'
                                                }}>
                                                    {replyMessage.length}/280 characters
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={handleSendReply}
                                                disabled={!replyMessage.trim() || isSubmitting || hasReplied}
                                                style={{
                                                    width: '100%',
                                                    background: replyMessage.trim() && !isSubmitting && !hasReplied
                                                        ? 'linear-gradient(135deg, #4a90e2, #8a7fff)'
                                                        : 'rgba(255, 255, 255, 0.1)',
                                                    color: replyMessage.trim() && !isSubmitting && !hasReplied ? 'white' : 'rgba(255, 255, 255, 0.3)',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    padding: '12px',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    cursor: replyMessage.trim() && !isSubmitting && !hasReplied ? 'pointer' : 'not-allowed',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseOver={(e) => {
                                                    if (replyMessage.trim() && !isSubmitting && !hasReplied) {
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 8px 20px rgba(138, 127, 255, 0.3)';
                                                    }
                                                }}
                                                onMouseOut={(e) => {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = 'none';
                                                }}
                                            >
                                                {isSubmitting ? 'Sending...' : 'Send Reply 🌊'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* View Replies Button */}
                {replies.length > 0 && !showReplies && (
                    <button
                        onClick={loadReplies}
                        disabled={loadingReplies}
                        style={{
                            width: '100%',
                            background: 'rgba(74, 144, 226, 0.2)',
                            color: '#4a90e2',
                            border: '1px solid rgba(74, 144, 226, 0.3)',
                            borderRadius: '10px',
                            padding: '10px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            if (!loadingReplies) {
                                e.target.style.background = 'rgba(74, 144, 226, 0.3)';
                                e.target.style.color = 'white';
                            }
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(74, 144, 226, 0.2)';
                            e.target.style.color = '#4a90e2';
                        }}
                    >
                        {loadingReplies ? 'Loading...' : `View ${replies.length} reply${replies.length !== 1 ? 's' : ''}`}
                    </button>
                )}

                {/* Replies List */}
                {showReplies && replies.length > 0 && (
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '12px',
                        padding: '15px',
                        marginTop: '15px'
                    }}>
                        <div style={{
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>💬</span> Replies ({replies.length})
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {replies.map((reply, index) => {
                                const isUsersReply = userDonationIds.includes(reply.sender_donation_id);
                                return (
                                    <div key={reply.id} style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        borderLeft: `3px solid ${isUsersReply ? '#6bcf7f' : '#4a90e2'}`
                                    }}>
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            fontSize: '13px',
                                            lineHeight: '1.5',
                                            marginBottom: '6px'
                                        }}>
                                            {reply.message}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.5)',
                                                fontSize: '11px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {isUsersReply ? '✅ Your reply' : (reply.is_anonymous ? 'Anonymous' : 'From donor')}
                                            </div>
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.5)',
                                                fontSize: '11px'
                                            }}>
                                                {formatDate(reply.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer Info */}
                <div style={{
                    marginTop: '20px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '11px',
                    textAlign: 'center'
                }}>
                    {!bottle.allow_reply ? (
                        "This bottle does not allow replies"
                    ) : hasReplied ? (
                        "You have already replied to this bottle"
                    ) : replySent ? (
                        "The bottle sender will be notified of your reply"
                    ) : (
                        "Replies are one-time only. The bottle sender will be notified."
                    )}
                </div>
            </div>
        </div>
    );
};

export default BottleDetailsModal;