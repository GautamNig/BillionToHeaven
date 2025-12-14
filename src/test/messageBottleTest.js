// src/test/messageBottleTest.js
import { MessageBottleService } from '../lib/messageBottleService';
import { DonationsService } from '../lib/donationsService';

async function testMessageBottleSystem() {
    console.log('🧪 Testing Message Bottle System...\n');
    
    try {
        // 1. Create a test donation
        console.log('1. Creating test donation...');
        const donation = await DonationsService.addDonation(25.00, null, 'test@example.com');
        console.log('✅ Donation created:', donation.id);
        
        // 2. Create a message bottle
        console.log('\n2. Creating message bottle...');
        const bottle = await MessageBottleService.createBottle(donation.id, {
            message: 'Test message from the ocean depths! 🌊',
            isAnonymous: true,
            showDonationAmount: true,
            allowReply: true
        });
        console.log('✅ Bottle created:', bottle.id);
        console.log('   Status:', bottle.status);
        console.log('   Color:', bottle.bottle_color);
        
        // 3. Create another donation to find the bottle
        console.log('\n3. Creating second donation to find bottle...');
        const secondDonation = await DonationsService.addDonation(10.00, null, 'finder@example.com');
        console.log('✅ Second donation created:', secondDonation.id);
        
        // Note: The donation service should automatically try to find a bottle
        // But let's test the bottle service directly
        console.log('\n4. Manually finding a random bottle...');
        const foundBottle = await MessageBottleService.findRandomBottle(secondDonation.id);
        if (foundBottle) {
            console.log('✅ Found bottle:', foundBottle.id);
            console.log('   Found by:', foundBottle.finder_donation_id);
            console.log('   New status:', foundBottle.status);
        } else {
            console.log('❌ No bottles found (should have found our test bottle)');
        }
        
        // 5. Test getting user bottles (simulated)
        console.log('\n5. Testing get user bottles...');
        // Since we don't have a real user ID, we'll test the function structure
        const testUserId = 'test-user-123';
        console.log('   (Skipping - requires real user authentication)');
        
        console.log('\n🎉 All tests completed!');
        console.log('\nNext steps:');
        console.log('1. Integrate MessageBottleModal into RiveAnimation.jsx');
        console.log('2. Add notification bell to MainLayout.jsx');
        console.log('3. Create BottleInbox component');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
    // You can run this in browser console: testMessageBottleSystem()
    window.testMessageBottleSystem = testMessageBottleSystem;
    console.log('Test script loaded. Run testMessageBottleSystem() to test.');
}

export { testMessageBottleSystem };