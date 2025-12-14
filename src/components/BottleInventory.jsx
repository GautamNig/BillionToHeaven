// src/components/BottleInventory.jsx
import React, { useState, useEffect } from 'react';
import { MessageBottleService } from '../lib/messageBottleService';
import MessageBottleModal from './MessageBottleModal';
import useAuth from '../hooks/useAuth';
import {supabase}  from '../lib/supabase';

const BottleInventory = () => {
    const { user } = useAuth();
    const [inventory, setInventory] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewBottleNotification, setShowNewBottleNotification] = useState(false);

useEffect(() => {
    if (user) {
        console.log('👤 User authenticated, loading inventory:', user.id);
        loadInventory();
        
        // Add error handling for real-time subscription
        try {
            const subscription = supabase
                .channel('inventory-changes')
                .on('postgres_changes', 
                    { 
                        event: 'INSERT', 
                        schema: 'public', 
                        table: 'bottle_inventory' 
                    },
                    (payload) => {
                        console.log('📡 Real-time INSERT event:', payload);
                        if (payload.new.user_id === user.id) {
                            console.log('🔄 New bottle added to inventory via real-time');
                            setShowNewBottleNotification(true);
                            loadInventory();
                            setTimeout(() => setShowNewBottleNotification(false), 5000);
                        }
                    }
                )
                .on('postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'bottle_inventory'
                    },
                    (payload) => {
                        console.log('📡 Real-time UPDATE event:', payload);
                        if (payload.new.user_id === user.id) {
                            console.log('🔄 Bottle inventory updated via real-time');
                            loadInventory();
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('📡 Real-time subscription status:', status);
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Real-time subscription active');
                    }
                });
            
            return () => {
                console.log('🧹 Cleaning up real-time subscription');
                subscription.unsubscribe();
            };
        } catch (error) {
            console.error('❌ Real-time subscription error:', error);
        }
    } else {
        console.log('👤 No user, clearing inventory');
        setInventory([]);
    }
}, [user]);

