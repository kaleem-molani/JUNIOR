-- CreateTable
CREATE TABLE "angel_one_profiles" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "clientcode" TEXT,
    "name" TEXT,
    "email" TEXT,
    "mobileno" TEXT,
    "exchanges" TEXT[],
    "products" TEXT[],
    "lastlogin" TIMESTAMP(3),
    "brokerid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "angel_one_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "angel_one_profiles_accountId_key" ON "angel_one_profiles"("accountId");

-- AddForeignKey
ALTER TABLE "angel_one_profiles" ADD CONSTRAINT "angel_one_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
