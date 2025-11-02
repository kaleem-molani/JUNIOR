// test-token-refresh.mjs
// Test script to verify token refresh functionality in signal queue

import { BatchTokenManager } from './lib/brokers/batch-token-manager.js';

async function testTokenRefresh() {
  console.log('🧪 [Test] Starting token refresh test...');

  try {
    // Get accounts that might need token refresh
    const accountsNeedingRefresh = await BatchTokenManager.getAccountsNeedingRefresh();
    console.log('🧪 [Test] Found', accountsNeedingRefresh.length, 'accounts that may need refresh');

    if (accountsNeedingRefresh.length === 0) {
      console.log('🧪 [Test] No accounts need refresh - test completed');
      return;
    }

    // Test batch token validation
    console.log('🧪 [Test] Testing batch token validation...');
    const validationResult = await BatchTokenManager.validateMultipleTokens(accountsNeedingRefresh);
    console.log('🧪 [Test] Validation result:', {
      valid: validationResult.validTokens.size,
      expired: validationResult.expiredTokens.length,
      errors: validationResult.errors.size,
    });

    // Test token refresh for expired tokens
    if (validationResult.expiredTokens.length > 0) {
      console.log('🧪 [Test] Testing token refresh for expired tokens...');
      const refreshResult = await BatchTokenManager.refreshExpiredTokens(validationResult.expiredTokens);
      console.log('🧪 [Test] Refresh result:', refreshResult.size, 'tokens refreshed');

      // Verify refresh worked
      const revalidationResult = await BatchTokenManager.validateMultipleTokens(validationResult.expiredTokens);
      console.log('🧪 [Test] Post-refresh validation:', {
        valid: revalidationResult.validTokens.size,
        expired: revalidationResult.expiredTokens.length,
        errors: revalidationResult.errors.size,
      });
    }

    console.log('✅ [Test] Token refresh test completed successfully');

  } catch (error) {
    console.error('❌ [Test] Token refresh test failed:', error);
    process.exit(1);
  }
}

// Run the test
testTokenRefresh();