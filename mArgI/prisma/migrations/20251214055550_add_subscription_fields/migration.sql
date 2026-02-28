/*
  Warnings:

  - A unique constraint covering the columns `[industry,location]` on the table `IndustryInsight` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpaySubscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `location` to the `IndustryInsight` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_industry_fkey";

-- DropIndex
DROP INDEX "IndustryInsight_industry_key";

-- DropIndex
DROP INDEX "Resume_userId_key";

-- AlterTable
ALTER TABLE "CoverLetter" ADD COLUMN     "inputHash" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'generated';

-- AlterTable
ALTER TABLE "IndustryInsight" ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "salaryCurrency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "salaryFrequency" TEXT NOT NULL DEFAULT 'Lakhs';

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "inputHash" TEXT,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'My Resume';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branch" TEXT,
ADD COLUMN     "college" TEXT,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "currentYear" INTEGER,
ADD COLUMN     "degree" TEXT,
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "isGraduated" BOOLEAN,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "monthlyUsage" JSONB NOT NULL DEFAULT '{"interview": 0, "resume": 0, "coverLetter": 0}',
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN     "razorpayCustomerId" TEXT,
ADD COLUMN     "razorpaySubscriptionId" TEXT,
ADD COLUMN     "userType" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IndustryInsight_industry_location_key" ON "IndustryInsight"("industry", "location");

-- CreateIndex
CREATE UNIQUE INDEX "User_razorpaySubscriptionId_key" ON "User"("razorpaySubscriptionId");
