-- AlterTable
ALTER TABLE "Resume" ADD COLUMN "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT,
ALTER COLUMN "clerkUserId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "employerLogo" TEXT,
    "jobApplyLink" TEXT,
    "resumeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
