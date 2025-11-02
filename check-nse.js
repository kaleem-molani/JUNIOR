import { prisma } from './lib/prisma';

async function checkNSEEquities() {
  try {
    const count = await prisma.symbol.count({
      where: {
        exchange: 'NSE',
        instrumentType: ''
      }
    });

    console.log('NSE equities (empty instrumentType):', count);

  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNSEEquities();