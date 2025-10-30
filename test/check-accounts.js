const { PrismaClient } = require('@prisma/client');

async function checkAccounts() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking trading accounts...');
    const accounts = await prisma.tradingAccount.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    console.log('Found accounts:', accounts.length);
    accounts.forEach(account => {
      console.log(`- ID: ${account.id}, User: ${account.user?.email}, Name: ${account.name}`);
    });

    // Also check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true
      }
    });

    console.log('\nUsers:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccounts();