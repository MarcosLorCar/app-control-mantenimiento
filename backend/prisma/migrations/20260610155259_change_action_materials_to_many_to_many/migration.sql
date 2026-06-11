/*
  Warnings:

  - You are about to drop the column `materialId` on the `actions` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_materialId_fkey";

-- DropIndex
DROP INDEX "actions_materialId_idx";

-- AlterTable
ALTER TABLE "actions" DROP COLUMN "materialId";

-- CreateTable
CREATE TABLE "_ActionToMaterial" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ActionToMaterial_AB_unique" ON "_ActionToMaterial"("A", "B");

-- CreateIndex
CREATE INDEX "_ActionToMaterial_B_index" ON "_ActionToMaterial"("B");

-- AddForeignKey
ALTER TABLE "_ActionToMaterial" ADD CONSTRAINT "_ActionToMaterial_A_fkey" FOREIGN KEY ("A") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActionToMaterial" ADD CONSTRAINT "_ActionToMaterial_B_fkey" FOREIGN KEY ("B") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
