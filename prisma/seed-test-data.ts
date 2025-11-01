import { PrismaClient, Role, Action, OrderType, PriceType, Status, LogLevel, User, TradingAccount } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Test data configuration
const TEST_DATA_CONFIG = {
  USERS_COUNT: 120, // 100+ users for scalability testing
  ACCOUNTS_PER_USER: { min: 1, max: 3 }, // 1-3 accounts per user
  SYMBOLS_COUNT: 50, // Popular trading symbols
  SIGNALS_COUNT: 200, // Historical signals for testing
  LOGS_COUNT: 500, // Activity logs
};

// Indian stock symbols for testing
const INDIAN_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'HINDUNILVR', 'ITC', 'KOTAKBANK',
  'LT', 'AXISBANK', 'MARUTI', 'BAJFINANCE', 'BHARTIARTL', 'HCLTECH', 'WIPRO',
  'ADANIPORTS', 'ASIANPAINT', 'BAJAJ-AUTO', 'BPCL', 'CIPLA', 'DRREDDY', 'GRASIM',
  'HEROMOTOCO', 'JSWSTEEL', 'NESTLEIND', 'NTPC', 'POWERGRID', 'SBIN', 'SUNPHARMA',
  'TATAMOTORS', 'TATASTEEL', 'TECHM', 'TITAN', 'ULTRACEMCO', 'UPL', 'VEDL',
  'ADANIGREEN', 'ADANITRANS', 'AMBUJACEM', 'APOLLOHOSP', 'AUROPHARMA', 'BANDHANBNK',
  'BERGEPAINT', 'BIOCON', 'BOSCHLTD', 'CADILAHC', 'CHOLAFIN', 'COALINDIA', 'COLPAL',
  'DABUR', 'DIVISLAB', 'DLF', 'GAIL', 'GODREJCP', 'HAVELLS', 'HINDALCO', 'HINDPETRO'
];

// Generate random data helpers
function generateRandomEmail(index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `testuser${index}@${domain}`;
}

function generateRandomName(): string {
  const firstNames = [
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Kavita', 'Rajesh', 'Meera', 'Suresh', 'Anita',
    'Arjun', 'Deepika', 'Rohit', 'Pooja', 'Karan', 'Neha', 'Vivek', 'Swati', 'Manoj', 'Kiran',
    'Aditya', 'Anjali', 'Ravi', 'Sakshi', 'Nikhil', 'Divya', 'Prakash', 'Shalini', 'Sunil', 'Rekha',
    'Aryan', 'Kritika', 'Sameer', 'Alisha', 'Dinesh', 'Preeti', 'Gaurav', 'Nandini', 'Ashish', 'Ritu',
    'Kartik', 'Shruti', 'Harish', 'Madhuri', 'Rakesh', 'Ananya', 'Sandeep', 'Poonam', 'Ajay', 'Seema',
    'Varun', 'Komal', 'Mukesh', 'Rashmi', 'Ankit', 'Simran', 'Vijay', 'Kavya', 'Rajat', 'Nisha',
    'Arun', 'Bhavna', 'Chetan', 'Diya', 'Eshan', 'Falguni', 'Gautam', 'Hina', 'Inder', 'Jasmine',
    'Kapil', 'Lata', 'Manish', 'Naveen', 'Om', 'Pallavi', 'Qamar', 'Radhika', 'Sahil', 'Tanvi'
  ];
  const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Jain', 'Agarwal', 'Verma', 'Yadav', 'Mishra'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function generateRandomClientCode(): string {
  return `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function generateRandomApiKey(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

async function seedSymbols() {
  console.log('🌱 Seeding symbols...');

  const symbols = INDIAN_SYMBOLS.slice(0, TEST_DATA_CONFIG.SYMBOLS_COUNT).map((symbol, index) => ({
    token: `TOKEN${index.toString().padStart(6, '0')}`,
    symbol,
    name: `${symbol} Limited`,
    exchange: 'NSE',
    instrumentType: 'EQ',
    lotSize: 1,
    tickSize: 0.05,
    exchSeg: 'EQ',
    isActive: true,
  }));

  for (const symbol of symbols) {
    await prisma.symbol.upsert({
      where: { token: symbol.token },
      update: symbol,
      create: symbol,
    });
  }

  console.log(`✅ Created ${symbols.length} symbols`);
}

async function seedUsers() {
  console.log('👥 Seeding users...');

  const hashedPassword = await bcrypt.hash('test123', 10);
  const users = [];

  // Create admin users first
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: 'System Admin',
      role: 'admin' as Role,
      isActive: true,
      isExecutionEnabled: true,
    },
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: { passwordHash: hashedPassword },
    create: {
      email: 'superadmin@example.com',
      passwordHash: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin' as Role,
      isActive: true,
      isExecutionEnabled: true,
    },
  });

  users.push(adminUser, superAdminUser);

  // Create regular test users
  for (let i = 1; i <= TEST_DATA_CONFIG.USERS_COUNT; i++) {
    const user = await prisma.user.upsert({
      where: { email: generateRandomEmail(i) },
      update: {},
      create: {
        email: generateRandomEmail(i),
        passwordHash: hashedPassword,
        name: generateRandomName(),
        role: 'user' as Role,
        isActive: Math.random() > 0.1, // 90% active users
        isExecutionEnabled: Math.random() > 0.2, // 80% execution enabled
        primaryBroker: 'angelone',
        restrictedSymbols: [],
      },
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length} users (${TEST_DATA_CONFIG.USERS_COUNT} test users + 2 admins)`);
  return users;
}

