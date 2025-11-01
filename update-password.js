const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function updateSuperadminPassword() {
  const prisma = new PrismaClient();

  try {
    const hashedPassword = await bcrypt.hash('test123', 10);

    const updatedUser = await prisma.user.update({
      where: { email: 'superadmin@example.com' },
      data: {
        passwordHash: hashedPassword,
        name: 'Super Admin' // Also update the name since it was null
      },
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    console.log('Superadmin password updated:', updatedUser);

    // Verify the new password
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@example.com' },
      select: { passwordHash: true }
    });

    const isValid = await bcrypt.compare('test123', user.passwordHash);
    console.log('Password verification after update:', isValid);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuperadminPassword();