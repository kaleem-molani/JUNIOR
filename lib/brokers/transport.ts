// lib/brokers/transport.ts
// SOLID: Single Responsibility - Handles HTTP transport operations

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ITransportService } from './interfaces';

export class HttpTransportService implements ITransportService {
  private axiosInstance: AxiosInstance;
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'https://apiconnect.angelone.in', timeout: number = 20000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async post<T>(endpoint: string, data: Record<string, unknown>, headers?: Record<string, string>): Promise<T> {
    const finalHeaders = { ...this.axiosInstance.defaults.headers.common, ...headers };

    console.log('🌐 [AngelOne Transport] ===== HTTP POST REQUEST =====');
    console.log('🌐 [AngelOne Transport] Timestamp:', new Date().toISOString());
    console.log('🌐 [AngelOne Transport] Method: POST');
    console.log('🌐 [AngelOne Transport] Endpoint:', endpoint);
    console.log('🌐 [AngelOne Transport] Full URL:', `${this.baseUrl}${endpoint}`);

    // Mask sensitive data in request payload
    const maskedData = JSON.parse(JSON.stringify(data, (key, value) => {
      if (key === 'password' || key === 'totp' || key === 'refreshToken' || key === 'jwtToken' || key === 'feedToken') {
        return value ? '***MASKED***' : value;
      }
      if (key === 'clientcode' && typeof value === 'string' && value.length > 4) {
        return '***' + value.slice(-4);
      }
      return value;
    }));

    console.log('🌐 [AngelOne Transport] Request payload (masked):', JSON.stringify(maskedData, null, 2));

    // Mask sensitive headers
    const maskedHeaders = JSON.parse(JSON.stringify(finalHeaders, (key, value) => {
      if (key === 'X-PrivateKey' && typeof value === 'string' && value.length > 4) {
        return '***' + value.slice(-4);
      }
      if (key === 'Authorization' && typeof value === 'string' && value.startsWith('Bearer ')) {
        return 'Bearer ***' + value.slice(-10);
      }
      return value;
    }));

    console.log('🌐 [AngelOne Transport] Request headers (masked):', JSON.stringify(maskedHeaders, null, 2));
    console.log('🌐 [AngelOne Transport] Timeout:', this.timeout, 'ms');

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(endpoint, data, {
        headers: headers || {},
      });

      console.log('🌐 [AngelOne Transport] ===== HTTP RESPONSE RECEIVED =====');
      console.log('🌐 [AngelOne Transport] Response timestamp:', new Date().toISOString());
      console.log('🌐 [AngelOne Transport] HTTP Status:', response.status, response.statusText);
      console.log('🌐 [AngelOne Transport] Response data type:', typeof response.data);

      // Mask sensitive data in response
      const maskedResponseData = JSON.parse(JSON.stringify(response.data, (key, value) => {
        if (key === 'jwtToken' || key === 'refreshToken' || key === 'feedToken') {
          return value ? '***TOKEN_PRESENT***' : '***NO_TOKEN***';
        }
        return value;
      }));

      console.log('🌐 [AngelOne Transport] Response data (masked):', JSON.stringify(maskedResponseData, null, 2));
      console.log('🌐 [AngelOne Transport] Response headers present:', !!response.headers);

      return response.data;
    } catch (error) {
      console.error('🌐 [AngelOne Transport] ===== HTTP REQUEST FAILED =====');
      console.error('🌐 [AngelOne Transport] Error timestamp:', new Date().toISOString());
      console.error('🌐 [AngelOne Transport] Error details:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('🌐 [AngelOne Transport] Error response status:', error.response.status);
        console.error('🌐 [AngelOne Transport] Error response data:', error.response.data);
      }
      throw this.handleError(error);
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(endpoint, {
        headers: headers || {},
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    console.error('🌐 [Transport] ===== ERROR HANDLING =====');

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string; error?: string } } };
      console.error('🌐 [Transport] Server responded with error status');
      console.error('🌐 [Transport] Status code:', axiosError.response?.status);
      console.error('🌐 [Transport] Response data:', axiosError.response?.data);

      // Server responded with error status
      const message = axiosError.response?.data?.message || axiosError.response?.data?.error || 'API Error';
      const errorMessage = `${axiosError.response?.status || 500}: ${message}`;
      console.error('🌐 [Transport] Final error message:', errorMessage);
      return new Error(errorMessage);
    } else if (error && typeof error === 'object' && 'request' in error) {
      // Network error
      console.error('🌐 [Transport] Network error - unable to connect to broker API');
      console.error('🌐 [Transport] Request details:', error);
      return new Error('Network Error: Unable to connect to broker API');
    } else {
      // Other error
      console.error('🌐 [Transport] Unknown error type');
      console.error('🌐 [Transport] Error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('🌐 [Transport] Final error message:', errorMessage);
      return new Error(errorMessage);
    }
  }

  // Method to update base headers for authenticated requests
  updateDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.axiosInstance.defaults.headers, headers);
  }
}