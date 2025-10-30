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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Super admins cannot generate trading account tokens
  if (session.user.role === 'super_admin') {
    return NextResponse.json({ error: 'Super administrators cannot generate trading account tokens' }, { status: 403 });
  }

  // Admins cannot generate trading account tokens
  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Administrators cannot generate trading account tokens' }, { status: 403 });
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
      const response = NextResponse.json({
        ok: false,
        error: "All fields are required: client_code, client_pin, totp, apiKey, accountId"
      }, { status: 400 });
      console.log('❌ [API] Validation error response sent');
      console.log('🔑 [API] ===== TOKEN GENERATION REQUEST END =====');
      return response;
    }

    // Verify that the account belongs to the authenticated user
    const account = await prisma.tradingAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      console.log('❌ [API] Account not found or access denied');
      const response = NextResponse.json({
        ok: false,
        error: 'Account not found or access denied'
      }, { status: 404 });
      console.log('❌ [API] Access denied response sent');
      console.log('🔑 [API] ===== TOKEN GENERATION REQUEST END =====');
      return response;
    }

    console.log('✅ [API] Account ownership verified');
    console.log('🔑 [API] Creating broker factory...');
    const broker = BrokerFactory.createAngelOneBroker();
    console.log('✅ [API] Broker created successfully');

    const credentials = {
      clientCode: client_code,
      apiKey,
      userPin: client_pin,
    };

    console.log('🔑 [API] Preparing credentials for authentication...');
    console.log('🔑 [API] Credentials prepared (sensitive data masked)');

    console.log('🔑 [API] Calling broker.authenticate()...');
    const success = await broker.authenticate(credentials, totp, accountId);
    console.log('🔑 [API] Authentication result:', success);

    if (success) {
      console.log('✅ [API] Authentication successful - preparing success response');
      const response = NextResponse.json({ ok: true, message: 'Authentication successful' });
      console.log('✅ [API] Success response sent');
      console.log('🔑 [API] ===== TOKEN GENERATION REQUEST END =====');
      return response;
    } else {
      console.log('❌ [API] Authentication failed - preparing error response');
      const response = NextResponse.json({
        ok: false,
        error: 'Authentication failed'
      }, { status: 400 });
      console.log('❌ [API] Error response sent');
      console.log('🔑 [API] ===== TOKEN GENERATION REQUEST END =====');
      return response;
    }
  } catch (error) {
    console.error('❌ [API] Exception caught in token generation');
    console.error('❌ [API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ [API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ [API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    const response = NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });

    console.log('❌ [API] Error response sent');
    console.log('🔑 [API] ===== TOKEN GENERATION REQUEST END =====');
    return response;
  }
}