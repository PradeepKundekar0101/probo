/*
  Warnings:

  - You are about to drop the column `categoryType` on the `markets` table. All the data in the column will be lost.
  - The `result` column on the `markets` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "markets" DROP COLUMN "categoryType",
ADD COLUMN     "numberOfTraders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sourceOfTruth" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '',
DROP COLUMN "result",
ADD COLUMN     "result" TEXT;
