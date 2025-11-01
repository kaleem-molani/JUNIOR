// test-monitoring-db.js
// Test database connection for monitoring API

async function testMonitoringDB() {
  console.log('Testing monitoring database connection...');

  try {
    // Simulate what the monitoring API does
    const { PrismaClient } = require('@prisma/client');

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    console.log('DATABASE_URL:', process.env.DATABASE_URL);

    // Test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Test getConnectionInfo
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Version query successful:', result[0]);

    await prisma.$disconnect();
    console.log('✅ Database test completed successfully');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  }
}

testMonitoringDB();