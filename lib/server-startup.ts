// lib/server-startup.ts
// Server-side startup utilities

import { tokenRefreshScheduler } from './scheduled-token-refresh';

let isInitialized = false;

export async function initializeServerServices() {
  if (isInitialized) {
    console.log('🚀 [Server] Services already initialized');
    return;
  }

  console.log('🚀 [Server] Initializing server services...');

  try {
    // Start the token refresh scheduler
    tokenRefreshScheduler.start();
    console.log('✅ [Server] Token refresh scheduler started successfully');

    isInitialized = true;
    console.log('✅ [Server] All server services initialized');
  } catch (error) {
    console.error('❌ [Server] Failed to initialize server services:', error);
    throw error;
  }
}