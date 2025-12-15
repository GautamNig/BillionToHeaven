// Updated BottleInboxTab.jsx - Add queue info section
import React, { useState, useEffect } from 'react';
import { MessageBottleService } from '../lib/messageBottleService';
import { DonationsService } from '../lib/donationsService'; // Add this import
import useAuth from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import BottleDetailsModal from './BottleDetailsModal';

const BottleInboxTab = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [foundBottles, setFoundBottles] = useState([]);
    const [selectedBottle, setSelectedBottle] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [queueInfo, setQueueInfo] = useState(null); // Add queue info state

    // Load user's found bottles
    const loadFoundBottles = async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const bottles = await MessageBottleService.getUserBottles(user.id);
            
            // Filter only found bottles (status = 'found' or 'read')
            const found = bottles.found.filter(b => 
                b.status === 'found' || b.status === 'read'
            );
            
            setFoundBottles(found);
            setUnreadCount(bottles.found.filter(b => b.status === 'found').length);
            
            console.log('📬 Loaded found bottles:', found.length);
            
        } catch (error) {
            console.error('Error loading found bottles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load queue info
    const loadQueueInfo = async () => {
        if (!user) return;
        
        try {
            const queueStatus = await DonationsService.getUserQueueStatus(user.id);
            setQueueInfo(queueStatus);
            
            if (queueStatus.inQueue) {
                console.log(`📊 User queue position: #${queueStatus.queuePosition}`);
            }
        } catch (error) {
            console.error('Error loading queue info:', error);
        }
    };

    useEffect(() => {
        if (user && isOpen) {
            loadFoundBottles();
            loadQueueInfo(); // Load queue info
            
            // Subscribe to bottle updates
            const subscription = supabase
                .channel('user-bottles-updates')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'message_bottles'
                    },
                    () => {
                        loadFoundBottles();
                        loadQueueInfo(); // Reload queue info on changes
                    }
                )
                .subscribe();
            
            return () => subscription.unsubscribe();
        }
    }, [user, isOpen]);

    const handleBottleClick = (bottle) => {
        setSelectedBottle(bottle);
        
        // Mark as read if unread
        if (bottle.status === 'found') {
            MessageBottleService.markBottleAsRead(bottle.id)
                .then(() => {
                    // Update local state
                    setFoundBottles(prev =>
                        prev.map(b =>
                            b.id === bottle.id
                                ? { ...b, status: 'read' }
                                : b
                        )
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                })
                .catch(error => {
                    console.error('Error marking bottle as read:', error);
                });
        }
    };

    const handleCloseModal = () => {
        setSelectedBottle(null);
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDonorInfo = (bottle) => {
        if (bottle.is_anonymous) {
            return {
                name: "Anonymous Donor",
                showAmount: false
            };
        }
        
        const donorEmail = bottle.donations?.user_email;
        const username = donorEmail ? donorEmail.split('@')[0] : "Unknown";
        
        return {
            name: username,
            showAmount: bottle.show_donation_amount,
            amount: bottle.donations?.amount
        };
    };

    if (!isOpen) return null;

    return (
        <>
            <div style={{
                position: 'fixed',
                top: '60px',
                right: 0,
                width: '350px',
                height: 'calc(100vh - 60px)',
                background: 'rgba(0, 0, 0, 0.98)',
                borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                zIndex: 1900,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
                animation: 'slideInRight 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📬</span>
                        Bottle Inbox
                        {unreadCount > 0 && (
                            <span style={{
                                background: '#ff6b6b',
                                color: 'white',
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '10px'
                            }}>
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
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
                            transition: 'all 0.3s ease'
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
                </div>

                {/* Queue Status Banner (NEW) */}
                {queueInfo?.inQueue && (
                    <div style={{
                        padding: '12px 15px',
                        background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.2), rgba(138, 127, 255, 0.2))',
                        borderBottom: '1px solid rgba(74, 144, 226, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                background: 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px'
                            }}>
                                ⏳
                            </div>
                            <div>
                                <div style={{
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    Queue Position: <span style={{ color: '#ffd93d' }}>#{queueInfo.queuePosition}</span>
                                </div>
                                <div style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '10px'
                                }}>
                                    {queueInfo.queuePosition === 1 ? 'Next to receive a bottle!' : 'Waiting for bottles...'}
                                </div>
                            </div>
                        </div>
                        {queueInfo.queuePosition === 1 && (
                            <div style={{
                                animation: 'pulse 2s infinite',
                                fontSize: '20px'
                            }}>
                                🎯
                            </div>
                        )}
                    </div>
                )}

                {/* Bottles List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px'
                }}>
                    {isLoading ? (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                            Loading bottles...
                        </div>
                    ) : foundBottles.length === 0 ? (
                        <div style={{
                            padding: '60px 20px',
                            textAlign: 'center',
                            color: 'rgba(255, 255, 255, 0.5)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌊</div>
                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                No bottles found yet
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.4)'
                            }}>
                                {queueInfo?.inQueue ? (
                                    `You're #${queueInfo.queuePosition} in queue - next donation might bring a bottle!`
                                ) : (
                                    'Donate to discover message bottles!'
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {foundBottles.map(bottle => {
                                const donorInfo = getDonorInfo(bottle);
                                
                                return (
                                    <div
                                        key={bottle.id}
                                        onClick={() => handleBottleClick(bottle)}
                                        style={{
                                            padding: '12px 15px',
                                            background: bottle.status === 'found' 
                                                ? 'rgba(74, 144, 226, 0.1)' 
                                                : 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${bottle.status === 'found' 
                                                ? 'rgba(74, 144, 226, 0.3)' 
                                                : 'rgba(255, 255, 255, 0.1)'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            position: 'relative'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = bottle.status === 'found' 
                                                ? 'rgba(74, 144, 226, 0.15)' 
                                                : 'rgba(255, 255, 255, 0.08)';
                                            e.currentTarget.style.transform = 'translateX(-2px)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = bottle.status === 'found' 
                                                ? 'rgba(74, 144, 226, 0.1)' 
                                                : 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '6px'
                                        }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                background: bottle.status === 'found'
                                                    ? 'linear-gradient(135deg, #4a90e2, #8a7fff)'
                                                    : 'rgba(255, 255, 255, 0.1)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                flexShrink: 0
                                            }}>
                                                {donorInfo.name === "Anonymous Donor" ? '🎭' : '👤'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    color: bottle.status === 'found' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                                                    fontSize: '13px',
                                                    fontWeight: bottle.status === 'found' ? '600' : '500',
                                                    marginBottom: '2px'
                                                }}>
                                                    {donorInfo.name}
                                                    {donorInfo.showAmount && donorInfo.amount && (
                                                        <span style={{
                                                            color: '#ffd93d',
                                                            fontSize: '11px',
                                                            marginLeft: '6px'
                                                        }}>
                                                            ${donorInfo.amount}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    color: 'rgba(255, 255, 255, 0.5)',
                                                    fontSize: '10px'
                                                }}>
                                                    {formatDate(bottle.found_at || bottle.created_at)}
                                                </div>
                                            </div>
                                            {bottle.status === 'found' && (
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    background: '#4a90e2',
                                                    borderRadius: '50%',
                                                    flexShrink: 0
                                                }} />
                                            )}
                                        </div>
                                        
                                        {/* Message preview */}
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '12px',
                                            lineHeight: '1.4',
                                            marginTop: '6px',
                                            maxHeight: '40px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {bottle.message}
                                        </div>
                                        
                                        {/* Bottle color indicator */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                background: bottle.bottle_color === 'blue' ? '#4a90e2' :
                                                           bottle.bottle_color === 'green' ? '#6bcf7f' :
                                                           bottle.bottle_color === 'purple' ? '#8a7fff' :
                                                           bottle.bottle_color === 'gold' ? '#ffd93d' :
                                                           'linear-gradient(45deg, #4a90e2, #6bcf7f, #8a7fff, #ffd93d)',
                                                borderRadius: '50%'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 15px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '11px'
                    }}>
                        {foundBottles.length} bottle{foundBottles.length !== 1 ? 's' : ''} in collection
                        {queueInfo?.inQueue && ` • Queue: #${queueInfo.queuePosition}`}
                    </div>
                </div>
            </div>

            {/* Click outside to close */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    right: '350px',
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1899,
                    backdropFilter: 'blur(2px)'
                }}
            />

            {/* Bottle Details Modal */}
            {selectedBottle && (
                <BottleDetailsModal
                    bottle={selectedBottle}
                    onClose={handleCloseModal}
                    user={user}
                />
            )}
        </>
    );
};

export default BottleInboxTab;