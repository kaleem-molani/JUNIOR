const { PrismaClient } = require('@prisma/client');

async function testApiMonitoring() {
  const prisma = new PrismaClient();

  try {
    const count = await prisma.apiRequest.count();
    console.log('Total API requests logged:', count);

    if (count > 0) {
      const recentRequests = await prisma.apiRequest.findMany({
        take: 5,
        orderBy: { startedAt: 'desc' },
        select: {
          method: true,
          url: true,
          duration: true,
          requestType: true,
          statusCode: true,
          isSuccessful: true,
          startedAt: true
        }
      });

      console.log('\nRecent API requests:');
      recentRequests.forEach((r, i) => {
        console.log(`${i + 1}. ${r.method} ${r.url}`);
        console.log(`   Duration: ${r.duration}ms | Status: ${r.statusCode} | Type: ${r.requestType} | Success: ${r.isSuccessful}`);
        console.log(`   Time: ${r.startedAt}`);
        console.log('');
      });
    } else {
      console.log('No API requests logged yet. The monitoring system may not be active.');
    }
  } catch (error) {
    console.error('Error checking API monitoring:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiMonitoring();