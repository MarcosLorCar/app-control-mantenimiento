/*
  Warnings:

  - You are about to drop the column `status_id` on the `infrastructures` table. All the data in the column will be lost.
  - You are about to drop the `infra_statuses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "infrastructures" DROP CONSTRAINT "infrastructures_status_id_fkey";

-- AlterTable
ALTER TABLE "infrastructures" DROP COLUMN "status_id";

-- DropTable
DROP TABLE "infra_statuses";
