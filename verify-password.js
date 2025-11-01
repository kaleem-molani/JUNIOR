const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function verifyPassword() {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@example.com' },
      select: {
        email: true,
        passwordHash: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', {
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      passwordHashLength: user.passwordHash.length
    });

    // Test password verification
    const testPassword = 'test123';
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('Password "test123" is valid:', isValid);

    // Also test if the hash was created correctly
    const expectedHash = await bcrypt.hash(testPassword, 10);
    console.log('Expected hash length:', expectedHash.length);
    console.log('Stored hash length:', user.passwordHash.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPassword();