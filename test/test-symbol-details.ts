import { AngelOneOrderService } from '../lib/brokers/orders';
import { HttpTransportService } from '../lib/brokers/transport';
import { PrismaClient } from '@prisma/client';

async function testSymbolDetails() {
  const prisma = new PrismaClient();
  const transport = new HttpTransportService();
  const orderService = new AngelOneOrderService(transport);

  try {
    // Get the correct RELIANCE symbol from database
    const symbolRecord = await prisma.symbol.findFirst({
      where: {
        symbol: 'RELIANCE-EQ', // Use the -EQ variant which has a token
        exchange: 'NSE',
        isActive: true
      }
    });

    if (!symbolRecord) {
      console.log('❌ RELIANCE-EQ symbol not found in database');
      return;
    }

    console.log('📊 Using symbol from database:', {
      symbol: symbolRecord.symbol,
      token: symbolRecord.token,
      name: symbolRecord.name
    });

    // Get account credentials
    const account = await prisma.tradingAccount.findFirst();
    if (!account) {
      console.log('❌ No trading account found');
      return;
    }

    const credentials = {
      clientCode: account.clientCode || undefined,
      apiKey: account.apiKey,
      userPin: account.userPin,
      accessToken: account.accessToken || undefined,
      refreshToken: account.refreshToken || undefined
    };

    console.log('🧪 Testing order placement with correct symbol from database...');

    const testOrder = {
      symbol: symbolRecord.symbol,
      symbolToken: symbolRecord.token || undefined,
      side: 'BUY' as const,
      quantity: 1,
      orderType: 'MARKET' as const,
      productType: 'INTRADAY' as const,
      exchange: 'NSE' as const
    };

    console.log('📋 Order request:', testOrder);

    const result = await orderService.placeOrder(credentials, testOrder);
    console.log('✅ Order placement result:', result);

  } catch (error: unknown) {
    const err = error as Error;
    console.log('❌ Order placement failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSymbolDetails();