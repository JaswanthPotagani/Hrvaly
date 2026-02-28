const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'e2e-test@example.com' },
    select: { email: true, industry: true, plan: true }
  });
  console.log('USER_CHECK_RESULT:', JSON.stringify(user));
}
main().finally(() => prisma.$disconnect());
