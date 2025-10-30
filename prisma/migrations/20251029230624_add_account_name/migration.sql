/*
  Warnings:

  - Added the required column `name` to the `trading_accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trading_accounts" ADD COLUMN     "name" TEXT NOT NULL;
