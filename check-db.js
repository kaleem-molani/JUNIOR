import { prisma } from './lib/prisma';

async function checkSymbols() {
  try {
    // Check total count
    const totalCount = await prisma.symbol.count();
    console.log('Total symbols in database:', totalCount);

    // Check YESBANK variants
    const yesbankSymbols = await prisma.symbol.findMany({
      where: {
        symbol: {
          contains: 'YESBANK'
        }
      },
      select: {
        symbol: true,
        token: true,
        exchange: true,
        exchSeg: true,
        instrumentType: true,
      }
    });

    console.log('YESBANK symbols found:', yesbankSymbols.length);
    yesbankSymbols.forEach(sym => {
      console.log('YESBANK:', sym);
    });

    // Check sample of NSE equity symbols
    const nseEquitySymbols = await prisma.symbol.findMany({
      where: {
        exchange: 'NSE',
        instrumentType: 'EQ'
      },
      select: {
        symbol: true,
        token: true,
        exchange: true,
        instrumentType: true,
      },
      take: 10
    });

    console.log('Sample NSE equity symbols:');
    nseEquitySymbols.forEach(sym => {
      console.log(sym);
    });

    // Check what instrument types exist for NSE
    const nseTypes = await prisma.symbol.groupBy({
      by: ['instrumentType'],
      where: {
        exchange: 'NSE'
      },
      _count: {
        instrumentType: true
      }
    });

    console.log('NSE instrument types:');
    nseTypes.forEach(type => {
      console.log(`${type.instrumentType}: ${type._count.instrumentType}`);
    });

    // Check total NSE count
    const nseCount = await prisma.symbol.count({
      where: { exchange: 'NSE' }
    });
    console.log('Total NSE symbols:', nseCount);

    // Check if YESBANK-EQ exists
    const yesbankEq = await prisma.symbol.findFirst({
      where: {
        symbol: 'YESBANK-EQ'
      }
    });

    console.log('YESBANK-EQ exists:', !!yesbankEq);
    if (yesbankEq) {
      console.log('YESBANK-EQ details:', yesbankEq);
    }

  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSymbols();