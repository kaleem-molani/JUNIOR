import { PrismaClient } from '@prisma/client';

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    const count = await prisma.symbol.count();
    console.log('Total symbols:', count);

    const idea = await prisma.symbol.findFirst({
      where: { symbol: 'IDEA-EQ' }
    });
    console.log('IDEA-EQ:', idea);

    const token14366 = await prisma.symbol.findFirst({
      where: { token: '14366' }
    });
    console.log('Token 14366:', token14366);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
