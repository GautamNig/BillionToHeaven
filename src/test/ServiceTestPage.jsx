// src/test/ServiceTestPage.jsx
import React, { useState } from 'react';
import { MessageBottleService } from '../lib/messageBottleService';
import { DonationsService } from '../lib/donationsService';

const ServiceTestPage = () => {
    const [testResults, setTestResults] = useState([]);
    const [isTesting, setIsTesting] = useState(false);

const addResult = (message, success = true) => {
    setTestResults(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        message,
        success,
        timestamp: new Date().toLocaleTimeString()
    }]);
};
    const runTests = async () => {
        setIsTesting(true);
        setTestResults([]);
        
        try {
            // Test 1: Create donation
            addResult('1. Creating test donation...');
            const donation = await DonationsService.addDonation(15.00, null, 'tester@example.com');
            addResult(`✅ Donation created: ${donation.id}`);
            
            // Test 2: Create bottle
            addResult('2. Creating message bottle...');
            const bottle = await MessageBottleService.createBottle(donation.id, {
                message: 'Test message for service verification! 🌊',
                isAnonymous: true,
                showDonationAmount: true,
                allowReply: true
            });
            addResult(`✅ Bottle created: ${bottle.id}`);
            addResult(`   Status: ${bottle.status}, Color: ${bottle.bottle_color}`);
            
            // Test 3: Find random bottle
            addResult('3. Creating second donation to find bottle...');
            const secondDonation = await DonationsService.addDonation(5.00, null, 'finder@example.com');
            addResult(`✅ Second donation: ${secondDonation.id}`);
            
            addResult('4. Finding random bottle...');
            const foundBottle = await MessageBottleService.findRandomBottle(secondDonation.id);
            if (foundBottle) {
                addResult(`✅ Found bottle: ${foundBottle.id}`);
                addResult(`   New status: ${foundBottle.status}, Found by: ${foundBottle.finder_donation_id}`);
            } else {
                addResult('❌ No bottles found');
            }
            
            // Test 4: Mark as read
            if (foundBottle) {
                addResult('5. Marking bottle as read...');
                const readBottle = await MessageBottleService.markBottleAsRead(foundBottle.id);
                addResult(`✅ Bottle marked as read: ${readBottle.status}`);
            }
            
            addResult('🎉 All service tests passed!');
            
        } catch (error) {
            addResult(`❌ Test failed: ${error.message}`, false);
            console.error('Test error:', error);
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div style={{
            padding: '20px',
            background: '#2b0c5c',
            color: 'white',
            minHeight: '100vh'
        }}>
            <h1 style={{ color: '#ffd93d' }}>🧪 Service Layer Test</h1>
            
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={runTests}
                    disabled={isTesting}
                    style={{
                        padding: '12px 24px',
                        background: isTesting 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: isTesting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isTesting ? 'Testing...' : 'Run Service Tests'}
                </button>
                
                <button
                    onClick={() => setTestResults([])}
                    style={{
                        padding: '12px 24px',
                        marginLeft: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    Clear Results
                </button>
            </div>
            
            <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '10px',
                padding: '20px',
                maxHeight: '500px',
                overflowY: 'auto'
            }}>
                <h3>Test Results:</h3>
                {testResults.length === 0 ? (
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                        No tests run yet. Click "Run Service Tests" above.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {testResults.map(result => (
                            <div
                                key={result.id}
                                style={{
                                    padding: '10px 15px',
                                    background: result.success 
                                        ? 'rgba(107, 207, 127, 0.1)' 
                                        : 'rgba(255, 107, 107, 0.1)',
                                    border: `1px solid ${result.success ? 'rgba(107, 207, 127, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`,
                                    borderRadius: '6px',
                                    color: result.success ? 'white' : '#ff6b6b'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{result.message}</span>
                                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                        {result.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px' }}>
                <h4>Next Steps After Service Test:</h4>
                <ol style={{ lineHeight: '1.8' }}>
                    <li>✅ Database setup complete</li>
                    <li>🔲 Run service tests above</li>
                    <li>🔲 Test bottle modal integration</li>
                    <li>🔲 Test PayPal donation flow</li>
                    <li>🔲 Test notification bell</li>
                </ol>
            </div>
        </div>
    );
};

export default ServiceTestPage;