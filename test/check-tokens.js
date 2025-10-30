const { PrismaClient } = require('@prisma/client');

async function checkTokens() {
  const prisma = new PrismaClient();

  try {
    const accounts = await prisma.tradingAccount.findMany({
      select: {
        id: true,
        name: true,
        accessToken: true,
        refreshToken: true,
        tokenExpiresAt: true,
        lastUsed: true
      }
    });

    console.log('Token status:');
    accounts.forEach(acc => {
      console.log(`ID: ${acc.id}`);
      console.log(`Name: ${acc.name}`);
      console.log(`Access Token: ${acc.accessToken ? 'Present (' + acc.accessToken.length + ' chars)' : 'NULL'}`);
      console.log(`Refresh Token: ${acc.refreshToken ? 'Present (' + acc.refreshToken.length + ' chars)' : 'NULL'}`);
      console.log(`Expires: ${acc.tokenExpiresAt}`);
      console.log(`Last Used: ${acc.lastUsed}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTokens();