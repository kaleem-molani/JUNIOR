import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
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
    // Check if user is admin
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Read reset requests
    const requests = readResetRequests();
    const resetRequest = requests.find(req => req.id === requestId && req.status === 'pending');

    if (!resetRequest) {
      return NextResponse.json({ error: 'Reset request not found or already processed' }, { status: 404 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: resetRequest.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash the default password "password123"
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: true,
        updatedAt: new Date(),
      },
    });

    // Mark request as processed
    resetRequest.status = 'processed';
    resetRequest.processedAt = new Date().toISOString();
    resetRequest.processedBy = session.user.email;

    writeResetRequests(requests);

    return NextResponse.json({
      message: `Password for ${resetRequest.email} has been reset to 'password123'. User must change password on next login.`
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}