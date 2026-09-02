-- CreateEnum
CREATE TYPE "AnimalType" AS ENUM ('DOG', 'CAT', 'OTHER');
CREATE TYPE "PointStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "PointReportType" AS ENUM ('STILL_HERE', 'NOT_FOUND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StrayPoint" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "animalType" "AnimalType" NOT NULL,
    "estimatedCount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "usualTime" TEXT,
    "status" "PointStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StrayPoint_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StrayPoint_estimatedCount_check" CHECK ("estimatedCount" >= 1),
    CONSTRAINT "StrayPoint_latitude_check" CHECK ("latitude" >= -90 AND "latitude" <= 90),
    CONSTRAINT "StrayPoint_longitude_check" CHECK ("longitude" >= -180 AND "longitude" <= 180)
);

CREATE TABLE "PointImage" (
    "id" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Feeding" (
    "id" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "imageUrl" TEXT,
    "fedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feeding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PointReport" (
    "id" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PointReportType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointReport_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "StrayPoint_status_idx" ON "StrayPoint"("status");
CREATE INDEX "StrayPoint_latitude_longitude_idx" ON "StrayPoint"("latitude", "longitude");
CREATE INDEX "StrayPoint_createdByUserId_idx" ON "StrayPoint"("createdByUserId");
CREATE INDEX "StrayPoint_createdAt_idx" ON "StrayPoint"("createdAt");
CREATE INDEX "PointImage_pointId_idx" ON "PointImage"("pointId");
CREATE INDEX "Feeding_pointId_fedAt_idx" ON "Feeding"("pointId", "fedAt" DESC);
CREATE INDEX "Feeding_userId_fedAt_idx" ON "Feeding"("userId", "fedAt" DESC);
CREATE INDEX "PointReport_pointId_createdAt_idx" ON "PointReport"("pointId", "createdAt" DESC);
CREATE INDEX "PointReport_userId_idx" ON "PointReport"("userId");

-- Foreign keys
ALTER TABLE "StrayPoint" ADD CONSTRAINT "StrayPoint_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointImage" ADD CONSTRAINT "PointImage_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "StrayPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Feeding" ADD CONSTRAINT "Feeding_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "StrayPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Feeding" ADD CONSTRAINT "Feeding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointReport" ADD CONSTRAINT "PointReport_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "StrayPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointReport" ADD CONSTRAINT "PointReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
