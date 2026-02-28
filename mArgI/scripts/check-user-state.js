const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const email = 'e2e-test@example.com';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, industry: true, plan: true }
  });
  console.log('USER_CHECK_RESULT:' + JSON.stringify(user));
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
