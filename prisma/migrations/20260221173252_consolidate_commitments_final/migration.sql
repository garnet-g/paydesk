/*
  Warnings:

  - You are about to drop the column `commitmentDate` on the `PaymentCommitment` table. All the data in the column will be lost.
  - You are about to drop the column `fulfilledAt` on the `PaymentCommitment` table. All the data in the column will be lost.
  - Added the required column `frequency` to the `PaymentCommitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `PaymentCommitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `PaymentCommitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `PaymentCommitment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PaymentCommitment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PaymentCommitment" DROP CONSTRAINT "PaymentCommitment_invoiceId_fkey";

-- DropIndex
DROP INDEX "PaymentCommitment_invoiceId_idx";

-- DropIndex
DROP INDEX "PaymentCommitment_status_idx";

-- AlterTable
ALTER TABLE "PaymentCommitment" DROP COLUMN "commitmentDate",
DROP COLUMN "fulfilledAt",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "frequency" TEXT NOT NULL,
ADD COLUMN     "schoolId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "invoiceId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "PaymentCommitment_studentId_idx" ON "PaymentCommitment"("studentId");

-- CreateIndex
CREATE INDEX "PaymentCommitment_schoolId_idx" ON "PaymentCommitment"("schoolId");

-- AddForeignKey
ALTER TABLE "PaymentCommitment" ADD CONSTRAINT "PaymentCommitment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCommitment" ADD CONSTRAINT "PaymentCommitment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCommitment" ADD CONSTRAINT "PaymentCommitment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
