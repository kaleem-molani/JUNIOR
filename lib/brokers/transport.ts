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

    console.log('🌐 [Transport] ===== HTTP POST REQUEST =====');
    console.log('🌐 [Transport] Timestamp:', new Date().toISOString());
    console.log('🌐 [Transport] Endpoint:', endpoint);
    console.log('🌐 [Transport] Full URL:', `${this.baseUrl}${endpoint}`);
    console.log('🌐 [Transport] Request data keys:', Object.keys(data));
    console.log('🌐 [Transport] Headers:', JSON.stringify(finalHeaders, null, 2));
    console.log('🌐 [Transport] Timeout:', this.timeout, 'ms');

    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(endpoint, data, {
        headers: headers || {},
      });

      console.log('🌐 [Transport] ===== HTTP RESPONSE RECEIVED =====');
      console.log('🌐 [Transport] Response status:', response.status);
      console.log('🌐 [Transport] Response status text:', response.statusText);
      console.log('🌐 [Transport] Response data type:', typeof response.data);
      console.log('🌐 [Transport] Response data keys:', response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A');
      console.log('🌐 [Transport] Response headers present:', !!response.headers);

      return response.data;
    } catch (error) {
      console.error('🌐 [Transport] ===== HTTP REQUEST FAILED =====');
      console.error('🌐 [Transport] Error details:', error);
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