// lib/brokers/factory.ts
// SOLID: Dependency Inversion - Factory creates brokers with proper dependencies

import { IBroker, ITransportService } from './interfaces';
import { AngelOneBroker } from './angelone';
import { AngelOneAuthService, IAuthStorage } from './auth';
import { AngelOneOrderService } from './orders';
import { AngelOneSymbolService } from './symbols';
import { AngelOneProfileService } from './profile';
import { HttpTransportService } from './transport';
import { IBrokerCredentials } from './interfaces';
import { MockBroker } from './mock-broker';
import { prisma } from '@/lib/prisma';

interface StoredCredentials extends IBrokerCredentials {
  savedAt: Date;
}

export class InMemoryAuthStorage implements IAuthStorage {
  private storage = new Map<string, StoredCredentials>();

  async saveAuth(accountId: string, credentials: IBrokerCredentials): Promise<void> {
    console.log('💾 [Auth Storage] ===== SAVING AUTH DATA =====');
    console.log('💾 [Auth Storage] Account ID:', accountId);
    console.log('💾 [Auth Storage] Credentials keys:', Object.keys(credentials));
    console.log('💾 [Auth Storage] Access token present:', !!credentials.accessToken);
    console.log('💾 [Auth Storage] Refresh token present:', !!credentials.refreshToken);
    console.log('💾 [Auth Storage] Access token length:', credentials.accessToken?.length || 0);
    console.log('💾 [Auth Storage] Refresh token length:', credentials.refreshToken?.length || 0);

    this.storage.set(accountId, { ...credentials, savedAt: new Date() });

    console.log('💾 [Auth Storage] Data saved to in-memory storage');
    console.log('💾 [Auth Storage] Current storage size:', this.storage.size);
    console.log('💾 [Auth Storage] ===== SAVE COMPLETE =====');
  }

  async loadAuth(accountId: string): Promise<IBrokerCredentials | null> {
    console.log('💾 [Auth Storage] ===== LOADING AUTH DATA =====');
    console.log('💾 [Auth Storage] Account ID:', accountId);

    const credentials = this.storage.get(accountId);

    console.log('💾 [Auth Storage] Credentials found:', !!credentials);
    if (credentials) {
      console.log('💾 [Auth Storage] Access token present:', !!credentials.accessToken);
      console.log('💾 [Auth Storage] Refresh token present:', !!credentials.refreshToken);
      console.log('💾 [Auth Storage] Saved at:', credentials.savedAt);
    } else {
      console.log('💾 [Auth Storage] No credentials found for account');
    }

    console.log('💾 [Auth Storage] ===== LOAD COMPLETE =====');
    return credentials || null;
  }
}

