import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10); // Change password as needed

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      role: 'admin',
      isActive: true, // Admin should be active
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'superadmin@example.com',
      passwordHash: hashedPassword,
      role: 'super_admin',
      isActive: true, // Super admin should be active
    },
  });

  console.log('Admin user created:', admin);
  console.log('Super admin user created:', superAdmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });