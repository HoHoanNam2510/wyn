-- AlterEnum
ALTER TYPE "ReviewMode" ADD VALUE 'srs';

-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "srsEaseFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "srsInterval" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "srsRepetitions" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Word_userId_nextReviewAt_idx" ON "Word"("userId", "nextReviewAt");
