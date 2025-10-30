// test-single-instrument.ts
import { prisma } from '../lib/prisma';

async function testSingleInstrument() {
  console.log('🧪 Testing single instrument insertion...');

  try {
    // Test data from AngelOne
    const testInstrument = {
      token: '738561',
      symbol: 'RELIANCE',
      name: 'RELIANCE INDUSTRIES LTD',
      expiry: '',
      strike: 0,
      lotsize: 1,
      instrumenttype: 'EQ',
      exch_seg: 'NSE',
      tick_size: 0.01,
    };

    console.log('📊 Test instrument:', testInstrument);

    const result = await prisma.symbol.upsert({
      where: { token: testInstrument.token },
      update: {
        symbol: testInstrument.symbol,
        name: testInstrument.name,
        exchange: testInstrument.exch_seg,
        instrumentType: testInstrument.instrumenttype,
        expiry: testInstrument.expiry ? new Date(testInstrument.expiry) : null,
        strike: testInstrument.strike || null,
        lotSize: testInstrument.lotsize || null,
        tickSize: testInstrument.tick_size || null,
        exchSeg: testInstrument.exch_seg,
        lastUpdated: new Date(),
        isActive: true,
      },
      create: {
        token: testInstrument.token,
        symbol: testInstrument.symbol,
        name: testInstrument.name,
        exchange: testInstrument.exch_seg,
        instrumentType: testInstrument.instrumenttype,
        expiry: testInstrument.expiry ? new Date(testInstrument.expiry) : null,
        strike: testInstrument.strike || null,
        lotSize: testInstrument.lotsize || null,
        tickSize: testInstrument.tick_size || null,
        exchSeg: testInstrument.exch_seg,
        isActive: true,
      },
    });

    console.log('✅ Successfully inserted/updated instrument:', result);

    // Check total count
    const count = await prisma.symbol.count();
    console.log('📊 Total symbols in database:', count);

  } catch (error) {
    console.error('❌ Failed to insert instrument:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSingleInstrument();