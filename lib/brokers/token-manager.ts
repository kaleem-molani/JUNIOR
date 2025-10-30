// lib/brokers/token-manager.ts
// Handles automatic token refresh and expiry checking

import { IBrokerCredentials } from './interfaces';
import { BrokerFactory } from './factory';
import { prisma } from '@/lib/prisma';

export class TokenManager {
  private static readonly EXPIRY_BUFFER_MINUTES = 30; // Refresh tokens 30 minutes before expiry

  /**
   * Checks if tokens are expired or about to expire
   */
  static isTokenExpired(credentials: IBrokerCredentials): boolean {
    if (!credentials.accessToken) return true;

    // For now, we don't have token expiry info in credentials
    // We'll check this from the database
    return false;
  }

  /**
   * Checks token expiry from database and refreshes if needed
   */
  static async ensureValidTokens(accountId: string): Promise<IBrokerCredentials | null> {
    console.log('🔄 [Token Manager] ===== CHECKING TOKEN VALIDITY =====');
    console.log('🔄 [Token Manager] Account ID:', accountId);

    try {
      // Get account with token info from database
      const account = await prisma.tradingAccount.findUnique({
        where: { id: accountId },
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
          isActive: true,
        },
      });

      if (!account) {
        console.log('❌ [Token Manager] Account not found');
        return null;
      }

      if (!account.isActive) {
        console.log('❌ [Token Manager] Account is not active');
        return null;
      }

      const now = new Date();
      const expiresAt = account.tokenExpiresAt;

      console.log('🔄 [Token Manager] Token expires at:', expiresAt);
      console.log('🔄 [Token Manager] Current time:', now);

      // Check if token is expired or will expire soon
      const bufferTime = new Date(now.getTime() + (this.EXPIRY_BUFFER_MINUTES * 60 * 1000));
      const needsRefresh = !expiresAt || expiresAt <= bufferTime;

      console.log('🔄 [Token Manager] Buffer time:', bufferTime);
      console.log('🔄 [Token Manager] Needs refresh:', needsRefresh);

      if (needsRefresh && account.refreshToken) {
        console.log('🔄 [Token Manager] Refreshing expired/expiring tokens...');

        const authStorage = BrokerFactory.getAuthStorage();

        // Load current credentials
        const currentCredentials = await authStorage.loadAuth(accountId);
        if (!currentCredentials?.refreshToken) {
          console.log('❌ [Token Manager] No refresh token available');
          return null;
        }

        try {
          // Create auth service directly
          const { AngelOneAuthService } = await import('./auth');
          const { HttpTransportService } = await import('./transport');
          const transport = new HttpTransportService();
          const authStorage = BrokerFactory.getAuthStorage();
          const authService = new AngelOneAuthService(transport, authStorage);

          const newCredentials = await authService.refreshToken(currentCredentials);

          console.log('✅ [Token Manager] Tokens refreshed successfully');
          return newCredentials;
        } catch (refreshError) {
          console.error('❌ [Token Manager] Token refresh failed:', refreshError);
          console.log('🔄 [Token Manager] Tokens may need manual regeneration');
          return null;
        }
      } else if (!account.refreshToken) {
        console.log('❌ [Token Manager] No refresh token available for renewal');
        return null;
      } else {
        console.log('✅ [Token Manager] Tokens are still valid');

        // Return current credentials
        return {
          clientCode: account.clientCode || undefined,
          apiKey: account.apiKey,
          userPin: account.userPin,
          accessToken: account.accessToken || undefined,
          refreshToken: account.refreshToken || undefined,
        };
      }
    } catch (error) {
      console.error('❌ [Token Manager] Error checking token validity:', error);
      return null;
    }
  }

  /**
   * Background job to refresh all tokens that are about to expire
   */
  static async refreshExpiringTokens(): Promise<void> {
    console.log('🔄 [Token Manager] ===== BACKGROUND TOKEN REFRESH JOB =====');
    console.log('🔄 [Token Manager] Starting token refresh job...');

    try {
      const now = new Date();
      const expiryThreshold = new Date(now.getTime() + (this.EXPIRY_BUFFER_MINUTES * 60 * 1000));

      console.log('🔄 [Token Manager] Current time:', now);
      console.log('🔄 [Token Manager] Expiry threshold:', expiryThreshold);

      // Find accounts with tokens that will expire soon
      const expiringAccounts = await prisma.tradingAccount.findMany({
        where: {
          isActive: true,
          refreshToken: { not: null },
          tokenExpiresAt: {
            lte: expiryThreshold,
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          tokenExpiresAt: true,
        },
      });

      console.log('🔄 [Token Manager] Found', expiringAccounts.length, 'accounts with expiring tokens');

      let successCount = 0;
      let failureCount = 0;

      for (const account of expiringAccounts) {
        console.log('🔄 [Token Manager] Processing account:', account.name, '(expires:', account.tokenExpiresAt, ')');

        try {
          const result = await this.ensureValidTokens(account.id);
          if (result) {
            successCount++;
            console.log('✅ [Token Manager] Successfully refreshed tokens for:', account.name);
          } else {
            failureCount++;
            console.log('❌ [Token Manager] Failed to refresh tokens for:', account.name);
          }
        } catch (error) {
          failureCount++;
          console.error('❌ [Token Manager] Error refreshing tokens for', account.name, ':', error);
        }
      }

      console.log('🔄 [Token Manager] ===== JOB COMPLETE =====');
      console.log('🔄 [Token Manager] Successfully refreshed:', successCount);
      console.log('🔄 [Token Manager] Failed to refresh:', failureCount);

    } catch (error) {
      console.error('❌ [Token Manager] Background job failed:', error);
    }
  }
}