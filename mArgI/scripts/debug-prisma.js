const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Prisma Models...");
    const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$'));
    console.log("Available Models:", models);
    
    if (models.includes('voiceQuestionPool')) {
        console.log("SUCCESS: voiceQuestionPool is available!");
    } else {
        console.log("FAILURE: voiceQuestionPool is MISSING.");
    }
}

main()
    .catch(e => {
        console.error("Error running diagnostic:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
