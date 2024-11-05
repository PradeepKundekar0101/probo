/*
  Warnings:

  - You are about to alter the column `userId` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Added the required column `stockSymbol` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tradedQuantity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `stockType` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_marketId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stockSymbol" TEXT NOT NULL,
ADD COLUMN     "tradedQuantity" INTEGER NOT NULL,
ALTER COLUMN "userId" SET DATA TYPE VARCHAR(255),
DROP COLUMN "stockType",
ADD COLUMN     "stockType" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- DropEnum
DROP TYPE "OrderStatus";
