const { PrismaClient } = require('@prisma/client');

async function checkClientCodes() {
  const prisma = new PrismaClient();

  try {
    const accounts = await prisma.tradingAccount.findMany({
      select: {
        id: true,
        name: true,
        clientCode: true
      }
    });

    console.log('Accounts with client codes:');
    accounts.forEach(acc => {
      console.log(`ID: ${acc.id}, Name: ${acc.name}, ClientCode: ${acc.clientCode}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientCodes();