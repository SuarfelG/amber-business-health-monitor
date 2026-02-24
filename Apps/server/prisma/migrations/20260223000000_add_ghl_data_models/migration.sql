-- CreateTable
CREATE TABLE "GHLContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "source" TEXT,
    "ghlCreatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GHLContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GHLOpportunity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "contactId" TEXT,
    "name" TEXT NOT NULL,
    "pipelineId" TEXT,
    "pipelineStageId" TEXT,
    "status" TEXT NOT NULL,
    "monetaryValue" INTEGER,
    "ghlCreatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GHLOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GHLAppointment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "contactId" TEXT,
    "title" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "ghlCreatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GHLAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GHLContact_userId_externalId_key" ON "GHLContact"("userId", "externalId");

-- CreateIndex
CREATE INDEX "GHLContact_userId_idx" ON "GHLContact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GHLOpportunity_userId_externalId_key" ON "GHLOpportunity"("userId", "externalId");

-- CreateIndex
CREATE INDEX "GHLOpportunity_userId_ghlCreatedAt_idx" ON "GHLOpportunity"("userId", "ghlCreatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GHLAppointment_userId_externalId_key" ON "GHLAppointment"("userId", "externalId");

-- CreateIndex
CREATE INDEX "GHLAppointment_userId_startTime_idx" ON "GHLAppointment"("userId", "startTime");

-- AddForeignKey
ALTER TABLE "GHLContact" ADD CONSTRAINT "GHLContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GHLOpportunity" ADD CONSTRAINT "GHLOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GHLOpportunity" ADD CONSTRAINT "GHLOpportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "GHLContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GHLAppointment" ADD CONSTRAINT "GHLAppointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
