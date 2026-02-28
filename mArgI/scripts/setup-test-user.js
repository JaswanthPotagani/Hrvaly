const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'e2e-test@example.com';
  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, bannedAt: null, industry: 'Technology' },
    create: {
      email,
      name: 'E2E Tester',
      password: hashedPassword,
      plan: 'FREE',
      industry: 'Technology',
    },
  });

  console.log(`Test user created/updated: ${user.email}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
