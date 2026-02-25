/*
  Warnings:

  - A unique constraint covering the columns `[transactionRef]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Payment_schoolId_transactionRef_key";

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "billingCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "currentTerm" TEXT DEFAULT 'Term 1',
ADD COLUMN     "currentYear" TEXT,
ADD COLUMN     "lastBillingNotification" TIMESTAMP(3),
ADD COLUMN     "motto" TEXT,
ADD COLUMN     "mpesaPaybill" TEXT,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "planStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "planTier" TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN     "subscriptionFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionRef" TEXT,
    "phoneNumber" TEXT,
    "checkoutRequestID" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImpersonationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_transactionRef_key" ON "SubscriptionPayment"("transactionRef");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_checkoutRequestID_key" ON "SubscriptionPayment"("checkoutRequestID");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_schoolId_idx" ON "SubscriptionPayment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationToken_token_key" ON "ImpersonationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionRef_key" ON "Payment"("transactionRef");

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
