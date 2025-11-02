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

  async authenticate(credentials: IBrokerCredentials, totp: string, accountId: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔐 [AngelOne Auth] ===== ANGELONE LOGIN REQUEST START =====');
    console.log('🔐 [AngelOne Auth] Timestamp:', new Date().toISOString());
    console.log('🔐 [AngelOne Auth] Account ID:', accountId);
    console.log('🔐 [AngelOne Auth] Client Code:', credentials.clientCode ? '***' + credentials.clientCode.slice(-4) : 'NOT_SET');
    console.log('🔐 [AngelOne Auth] API Key:', credentials.apiKey ? '***' + credentials.apiKey.slice(-4) : 'NOT_SET');
    console.log('🔐 [AngelOne Auth] TOTP Length:', totp ? totp.length : 0);

    if (!credentials.clientCode || !credentials.apiKey || !credentials.userPin) {
      console.log('❌ [AngelOne Auth] Missing required credentials:', {
        clientCode: !!credentials.clientCode,
        apiKey: !!credentials.apiKey,
        userPin: !!credentials.userPin,
      });
      console.log('🔐 [AngelOne Auth] ===== ANGELONE LOGIN REQUEST END =====');
      throw new Error('Missing required credentials: clientCode, apiKey, userPin');
    }

    console.log('✅ [AngelOne Auth] Credentials validated');
    console.log('🔐 [AngelOne Auth] Preparing login request data...');

    try {
      const loginData = {
        clientcode: credentials.clientCode,
        password: credentials.userPin,
        totp: totp,
      };

      console.log('🔐 [AngelOne Auth] Login request data prepared');
      console.log('🔐 [AngelOne Auth] Request payload (masked):', {
        clientcode: loginData.clientcode ? '***' + loginData.clientcode.slice(-4) : 'NOT_SET',
        password: loginData.password ? '***MASKED***' : 'NOT_SET',
        totp: loginData.totp ? '***' + loginData.totp.slice(-2) : 'NOT_SET',
      });

      const headers = {
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
        'X-PrivateKey': credentials.apiKey,
      };

      console.log('🔐 [AngelOne Auth] Request headers prepared');
      console.log('🔐 [AngelOne Auth] Headers (masked):', {
        'X-UserType': headers['X-UserType'],
        'X-SourceID': headers['X-SourceID'],
        'X-ClientLocalIP': headers['X-ClientLocalIP'],
        'X-ClientPublicIP': headers['X-ClientPublicIP'],
        'X-MACAddress': headers['X-MACAddress'],
        'X-PrivateKey': headers['X-PrivateKey'] ? '***' + headers['X-PrivateKey'].slice(-4) : 'NOT_SET',
      });

      console.log('🔐 [AngelOne Auth] Making HTTP POST request to AngelOne API...');
      console.log('🔐 [AngelOne Auth] Endpoint:', this.loginEndpoint);
      console.log('🔐 [AngelOne Auth] Full URL will be constructed by transport service');

      const response = await this.transport.post<{
        status?: string;
        error?: boolean;
        message?: string;
        data?: { jwtToken: string; refreshToken: string; feedToken: string };
        jwtToken?: string;
        refreshToken?: string;
        access_token?: string;
        accessToken?: string;
        token?: string;
        refresh_token?: string;
      }>(this.loginEndpoint, loginData, headers);

      console.log('🔐 [AngelOne Auth] ===== ANGELONE API RESPONSE RECEIVED =====');
      console.log('🔐 [AngelOne Auth] Response timestamp:', new Date().toISOString());
      console.log('🔐 [AngelOne Auth] Full response object:', JSON.stringify(response, (key, value) => {
        // Mask sensitive token values in logs
        if (key === 'jwtToken' || key === 'refreshToken' || key === 'feedToken') {
          return value ? '***TOKEN_PRESENT***' : '***NO_TOKEN***';
        }
        return value;
      }, 2));

      console.log('🔐 [AngelOne Auth] Response breakdown:');
      console.log('🔐 [AngelOne Auth] - status:', response.status);
      console.log('🔐 [AngelOne Auth] - error:', response.error);
      console.log('🔐 [AngelOne Auth] - message:', response.message);
      console.log('🔐 [AngelOne Auth] - has data:', !!response.data);
      console.log('🔐 [AngelOne Auth] - direct jwtToken:', !!response.jwtToken);
      console.log('🔐 [AngelOne Auth] - direct refreshToken:', !!response.refreshToken);
      console.log('🔐 [AngelOne Auth] - all response keys:', Object.keys(response));

      // Check for success - prioritize status field as primary indicator
      const isSuccess = response.status === 'success' ||
                       response.status === 'ok' ||
                       (!response.error && (response.data || response.jwtToken || response.refreshToken));

      console.log('🔐 [AngelOne Auth] - interpreted as success:', isSuccess);

      if (response.data) {
        console.log('🔐 [AngelOne Auth] Response data details:');
        console.log('🔐 [AngelOne Auth] - jwtToken present:', !!response.data.jwtToken);
        console.log('🔐 [AngelOne Auth] - refreshToken present:', !!response.data.refreshToken);
        console.log('🔐 [AngelOne Auth] - feedToken present:', !!response.data.feedToken);

        if (response.data.jwtToken) {
          console.log('🔐 [AngelOne Auth] - jwtToken length:', response.data.jwtToken.length);
        }
        if (response.data.refreshToken) {
          console.log('🔐 [AngelOne Auth] - refreshToken length:', response.data.refreshToken.length);
        }
        if (response.data.feedToken) {
          console.log('🔐 [AngelOne Auth] - feedToken length:', response.data.feedToken.length);
        }
      }
      
      if (isSuccess && (response.data || response.jwtToken || response.refreshToken)) {
        console.log('✅ [AngelOne Auth] Authentication successful from AngelOne');

        // Handle different possible response structures from AngelOne
        let jwtToken: string | undefined;
        let refreshToken: string | undefined;

        if (response.data) {
          // Standard structure: tokens in data object
          jwtToken = response.data.jwtToken;
          refreshToken = response.data.refreshToken;
          console.log('🔐 [AngelOne Auth] Using tokens from response.data');
        } else if (response.jwtToken || response.refreshToken) {
          // Alternative structure: tokens directly on response
          jwtToken = response.jwtToken;
          refreshToken = response.refreshToken;
          console.log('🔐 [AngelOne Auth] Using tokens directly from response');
        } else {
          // Check for other possible property names
          const resp = response as Record<string, unknown>;
          jwtToken = (resp.access_token as string) || (resp.accessToken as string) || (resp.token as string);
          refreshToken = (resp.refresh_token as string) || (resp.refreshToken as string);
          console.log('🔐 [AngelOne Auth] Using tokens from alternative property names');
        }

        console.log('🔐 [AngelOne Auth] Extracted tokens:');
        console.log('🔐 [AngelOne Auth] - jwtToken present:', !!jwtToken);
        console.log('🔐 [AngelOne Auth] - refreshToken present:', !!refreshToken);
        console.log('🔐 [AngelOne Auth] - jwtToken length:', jwtToken?.length || 0);
        console.log('🔐 [AngelOne Auth] - refreshToken length:', refreshToken?.length || 0);

        if (!jwtToken || !refreshToken) {
          console.error('❌ [AngelOne Auth] CRITICAL: Missing tokens in successful response!');
          console.error('❌ [AngelOne Auth] Response structure:', Object.keys(response));
          console.log('🔐 [AngelOne Auth] ===== ANGELONE LOGIN REQUEST END =====');
          return { success: false, error: 'Authentication succeeded but tokens not found in response' };
        }

        const updatedCredentials: IBrokerCredentials = {
          ...credentials,
          accessToken: jwtToken,
          refreshToken: refreshToken,
        };

        console.log('🔐 [AngelOne Auth] Updated credentials prepared for storage');
        console.log('🔐 [AngelOne Auth] Updated credentials keys:', Object.keys(updatedCredentials));
        console.log('🔐 [AngelOne Auth] Access token present in updated credentials:', !!updatedCredentials.accessToken);
        console.log('🔐 [AngelOne Auth] Refresh token present in updated credentials:', !!updatedCredentials.refreshToken);

        console.log('🔐 [AngelOne Auth] Saving authentication data...');
        await this.authStorage.saveAuth(accountId, updatedCredentials);
        console.log('✅ [AngelOne Auth] Authentication data saved');

        // Verify the data was saved by attempting to load it back
        console.log('🔐 [AngelOne Auth] Verifying saved authentication data...');
        const savedCredentials = await this.authStorage.loadAuth(accountId);
        console.log('🔐 [AngelOne Auth] Verification - saved credentials loaded:', !!savedCredentials);
        if (savedCredentials) {
          console.log('🔐 [AngelOne Auth] Verification - access token saved:', !!savedCredentials.accessToken);
          console.log('🔐 [AngelOne Auth] Verification - refresh token saved:', !!savedCredentials.refreshToken);
          console.log('🔐 [AngelOne Auth] Verification - access token length:', savedCredentials.accessToken?.length || 0);
          console.log('🔐 [AngelOne Auth] Verification - refresh token length:', savedCredentials.refreshToken?.length || 0);
        } else {
          console.log('❌ [AngelOne Auth] Verification FAILED - no credentials found after save!');
        }

        console.log('🔐 [AngelOne Auth] ===== ANGELONE LOGIN REQUEST END =====');
        return { success: true };
      } else {
        // Authentication failed - capture error message if available
        const errorMessage = response.message || (!isSuccess ? 'Authentication failed - invalid response structure' : 'Authentication failed - invalid credentials or TOTP');
        console.log('❌ [AngelOne Auth] Authentication failed:', errorMessage);
        console.log('🔐 [AngelOne Auth] ===== ANGELONE LOGIN REQUEST END =====');
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ [AngelOne Auth] Authentication exception:', error);
      console.error('❌ [AngelOne Auth] Exception type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ [AngelOne Auth] Exception message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [AngelOne Auth] Exception stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.log('🔐 [AngelOne Auth] ===== ANGELONE LOGIN REQUEST END =====');
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }

  async refreshToken(credentials: IBrokerCredentials): Promise<IBrokerCredentials> {
    console.log('🔄 [AngelOne Auth] ===== ANGELONE TOKEN REFRESH REQUEST START =====');
    console.log('🔄 [AngelOne Auth] Timestamp:', new Date().toISOString());
    console.log('🔄 [AngelOne Auth] Client Code:', credentials.clientCode ? '***' + credentials.clientCode.slice(-4) : 'NOT_SET');

    if (!credentials.refreshToken) {
      console.log('❌ [AngelOne Auth] No refresh token available');
      console.log('🔄 [AngelOne Auth] ===== ANGELONE TOKEN REFRESH REQUEST END =====');
      throw new Error('No refresh token available');
    }

    try {
      const headers = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'CLIENT_LOCAL_IP',
        'X-ClientPublicIP': 'CLIENT_PUBLIC_IP',
        'X-MACAddress': 'MAC_ADDRESS',
        'X-PrivateKey': credentials.apiKey,
      };

      const requestData = { refreshToken: credentials.refreshToken };

      console.log('🔄 [AngelOne Auth] Refresh request prepared');
      console.log('🔄 [AngelOne Auth] Request payload (masked):', {
        refreshToken: requestData.refreshToken ? '***' + requestData.refreshToken.slice(-4) : 'NOT_SET',
      });

      console.log('🔄 [AngelOne Auth] Request headers (masked):', {
        'Authorization': headers['Authorization'] ? 'Bearer ***' + headers['Authorization'].slice(-10) : 'NOT_SET',
        'Content-Type': headers['Content-Type'],
        'Accept': headers['Accept'],
        'X-UserType': headers['X-UserType'],
        'X-SourceID': headers['X-SourceID'],
        'X-ClientLocalIP': headers['X-ClientLocalIP'],
        'X-ClientPublicIP': headers['X-ClientPublicIP'],
        'X-MACAddress': headers['X-MACAddress'],
        'X-PrivateKey': headers['X-PrivateKey'] ? '***' + headers['X-PrivateKey'].slice(-4) : 'NOT_SET',
      });

      console.log('🔄 [AngelOne Auth] Making HTTP POST request to AngelOne API...');
      console.log('🔄 [AngelOne Auth] Endpoint:', this.refreshEndpoint);
      console.log('🔄 [AngelOne Auth] Full URL will be constructed by transport service');

      const response = await this.transport.post<{
        status?: string;
        error?: boolean;
        message?: string;
        errorCode?: string;
        data?: { jwtToken: string; refreshToken: string };
      }>(this.refreshEndpoint, requestData, headers);

      console.log('🔄 [AngelOne Auth] ===== ANGELONE API RESPONSE RECEIVED =====');
      console.log('🔄 [AngelOne Auth] Response timestamp:', new Date().toISOString());
      console.log('🔄 [AngelOne Auth] Full response object:', JSON.stringify(response, (key, value) => {
        // Mask sensitive token values in logs
        if (key === 'jwtToken' || key === 'refreshToken') {
          return value ? '***TOKEN_PRESENT***' : '***NO_TOKEN***';
        }
        return value;
      }, 2));

      console.log('🔄 [AngelOne Auth] Response breakdown:');
      console.log('🔄 [AngelOne Auth] - status:', response.status);
      console.log('🔄 [AngelOne Auth] - error:', response.error);
      console.log('🔄 [AngelOne Auth] - message:', response.message);
      console.log('🔄 [AngelOne Auth] - errorCode:', response.errorCode);
      console.log('🔄 [AngelOne Auth] - has data:', !!response.data);

      // Check for success - prioritize status field as primary indicator
      const isRefreshSuccess = response.status === 'success' ||
                              response.status === 'ok' ||
                              (!response.error && response.data);

      console.log('🔄 [AngelOne Auth] - interpreted as success:', isRefreshSuccess);

      if (response.data) {
        console.log('🔄 [AngelOne Auth] Response data details:');
        console.log('🔄 [AngelOne Auth] - jwtToken present:', !!response.data.jwtToken);
        console.log('🔄 [AngelOne Auth] - refreshToken present:', !!response.data.refreshToken);

        if (response.data.jwtToken) {
          console.log('🔄 [AngelOne Auth] - jwtToken length:', response.data.jwtToken.length);
        }
        if (response.data.refreshToken) {
          console.log('🔄 [AngelOne Auth] - refreshToken length:', response.data.refreshToken.length);
        }
      }

      if (isRefreshSuccess && response.data) {
        console.log('✅ [AngelOne Auth] Token refresh successful');

        const updatedCredentials: IBrokerCredentials = {
          ...credentials,
          accessToken: response.data.jwtToken,
          refreshToken: response.data.refreshToken,
        };

        // Update stored credentials
        await this.authStorage.saveAuth(credentials.clientCode!, updatedCredentials);

        console.log('✅ [AngelOne Auth] Credentials updated successfully');
        console.log('🔄 [AngelOne Auth] ===== ANGELONE TOKEN REFRESH REQUEST END =====');
        return updatedCredentials;
      }

      console.error('❌ [AngelOne Auth] Token refresh failed - invalid response structure');
      console.error('❌ [AngelOne Auth] Error message:', response.message);
      console.error('❌ [AngelOne Auth] Error code:', response.errorCode);
      console.error('❌ [AngelOne Auth] Interpreted as success:', isRefreshSuccess);
      console.log('🔄 [AngelOne Auth] ===== ANGELONE TOKEN REFRESH REQUEST END =====');
      throw new Error(`Token refresh failed: ${response.message || 'Invalid response'}`);
    } catch (error) {
      console.error('❌ [AngelOne Auth] Token refresh exception:', error);
      console.error('❌ [AngelOne Auth] Exception type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ [AngelOne Auth] Exception message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [AngelOne Auth] Exception stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.log('🔄 [AngelOne Auth] ===== ANGELONE TOKEN REFRESH REQUEST END =====');
      throw error;
    }
  }

  isAuthenticated(credentials: IBrokerCredentials): boolean {
    return !!(credentials.accessToken && credentials.refreshToken);
  }
}