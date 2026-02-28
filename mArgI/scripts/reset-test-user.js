const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'e2e-test@example.com';
  console.log(`Resetting onboarding status for ${email}...`);
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        industry: null,
        // Optional: you can reset other fields if needed
      }
    });
    console.log(`Successfully reset ${user.email}. Industry is now ${user.industry}.`);
  } catch (error) {
    console.error('Failed to reset test user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
