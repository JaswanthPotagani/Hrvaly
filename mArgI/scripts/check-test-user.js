const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'e2e-test@example.com';
  const password = 'Password123!';

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, password: true, bannedAt: true, industry: true }
  });

  if (!user) {
    console.log('❌ Test user NOT found');
    return;
  }

  console.log('✅ Test user found:', user.email);
  console.log('   ID:', user.id);
  console.log('   Has password hash:', !!user.password);
  console.log('   Is banned:', !!user.bannedAt);
  console.log('   Has industry (onboarded):', !!user.industry);

  if (user.password) {
    const passwordMatches = await bcrypt.compare(password, user.password);
    console.log('   Password matches:', passwordMatches ? '✅' : '❌');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
