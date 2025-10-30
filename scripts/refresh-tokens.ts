// scripts/refresh-tokens.ts
// Background job to refresh expiring tokens

import { TokenManager } from '../lib/brokers/token-manager';

async function refreshTokens() {
  console.log('🔄 [Token Refresh Job] Starting token refresh background job...');

  try {
    await TokenManager.refreshExpiringTokens();
    console.log('✅ [Token Refresh Job] Token refresh job completed successfully');
  } catch (error) {
    console.error('❌ [Token Refresh Job] Token refresh job failed:', error);
    process.exit(1);
  }
}

// Run the job
refreshTokens();