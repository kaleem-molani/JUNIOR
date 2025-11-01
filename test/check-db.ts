// check-db.ts
import { prisma } from '../lib/prisma';
import { InstrumentService } from '../lib/services/instrument-service';

async function checkDatabase() {
  try {
    console.log('🔍 Checking database state...\n');

    // Count total symbols
    const totalCount = await prisma.symbol.count();
    console.log('📊 Total symbols in database:', totalCount);

    // Count active symbols
    const activeCount = await prisma.symbol.count({
      where: { isActive: true }
    });
    console.log('📊 Active symbols:', activeCount);

    // Test search
    const service = new InstrumentService();
    const searchResults = await service.searchSymbols('RELIANCE', 3);
    console.log('🔍 RELIANCE search results (NSE default):', searchResults.length);
    if (searchResults.length > 0) {
      console.log('Sample RELIANCE result:', searchResults[0]);
    }

    // Test exchange filter
    const bseResults = await service.searchSymbols('RELIANCE', 3, 'BSE');
    console.log('🔍 RELIANCE search results (BSE):', bseResults.length);
    if (bseResults.length > 0) {
      console.log('Sample BSE result:', bseResults[0]);
    }

    // Check some popular symbols
    const popularSymbols = ['TCS', 'INFY', 'HDFC', 'ICICI', 'SBIN'];
    for (const symbol of popularSymbols) {
      const results = await service.searchSymbols(symbol, 1);
      console.log(`🔍 ${symbol}: ${results.length} results`);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();