-- CreateEnum
CREATE TYPE "ApiRequestType" AS ENUM ('frontend_to_backend', 'backend_to_broker');

-- CreateTable
CREATE TABLE "api_requests" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestType" "ApiRequestType" NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "body" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "statusCode" INTEGER,
    "responseHeaders" JSONB,
    "responseBody" TEXT,
    "error" TEXT,
    "isSuccessful" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "api_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_requests_requestId_key" ON "api_requests"("requestId");

-- AddForeignKey
ALTER TABLE "api_requests" ADD CONSTRAINT "api_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
