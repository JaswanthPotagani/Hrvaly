import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Checking database state...\n');
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        industry: true,
        location: true
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.email}: industry="${user.industry}", location="${user.location}"`);
    });

    // Check industry insights
    const insights = await prisma.industryInsight.findMany({
      select: {
        id: true,
        industry: true,
        location: true
      }
    });

    console.log(`\nFound ${insights.length} industry insights:`);
    insights.forEach(insight => {
      console.log(`  - industry="${insight.industry}", location="${insight.location}"`);
    });

    // Find mismatches
    console.log('\n--- Checking for mismatches ---');
    const mismatches = users.filter(user => {
      if (!user.industry || !user.location) {
        console.log(`⚠ User ${user.email} has null industry or location`);
        return true;
      }
      
      const hasMatchingInsight = insights.some(
        insight => insight.industry === user.industry && insight.location === user.location
      );
      
      if (!hasMatchingInsight) {
        console.log(`⚠ User ${user.email} has industry="${user.industry}", location="${user.location}" but no matching IndustryInsight exists`);
        return true;
      }
      
      return false;
    });

    if (mismatches.length === 0) {
      console.log('✓ All users have matching industry insights!');
    } else {
      console.log(`\n❌ Found ${mismatches.length} users with missing industry insights`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
