/*
  Warnings:

  - You are about to drop the column `lastlogin` on the `angel_one_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "angel_one_profiles" DROP COLUMN "lastlogin",
ADD COLUMN     "bankaccno" TEXT,
ADD COLUMN     "bankbranch" TEXT,
ADD COLUMN     "bankname" TEXT,
ADD COLUMN     "bankpincode" TEXT,
ADD COLUMN     "dematid" TEXT,
ADD COLUMN     "lastlogintime" TEXT,
ADD COLUMN     "panno" TEXT;
