-- CreateTable
CREATE TABLE "ApiUsageDaily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "service" TEXT NOT NULL,
    "userId" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApiUsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApiUsageDaily_date_service_idx" ON "ApiUsageDaily"("date", "service");

-- CreateIndex
CREATE UNIQUE INDEX "ApiUsageDaily_date_service_userId_key" ON "ApiUsageDaily"("date", "service", "userId");
