// src/components/BottleDetailsModal.jsx
import React, { useState } from 'react';
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
            // You'll need to add a method to MessageBottleService for this
            const bottleWithReplies = await MessageBottleService.getBottleWithReplies(bottle.id);
            setReplies(bottleWithReplies.replies || []);
            setShowReplies(true);
        } catch (error) {
            console.error('Error loading replies:', error);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !bottle.allow_reply) return;
        
        setIsSubmitting(true);
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
            setReplyMessage('');
            
            // Refresh replies
            await loadReplies();
            
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Failed to send reply. Please try again.');
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

                                {/* Reply Form */}
                                <div style={{
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '20px'
                                }}>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
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
                                            marginBottom: '15px'
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
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            fontSize: '12px'
                                        }}>
                                            {replyMessage.length}/280 characters
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyMessage.trim() || isSubmitting}
                                        style={{
                                            width: '100%',
                                            background: replyMessage.trim() && !isSubmitting
                                                ? 'linear-gradient(135deg, #4a90e2, #8a7fff)'
                                                : 'rgba(255, 255, 255, 0.1)',
                                            color: replyMessage.trim() && !isSubmitting ? 'white' : 'rgba(255, 255, 255, 0.3)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '12px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: replyMessage.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Reply 🌊'}
                                    </button>
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
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            padding: '10px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
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
                            {replies.map((reply, index) => (
                                <div key={reply.id} style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    borderLeft: '3px solid #4a90e2'
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
                                            fontSize: '11px'
                                        }}>
                                            {reply.is_anonymous ? 'Anonymous' : 'From you'}
                                        </div>
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            fontSize: '11px'
                                        }}>
                                            {formatDate(reply.created_at)}
                                        </div>
                                    </div>
                                </div>
                            ))}
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