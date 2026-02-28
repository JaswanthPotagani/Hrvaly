/*
  Warnings:

  - You are about to drop the column `clerkUserId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_clerkUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerkUserId",
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ALTER COLUMN "monthlyUsage" SET DEFAULT '{"interview": 0, "resume": 0, "coverLetter": 0, "voiceInterview": 0}';

-- CreateTable
CREATE TABLE "VoiceAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quizScore" DOUBLE PRECISION NOT NULL,
    "questions" JSONB[],
    "category" TEXT NOT NULL DEFAULT 'Voice',
    "improvementTip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCache" (
    "id" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizPool" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewType" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceQuestionPool" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceQuestionPool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceAssessment_userId_idx" ON "VoiceAssessment"("userId");

-- CreateIndex
CREATE INDEX "JobCache_industry_location_idx" ON "JobCache"("industry", "location");

-- CreateIndex
CREATE UNIQUE INDEX "JobCache_industry_location_key" ON "JobCache"("industry", "location");

-- CreateIndex
CREATE UNIQUE INDEX "QuizPool_userId_interviewType_key" ON "QuizPool"("userId", "interviewType");

-- CreateIndex
CREATE UNIQUE INDEX "VoiceQuestionPool_userId_industry_key" ON "VoiceQuestionPool"("userId", "industry");

-- AddForeignKey
ALTER TABLE "VoiceAssessment" ADD CONSTRAINT "VoiceAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizPool" ADD CONSTRAINT "QuizPool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceQuestionPool" ADD CONSTRAINT "VoiceQuestionPool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
