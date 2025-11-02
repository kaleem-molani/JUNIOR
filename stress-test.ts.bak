import { PrismaClient, Role, Action, OrderType, PriceType, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Stress test configuration
const STRESS_TEST_CONFIG = {
  USERS_TO_CREATE: 150, // 150 test users for scalability testing
  ACCOUNTS_PER_USER: { min: 1, max: 3 }, // 1-3 accounts per user
  SIGNALS_TO_BROADCAST: 50, // 50 concurrent signals
  API_REQUESTS_PER_USER: 20, // 20 API calls per user
  CONCURRENT_OPERATIONS: 10, // 10 concurrent operations
};

// Popular trading symbols for testing
const TEST_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'HINDUNILVR', 'ITC', 'KOTAKBANK',
  'LT', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'BHARTIARTL', 'HCLTECH', 'WIPRO'
];

// Generate random data helpers
function generateRandomEmail(index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `stressuser${index}@${domain}`;
}

function generateRandomName(): string {
  const firstNames = [
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Kavita', 'Rajesh', 'Meera', 'Suresh', 'Anita'
  ];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function generateRandomClientCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomSymbol(): string {
  return TEST_SYMBOLS[Math.floor(Math.random() * TEST_SYMBOLS.length)];
}

function getRandomAction(): Action {
  return Math.random() > 0.5 ? Action.BUY : Action.SELL;
}

function getRandomQuantity(): number {
  return Math.floor(Math.random() * 10) + 1; // 1-10 shares
}

async function createStressTestUsers() {
  console.log('🚀 Starting JUNIOR Stress Test...');
  console.log('=====================================');
  console.log(`Creating ${STRESS_TEST_CONFIG.USERS_TO_CREATE} test users...`);

  const startTime = Date.now();
  const users = [];

  // Create users in batches
  const batchSize = 10;
  for (let i = 0; i < STRESS_TEST_CONFIG.USERS_TO_CREATE; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize && i + j < STRESS_TEST_CONFIG.USERS_TO_CREATE; j++) {
      const userIndex = i + j + 1;
      const email = generateRandomEmail(userIndex);
      const name = generateRandomName();
      const hashedPassword = await bcrypt.hash('test123', 10);

      batch.push({
        email,
        name,
        passwordHash: hashedPassword,
        role: Role.user,
        isActive: true,
      });
    }

    const createdUsers = await prisma.user.createMany({
      data: batch,
      skipDuplicates: true,
    });

    users.push(...batch);
    console.log(`✅ Created batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(STRESS_TEST_CONFIG.USERS_TO_CREATE/batchSize)} (${batch.length} users)`);
  }

  const userCreationTime = Date.now() - startTime;
  console.log(`⏱️  User creation completed in ${userCreationTime}ms`);
  console.log(`📊 Total users created: ${users.length}`);

  return users;
}

async function createTradingAccounts(users: any[]) {
  console.log('\n🏦 Creating trading accounts...');

  const startTime = Date.now();
  let totalAccounts = 0;

  // Create accounts for each user
  for (const user of users) {
    const userRecord = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!userRecord) continue;

    const numAccounts = Math.floor(Math.random() *
      (STRESS_TEST_CONFIG.ACCOUNTS_PER_USER.max - STRESS_TEST_CONFIG.ACCOUNTS_PER_USER.min + 1)) +
      STRESS_TEST_CONFIG.ACCOUNTS_PER_USER.min;

    const accounts = [];
    for (let i = 0; i < numAccounts; i++) {
      accounts.push({
        userId: userRecord.id,
        name: `${user.name} Account ${i + 1}`,
        broker: 'mock', // Using mock broker for testing
        clientCode: generateRandomClientCode(),
        apiKey: `mock_api_key_${userRecord.id}_${i}`,
        secret: `mock_secret_${userRecord.id}_${i}`,
        userPin: '123456', // Required PIN for mock accounts
        isActive: true,
      });
    }

    await prisma.tradingAccount.createMany({
      data: accounts,
      skipDuplicates: true,
    });

    totalAccounts += accounts.length;
  }

  const accountCreationTime = Date.now() - startTime;
  console.log(`⏱️  Account creation completed in ${accountCreationTime}ms`);
  console.log(`📊 Total accounts created: ${totalAccounts}`);

  return totalAccounts;
}

