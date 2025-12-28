-- CreateTable
CREATE TABLE "Refuel" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "filledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "odometerKm" INTEGER NOT NULL,
    "liters" DECIMAL(65,30) NOT NULL,
    "totalCost" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "lat" DECIMAL(65,30),
    "lng" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refuel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Refuel_userId_idx" ON "Refuel"("userId");

-- CreateIndex
CREATE INDEX "Refuel_vehicleId_idx" ON "Refuel"("vehicleId");

-- CreateIndex
CREATE INDEX "Refuel_filledAt_idx" ON "Refuel"("filledAt");

-- AddForeignKey
ALTER TABLE "Refuel" ADD CONSTRAINT "Refuel_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refuel" ADD CONSTRAINT "Refuel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
