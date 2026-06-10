/*
  Warnings:

  - You are about to drop the column `code` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `materials` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "locations" DROP COLUMN "code";

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "code";