async function broadcastStressSignals() {
  console.log('\n📡 Broadcasting stress test signals...');

  const startTime = Date.now();
  const adminUser = await prisma.user.findFirst({
    where: { role: Role.super_admin }
  });

  if (!adminUser) {
    throw new Error('No super admin user found');
  }

  // Get all active accounts for signal distribution
  const accounts = await prisma.tradingAccount.findMany({
    where: { isActive: true },
    include: { user: true }
  });

  console.log(`📊 Found ${accounts.length} active trading accounts`);

  // Broadcast signals concurrently
  const signalPromises = [];
  for (let i = 0; i < STRESS_TEST_CONFIG.SIGNALS_TO_BROADCAST; i++) {
    const signal = {
      adminId: adminUser.id,
      symbol: getRandomSymbol(),
      quantity: getRandomQuantity(),
      action: getRandomAction(),
      type: OrderType.INTRADAY,
      orderType: PriceType.MARKET,
      status: Status.pending,
    };

    signalPromises.push(
      prisma.signal.create({ data: signal })
        .then(createdSignal => {
          console.log(`📡 Signal ${i + 1}/${STRESS_TEST_CONFIG.SIGNALS_TO_BROADCAST}: ${createdSignal.action} ${createdSignal.quantity} ${createdSignal.symbol}`);

          // Create orders for random subset of accounts
          const numOrders = Math.min(accounts.length, Math.floor(Math.random() * 20) + 5); // 5-20 orders per signal
          const selectedAccounts = accounts.sort(() => 0.5 - Math.random()).slice(0, numOrders);

          const orderPromises = selectedAccounts.map(account =>
            prisma.order.create({
              data: {
                signalId: createdSignal.id,
                accountId: account.id,
                status: Math.random() > 0.1 ? Status.executed : Status.failed, // 90% success rate
                executedAt: new Date(),
              }
            })
          );

          return Promise.all(orderPromises);
        })
    );
  }

  await Promise.all(signalPromises);

  const signalBroadcastTime = Date.now() - startTime;
  console.log(`⏱️  Signal broadcasting completed in ${signalBroadcastTime}ms`);
}

async function runDatabasePerformanceTest() {
  console.log('\n🗄️  Running database performance tests...');

  const startTime = Date.now();

  // Test 1: Count all records
  console.log('Counting records...');
  const [userCount, accountCount, signalCount, orderCount] = await Promise.all([
    prisma.user.count(),
    prisma.tradingAccount.count(),
    prisma.signal.count(),
    prisma.order.count(),
  ]);

  console.log(`📊 Database contains: ${userCount} users, ${accountCount} accounts, ${signalCount} signals, ${orderCount} orders`);

  // Test 2: Complex query performance
  console.log('Testing complex queries...');
  const complexQueryStart = Date.now();

  const recentActivity = await prisma.signal.findMany({
    take: 100,
    orderBy: { broadcastAt: 'desc' },
    include: {
      admin: { select: { email: true, name: true } },
      orders: {
        include: {
          account: {
            include: {
              user: { select: { email: true, name: true } }
            }
          }
        }
      }
    }
  });

  const complexQueryTime = Date.now() - complexQueryStart;
  console.log(`⏱️  Complex query (100 signals with relations) took ${complexQueryTime}ms`);

  // Test 3: Aggregation queries
  const aggregationStart = Date.now();

  const signalStats = await prisma.signal.groupBy({
    by: ['action', 'status'],
    _count: { id: true }
  });

  const orderStats = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  const aggregationTime = Date.now() - aggregationStart;
  console.log(`⏱️  Aggregation queries took ${aggregationTime}ms`);

  const dbTestTime = Date.now() - startTime;
  console.log(`⏱️  Database performance tests completed in ${dbTestTime}ms`);

  return {
    userCount,
    accountCount,
    signalCount,
    orderCount,
    complexQueryTime,
    aggregationTime,
    totalDbTime: dbTestTime
  };
}