export class DatabaseAuthStorage implements IAuthStorage {
  async saveAuth(accountId: string, credentials: IBrokerCredentials): Promise<void> {
    console.log('💾 [DB Auth Storage] ===== SAVING AUTH DATA TO DATABASE =====');
    console.log('💾 [DB Auth Storage] Account ID:', accountId);
    console.log('💾 [DB Auth Storage] Credentials keys:', Object.keys(credentials));
    console.log('💾 [DB Auth Storage] Access token present:', !!credentials.accessToken);
    console.log('💾 [DB Auth Storage] Refresh token present:', !!credentials.refreshToken);
    console.log('💾 [DB Auth Storage] Access token length:', credentials.accessToken?.length || 0);
    console.log('💾 [DB Auth Storage] Refresh token length:', credentials.refreshToken?.length || 0);
    console.log('💾 [DB Auth Storage] Access token preview:', credentials.accessToken ? credentials.accessToken.substring(0, 20) + '...' : 'N/A');
    console.log('💾 [DB Auth Storage] Refresh token preview:', credentials.refreshToken ? credentials.refreshToken.substring(0, 20) + '...' : 'N/A');

    try {
      // Check if the account exists and is active
      console.log('💾 [DB Auth Storage] Checking if account exists...');
      let account = await prisma.tradingAccount.findUnique({
        where: { id: accountId },
        select: { id: true, name: true, isActive: true, accessToken: true, refreshToken: true },
      });

      // If not found by ID, try finding by clientCode
      if (!account) {
        console.log('💾 [DB Auth Storage] Account not found by ID, trying clientCode...');
        account = await prisma.tradingAccount.findFirst({
          where: { clientCode: accountId },
          select: { id: true, name: true, isActive: true, accessToken: true, refreshToken: true },
        });
      }

      console.log('💾 [DB Auth Storage] Account lookup result:', account ? { id: account.id, name: account.name, isActive: account.isActive } : null);
      console.log('💾 [DB Auth Storage] Current tokens in DB - access:', !!account?.accessToken, 'refresh:', !!account?.refreshToken);

      if (!account) {
        console.log('❌ [DB Auth Storage] Account does not exist in database');
        throw new Error(`Trading account with ID '${accountId}' does not exist`);
      }

      if (!account.isActive) {
        console.log('❌ [DB Auth Storage] Account exists but is not active');
        throw new Error(`Trading account '${account.name}' is not active`);
      }

      // Calculate token expiration (typically 24 hours from now for AngelOne)
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

      const updateData: {
        accessToken?: string | null;
        refreshToken?: string | null;
        tokenExpiresAt: Date;
        lastUsed: Date;
      } = {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        tokenExpiresAt,
        lastUsed: new Date(),
      };

      // Only update tokens if they are provided
      if (!credentials.accessToken) {
        delete updateData.accessToken;
        console.log('💾 [DB Auth Storage] Access token not provided, not updating');
      }
      if (!credentials.refreshToken) {
        delete updateData.refreshToken;
        console.log('💾 [DB Auth Storage] Refresh token not provided, not updating');
      }

      console.log('💾 [DB Auth Storage] Update data keys:', Object.keys(updateData));
      console.log('💾 [DB Auth Storage] Update data preview:', {
        accessToken: updateData.accessToken ? updateData.accessToken.substring(0, 20) + '...' : null,
        refreshToken: updateData.refreshToken ? updateData.refreshToken.substring(0, 20) + '...' : null,
        tokenExpiresAt: updateData.tokenExpiresAt,
        lastUsed: updateData.lastUsed,
      });

      // Update by account ID - use the actual account.id we found
      console.log('💾 [DB Auth Storage] Executing database update for account ID:', account.id);
      const result = await prisma.tradingAccount.update({
        where: { id: account.id },
        data: updateData,
        select: { id: true, name: true, accessToken: true, refreshToken: true, tokenExpiresAt: true, lastUsed: true },
      });

      console.log('💾 [DB Auth Storage] Database update successful for account:', result.name);
      console.log('💾 [DB Auth Storage] Updated record details:');
      console.log('💾 [DB Auth Storage] - ID:', result.id);
      console.log('💾 [DB Auth Storage] - Name:', result.name);
      console.log('💾 [DB Auth Storage] - Access token saved:', !!result.accessToken);
      console.log('💾 [DB Auth Storage] - Refresh token saved:', !!result.refreshToken);
      console.log('💾 [DB Auth Storage] - Token expires at:', result.tokenExpiresAt);
      console.log('💾 [DB Auth Storage] - Last used:', result.lastUsed);
      console.log('💾 [DB Auth Storage] - Access token length:', result.accessToken?.length || 0);
      console.log('💾 [DB Auth Storage] - Refresh token length:', result.refreshToken?.length || 0);

      console.log('✅ [DB Auth Storage] Authentication data saved to database');
      console.log('💾 [DB Auth Storage] ===== SAVE COMPLETE =====');
    } catch (error) {
      console.error('❌ [DB Auth Storage] Failed to save auth data:', error);
      console.error('❌ [DB Auth Storage] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
      });
      console.log('💾 [DB Auth Storage] ===== SAVE FAILED =====');
      throw error;
    }
  }

  async loadAuth(accountId: string): Promise<IBrokerCredentials | null> {
    console.log('💾 [DB Auth Storage] ===== LOADING AUTH DATA FROM DATABASE =====');
    console.log('💾 [DB Auth Storage] Account ID:', accountId);

    try {
      let account = await prisma.tradingAccount.findUnique({
        where: { id: accountId },
        select: {
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

      // If not found by ID, try finding by clientCode
      if (!account) {
        console.log('💾 [DB Auth Storage] Account not found by ID, trying clientCode...');
        account = await prisma.tradingAccount.findFirst({
          where: { clientCode: accountId },
          select: {
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
      }

      console.log('💾 [DB Auth Storage] Database query result:', !!account);

      if (!account) {
        console.log('💾 [DB Auth Storage] No account found with ID:', accountId);
        console.log('💾 [DB Auth Storage] ===== LOAD COMPLETE =====');
        return null;
      }

      if (!account.isActive) {
        console.log('⚠️ [DB Auth Storage] Account found but is not active');
      }

      console.log('💾 [DB Auth Storage] Access token present:', !!account.accessToken);
      console.log('💾 [DB Auth Storage] Refresh token present:', !!account.refreshToken);
      console.log('💾 [DB Auth Storage] Token expires at:', account.tokenExpiresAt);
      console.log('💾 [DB Auth Storage] Last used:', account.lastUsed);

      // Check if tokens are expired
      if (account.tokenExpiresAt && new Date() > account.tokenExpiresAt) {
        console.log('⚠️ [DB Auth Storage] Tokens are expired');
      }

      const credentials: IBrokerCredentials = {
        clientCode: account.clientCode || undefined,
        apiKey: account.apiKey,
        userPin: account.userPin,
        accessToken: account.accessToken || undefined,
        refreshToken: account.refreshToken || undefined,
      };

      console.log('✅ [DB Auth Storage] Credentials loaded from database for account:', account.name);
      console.log('💾 [DB Auth Storage] ===== LOAD COMPLETE =====');
      return credentials;
    } catch (error) {
      console.error('❌ [DB Auth Storage] Failed to load auth data:', error);
      console.log('💾 [DB Auth Storage] ===== LOAD FAILED =====');
      throw error;
    }
  }
}

export class BrokerFactory {
  private static transport: ITransportService;
  private static authStorage: IAuthStorage;

  static initialize() {
    this.transport = new HttpTransportService('https://apiconnect.angelbroking.com');
    // Use database storage for persistence
    this.authStorage = new DatabaseAuthStorage();
  }

  static createAngelOneBroker(): IBroker {
    // Determine sandbox/mock flags more explicitly and log them for debugging.
    const sandboxMode = process.env.SANDBOX_MODE === 'true';
    const mockApi = process.env.MOCK_BROKER_API === 'true';
    console.log(`�️ [BrokerFactory] ENV check -> SANDBOX_MODE=${process.env.SANDBOX_MODE} (sandboxMode=${sandboxMode}), MOCK_BROKER_API=${process.env.MOCK_BROKER_API} (mockApi=${mockApi}), NODE_ENV=${process.env.NODE_ENV}`);

    // Only use MockBroker when both sandbox mode and explicit mock API flag are set.
    // This avoids accidental mock usage when only one flag is present.
    if (sandboxMode && mockApi) {
      console.log('🏖️ [BrokerFactory] Sandbox + Mock API enabled, creating MockBroker');
      return this.createMockBroker();
    }

    console.log('🔴 [BrokerFactory] Production mode, creating AngelOneBroker');
    if (!this.transport || !this.authStorage) {
      this.initialize();
    }

    const authService = new AngelOneAuthService(this.transport, this.authStorage);
    const orderService = new AngelOneOrderService(this.transport);
    const symbolService = new AngelOneSymbolService(this.transport);
    const profileService = new AngelOneProfileService(this.transport);

    return new AngelOneBroker(
      authService,
      orderService,
      symbolService,
      profileService,
      this.transport
    );
  }

  static createMockBroker(): IBroker {
    return new MockBroker();
  }

  static getAuthStorage(): IAuthStorage {
    if (!this.authStorage) {
      this.initialize();
    }
    return this.authStorage;
  }

  static getTransport(): ITransportService {
    if (!this.transport) {
      this.initialize();
    }
    return this.transport;
  }
}