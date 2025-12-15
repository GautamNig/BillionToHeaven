// src/components/QueueTestHelper.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const QueueTestHelper = () => {
    const [showHelper, setShowHelper] = useState(false);

    const checkQueueStatus = async () => {
        console.log('🔍 Checking queue status...');
        
        // Check all queue entries
        const { data: queueEntries } = await supabase
            .from('bottle_queue_entries')
            .select('*')
            .order('queue_position', { ascending: true });
        
        console.log('📊 Queue entries:', queueEntries);
        
        // Check floating bottles
        const { data: floatingBottles } = await supabase
            .from('message_bottles')
            .select('*')
            .eq('status', 'floating');
        
        console.log('🌊 Floating bottles:', floatingBottles);
        
        alert(`Queue Status:\n- ${queueEntries?.length || 0} users in queue\n- ${floatingBottles?.length || 0} floating bottles`);
    };

    const resetTestData = async () => {
        if (!window.confirm('Reset all test data? This will clear queue and bottles.')) return;
        
        try {
            // Clear queue entries
            await supabase
                .from('bottle_queue_entries')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            
            // Set all bottles to floating for testing
            await supabase
                .from('message_bottles')
                .update({ status: 'floating' })
                .neq('id', '00000000-0000-0000-0000-000000000000');
            
            alert('Test data reset!');
        } catch (error) {
            console.error('Reset error:', error);
            alert('Reset failed: ' + error.message);
        }
    };

    if (!showHelper) {
        return (
            <button
                onClick={() => setShowHelper(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    background: '#ffd93d',
                    color: 'black',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    zIndex: 9998,
                    boxShadow: '0 4px 15px rgba(255, 217, 61, 0.4)'
                }}
                title="Queue Test Helper"
            >
                🧪
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '70px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            border: '2px solid #ffd93d',
            zIndex: 9999,
            width: '250px'
        }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
            }}>
                <h4 style={{ margin: 0, color: '#ffd93d' }}>Queue Test Helper</h4>
                <button
                    onClick={() => setShowHelper(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '18px',
                        cursor: 'pointer'
                    }}
                >
                    ×
                </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                    onClick={checkQueueStatus}
                    style={{
                        padding: '8px',
                        background: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    🔍 Check Queue Status
                </button>
                
                <button
                    onClick={resetTestData}
                    style={{
                        padding: '8px',
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    🗑️ Reset Test Data
                </button>
                
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '10px' }}>
                    <strong>Test Instructions:</strong>
                    <ol style={{ margin: '5px 0', paddingLeft: '15px' }}>
                        <li>User A donates → Gets queue #1</li>
                        <li>User B donates → Gets queue #2</li>
                        <li>User A drops bottle → Goes to User B</li>
                        <li>Check notifications</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default QueueTestHelper;