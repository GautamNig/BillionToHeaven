// src/components/NotificationBell.jsx - UPDATED
import React, { useState, useEffect } from 'react';
import { MessageBottleService } from '../lib/messageBottleService';
import useAuth from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const NotificationBell = ({ onOpenInbox }) => { // Add onOpenInbox prop
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadNotifications();
            
            // Simple subscription - just listen for all bottle changes
            const subscription = supabase
                .channel('user-bottles-simple')
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'message_bottles' 
                    },
                    () => {
                        // Just refresh notifications on any change
                        loadNotifications();
                    }
                )
                .subscribe();
            
            return () => {
                subscription?.unsubscribe();
            };
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const bottles = await MessageBottleService.getUserBottles(user.id);
            
            // Count unread bottles (status = 'found')
            const unread = bottles.found.filter(b => b.status === 'found').length;
            setUnreadCount(unread);
            
            // Create notifications from found bottles
            const notifs = bottles.found
                .filter(b => b.status === 'found')
                .map(bottle => ({
                    id: bottle.id,
                    type: 'bottle_found',
                    message: '🎉 You found a message bottle!',
                    timestamp: bottle.found_at,
                    data: bottle,
                    isRead: bottle.status === 'read'
                }));
            
            setNotifications(notifs);
            
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBellClick = () => {
        setShowDropdown(!showDropdown);
    };

    const handleNotificationClick = async (notification) => {
        if (notification.type === 'bottle_found') {
            // Mark bottle as read
            try {
                await MessageBottleService.markBottleAsRead(notification.id);
                // Update local state
                setNotifications(prev => 
                    prev.map(n => 
                        n.id === notification.id 
                            ? { ...n, isRead: true }
                            : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error('Error marking bottle as read:', error);
            }
        }
        
        // OPEN THE INBOX INSTEAD OF JUST LOGGING
        if (onOpenInbox) {
            onOpenInbox();
        }
        setShowDropdown(false);
    };

    const clearAllNotifications = () => {
        // Implement clearing logic
        setNotifications([]);
        setUnreadCount(0);
        setShowDropdown(false);
    };

    if (!user) return null;

    return (
        <div style={{ position: 'relative' }}>
            {/* Bell Icon */}
            <button
                onClick={handleBellClick}
                style={{
                    background: 'transparent',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                    e.target.style.background = 'transparent';
                }}
            >
                <div style={{ fontSize: '20px', position: 'relative' }}>
                    🔔
                    {unreadCount > 0 && (
                        <div style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#ff6b6b',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            minWidth: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2px',
                            border: '2px solid rgba(0, 0, 0, 0.95)'
                        }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                    )}
                </div>
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'rgba(0, 0, 0, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    minWidth: '300px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 2000,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                    marginTop: '10px'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '15px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>📬</span>
                            Messages
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
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAllNotifications}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px'
                                }}
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {isLoading ? (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: 'rgba(255, 255, 255, 0.6)'
                            }}>
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{
                                padding: '30px 20px',
                                textAlign: 'center',
                                color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🌊</div>
                                <div style={{ fontSize: '12px' }}>
                                    No messages yet
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: 'rgba(255, 255, 255, 0.4)',
                                    marginTop: '5px'
                                }}>
                                    Donate to find message bottles!
                                </div>
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notification, index) => (
                                    <div
                                        key={`${notification.id || 'no-id'}-${index}`}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{
                                            padding: '12px 15px',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                            cursor: 'pointer',
                                            background: notification.isRead 
                                                ? 'transparent' 
                                                : 'rgba(74, 144, 226, 0.1)',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.background = notification.isRead
                                                ? 'rgba(255, 255, 255, 0.05)'
                                                : 'rgba(74, 144, 226, 0.15)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.background = notification.isRead
                                                ? 'transparent'
                                                : 'rgba(74, 144, 226, 0.1)';
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            background: notification.isRead
                                                ? 'rgba(255, 255, 255, 0.1)'
                                                : 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '16px',
                                            flexShrink: 0
                                        }}>
                                            {notification.type === 'bottle_found' ? '🌊' : '📨'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                color: notification.isRead 
                                                    ? 'rgba(255, 255, 255, 0.7)' 
                                                    : 'white',
                                                fontSize: '12px',
                                                fontWeight: notification.isRead ? '400' : '600',
                                                marginBottom: '2px'
                                            }}>
                                                {notification.message}
                                            </div>
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.4)',
                                                fontSize: '10px'
                                            }}>
                                                {new Date(notification.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {!notification.isRead && (
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                background: '#4a90e2',
                                                borderRadius: '50%',
                                                flexShrink: 0
                                            }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer - Now opens the inbox */}
                    <div style={{
                        padding: '12px 15px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        textAlign: 'center'
                    }}>
                        <button
                            onClick={() => {
                                if (onOpenInbox) {
                                    onOpenInbox();
                                }
                                setShowDropdown(false);
                            }}
                            style={{
                                background: 'rgba(74, 144, 226, 0.2)',
                                border: '1px solid rgba(74, 144, 226, 0.3)',
                                color: '#4a90e2',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                width: '100%'
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
                            📬 Open Bottle Inbox
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside to close */}
            {showDropdown && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1999
                    }}
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
};

export default NotificationBell;