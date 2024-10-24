/*
  Warnings:

  - You are about to drop the column `no` on the `markets` table. All the data in the column will be lost.
  - You are about to drop the column `yes` on the `markets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "markets" DROP COLUMN "no",
DROP COLUMN "yes";
