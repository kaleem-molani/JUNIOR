import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking sandbox database state...\n');

    // Count API requests
    const apiRequestCount = await prisma.apiRequest.count();
    console.log(`📊 API Requests: ${apiRequestCount}`);

    // Count users
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount}`);

    // Count signals
    const signalCount = await prisma.signal.count();
    console.log(`📡 Signals: ${signalCount}`);

    // Count orders
    const orderCount = await prisma.order.count();
    console.log(`📋 Orders: ${orderCount}`);

    // Count trading accounts
    const accountCount = await prisma.tradingAccount.count();
    console.log(`🏦 Trading Accounts: ${accountCount}`);

    // Check recent API requests
    if (apiRequestCount > 0) {
      const recentRequests = await prisma.apiRequest.findMany({
        take: 5,
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          requestType: true,
          method: true,
          url: true,
          statusCode: true,
          duration: true,
          startedAt: true
        }
      });

      console.log('\n🔍 Recent API Requests:');
      recentRequests.forEach(req => {
        console.log(`  ${req.method} ${req.url} -> ${req.statusCode} (${req.duration}ms)`);
      });
    }

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();