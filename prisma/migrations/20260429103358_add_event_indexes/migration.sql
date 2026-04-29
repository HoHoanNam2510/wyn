-- CreateIndex
CREATE INDEX "GrammarReviewEvent_userId_reviewedAt_idx" ON "GrammarReviewEvent"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "IdiomReviewEvent_userId_reviewedAt_idx" ON "IdiomReviewEvent"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "ReviewEvent_userId_reviewedAt_idx" ON "ReviewEvent"("userId", "reviewedAt");
