-- CreateTable
CREATE TABLE "IdiomCategory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "IdiomCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idiom" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "register" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Idiom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdiomExample" (
    "id" TEXT NOT NULL,
    "idiomId" TEXT NOT NULL,
    "userId" TEXT,
    "sentence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdiomExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdiomReviewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idiomId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER NOT NULL,

    CONSTRAINT "IdiomReviewEvent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Idiom" ADD CONSTRAINT "Idiom_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IdiomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdiomExample" ADD CONSTRAINT "IdiomExample_idiomId_fkey" FOREIGN KEY ("idiomId") REFERENCES "Idiom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdiomExample" ADD CONSTRAINT "IdiomExample_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdiomReviewEvent" ADD CONSTRAINT "IdiomReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdiomReviewEvent" ADD CONSTRAINT "IdiomReviewEvent_idiomId_fkey" FOREIGN KEY ("idiomId") REFERENCES "Idiom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
