import { PrismaClient } from '@prisma/client';

async function checkSymbols() {
  const prisma = new PrismaClient();

  try {
    const relianceSymbols = await prisma.symbol.findMany({
      where: {
        OR: [
          { symbol: { contains: 'RELIANCE', mode: 'insensitive' } },
          { name: { contains: 'RELIANCE', mode: 'insensitive' } }
        ],
        exchange: 'NSE'
      },
      select: {
        id: true,
        token: true,
        symbol: true,
        name: true,
        exchange: true,
        instrumentType: true,
        isActive: true
      },
      take: 10
    });

    console.log('RELIANCE symbols in database:');
    console.log(JSON.stringify(relianceSymbols, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSymbols();