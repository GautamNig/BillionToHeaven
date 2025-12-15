// src/components/QueueDebugSimple.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const QueueDebugSimple = () => {
    const [queueData, setQueueData] = useState(null);
    const [bottleData, setBottleData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchDebugData = async () => {
        setLoading(true);
        try {
            console.log('🔍 Fetching debug data...');
            
            // 1. Get ALL queue entries
            const { data: allQueue, error: queueError } = await supabase
                .from('bottle_queue_entries')
                .select('*');
            
            console.log('📊 ALL queue entries:', allQueue);
            if (queueError) console.error('Queue error:', queueError);
            
            // 2. Get WAITING queue entries  
            const { data: waitingQueue, error: waitingError } = await supabase
                .from('bottle_queue_entries')
                .select('*')
                .eq('status', 'waiting');
            
            console.log('⏳ WAITING queue entries:', waitingQueue);
            if (waitingError) console.error('Waiting error:', waitingError);
            
            // 3. Get floating bottles
            const { data: floatingBottles, error: bottlesError } = await supabase
                .from('message_bottles')
                .select('*')
                .eq('status', 'floating');
            
            console.log('🌊 Floating bottles:', floatingBottles);
            if (bottlesError) console.error('Bottles error:', bottlesError);
            
            // 4. Test the problematic query
            const testUserId = '48c02248-79c8-4f9f-bd98-df281b73daed';
            let testQuery = supabase
                .from('bottle_queue_entries')
                .select('*')
                .eq('status', 'waiting')
                .order('queue_position', { ascending: true })
                .limit(1);
            
            // Test WITH exclusion
            testQuery = testQuery.neq('user_id', testUserId);
            const { data: excludedResult, error: excludedError } = await testQuery.maybeSingle();
            
            console.log('🚫 Query WITH user exclusion:', excludedResult);
            console.log('Exclusion error:', excludedError);
            
            // Test WITHOUT exclusion  
            const { data: includedResult, error: includedError } = await supabase
                .from('bottle_queue_entries')
                .select('*')
                .eq('status', 'waiting')
                .order('queue_position', { ascending: true })
                .limit(1)
                .maybeSingle();
            
            console.log('✅ Query WITHOUT user exclusion:', includedResult);
            console.log('Inclusion error:', includedError);
            
            setQueueData({
                allEntries: allQueue,
                waitingEntries: waitingQueue,
                withExclusion: excludedResult,
                withoutExclusion: includedResult,
                errors: {
                    queue: queueError?.message,
                    waiting: waitingError?.message,
                    exclusion: excludedError?.message,
                    inclusion: includedError?.message
                }
            });
            
            setBottleData(floatingBottles);
            
        } catch (error) {
            console.error('❌ Debug error:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearData = () => {
        setQueueData(null);
        setBottleData(null);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            background: 'rgba(0,0,0,0.95)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            border: '2px solid #ff6b6b',
            zIndex: 10000,
            maxWidth: '500px',
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '11px'
        }}>
            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={fetchDebugData}
                    disabled={loading}
                    style={{ 
                        padding: '8px 12px', 
                        background: '#4a90e2', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Loading...' : '🔍 Debug Queue'}
                </button>
                <button 
                    onClick={clearData}
                    style={{ 
                        padding: '8px 12px', 
                        background: 'rgba(255,255,255,0.1)', 
                        color: 'white', 
                        border: '1px solid rgba(255,255,255,0.3)', 
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Clear
                </button>
            </div>
            
            {queueData && (
                <div>
                    <h4 style={{ margin: '10px 0 5px 0', color: '#ffd93d' }}>📊 Queue Data:</h4>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <strong>All Queue Entries ({queueData.allEntries?.length || 0}):</strong>
                        <pre style={{ 
                            background: 'rgba(0,0,0,0.5)', 
                            padding: '5px', 
                            borderRadius: '5px',
                            margin: '5px 0',
                            overflow: 'auto',
                            maxHeight: '100px'
                        }}>
                            {JSON.stringify(queueData.allEntries, null, 2)}
                        </pre>
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <strong>Waiting Entries ({queueData.waitingEntries?.length || 0}):</strong>
                        <pre style={{ 
                            background: 'rgba(0,0,0,0.5)', 
                            padding: '5px', 
                            borderRadius: '5px',
                            margin: '5px 0',
                            overflow: 'auto',
                            maxHeight: '100px'
                        }}>
                            {JSON.stringify(queueData.waitingEntries, null, 2)}
                        </pre>
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <strong>Query WITH exclusion (should be null):</strong>
                        <div style={{ 
                            background: queueData.withExclusion ? 'rgba(107, 207, 127, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                            padding: '5px', 
                            borderRadius: '5px',
                            margin: '5px 0'
                        }}>
                            {queueData.withExclusion ? 
                                `FOUND: User ${queueData.withExclusion.user_id?.slice(0,8)}...` : 
                                'NULL (correct - no other users)'}
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                        <strong>Query WITHOUT exclusion (should find YOU):</strong>
                        <div style={{ 
                            background: queueData.withoutExclusion ? 'rgba(107, 207, 127, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                            padding: '5px', 
                            borderRadius: '5px',
                            margin: '5px 0'
                        }}>
                            {queueData.withoutExclusion ? 
                                `FOUND: User ${queueData.withoutExclusion.user_id?.slice(0,8)}... at position ${queueData.withoutExclusion.queue_position}` : 
                                'NULL (error!)'}
                        </div>
                    </div>
                    
                    {queueData.errors && Object.values(queueData.errors).some(e => e) && (
                        <div style={{ color: '#ff6b6b', marginTop: '10px' }}>
                            <strong>Errors:</strong>
                            <pre style={{ 
                                background: 'rgba(255,0,0,0.1)', 
                                padding: '5px', 
                                borderRadius: '5px',
                                margin: '5px 0'
                            }}>
                                {JSON.stringify(queueData.errors, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
            
            {bottleData && (
                <div style={{ marginTop: '15px' }}>
                    <h4 style={{ margin: '10px 0 5px 0', color: '#ffd93d' }}>🌊 Floating Bottles:</h4>
                    <div>Count: {bottleData.length}</div>
                    {bottleData.length > 0 && (
                        <pre style={{ 
                            background: 'rgba(0,0,0,0.5)', 
                            padding: '5px', 
                            borderRadius: '5px',
                            margin: '5px 0',
                            overflow: 'auto',
                            maxHeight: '100px'
                        }}>
                            {JSON.stringify(bottleData, null, 2)}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
};

export default QueueDebugSimple;