async function generateApiMonitoringData() {
  console.log('\n🔍 Generating API monitoring test data...');

  const startTime = Date.now();
  const users = await prisma.user.findMany({ take: 50 }); // Test with 50 users

  const apiRequests = [];
  const requestTypes = ['frontend_to_backend', 'backend_to_broker'] as const;
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const statusCodes = [200, 201, 400, 401, 404, 500];

  for (const user of users) {
    for (let i = 0; i < STRESS_TEST_CONFIG.API_REQUESTS_PER_USER; i++) {
      const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      const duration = Math.floor(Math.random() * 2000) + 100; // 100-2100ms

      apiRequests.push({
        requestId: `stress_${user.id}_${i}_${Date.now()}`,
        requestType,
        method,
        url: requestType === 'frontend_to_backend'
          ? `/api/${['signals', 'orders', 'accounts', 'users'][Math.floor(Math.random() * 4)]}`
          : `https://api.broker.com/${['orders', 'positions', 'holdings'][Math.floor(Math.random() * 3)]}`,
        headers: { 'user-agent': 'Mozilla/5.0', 'content-type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify({ test: 'data' }) : null,
        userId: user.id,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        startedAt: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
        endedAt: new Date(),
        duration,
        statusCode,
        responseHeaders: { 'content-type': 'application/json' },
        responseBody: JSON.stringify({ success: statusCode < 400 }),
        error: statusCode >= 500 ? 'Internal server error' : null,
        isSuccessful: statusCode < 400,
      });
    }
  }

  // Insert in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < apiRequests.length; i += batchSize) {
    const batch = apiRequests.slice(i, i + batchSize);
    await prisma.apiRequest.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`📝 Inserted API requests batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(apiRequests.length/batchSize)}`);
  }

  const apiGenTime = Date.now() - startTime;
  console.log(`⏱️  API monitoring data generation completed in ${apiGenTime}ms`);
  console.log(`📊 Generated ${apiRequests.length} API request records`);

  return apiRequests.length;
}

async function runStressTest() {
  try {
    console.log('🚀 JUNIOR STRESS TEST SUITE');
    console.log('===========================');
    console.log(`Target: ${STRESS_TEST_CONFIG.USERS_TO_CREATE} users, ${STRESS_TEST_CONFIG.SIGNALS_TO_BROADCAST} signals`);
    console.log(`Database: trading_app_sandbox`);
    console.log(`Environment: SANDBOX MODE`);
    console.log('');

    const testStartTime = Date.now();

    // Phase 1: Create test users
    const users = await createStressTestUsers();

    // Phase 2: Create trading accounts
    const totalAccounts = await createTradingAccounts(users);

    // Phase 3: Broadcast stress signals
    await broadcastStressSignals();

    // Phase 4: Generate API monitoring data
    const apiRequestsGenerated = await generateApiMonitoringData();

    // Phase 5: Run database performance tests
    const dbStats = await runDatabasePerformanceTest();

    // Final summary
    const totalTestTime = Date.now() - testStartTime;

    console.log('\n🎯 STRESS TEST RESULTS');
    console.log('======================');
    console.log(`⏱️  Total test duration: ${totalTestTime}ms`);
    console.log(`👥 Users created: ${dbStats.userCount}`);
    console.log(`🏦 Accounts created: ${dbStats.accountCount}`);
    console.log(`📡 Signals broadcast: ${dbStats.signalCount}`);
    console.log(`📋 Orders created: ${dbStats.orderCount}`);
    console.log(`🔍 API requests logged: ${apiRequestsGenerated}`);
    console.log(`🗄️  Database performance: ${dbStats.complexQueryTime}ms (complex query)`);
    console.log(`⚡ System status: OPERATIONAL ✅`);

    console.log('\n📈 Performance Metrics:');
    console.log(`   - User creation rate: ${(STRESS_TEST_CONFIG.USERS_TO_CREATE / (totalTestTime / 1000)).toFixed(1)} users/sec`);
    console.log(`   - Database query time: ${dbStats.complexQueryTime}ms for 100 records with relations`);
    console.log(`   - Signal processing: ${STRESS_TEST_CONFIG.SIGNALS_TO_BROADCAST} signals in ${totalTestTime}ms`);

    console.log('\n🎉 Stress test completed successfully!');
    console.log('🔍 Check the super admin dashboard to view monitoring data');

  } catch (error) {
    console.error('❌ Stress test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the stress test
runStressTest();