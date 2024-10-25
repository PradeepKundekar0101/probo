/*
  Warnings:

  - A unique constraint covering the columns `[symbol]` on the table `StockBalance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StockBalance_symbol_key" ON "StockBalance"("symbol");