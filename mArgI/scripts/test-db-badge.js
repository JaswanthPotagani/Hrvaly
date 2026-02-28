const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Connecting to database...');
  try {
    const badges = await prisma.verificationBadge.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { uniqueShareableId: true, userId: true }
    });

    console.log(`Found ${badges.length} badges.`);
    badges.forEach(b => {
      console.log(`- ID: '${b.uniqueShareableId}'  (Length: ${b.uniqueShareableId.length})`);
    });

    if (badges.length > 0) {
      const testId = badges[0].uniqueShareableId;
      const testIdWithSpace = '  ' + testId + '  ';
      console.log(`\nSimulating lookup with spaces: '${testIdWithSpace}'`);
      
      const cleanId = testIdWithSpace.trim();
      console.log(`Cleaned ID: '${cleanId}'`);
      
      const found = await prisma.verificationBadge.findUnique({
        where: { uniqueShareableId: cleanId }
      });
      
      console.log('Lookup result:', found ? 'SUCCESS' : 'FAILED');
    } else {
      console.log('No badges found to test.');
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
