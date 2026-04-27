-- CreateTable
CREATE TABLE "GrammarReviewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER NOT NULL,

    CONSTRAINT "GrammarReviewEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GrammarReviewEvent" ADD CONSTRAINT "GrammarReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarReviewEvent" ADD CONSTRAINT "GrammarReviewEvent_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "GrammarPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