async function seedTradingAccounts(users: Awaited<ReturnType<typeof seedUsers>>) {
  console.log('💼 Seeding trading accounts...');

  const accounts = [];
  const regularUsers = users.filter(u => u.role === 'user');

  for (const user of regularUsers) {
    const accountCount = getRandomInt(TEST_DATA_CONFIG.ACCOUNTS_PER_USER.min, TEST_DATA_CONFIG.ACCOUNTS_PER_USER.max);

    for (let i = 0; i < accountCount; i++) {
      const account = await prisma.tradingAccount.create({
        data: {
          userId: user.id,
          name: `Account ${i + 1}`,
          broker: 'angelone',
          clientCode: generateRandomClientCode(),
          apiKey: generateRandomApiKey(),
          secret: generateRandomApiKey(),
          userPin: getRandomInt(100000, 999999).toString(),
          accessToken: generateRandomApiKey(),
          refreshToken: generateRandomApiKey(),
          tokenExpiresAt: new Date(Date.now() + getRandomInt(1, 24) * 60 * 60 * 1000), // 1-24 hours from now
          isActive: Math.random() > 0.15, // 85% active accounts
          lastUsed: Math.random() > 0.3 ? new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000) : null,
        },
      });
      accounts.push(account);
    }
  }

  console.log(`✅ Created ${accounts.length} trading accounts`);
  return accounts;
}

async function seedSignalsAndOrders(users: Awaited<ReturnType<typeof seedUsers>>, accounts: Awaited<ReturnType<typeof seedTradingAccounts>>) {
  console.log('📡 Seeding signals and orders...');

  const adminUsers = users.filter(u => u.role !== 'user');
  const symbols = await prisma.symbol.findMany();

  const signals = [];
  const orders = [];

  for (let i = 0; i < TEST_DATA_CONFIG.SIGNALS_COUNT; i++) {
    const admin = getRandomElement(adminUsers);
    const symbol = getRandomElement(symbols);

    const signal = await prisma.signal.create({
      data: {
        adminId: admin.id,
        symbolId: symbol.id,
        symbol: symbol.symbol,
        quantity: getRandomInt(1, 100),
        action: getRandomElement([Action.BUY, Action.SELL]),
        type: getRandomElement([OrderType.INTRADAY, OrderType.DELIVERY]),
        orderType: getRandomElement([PriceType.MARKET, PriceType.LIMIT]),
        limitPrice: Math.random() > 0.5 ? getRandomFloat(100, 5000) : null,
        broadcastAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000), // Last 30 days
        status: getRandomElement([Status.pending, Status.executed, Status.partially_executed, Status.failed]),
      },
    });
    signals.push(signal);

    // Create orders for this signal (simulate execution)
    const orderCount = getRandomInt(1, Math.min(accounts.length, 20)); // 1-20 orders per signal
    const selectedAccounts = accounts.sort(() => 0.5 - Math.random()).slice(0, orderCount);

    for (const account of selectedAccounts) {
      const order = await prisma.order.create({
        data: {
          signalId: signal.id,
          accountId: account.id,
          brokerOrderId: Math.random() > 0.1 ? `ORDER${getRandomInt(100000, 999999)}` : null,
          status: getRandomElement([Status.pending, Status.executed, Status.partially_executed, Status.failed]),
          executedAt: Math.random() > 0.3 ? new Date(signal.broadcastAt.getTime() + getRandomInt(1000, 10000)) : null,
          errorMessage: Math.random() > 0.8 ? 'Insufficient funds' : null,
        },
      });
      orders.push(order);
    }
  }

  console.log(`✅ Created ${signals.length} signals and ${orders.length} orders`);
}

