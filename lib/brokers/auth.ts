// lib/brokers/auth.ts
// SOLID: Single Responsibility - Handles authentication operations

import { IAuthenticationService, IBrokerCredentials, ITransportService } from './interfaces';

export interface IAuthStorage {
  saveAuth(accountId: string, credentials: IBrokerCredentials): Promise<void>;
  loadAuth(accountId: string): Promise<IBrokerCredentials | null>;
}

export class AngelOneAuthService implements IAuthenticationService {
  private transport: ITransportService;
  private authStorage: IAuthStorage;
  private readonly loginEndpoint = '/rest/auth/angelbroking/user/v1/loginByPassword';
  private readonly refreshEndpoint = '/rest/auth/angelbroking/jwt/v1/generateTokens';

  constructor(transport: ITransportService, authStorage: IAuthStorage) {
    this.transport = transport;
    this.authStorage = authStorage;
  }

  async authenticate(credentials: IBrokerCredentials, totp: string, accountId: string): Promise<boolean> {
    console.log('🔐 [Broker Auth] ===== ANGELONE AUTHENTICATION START =====');
    console.log('🔐 [Broker Auth] Timestamp:', new Date().toISOString());

    if (!credentials.clientCode || !credentials.apiKey || !credentials.userPin) {
      console.log('❌ [Broker Auth] Missing required credentials:', {
        clientCode: !!credentials.clientCode,
        apiKey: !!credentials.apiKey,
        userPin: !!credentials.userPin,
      });
      throw new Error('Missing required credentials: clientCode, apiKey, userPin');
    }

    console.log('✅ [Broker Auth] Credentials validated');
    console.log('🔐 [Broker Auth] Preparing login request data...');

    try {
      const loginData = {
        clientcode: credentials.clientCode,
        password: credentials.userPin,
        totp: totp,
      };

      console.log('🔐 [Broker Auth] Login data prepared (sensitive data masked)');

      const headers = {
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
        'X-PrivateKey': credentials.apiKey,
      };

      console.log('🔐 [Broker Auth] Headers prepared');
      console.log('🔐 [Broker Auth] Making HTTP request to AngelOne API...');
      console.log('🔐 [Broker Auth] Endpoint:', this.loginEndpoint);

      const response = await this.transport.post<{
        status: boolean;
        data: { jwtToken: string; refreshToken: string; feedToken: string };
      }>(this.loginEndpoint, loginData, headers);

      console.log('🔐 [Broker Auth] HTTP response received');
      console.log('🔐 [Broker Auth] Response status:', response.status);
      console.log('🔐 [Broker Auth] Response has data:', !!response.data);

      // Log the complete response structure for debugging
      console.log('🔐 [Broker Auth] ===== ANGELONE API RESPONSE =====');
      console.log('🔐 [Broker Auth] Full response object:', response,JSON.stringify(response, (key, value) => {
        // Mask sensitive token values in logs
        if (key === 'jwtToken' || key === 'refreshToken' || key === 'feedToken') {
          return value ? '***TOKEN_PRESENT***' : '***NO_TOKEN***';
        }
        return value;
      }, 2));
      console.log('🔐 [Broker Auth] ===== END ANGELONE API RESPONSE =====');

      if (response.data) {
        console.log('🔐 [Broker Auth] Response data keys:', Object.keys(response.data));
        console.log('🔐 [Broker Auth] JWT token present:', !!response.data.jwtToken);
        console.log('🔐 [Broker Auth] Refresh token present:', !!response.data.refreshToken);
        console.log('🔐 [Broker Auth] Feed token present:', !!response.data.feedToken);

        // Log token lengths for debugging (without revealing actual values)
        if (response.data.jwtToken) {
          console.log('🔐 [Broker Auth] JWT token length:', response.data.jwtToken.length);
        }
        if (response.data.refreshToken) {
          console.log('🔐 [Broker Auth] Refresh token length:', response.data.refreshToken.length);
        }
        if (response.data.feedToken) {
          console.log('🔐 [Broker Auth] Feed token length:', response.data.feedToken.length);
        }
      }

      if (response.status && response.data) {
        console.log('✅ [Broker Auth] Authentication successful from AngelOne');

        const updatedCredentials: IBrokerCredentials = {
          ...credentials,
          accessToken: response.data.jwtToken,
          refreshToken: response.data.refreshToken,
        };

        console.log('🔐 [Broker Auth] Updated credentials prepared for storage');
        console.log('🔐 [Broker Auth] Updated credentials keys:', Object.keys(updatedCredentials));
        console.log('🔐 [Broker Auth] Access token present in updated credentials:', !!updatedCredentials.accessToken);
        console.log('🔐 [Broker Auth] Refresh token present in updated credentials:', !!updatedCredentials.refreshToken);

        console.log('🔐 [Broker Auth] Saving authentication data...');
        await this.authStorage.saveAuth(accountId, updatedCredentials);
        console.log('✅ [Broker Auth] Authentication data saved');

        // Verify the data was saved by attempting to load it back
        console.log('🔐 [Broker Auth] Verifying saved authentication data...');
        const savedCredentials = await this.authStorage.loadAuth(accountId);
        console.log('🔐 [Broker Auth] Verification - saved credentials loaded:', !!savedCredentials);
        if (savedCredentials) {
          console.log('🔐 [Broker Auth] Verification - access token saved:', !!savedCredentials.accessToken);
          console.log('🔐 [Broker Auth] Verification - refresh token saved:', !!savedCredentials.refreshToken);
          console.log('🔐 [Broker Auth] Verification - access token length:', savedCredentials.accessToken?.length || 0);
          console.log('🔐 [Broker Auth] Verification - refresh token length:', savedCredentials.refreshToken?.length || 0);
        } else {
          console.log('❌ [Broker Auth] Verification FAILED - no credentials found after save!');
        }

        console.log('🔐 [Broker Auth] ===== ANGELONE AUTHENTICATION END =====');
        return true;
      }

      console.log('❌ [Broker Auth] Authentication failed - invalid response from AngelOne');
      console.log('🔐 [Broker Auth] ===== ANGELONE AUTHENTICATION END =====');
      return false;
    } catch (error) {
      console.error('❌ [Broker Auth] Authentication exception:', error);
      console.error('❌ [Broker Auth] Exception type:', error instanceof Error ? error.constructor.name : typeof error);
      console.log('🔐 [Broker Auth] ===== ANGELONE AUTHENTICATION END =====');
      return false;
    }
  }

  async refreshToken(credentials: IBrokerCredentials): Promise<IBrokerCredentials> {
    if (!credentials.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const headers = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
        'X-PrivateKey': credentials.apiKey,
      };

      const response = await this.transport.post<{
        status: boolean;
        data: { jwtToken: string; refreshToken: string };
      }>(this.refreshEndpoint, { refreshToken: credentials.refreshToken }, headers);

      if (response.status && response.data) {
        const updatedCredentials: IBrokerCredentials = {
          ...credentials,
          accessToken: response.data.jwtToken,
          refreshToken: response.data.refreshToken,
        };

        // Update stored credentials
        await this.authStorage.saveAuth(credentials.clientCode!, updatedCredentials);

        return updatedCredentials;
      }

      throw new Error('Token refresh failed');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  isAuthenticated(credentials: IBrokerCredentials): boolean {
    return !!(credentials.accessToken && credentials.refreshToken);
  }
}