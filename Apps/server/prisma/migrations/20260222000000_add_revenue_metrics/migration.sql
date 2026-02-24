-- CreateTable
CREATE TABLE "RevenueMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL,
    "totalRevenue" INTEGER NOT NULL,
    "refundedRevenue" INTEGER NOT NULL,
    "netRevenue" INTEGER NOT NULL,
    "chargeCount" INTEGER NOT NULL,
    "refundCount" INTEGER NOT NULL,
    "customerCount" INTEGER NOT NULL,
    "newCustomerCount" INTEGER NOT NULL,
    "activeSubscriptions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevenueMetric_userId_periodStart_periodType_key" ON "RevenueMetric"("userId", "periodStart", "periodType");

-- CreateIndex
CREATE INDEX "RevenueMetric_userId_periodType_periodStart_idx" ON "RevenueMetric"("userId", "periodType", "periodStart");

-- AddForeignKey
ALTER TABLE "RevenueMetric" ADD CONSTRAINT "RevenueMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
