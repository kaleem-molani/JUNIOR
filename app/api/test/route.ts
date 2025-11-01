import { NextResponse, NextRequest } from 'next/server';
import { withApiMonitoring } from '@/lib/api-monitoring';

async function testHandler(request: NextRequest) {
  console.log('🧪 Test API endpoint called with monitoring');

  return NextResponse.json({
    message: 'Test API endpoint with monitoring',
    timestamp: new Date().toISOString(),
    status: 'success',
    monitoringEnabled: true
  });
}

export async function GET(request: NextRequest) {
  return withApiMonitoring(testHandler, request);
}