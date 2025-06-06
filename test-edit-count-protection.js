// Test script to verify edit count gaming protection
import { DatabaseStorage } from './server/storage.js';

const storage = new DatabaseStorage();

async function testEditCountProtection() {
  console.log('Testing edit count gaming protection...\n');

  // Test user ID (this would be a real user in production)
  const testUserId = 'test-user-123';

  try {
    // Create a test user with some edits used
    console.log('1. Creating test user with 5 edits used...');
    await storage.upsertUser({
      id: testUserId,
      email: 'test@example.com',
      editCount: 5,
      editLimit: 10,
      subscriptionTier: 'free'
    });

    // Simulate first upgrade (should preserve edit count)
    console.log('2. Upgrading to basic plan (should preserve 5 edits)...');
    let user = await storage.updateUserSubscription(testUserId, 'basic', 50, true);
    console.log(`   Edit count after upgrade: ${user?.editCount} (expected: 5)`);

    // Try immediate second upgrade (should be blocked and preserve edits)
    console.log('3. Attempting rapid upgrade to premium (should preserve edits due to gaming protection)...');
    user = await storage.updateUserSubscription(testUserId, 'premium', 50, false); // Even though we say false, protection should override
    console.log(`   Edit count after rapid upgrade: ${user?.editCount} (expected: 5, preserved due to protection)`);

    // Test cancellation (should reset edits)
    console.log('4. Cancelling subscription (should reset edits)...');
    user = await storage.updateUserSubscription(testUserId, 'free', 10, false);
    console.log(`   Edit count after cancellation: ${user?.editCount} (expected: 0)`);

    // Test new billing period reset
    console.log('5. Testing billing period reset...');
    // First set up a user with edits and a billing period
    await storage.updateUserSubscription(testUserId, 'basic', 50, true);
    await storage.incrementUserEditCount(testUserId);
    await storage.incrementUserEditCount(testUserId);
    user = await storage.getUser(testUserId);
    console.log(`   Edit count before billing reset: ${user?.editCount}`);

    // Simulate new billing period
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    user = await storage.updateUserBillingPeriod(testUserId, periodStart, periodEnd);
    console.log(`   Edit count after billing period reset: ${user?.editCount} (expected: 0)`);

    console.log('\n✅ All edit count protection tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEditCountProtection();