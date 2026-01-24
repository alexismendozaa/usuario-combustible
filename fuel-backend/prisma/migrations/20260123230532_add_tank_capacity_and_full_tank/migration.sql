-- AlterTable
ALTER TABLE "Refuel" ADD COLUMN     "fullTank" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "tankCapacity" DECIMAL(5,2);
