import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function backfillLocations() {
  try {
    console.log('Starting location backfill...');
    
    // Find all users without a location
    const usersWithoutLocation = await prisma.user.findMany({
      where: {
        location: null
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log(`Found ${usersWithoutLocation.length} users without location\n`);

    if (usersWithoutLocation.length === 0) {
      console.log('No users to update. Exiting.');
      rl.close();
      return;
    }

    // Ask for location for each user
    for (const user of usersWithoutLocation) {
      console.log(`\nUser: ${user.name || 'Unknown'} (${user.email})`);
      const location = await askQuestion('Enter location for this user: ');
      
      if (location && location.trim()) {
        await prisma.user.update({
          where: { id: user.id },
          data: { location: location.trim() }
        });
        console.log(`✓ Updated ${user.email} with location: ${location.trim()}`);
      } else {
        console.log(`⚠ Skipped ${user.email} (no location provided)`);
      }
    }

    console.log('\n✓ Backfill completed successfully!');
    
  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

backfillLocations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
