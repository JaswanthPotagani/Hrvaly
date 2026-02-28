const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Attempting to find first user and select monthlyUsage...");
    const user = await prisma.user.findFirst({
        select: {
            id: true,
            monthlyUsage: true
        }
    });
    console.log("Success! User found:", user);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
