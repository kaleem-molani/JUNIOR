-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isExecutionEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "primaryBroker" TEXT,
ADD COLUMN     "restrictedSymbols" TEXT[] DEFAULT ARRAY[]::TEXT[];
