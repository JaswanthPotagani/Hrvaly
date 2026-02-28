const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 5,
    select: { email: true, name: true }
  });
  console.log('USERS:', JSON.stringify(users));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
