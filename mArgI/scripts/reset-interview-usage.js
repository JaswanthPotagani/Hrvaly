/**
 * Script to reset interview usage counter for a user
 * Usage: node scripts/reset-interview-usage.js <userId>
 */

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function resetUsage() {
    const userId = process.argv[2];
    
    if (!userId) {
        console.error('Error: Please provide a userId');
        console.log('Usage: node scripts/reset-interview-usage.js <userId>');
        process.exit(1);
    }

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { 
                email: true, 
                monthlyUsage: true,
                plan: true 
            }
        });

        if (!user) {
            console.error(`Error: User with ID ${userId} not found`);
            process.exit(1);
        }

        console.log('Current user:', user.email);
        console.log('Current plan:', user.plan);
        console.log('Current usage:', user.monthlyUsage);

        // Reset interview usage to 0
        const updated = await db.user.update({
            where: { id: userId },
            data: {
                monthlyUsage: {
                    ...user.monthlyUsage,
                    interview: 0
                }
            }
        });

        console.log('\n✅ Successfully reset interview usage to 0');
        console.log('New usage:', updated.monthlyUsage);

    } catch (error) {
        console.error('Error resetting usage:', error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

resetUsage();
