-- CreateTable
CREATE TABLE "CRMMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL,
    "newLeads" INTEGER NOT NULL,
    "totalLeads" INTEGER NOT NULL,
    "appointmentsBooked" INTEGER NOT NULL,
    "appointmentsShowed" INTEGER NOT NULL,
    "appointmentsNoShow" INTEGER NOT NULL,
    "showRate" DOUBLE PRECISION NOT NULL,
    "opportunitiesWon" INTEGER NOT NULL,
    "opportunitiesLost" INTEGER NOT NULL,
    "pipelineValue" INTEGER NOT NULL,
    "wonValue" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CRMMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CRMMetric_userId_periodStart_periodType_key" ON "CRMMetric"("userId", "periodStart", "periodType");

-- CreateIndex
CREATE INDEX "CRMMetric_userId_periodType_periodStart_idx" ON "CRMMetric"("userId", "periodType", "periodStart");

-- AddForeignKey
ALTER TABLE "CRMMetric" ADD CONSTRAINT "CRMMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
