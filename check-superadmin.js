const { PrismaClient } = require('@prisma/client');

async function checkSuperadmin() {
  const prisma = new PrismaClient();

  try {
    const superadminUsers = await prisma.user.findMany({
      where: { role: 'super_admin' },
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    console.log('Superadmin users found:', superadminUsers);

    if (superadminUsers.length === 0) {
      console.log('No superadmin users found. Running seed data...');
      await require('./prisma/seed-test-data').main();
      console.log('Seed data completed. Checking again...');

      const usersAfterSeed = await prisma.user.findMany({
        where: { role: 'super_admin' },
        select: {
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      console.log('Superadmin users after seeding:', usersAfterSeed);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperadmin();