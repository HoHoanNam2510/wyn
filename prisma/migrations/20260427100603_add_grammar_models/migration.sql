-- CreateTable
CREATE TABLE "GrammarSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "GrammarSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarPattern" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "formula" JSONB NOT NULL,
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "GrammarPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarExample" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "userId" TEXT,
    "sentence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarExample_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GrammarPattern" ADD CONSTRAINT "GrammarPattern_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "GrammarSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarExample" ADD CONSTRAINT "GrammarExample_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "GrammarPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarExample" ADD CONSTRAINT "GrammarExample_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
