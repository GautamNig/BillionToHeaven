// src/components/QueueTest.jsx
import React, { useState } from 'react';
import { DonationsService } from '../lib/donationsService';
import { MessageBottleService } from '../lib/messageBottleService';
import useAuth from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const QueueTest = () => {
    const { user } = useAuth();
    const [testLog, setTestLog] = useState([]);
    const [isRunning, setIsRunning] = useState(false);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        console.log(`📋 TEST: ${message}`);
        setTestLog(prev => [...prev, { message: logEntry, type }]);
    };

    const clearLogs = () => {
        setTestLog([]);
    };

    // Test 1: Basic Queue Operations (FIXED)
    const testQueueOperations = async () => {
        setIsRunning(true);
        clearLogs();
        
        try {
            addLog('🚀 STARTING QUEUE SYSTEM TEST', 'success');
            
            // Test 1A: Check if queue table exists by querying it
            addLog('1️⃣ Checking bottle_queue_entries table...');
            
            const { data: queueEntries, error: queueError } = await supabase
                .from('bottle_queue_entries')
                .select('*')
                .order('queue_position', { ascending: true });
            
            if (queueError) {
                addLog(`❌ Queue table error: ${queueError.message}`, 'error');
                addLog(`   Code: ${queueError.code}, Details: ${queueError.details}`, 'error');
            } else {
                addLog(`✅ Queue entries: ${queueEntries?.length || 0} waiting`);
                
                if (queueEntries && queueEntries.length > 0) {
                    queueEntries.forEach(entry => {
                        addLog(`   👤 User ${entry.user_id?.slice(0,8) || 'unknown'}... at position ${entry.queue_position} (${entry.status})`);
                    });
                }
            }
            
            // Test 1B: Check floating bottles
            addLog('2️⃣ Checking floating bottles...');
            
            const { data: floatingBottles, error: bottlesError } = await supabase
                .from('message_bottles')
                .select('*')
                .eq('status', 'floating');
            
            if (bottlesError) {
                addLog(`❌ Bottles error: ${bottlesError.message}`, 'error');
            } else {
                addLog(`✅ Floating bottles: ${floatingBottles?.length || 0} available`);
                
                if (floatingBottles && floatingBottles.length > 0) {
                    floatingBottles.forEach(bottle => {
                        addLog(`   🏺 Bottle ${bottle.id.slice(0,8)}... created ${new Date(bottle.created_at).toLocaleTimeString()}`);
                    });
                }
            }
            
            // Test 1C: Check donations
            addLog('3️⃣ Checking donations...');
            
            const { data: donations, error: donationsError } = await supabase
                .from('donations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (donationsError) {
                addLog(`❌ Donations error: ${donationsError.message}`, 'error');
            } else {
                addLog(`✅ Total donations: ${donations?.length || 0}`);
            }
            
            // Test 1D: Check user's current queue status
            if (user) {
                addLog('4️⃣ Checking current user queue status...');
                
                const queueStatus = await DonationsService.getUserQueueStatus(user.id);
                addLog(`   👤 User ${user.email} queue status: ${queueStatus.inQueue ? `Position #${queueStatus.queuePosition}` : 'Not in queue'}`);
            }
            
            addLog('✅ BASIC QUEUE CHECKS COMPLETE', 'success');
            
        } catch (error) {
            addLog(`❌ Test failed: ${error.message}`, 'error');
            console.error('Full error:', error);
        } finally {
            setIsRunning(false);
        }
    };

    // Test 2: Simulate Donation Flow
    const testDonationFlow = async () => {
        if (!user) {
            addLog('❌ Please sign in first to test donation flow', 'error');
            return;
        }
        
        setIsRunning(true);
        
        try {
            addLog('💰 TESTING DONATION FLOW', 'success');
            
            // Test donation amount
            const testAmount = Math.floor(Math.random() * 50) + 1;
            addLog(`1️⃣ Simulating donation of $${testAmount}...`);
            
            // Make donation
            const result = await DonationsService.addDonation(testAmount, user.id, user.email);
            addLog(`✅ Donation created: ${result.donation?.id?.slice(0,8)}...`);
            
            // Check what happened
            if (result.immediateBottle) {
                addLog(`   🎉 IMMEDIATE BOTTLE: User received floating bottle immediately`, 'success');
                addLog(`   🏺 Bottle ID: ${result.immediateBottle.id.slice(0,8)}...`);
            } else if (result.bottle) {
                addLog(`   🔍 RANDOM BOTTLE: Found via legacy random system`, 'info');
                addLog(`   🏺 Bottle ID: ${result.bottle.id.slice(0,8)}...`);
            } else if (result.queueStatus === 'waiting_in_queue') {
                addLog(`   ⏳ QUEUE WAITING: User added to queue, waiting for bottle`, 'info');
                
                // Check queue position
                const queueStatus = await DonationsService.getUserQueueStatus(user.id);
                if (queueStatus.inQueue) {
                    addLog(`   📍 Queue position: #${queueStatus.queuePosition}`);
                }
            }
            
            // Check inventory
            const { data: inventory, error: invError } = await supabase
                .from('bottle_inventory')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'empty');
            
            if (invError) {
                addLog(`   ❌ Inventory error: ${invError.message}`, 'error');
            } else {
                addLog(`   🏺 Empty bottles in inventory: ${inventory?.length || 0}`);
            }
            
            // Check queue again
            const { data: userQueueEntry, error: queueError } = await supabase
                .from('bottle_queue_entries')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'waiting')
                .maybeSingle();
            
            if (queueError) {
                addLog(`   ❌ Queue check error: ${queueError.message}`, 'error');
            } else if (userQueueEntry) {
                addLog(`   📊 Queue entry: Position ${userQueueEntry.queue_position}, Donation ${userQueueEntry.donation_id?.slice(0,8) || 'unknown'}...`);
            } else {
                addLog(`   ℹ️ No active queue entry found for user`);
            }
            
            addLog('✅ DONATION FLOW TEST COMPLETE', 'success');
            
        } catch (error) {
            addLog(`❌ Donation test failed: ${error.message}`, 'error');
            console.error('Donation test error:', error);
        } finally {
            setIsRunning(false);
        }
    };

    // Test 3: Simulate Bottle Drop Flow
    const testBottleDropFlow = async () => {
        if (!user) {
            addLog('❌ Please sign in first to test bottle drop', 'error');
            return;
        }
        
        setIsRunning(true);
        
        try {
            addLog('🌊 TESTING BOTTLE DROP FLOW', 'success');
            
            // First check if user has empty bottles
            const { data: inventory, error: invError } = await supabase
                .from('bottle_inventory')
                .select('*, donations(amount)')
                .eq('user_id', user.id)
                .eq('status', 'empty')
                .limit(1);
            
            if (invError) {
                addLog(`❌ Inventory error: ${invError.message}`, 'error');
                return;
            }
            
            if (!inventory || inventory.length === 0) {
                addLog('❌ No empty bottles to drop. Make a donation first.', 'error');
                return;
            }
            
            const inventoryItem = inventory[0];
            addLog(`1️⃣ Found empty bottle from donation $${inventoryItem.donations?.amount || '?'}`);
            
            // Create a bottle
            const testMessage = `Test bottle dropped at ${new Date().toLocaleTimeString()}`;
            addLog(`2️⃣ Creating message bottle...`);
            
            const bottle = await MessageBottleService.createBottle(
                inventoryItem.donation_id,
                {
                    message: testMessage,
                    isAnonymous: true,
                    showDonationAmount: false,
                    allowReply: true
                },
                inventoryItem.id
            );
            
            addLog(`✅ Bottle created: ${bottle.id.slice(0,8)}...`);
            addLog(`   💬 Message: "${testMessage}"`);
            
            // Check what happened with the bottle
            const { data: createdBottle, error: bottleError } = await supabase
                .from('message_bottles')
                .select('status, finder_donation_id')
                .eq('id', bottle.id)
                .single();
            
            if (bottleError) {
                addLog(`   ❌ Bottle check error: ${bottleError.message}`, 'error');
            } else if (createdBottle.status === 'found') {
                addLog(`   🎯 BOTTLE SERVED: Immediately served to a queue user`, 'success');
                
                // Find who got it
                const { data: finderDonation, error: finderError } = await supabase
                    .from('donations')
                    .select('user_id, user_email')
                    .eq('id', createdBottle.finder_donation_id)
                    .single();
                
                if (finderError) {
                    addLog(`   ❌ Finder check error: ${finderError.message}`, 'error');
                } else if (finderDonation) {
                    addLog(`   👤 Served to: ${finderDonation.user_email || finderDonation.user_id?.slice(0,8) || 'unknown'}...`);
                }
            } else if (createdBottle.status === 'floating') {
                addLog(`   🌊 BOTTLE FLOATING: No one in queue, bottle is floating`, 'info');
                
                // Check queue
                const { data: waitingQueue, error: queueError } = await supabase
                    .from('bottle_queue_entries')
                    .select('count', { count: 'exact' })
                    .eq('status', 'waiting');
                
                if (queueError) {
                    addLog(`   ❌ Queue check error: ${queueError.message}`, 'error');
                } else {
                    addLog(`   ⏳ Queue waiting: ${waitingQueue?.[0]?.count || 0} users`);
                }
            }
            
            // Check inventory status
            const { data: updatedInventory, error: updateError } = await supabase
                .from('bottle_inventory')
                .select('status')
                .eq('id', inventoryItem.id)
                .single();
            
            if (updateError) {
                addLog(`   ❌ Inventory status error: ${updateError.message}`, 'error');
            } else {
                addLog(`   🏺 Inventory status: ${updatedInventory?.status}`);
            }
            
            addLog('✅ BOTTLE DROP TEST COMPLETE', 'success');
            
        } catch (error) {
            addLog(`❌ Bottle drop test failed: ${error.message}`, 'error');
            console.error('Bottle drop error:', error);
        } finally {
            setIsRunning(false);
        }
    };

    // Test 5: Database Sanity Check (FIXED)
    const testDatabaseSanity = async () => {
        setIsRunning(true);
        clearLogs();
        
        try {
            addLog('🔍 DATABASE SANITY CHECK', 'success');
            
            const checks = [
                { name: 'donations table', query: supabase.from('donations').select('count', { count: 'exact', head: true }) },
                { name: 'bottle_inventory table', query: supabase.from('bottle_inventory').select('count', { count: 'exact', head: true }) },
                { name: 'message_bottles table', query: supabase.from('message_bottles').select('count', { count: 'exact', head: true }) },
                { name: 'bottle_queue_entries table', query: supabase.from('bottle_queue_entries').select('count', { count: 'exact', head: true }) },
            ];
            
            for (const check of checks) {
                const { count, error } = await check.query;
                if (error) {
                    addLog(`❌ ${check.name}: ${error.message}`, 'error');
                    addLog(`   Code: ${error.code}, Details: ${error.details}`, 'error');
                } else {
                    addLog(`✅ ${check.name}: ${count || 0} records`);
                }
            }
            
            addLog('✅ DATABASE SANITY CHECK COMPLETE', 'success');
            
        } catch (error) {
            addLog(`❌ Database check failed: ${error.message}`, 'error');
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '100px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid #4a90e2',
            zIndex: 9999,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <h3 style={{ margin: 0, color: '#ffd93d' }}>🧪 Queue System Test Panel</h3>
                <button
                    onClick={clearLogs}
                    style={{
                        padding: '5px 10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Clear Logs
                </button>
            </div>
            
            <div style={{
                marginBottom: '20px',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ marginBottom: '10px' }}>
                    <strong>👤 Current User:</strong> {user ? `${user.email} (${user.id.slice(0,8)}...)` : 'Not signed in'}
                </div>
                <div>
                    <strong>📊 Test Controls:</strong>
                </div>
            </div>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '10px',
                marginBottom: '20px'
            }}>
                <button
                    onClick={testDatabaseSanity}
                    disabled={isRunning}
                    style={{
                        padding: '10px',
                        background: 'linear-gradient(135deg, #ff6b6b, #f44336)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        opacity: isRunning ? 0.6 : 1
                    }}
                >
                    🔍 Database Sanity Check
                </button>
                
                <button
                    onClick={testQueueOperations}
                    disabled={isRunning}
                    style={{
                        padding: '10px',
                        background: 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        opacity: isRunning ? 0.6 : 1
                    }}
                >
                    🚀 Test Queue Operations
                </button>
                
                <button
                    onClick={testDonationFlow}
                    disabled={isRunning || !user}
                    style={{
                        padding: '10px',
                        background: user ? 'linear-gradient(135deg, #6bcf7f, #4caf50)' : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: (isRunning || !user) ? 'not-allowed' : 'pointer',
                        opacity: (isRunning || !user) ? 0.6 : 1
                    }}
                >
                    💰 Test Donation Flow
                </button>
                
                <button
                    onClick={testBottleDropFlow}
                    disabled={isRunning || !user}
                    style={{
                        padding: '10px',
                        background: user ? 'linear-gradient(135deg, #8a7fff, #9c27b0)' : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: (isRunning || !user) ? 'not-allowed' : 'pointer',
                        opacity: (isRunning || !user) ? 0.6 : 1
                    }}
                >
                    🌊 Test Bottle Drop Flow
                </button>
            </div>
            
            <div style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                maxHeight: '400px',
                overflowY: 'auto'
            }}>
                <div style={{
                    marginBottom: '10px',
                    color: '#ffd93d',
                    fontWeight: 'bold'
                }}>
                    📋 Test Logs ({testLog.length} entries):
                </div>
                
                {testLog.length === 0 ? (
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                        No logs yet. Run a test to see output.
                    </div>
                ) : (
                    testLog.map((log, index) => (
                        <div 
                            key={index}
                            style={{
                                padding: '5px 0',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                color: log.type === 'error' ? '#ff6b6b' : 
                                       log.type === 'success' ? '#6bcf7f' : 
                                       'rgba(255, 255, 255, 0.8)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}
                        >
                            {log.message}
                        </div>
                    ))
                )}
            </div>
            
            {isRunning && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.9)',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '2px solid #4a90e2'
                }}>
                    <div style={{ textAlign: 'center', color: '#ffd93d' }}>
                        ⏳ Running Test...
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueueTest;