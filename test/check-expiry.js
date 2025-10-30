const { PrismaClient } = require('@prisma/client');

async function checkTokenExpiration() {
  const prisma = new PrismaClient();

  try {
    const accounts = await prisma.tradingAccount.findMany({
      select: {
        id: true,
        name: true,
        tokenExpiresAt: true,
        lastUsed: true
      }
    });

    const now = new Date();
    accounts.forEach(acc => {
      console.log(`Account: ${acc.name}`);
      console.log(`Expires: ${acc.tokenExpiresAt}`);
      console.log(`Last Used: ${acc.lastUsed}`);
      console.log(`Expired: ${acc.tokenExpiresAt && now > acc.tokenExpiresAt ? 'YES' : 'NO'}`);
      console.log(`Time until expiry: ${acc.tokenExpiresAt ? Math.floor((acc.tokenExpiresAt - now) / 1000 / 60) + ' minutes' : 'N/A'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTokenExpiration();