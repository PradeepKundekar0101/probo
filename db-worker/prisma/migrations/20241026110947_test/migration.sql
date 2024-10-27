/*
  Warnings:

  - You are about to drop the column `symbol` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `StockBalance` table. All the data in the column will be lost.
  - The primary key for the `markets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `symbol` on the `markets` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `markets` table. All the data in the column will be lost.
  - You are about to drop the `StockSymbol` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `marketId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marketId` to the `StockBalance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `markets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryType` to the `markets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_symbol_fkey";

-- DropForeignKey
ALTER TABLE "StockBalance" DROP CONSTRAINT "StockBalance_symbol_fkey";

-- DropForeignKey
ALTER TABLE "markets" DROP CONSTRAINT "markets_symbol_fkey";

-- DropIndex
DROP INDEX "StockBalance_symbol_key";

-- DropIndex
DROP INDEX "StockBalance_userId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "symbol",
ADD COLUMN     "marketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StockBalance" DROP COLUMN "symbol",
ADD COLUMN     "marketId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "markets" DROP CONSTRAINT "markets_pkey",
DROP COLUMN "symbol",
DROP COLUMN "title",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "categoryType" TEXT NOT NULL,
ADD COLUMN     "stockSymbol" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "thumbnail" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "markets_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "markets_id_seq";

-- DropTable
DROP TABLE "StockSymbol";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StockBalance" ADD CONSTRAINT "StockBalance_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "markets" ADD CONSTRAINT "markets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
