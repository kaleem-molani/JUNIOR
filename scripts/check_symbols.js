const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.symbol.count();
    console.log('symbols:', count);
    const sample = await prisma.symbol.findMany({ take: 5 });
    console.log('sample:', sample);
  } catch (e) {
    console.error('error:', e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();