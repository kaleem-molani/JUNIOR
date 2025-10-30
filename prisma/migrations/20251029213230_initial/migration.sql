-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "Action" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('INTRADAY', 'DELIVERY');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'executed', 'failed');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('info', 'warn', 'error');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "apiKey" VARCHAR(255) NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "userPin" VARCHAR(10) NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3),

    CONSTRAINT "trading_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "action" "Action" NOT NULL,
    "type" "OrderType" NOT NULL,
    "broadcastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL DEFAULT 'pending',

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "brokerOrderId" TEXT,
    "status" "Status" NOT NULL DEFAULT 'pending',
    "executedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbols" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symbols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagged_symbols" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbolId" TEXT NOT NULL,
    "taggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tagged_symbols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" "LogLevel" NOT NULL,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "symbols_symbol_key" ON "symbols"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "tagged_symbols_userId_symbolId_key" ON "tagged_symbols"("userId", "symbolId");

-- AddForeignKey
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "trading_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagged_symbols" ADD CONSTRAINT "tagged_symbols_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tagged_symbols" ADD CONSTRAINT "tagged_symbols_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "symbols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
