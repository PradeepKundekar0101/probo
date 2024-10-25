/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `StockBalance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_userId_key" ON "StockBalance"("userId");
