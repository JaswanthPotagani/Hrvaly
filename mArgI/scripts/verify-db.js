const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function verify() {
  const prisma = new PrismaClient();
  console.log("--- mArgI Database Verification ---");
  try {
    await prisma.$connect();
    console.log("✅ Connection: Success");
    
    const userCount = await prisma.user.count();
    console.log(`✅ Table Check (User): ${userCount} records found`);
    
    // Check for another important table if necessary
    // const insightCount = await prisma.industryInsight.count();
    // console.log(`✅ Table Check (Insights): ${insightCount} records found`);

    console.log("-----------------------------------");
    console.log("Database is ready and reachable via Prisma.");
  } catch (err) {
    console.error("❌ Verification Failed:");
    console.error(err.message);
    if (err.message.includes("P1001")) {
      console.error("Diagnosis: Can't reach database. Check your internet connection or Neon status.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

verify();
