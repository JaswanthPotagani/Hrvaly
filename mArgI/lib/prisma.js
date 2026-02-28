import { validatedEnv } from "@/lib/env";
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  const connectionString = validatedEnv.DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("CRITICAL: DATABASE_URL is not defined!");
    throw new Error("DATABASE_URL is not defined in environment variables.");
  }

  console.log("Initializing standard Prisma Client...");
  return new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
};

const globalForPrisma = globalThis;

const db = globalForPrisma.prisma ?? prismaClientSingleton();

export { db };
export default db;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
