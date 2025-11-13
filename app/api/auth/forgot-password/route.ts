import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

const RESET_REQUESTS_FILE = path.join(process.cwd(), 'password-reset-requests.json');

interface PasswordResetRequest {
  id: string;
  email: string;
  requestedAt: string;
  status: 'pending' | 'processed';
  processedAt?: string;
  processedBy?: string;
}

// Helper function to read reset requests
function readResetRequests(): PasswordResetRequest[] {
  try {
    if (!fs.existsSync(RESET_REQUESTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(RESET_REQUESTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading reset requests:', error);
    return [];
  }
}

// Helper function to write reset requests
function writeResetRequests(requests: PasswordResetRequest[]): void {
  try {
    fs.writeFileSync(RESET_REQUESTS_FILE, JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error('Error writing reset requests:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'If an account with this email exists, a password reset request has been submitted to administrators.'
      });
    }

    // Check if there's already a pending request for this email
    const existingRequests = readResetRequests();
    const pendingRequest = existingRequests.find(
      req => req.email === email && req.status === 'pending'
    );

    if (pendingRequest) {
      return NextResponse.json({
        message: 'A password reset request is already pending for this email.'
      });
    }

    // Create new reset request
    const newRequest: PasswordResetRequest = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      email,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    existingRequests.push(newRequest);
    writeResetRequests(existingRequests);

    return NextResponse.json({
      message: 'Password reset request submitted. An administrator will process your request.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for admins to view reset requests
export async function GET() {
  try {
    const requests = readResetRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching reset requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}