-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('MARKET', 'LIMIT');

-- AlterTable
ALTER TABLE "signals" ADD COLUMN     "limitPrice" DOUBLE PRECISION,
ADD COLUMN     "orderType" "PriceType" NOT NULL DEFAULT 'MARKET';
