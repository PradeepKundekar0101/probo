/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `InrBalance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InrBalance_userId_key" ON "InrBalance"("userId");
