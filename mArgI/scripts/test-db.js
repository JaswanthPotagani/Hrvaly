const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testConnection() {
  const prisma = new PrismaClient();
  const connectionString = process.env.DATABASE_URL;
  console.log("Attempting to connect to database...");
  
  try {
    // Attempt to connect and run a simple query
    await prisma.$connect();
    console.log("Success! Connected to the database.");
    
    // Check if we can reach the User table as a proxy for schema health
    const userCount = await prisma.user.count();
    console.log(`Database reachable. Total users: ${userCount}`);
    
    await prisma.$disconnect();
  } catch (err) {
    console.error("Connection failed:", err.message);
    if (err.message.includes("Can't reach database server")) {
       console.log("Diagnosis: This looks like a network or firewall issue.");
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