async function seedLogs(users: Awaited<ReturnType<typeof seedUsers>>) {
  console.log('📝 Seeding activity logs...');

  const logActions = [
    'LOGIN', 'LOGOUT', 'SIGNAL_CREATED', 'SIGNAL_EXECUTED', 'ACCOUNT_ADDED',
    'ACCOUNT_UPDATED', 'ORDER_PLACED', 'ORDER_EXECUTED', 'ORDER_FAILED'
  ];

  const logs = [];

  for (let i = 0; i < TEST_DATA_CONFIG.LOGS_COUNT; i++) {
    const user = getRandomElement(users);
    const action = getRandomElement(logActions);

    const log = await prisma.log.create({
      data: {
        userId: user.id,
        action,
        details: {
          timestamp: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000),
          ip: `192.168.1.${getRandomInt(1, 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...(action.includes('SIGNAL') && { signalId: `signal_${getRandomInt(1, 1000)}` }),
          ...(action.includes('ORDER') && { orderId: `order_${getRandomInt(1, 1000)}` }),
        },
        level: getRandomElement([LogLevel.info, LogLevel.warn, LogLevel.error]),
      },
    });
    logs.push(log);
  }

  console.log(`✅ Created ${logs.length} activity logs`);
}

async function seedTaggedSymbols(users: Awaited<ReturnType<typeof seedUsers>>) {
  console.log('🏷️ Seeding tagged symbols...');

  const symbols = await prisma.symbol.findMany();
  const regularUsers = users.filter(u => u.role === 'user');

  const taggedSymbols = [];

  for (const user of regularUsers) {
    const tagCount = getRandomInt(0, 10); // 0-10 tags per user
    const userSymbols = symbols.sort(() => 0.5 - Math.random()).slice(0, tagCount);

    for (const symbol of userSymbols) {
      const taggedSymbol = await prisma.taggedSymbol.upsert({
        where: {
          userId_symbolId: {
            userId: user.id,
            symbolId: symbol.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          symbolId: symbol.id,
          taggedAt: new Date(Date.now() - getRandomInt(0, 30) * 24 * 60 * 60 * 1000),
        },
      });
      taggedSymbols.push(taggedSymbol);
    }
  }

  console.log(`✅ Created ${taggedSymbols.length} tagged symbols`);
}

async function main() {
  console.log('🚀 Starting comprehensive test data seeding...');
  console.log(`📊 Configuration: ${TEST_DATA_CONFIG.USERS_COUNT} users, ${TEST_DATA_CONFIG.SYMBOLS_COUNT} symbols, ${TEST_DATA_CONFIG.SIGNALS_COUNT} signals`);

  try {
    // Seed in order of dependencies
    await seedSymbols();
    const users = await seedUsers();
    const accounts = await seedTradingAccounts(users);
    await seedSignalsAndOrders(users, accounts);
    await seedLogs(users);
    await seedTaggedSymbols(users);

    console.log('🎉 Test data seeding completed successfully!');
    console.log('📈 Summary:');
    console.log(`   • ${TEST_DATA_CONFIG.USERS_COUNT + 2} users created`);
    console.log(`   • ${accounts.length} trading accounts created`);
    console.log(`   • ${TEST_DATA_CONFIG.SYMBOLS_COUNT} symbols created`);
    console.log(`   • ${TEST_DATA_CONFIG.SIGNALS_COUNT} signals created`);
    console.log(`   • ${TEST_DATA_CONFIG.LOGS_COUNT} activity logs created`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });