// lib/brokers/batch-token-manager.ts
// Optimized batch token management for multiple accounts

import { IBrokerCredentials } from './interfaces';
import { BrokerFactory } from './factory';
import { prisma } from '@/lib/prisma';

export interface TokenValidationResult {
  accountId: string;
  isValid: boolean;
  needsRefresh: boolean;
  credentials?: IBrokerCredentials;
  error?: string;
}

export interface BatchTokenResult {
  validTokens: Map<string, IBrokerCredentials>;
  expiredTokens: string[];
  errors: Map<string, string>;
}

export class BatchTokenManager {
  private static readonly EXPIRY_BUFFER_MINUTES = 30; // Refresh tokens 30 minutes before expiry
  private static readonly BATCH_SIZE = 50; // Process accounts in batches to avoid memory issues

  /**
   * Batch validate tokens for multiple accounts
   */
  static async validateMultipleTokens(accountIds: string[]): Promise<BatchTokenResult> {
    console.log('🔄 [Batch Token Manager] ===== BATCH TOKEN VALIDATION =====');
    console.log('🔄 [Batch Token Manager] Processing', accountIds.length, 'accounts');

    const result: BatchTokenResult = {
      validTokens: new Map(),
      expiredTokens: [],
      errors: new Map(),
    };

    // Process in batches to avoid memory issues
    for (let i = 0; i < accountIds.length; i += this.BATCH_SIZE) {
      const batch = accountIds.slice(i, i + this.BATCH_SIZE);
      const batchResult = await this.processBatch(batch);
      this.mergeBatchResults(result, batchResult);
    }

    console.log('🔄 [Batch Token Manager] Batch validation complete:');
    console.log('🔄 [Batch Token Manager] - Valid tokens:', result.validTokens.size);
    console.log('🔄 [Batch Token Manager] - Expired tokens:', result.expiredTokens.length);
    console.log('🔄 [Batch Token Manager] - Errors:', result.errors.size);

    return result;
  }

  /**
   * Process a batch of account IDs
   */
  private static async processBatch(accountIds: string[]): Promise<BatchTokenResult> {
    const result: BatchTokenResult = {
      validTokens: new Map(),
      expiredTokens: [],
      errors: new Map(),
    };

    try {
      // Single database query to get all accounts in batch
      const accounts = await prisma.tradingAccount.findMany({
        where: {
          id: { in: accountIds },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          clientCode: true,
          apiKey: true,
          userPin: true,
          accessToken: true,
          refreshToken: true,
          tokenExpiresAt: true,
          lastUsed: true,
        },
      });

      const now = new Date();
      const expiryBuffer = new Date(now.getTime() + this.EXPIRY_BUFFER_MINUTES * 60 * 1000);

      for (const account of accounts) {
        try {
          if (!account.accessToken) {
            result.expiredTokens.push(account.id);
            continue;
          }

          // Check if token is expired or about to expire
          const isExpired = !account.tokenExpiresAt || account.tokenExpiresAt <= expiryBuffer;

          if (isExpired) {
            result.expiredTokens.push(account.id);
          } else {
            // Token is valid
            const credentials: IBrokerCredentials = {
              accessToken: account.accessToken,
              refreshToken: account.refreshToken || '',
              clientCode: account.clientCode || '',
              apiKey: account.apiKey,
              userPin: account.userPin,
            };

            result.validTokens.set(account.id, credentials);
          }
        } catch (accountError) {
          console.error(`❌ [Batch Token Manager] Error processing account ${account.id}:`, accountError);
          result.errors.set(account.id, accountError instanceof Error ? accountError.message : 'Unknown error');
        }
      }

      // Handle accounts not found in database
      const foundIds = new Set(accounts.map(acc => acc.id));
      const missingIds = accountIds.filter(id => !foundIds.has(id));
      missingIds.forEach(id => {
        result.errors.set(id, 'Account not found');
      });

    } catch (error) {
      console.error('❌ [Batch Token Manager] Batch processing error:', error);
      // Mark all accounts in batch as errors
      accountIds.forEach(id => {
        result.errors.set(id, 'Batch processing failed');
      });
    }

    return result;
  }

  /**
   * Merge batch results into main result
   */
  private static mergeBatchResults(main: BatchTokenResult, batch: BatchTokenResult): void {
    // Merge valid tokens
    batch.validTokens.forEach((credentials, accountId) => {
      main.validTokens.set(accountId, credentials);
    });

    // Merge expired tokens
    main.expiredTokens.push(...batch.expiredTokens);

    // Merge errors
    batch.errors.forEach((error, accountId) => {
      main.errors.set(accountId, error);
    });
  }

  /**
   * Batch refresh expired tokens
   */
  static async refreshExpiredTokens(accountIds: string[]): Promise<Map<string, IBrokerCredentials>> {
    console.log('🔄 [Batch Token Manager] ===== BATCH TOKEN REFRESH =====');
    console.log('🔄 [Batch Token Manager] Refreshing', accountIds.length, 'tokens');

    const refreshedTokens = new Map<string, IBrokerCredentials>();
    const authStorage = BrokerFactory.getAuthStorage();

    // Process token refreshes with concurrency control
    const refreshPromises = accountIds.map(async (accountId) => {
      try {
        const credentials = await authStorage.loadAuth(accountId);
        if (!credentials?.refreshToken) {
          console.log(`❌ [Batch Token Manager] No refresh token for account ${accountId}`);
          return null;
        }

        // Attempt to refresh token using auth service
        const transport = BrokerFactory.getTransport();
        const { AngelOneAuthService } = await import('./auth');
        const authService = new AngelOneAuthService(transport, authStorage);
        const newCredentials = await authService.refreshToken(credentials);

        if (newCredentials?.accessToken) {
          // Save refreshed credentials
          await authStorage.saveAuth(accountId, newCredentials);

          // Update database
          await prisma.tradingAccount.update({
            where: { id: accountId },
            data: {
              accessToken: newCredentials.accessToken,
              refreshToken: newCredentials.refreshToken,
              tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              lastUsed: new Date(),
            },
          });

          console.log(`✅ [Batch Token Manager] Refreshed token for account ${accountId}`);
          return { accountId, credentials: newCredentials };
        } else {
          console.log(`❌ [Batch Token Manager] Failed to refresh token for account ${accountId}`);
          return null;
        }
      } catch (error) {
        console.error(`❌ [Batch Token Manager] Error refreshing token for account ${accountId}:`, error);
        return null;
      }
    });

    // Execute refreshes with limited concurrency
    const results = await Promise.allSettled(refreshPromises);

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { accountId, credentials } = result.value;
        refreshedTokens.set(accountId, credentials);
      }
    });

    console.log('🔄 [Batch Token Manager] Batch refresh complete:', refreshedTokens.size, 'successful');

    return refreshedTokens;
  }

  /**
   * Get accounts that need token refresh (optimized query)
   */
  static async getAccountsNeedingRefresh(): Promise<string[]> {
    const expiryBuffer = new Date(Date.now() + this.EXPIRY_BUFFER_MINUTES * 60 * 1000);

    const accounts = await prisma.tradingAccount.findMany({
      where: {
        isActive: true,
        OR: [
          { tokenExpiresAt: { lte: expiryBuffer } },
          { tokenExpiresAt: null },
          { accessToken: null },
        ],
      },
      select: { id: true },
    });

    return accounts.map(acc => acc.id);
  }
}