const loadInventory = async () => {
    if (!user) {
        console.log('❌ No user, skipping inventory load');
        return;
    }
    
    try {
        setIsLoading(true);
        console.log('🔄 Loading inventory for user:', user.id);
        
        // Now load inventory WITH donation_id (NO COMMENTS IN THE STRING!)
        const { data, error } = await supabase
            .from('bottle_inventory')
            .select(`
                id,
                donation_id,
                status,
                created_at,
                donation:donations!donation_id (
                    id,
                    amount,
                    created_at
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'empty')
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error('❌ Inventory query error:', error);
            throw error;
        }
        
        console.log('📦 Inventory loaded:', data?.length, 'items');
        console.log('📋 Inventory data:', data);
        
        setInventory(data || []);
        
    } catch (error) {
        console.error('❌ Error loading inventory:', error);
        setInventory([]);
    } finally {
        setIsLoading(false);
    }
};

// Add to BottleInventory.jsx
const checkInventoryManually = async () => {
    console.log('🔍 Manually checking inventory...');
    await loadInventory();
};

    const handleOpenModal = (inventoryItem) => {
        setSelectedDonation({
            id: inventoryItem.donation_id,
            amount: inventoryItem.donation?.amount
        });
        setShowModal(true);
    };

    const handleBottleSubmit = async (message, options) => {
    if (!selectedDonation) return;
    
    try {
        setIsLoading(true);
        
        // 1. Find the inventory item for this donation
        const { data: inventoryItem, error: inventoryError } = await supabase
            .from('bottle_inventory')
            .select('id')
            .eq('donation_id', selectedDonation.id)
            .eq('status', 'empty')
            .single();
        
        if (inventoryError) throw inventoryError;
        
        // 2. Create the message bottle WITH inventory_id
        const bottle = await MessageBottleService.createBottle(
            selectedDonation.id,
            {
                message: message,
                isAnonymous: options.isAnonymous,
                showDonationAmount: options.showDonationAmount,
                allowReply: options.allowReply
            },
            inventoryItem.id  // PASS inventory_id
        );
        
        // 3. Update inventory status
        await supabase
            .from('bottle_inventory')
            .update({
                status: 'dropped',
                dropped_at: new Date().toISOString()
            })
            .eq('id', inventoryItem.id);
        
        // 4. Close modal and refresh
        setShowModal(false);
        setSelectedDonation(null);
        loadInventory();
        
        console.log('Bottle dropped:', bottle.id);
        
    } catch (error) {
        console.error('Error dropping bottle:', error);
    } finally {
        setIsLoading(false);
    }
};

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedDonation(null);
    };

    if (!user) return null;

    return (
        <>
            {/* Bottle Inventory Button */}
            <button
                onClick={(e) => {
                    if (e.shiftKey) { // Hold Shift while clicking to refresh
                        checkInventoryManually();
                    } else {
                        setShowModal(true);
                    }
                }}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(74, 144, 226, 0.4)',
                    zIndex: 1000,
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 6px 25px rgba(74, 144, 226, 0.6)';
                }}
                onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 20px rgba(74, 144, 226, 0.4)';
                }}
                title={`${inventory.length} empty bottles\nHold Shift + Click to refresh`}
            >
                🏺
                {inventory.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#ff6b6b',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #2b0c5c'
                    }}>
                        {inventory.length}
                    </div>
                )}
            </button>

             {/* New Bottle Notification */}
        {showNewBottleNotification && (
            <div style={{
                position: 'fixed',
                bottom: '90px',
                right: '20px',
                background: 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 1001,
                boxShadow: '0 4px 15px rgba(74, 144, 226, 0.4)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                🎉 New bottle added to your inventory!
            </div>
        )}

            {/* Inventory Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.9)',
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
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        position: 'relative'
                    }}>
                        <h2 style={{
                            color: '#ffd93d',
                            margin: '0 0 20px 0',
                            fontSize: '22px',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}>
                            🏺 Your Bottle Inventory
                        </h2>
                        
                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                Loading...
                            </div>
                        ) : inventory.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌊</div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '10px' }}>
                                    No empty bottles yet
                                </div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                                    Donate to receive empty bottles!
                                </div>
                            </div>
                        ) : (
                            <>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    textAlign: 'center',
                                    marginBottom: '25px',
                                    fontSize: '14px'
                                }}>
                                    You have {inventory.length} empty bottle{inventory.length !== 1 ? 's' : ''}.<br />
                                    Fill them with messages for other donors!
                                </p>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                    gap: '15px',
                                    marginBottom: '25px'
                                }}>
                                    {inventory.map((item, index) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleOpenModal(item)}
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.2), rgba(138, 127, 255, 0.2))',
                                                border: '2px solid rgba(74, 144, 226, 0.4)',
                                                borderRadius: '12px',
                                                padding: '15px 10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                color: 'white'
                                            }}
                                            onMouseOver={(e) => {
                                                e.target.style.transform = 'translateY(-5px)';
                                                e.target.style.borderColor = '#ffd93d';
                                                e.target.style.background = 'linear-gradient(135deg, rgba(74, 144, 226, 0.3), rgba(138, 127, 255, 0.3))';
                                            }}
                                            onMouseOut={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.borderColor = 'rgba(74, 144, 226, 0.4)';
                                                e.target.style.background = 'linear-gradient(135deg, rgba(74, 144, 226, 0.2), rgba(138, 127, 255, 0.2))';
                                            }}
                                        >
                                            <div style={{ fontSize: '24px' }}>🏺</div>
                                            <div style={{
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#ffd93d'
                                            }}>
                                                ${item.donation?.amount || '0.00'}
                                            </div>
                                            <div style={{
                                                fontSize: '10px',
                                                color: 'rgba(255, 255, 255, 0.6)'
                                            }}>
                                                Bottle #{index + 1}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                        
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                            marginTop: '20px'
                        }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                        
                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
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
                                fontSize: '16px'
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Message Bottle Modal (when filling a specific bottle) */}
            <MessageBottleModal
                isOpen={!!selectedDonation}
                onClose={handleModalClose}
                onSubmit={handleBottleSubmit}
                donationAmount={selectedDonation?.amount}
                isLoading={isLoading}
            />
        </>
    );
};

export default BottleInventory;