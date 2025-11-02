// app/api/auth/angel_one/generate/token/route.ts
// Generate AngelOne authentication token

import { NextRequest, NextResponse } from 'next/server';
import { BrokerFactory } from '@/lib/brokers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Super admins cannot generate trading account tokens
  if (session.user.role === 'super_admin') {
    return new NextResponse('Super administrators cannot generate trading account tokens', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Admins cannot generate trading account tokens
  if (session.user.role === 'admin') {
    return new NextResponse('Administrators cannot generate trading account tokens', {
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  console.log('🔑 [API] ===== TOKEN GENERATION REQUEST START =====');
  console.log('🔑 [API] Timestamp:', new Date().toISOString());
  console.log('🔑 [API] Request method:', request.method);
  console.log('🔑 [API] Request URL:', request.url);
  console.log('🔑 [API] User:', session.user.email);

  try {
    console.log('🔑 [API] Parsing request body...');
    const body = await request.json();
    console.log('🔑 [API] Request body received with keys:', Object.keys(body));
    console.log('🔑 [API] Request body (masked):', {
      client_code: body.client_code ? '***' : undefined,
      client_pin: body.client_pin ? '***' : undefined,
      totp: body.totp ? '***' : undefined,
      apiKey: body.apiKey ? '***' : undefined,
      accountId: body.accountId,
    });

    const { client_code, client_pin, totp, apiKey, accountId } = body;

    console.log('🔑 [API] Validating required fields...');
    console.log('🔑 [API] client_code present:', !!client_code);
    console.log('🔑 [API] client_pin present:', !!client_pin);
    console.log('🔑 [API] totp present:', !!totp);
    console.log('🔑 [API] apiKey present:', !!apiKey);
    console.log('🔑 [API] accountId present:', !!accountId);

    if (!client_code || !client_pin || !totp || !apiKey || !accountId) {
      console.log('❌ [API] Validation failed - missing required fields');
      return new NextResponse("All fields are required: client_code, client_pin, totp, apiKey, accountId", {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Validate TOTP format (should be 6 digits)
    if (!/^\d{6}$/.test(totp)) {
      console.log('❌ [API] Validation failed - invalid TOTP format');
      return new NextResponse("TOTP must be a 6-digit number", {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Verify that the account belongs to the authenticated user
    console.log('🔍 [API] Looking up account in database...');
    console.log('🔍 [API] Account ID from request:', accountId);
    console.log('🔍 [API] User ID from session:', session.user.id);

    const account = await prisma.tradingAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    console.log('🔍 [API] Database lookup result:');
    console.log('🔍 [API] - Account found:', !!account);
    if (account) {
      console.log('🔍 [API] - Account ID:', account.id);
      console.log('🔍 [API] - Account name:', account.name);
      console.log('🔍 [API] - Client code:', account.clientCode);
      console.log('🔍 [API] - Is active:', account.isActive);
      console.log('🔍 [API] - Current access token:', !!account.accessToken);
      console.log('🔍 [API] - Current refresh token:', !!account.refreshToken);
    } else {
      console.log('❌ [API] Account not found in database');
    }

    if (!account) {
      console.log('❌ [API] Account not found or access denied');
      return new NextResponse('Account not found or access denied', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    console.log('✅ [API] Account ownership verified');
    console.log('🔑 [API] Creating broker factory...');
    const broker = BrokerFactory.createAngelOneBroker();
    console.log('✅ [API] Broker created successfully:', !!broker);
    console.log('✅ [API] Broker type:', typeof broker);
    console.log('✅ [API] Broker has authenticate method:', typeof broker?.authenticate);

    const credentials = {
      clientCode: client_code,
      apiKey,
      userPin: client_pin,
    };

    console.log('🔑 [API] Preparing credentials for authentication...');
    console.log('🔑 [API] Credentials prepared (sensitive data masked)');

    console.log('🔑 [API] Calling broker.authenticate()...');
    console.log('🔑 [API] Account ID being passed to authenticate:', accountId);
    console.log('🔑 [API] Account ID type:', typeof accountId);
    const result = await broker.authenticate(credentials, totp, accountId);
    console.log('🔑 [API] Authentication result:', result);
    console.log('🔑 [API] Result type:', typeof result);
    console.log('🔑 [API] Result keys:', result ? Object.keys(result) : 'N/A');
    console.log('🔑 [API] Result success:', result?.success);
    console.log('🔑 [API] Result error:', result?.error);

    if (result.success) {
      console.log('✅ [API] Authentication successful - preparing success response');

      // Verify tokens were actually saved to database
      console.log('🔍 [API] Verifying tokens saved to database...');
      try {
        const updatedAccount = await prisma.tradingAccount.findUnique({
          where: { id: accountId },
          select: {
            id: true,
            name: true,
            accessToken: true,
            refreshToken: true,
            tokenExpiresAt: true,
            lastUsed: true,
          },
        });

        console.log('🔍 [API] Database verification result:');
        console.log('🔍 [API] - Account found:', !!updatedAccount);
        if (updatedAccount) {
          console.log('🔍 [API] - Account ID:', updatedAccount.id);
          console.log('🔍 [API] - Account name:', updatedAccount.name);
          console.log('🔍 [API] - Access token saved:', !!updatedAccount.accessToken);
          console.log('🔍 [API] - Refresh token saved:', !!updatedAccount.refreshToken);
          console.log('🔍 [API] - Token expires at:', updatedAccount.tokenExpiresAt);
          console.log('🔍 [API] - Last used:', updatedAccount.lastUsed);
          console.log('🔍 [API] - Access token length:', updatedAccount.accessToken?.length || 0);
          console.log('🔍 [API] - Refresh token length:', updatedAccount.refreshToken?.length || 0);

          if (!updatedAccount.accessToken || !updatedAccount.refreshToken) {
            console.error('❌ [API] CRITICAL: Tokens not found in database after successful authentication!');
            console.error('❌ [API] This indicates a database storage failure');
          } else {
            console.log('✅ [API] Database verification successful - tokens are saved');
          }
        } else {
          console.error('❌ [API] CRITICAL: Account not found in database after authentication!');
        }
      } catch (verifyError) {
        console.error('❌ [API] Failed to verify database state:', verifyError);
      }

      const response = new NextResponse('Authentication successful', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
      console.log('✅ [API] Success response created');
      return response;
    } else {
      console.log('❌ [API] Authentication failed - preparing error response');
      console.log('❌ [API] Raw result.error:', result.error);
      console.log('❌ [API] result.error type:', typeof result.error);
      console.log('❌ [API] result.error length:', result.error?.length);
      const errorMessage = result.error || 'Authentication failed. Please check your credentials and TOTP code.';
      console.log('❌ [API] Final error message:', errorMessage);
      const response = new NextResponse(errorMessage, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
      console.log('❌ [API] Error response created');
      return response;
    }
  } catch (error) {
    console.error('❌ [API] Exception caught in token generation');
    console.error('❌ [API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return new NextResponse(`Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}