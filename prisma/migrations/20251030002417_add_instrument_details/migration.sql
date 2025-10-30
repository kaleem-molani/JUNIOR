/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `symbols` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "symbols_symbol_key";

-- AlterTable
ALTER TABLE "signals" ADD COLUMN     "symbolId" TEXT;

-- AlterTable
ALTER TABLE "symbols" ADD COLUMN     "exchSeg" TEXT,
ADD COLUMN     "expiry" TIMESTAMP(3),
ADD COLUMN     "instrumentType" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lotSize" INTEGER,
ADD COLUMN     "strike" DOUBLE PRECISION,
ADD COLUMN     "tickSize" DOUBLE PRECISION,
ADD COLUMN     "token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "symbols_token_key" ON "symbols"("token");

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "symbols"("id") ON DELETE SET NULL ON UPDATE CASCADE;
