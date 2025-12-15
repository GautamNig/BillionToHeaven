// src/components/SentBottlesTab.jsx - UPDATED WITH BADGE CLEARING
import React, { useState, useEffect } from 'react';
import { MessageBottleService } from '../lib/messageBottleService';
import useAuth from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const SentBottlesTab = ({ isOpen, onClose, onBottleViewed, onRepliesLoaded }) => {
    const { user } = useAuth();
    const [sentBottles, setSentBottles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBottle, setSelectedBottle] = useState(null);
    const [bottleReplies, setBottleReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [viewedBottles, setViewedBottles] = useState(new Set()); // Track viewed bottles

    const loadSentBottles = async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const bottles = await MessageBottleService.getUserBottles(user.id);
            setSentBottles(bottles.sent || []);
            console.log('📤 Loaded sent bottles:', bottles.sent?.length);
            
            // Callback to update parent component
            if (onRepliesLoaded) {
                onRepliesLoaded(bottles.sent || []);
            }
        } catch (error) {
            console.error('Error loading sent bottles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadReplies = async (bottleId) => {
        setLoadingReplies(true);
        try {
            const bottleWithReplies = await MessageBottleService.getBottleWithReplies(bottleId);
            setBottleReplies(bottleWithReplies.replies || []);
            
            // Mark this bottle as viewed (clear its badge)
            markBottleAsViewed(bottleId);
            
            console.log(`💌 Loaded ${bottleWithReplies.replies?.length} replies for bottle ${bottleId}`);
        } catch (error) {
            console.error('Error loading replies:', error);
        } finally {
            setLoadingReplies(false);
        }
    };

     const markBottleAsViewed = (bottleId) => {
        // Add bottle to viewed set
        setViewedBottles(prev => {
            const newSet = new Set([...prev, bottleId]);
            return newSet;
        });
        
        // Notify parent component
        if (onBottleViewed) {
            onBottleViewed(bottleId);
        }
        
        console.log(`👁️ Marked bottle ${bottleId} as viewed`);
    };

    const handleViewReplies = async (bottle) => {
        setSelectedBottle(bottle);
        await loadReplies(bottle.id);
    };

    const handleCloseModal = () => {
        setSelectedBottle(null);
        setBottleReplies([]);
    };

    const handleViewBottleDetails = (bottle) => {
        // When user views bottle details, mark it as viewed
        markBottleAsViewed(bottle.id);
        handleViewReplies(bottle);
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

    const getBottleStatus = (bottle) => {
        if (bottle.status === 'floating') return '🌊 Floating in ocean';
        if (bottle.status === 'found') return '🎉 Found by someone!';
        if (bottle.has_replies) return '💌 Has replies';
        return 'Sent';
    };

    const isBottleNew = (bottle) => {
        // Bottle is "new" if it has replies AND hasn't been viewed yet
        return bottle.has_replies && !viewedBottles.has(bottle.id);
    };

      useEffect(() => {
        if (user) {
            const storedViewed = localStorage.getItem(`viewed_bottles_${user.id}`);
            if (storedViewed) {
                try {
                    const viewedIds = new Set(JSON.parse(storedViewed));
                    setViewedBottles(viewedIds);
                    console.log(`📋 Tab: Loaded ${viewedIds.size} viewed bottles`);
                } catch (error) {
                    console.error('Error loading viewed bottles:', error);
                }
            }
        }
    }, [user]);

    useEffect(() => {
        if (user && isOpen) {
            loadSentBottles();
            
            // Subscribe to reply updates
            const subscription = supabase
                .channel('replies-updates')
                .on('postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'bottle_replies'
                    },
                    () => {
                        loadSentBottles(); // Reload to show new replies
                    }
                )
                .subscribe();
            
            return () => subscription.unsubscribe();
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div style={{
                position: 'fixed',
                top: '60px',
                right: 0,
                width: '400px',
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
                        <span>📤</span>
                        Your Sent Bottles
                        <span style={{
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontWeight: 'normal'
                        }}>
                            ({sentBottles.filter(b => isBottleNew(b)).length} new)
                        </span>
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

                {/* Bottles List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '10px'
                }}>
                    {isLoading ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                            Loading your sent bottles...
                        </div>
                    ) : sentBottles.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌊</div>
                            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                                No bottles sent yet
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>
                                Drop a bottle after donating to send messages to others!
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {sentBottles.map(bottle => {
                                const isNew = isBottleNew(bottle);
                                return (
                                    <div
                                        key={bottle.id}
                                        style={{
                                            background: isNew 
                                                ? 'rgba(107, 207, 127, 0.1)' 
                                                : bottle.has_replies
                                                    ? 'rgba(74, 144, 226, 0.1)'
                                                    : 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${isNew 
                                                ? 'rgba(107, 207, 127, 0.3)' 
                                                : bottle.has_replies
                                                    ? 'rgba(74, 144, 226, 0.3)'
                                                    : 'rgba(255, 255, 255, 0.1)'}`,
                                            borderRadius: '10px',
                                            padding: '15px',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onClick={() => handleViewBottleDetails(bottle)}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.background = isNew 
                                                ? 'rgba(107, 207, 127, 0.15)' 
                                                : bottle.has_replies
                                                    ? 'rgba(74, 144, 226, 0.15)'
                                                    : 'rgba(255, 255, 255, 0.08)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.background = isNew 
                                                ? 'rgba(107, 207, 127, 0.1)' 
                                                : bottle.has_replies
                                                    ? 'rgba(74, 144, 226, 0.1)'
                                                    : 'rgba(255, 255, 255, 0.05)';
                                        }}
                                    >
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            fontSize: '13px',
                                            fontWeight: 'bold',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>Bottle #{bottle.id.slice(0, 8)}</span>
                                            <span style={{
                                                fontSize: '11px',
                                                color: isNew ? '#6bcf7f' : 
                                                       bottle.has_replies ? '#4a90e2' : 
                                                       'rgba(255, 255, 255, 0.6)'
                                            }}>
                                                {getBottleStatus(bottle)}
                                            </span>
                                        </div>
                                        
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontSize: '12px',
                                            lineHeight: '1.4',
                                            marginBottom: '10px',
                                            maxHeight: '60px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            "{bottle.message}"
                                        </div>
                                        
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginTop: '10px'
                                        }}>
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.5)',
                                                fontSize: '10px'
                                            }}>
                                                {formatDate(bottle.created_at)}
                                            </div>
                                            
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                {bottle.has_replies && (
                                                    <span style={{
                                                        fontSize: '11px',
                                                        color: isNew ? '#6bcf7f' : '#4a90e2',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        {isNew ? '💌 New replies!' : '💌 View replies'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {isNew && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                background: '#6bcf7f',
                                                color: 'white',
                                                fontSize: '10px',
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                fontWeight: 'bold',
                                                animation: 'pulse 2s infinite'
                                            }}>
                                                New
                                            </div>
                                        )}
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
                        {sentBottles.length} bottle{sentBottles.length !== 1 ? 's' : ''} sent • 
                        {sentBottles.filter(b => b.has_replies).length} with replies • 
                        {sentBottles.filter(b => isBottleNew(b)).length} new
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
                    right: '400px',
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1899,
                    backdropFilter: 'blur(2px)'
                }}
            />

            {/* Replies Modal */}
            {selectedBottle && (
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
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        border: '2px solid rgba(107, 207, 127, 0.3)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={handleCloseModal}
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

                        <h3 style={{
                            color: '#6bcf7f',
                            fontSize: '18px',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            💌 Replies to Your Bottle
                        </h3>

                        <div style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '13px',
                            marginBottom: '20px',
                            padding: '15px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '10px',
                            borderLeft: '3px solid #4a90e2'
                        }}>
                            "{selectedBottle.message}"
                        </div>

                        {loadingReplies ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                Loading replies...
                            </div>
                        ) : bottleReplies.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
                                <div>No replies yet</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px' }}>
                                    Check back later to see if someone replied!
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {bottleReplies.map(reply => (
                                    <div key={reply.id} style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '10px',
                                        padding: '15px',
                                        borderLeft: '3px solid #6bcf7f'
                                    }}>
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            fontSize: '13px',
                                            lineHeight: '1.5',
                                            marginBottom: '8px'
                                        }}>
                                            {reply.message}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.6)',
                                                fontSize: '11px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {reply.is_anonymous ? '👤 From anonymous donor' : '👤 From: ' + (reply.sender_donation?.user_email?.split('@')[0] || 'Unknown')}
                                            </div>
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.5)',
                                                fontSize: '10px'
                                            }}>
                                                {formatDate(reply.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{
                            marginTop: '20px',
                            paddingTop: '15px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            textAlign: 'center'
                        }}>
                            <button
                                onClick={handleCloseModal}
                                style={{
                                    background: 'rgba(74, 144, 226, 0.2)',
                                    border: '1px solid rgba(74, 144, 226, 0.3)',
                                    color: '#4a90e2',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = 'rgba(74, 144, 226, 0.3)';
                                    e.target.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'rgba(74, 144, 226, 0.2)';
                                    e.target.style.color = '#4a90e2';
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SentBottlesTab;