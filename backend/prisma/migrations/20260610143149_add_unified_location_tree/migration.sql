/*
  Warnings:

  - You are about to drop the column `dependencyId` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `infrastructureId` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `dependencyId` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `infrastructureId` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the `dependencies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `infrastructures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `structures` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_dependencyId_fkey";

-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_infrastructureId_fkey";

-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_materialId_fkey";

-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_structureId_fkey";

-- DropForeignKey
ALTER TABLE "dependencies" DROP CONSTRAINT "dependencies_infrastructureId_fkey";

-- DropForeignKey
ALTER TABLE "dependencies" DROP CONSTRAINT "dependencies_parentId_fkey";

-- DropForeignKey
ALTER TABLE "infrastructures" DROP CONSTRAINT "infrastructures_infraTypeId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_dependencyId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_infrastructureId_fkey";

-- DropForeignKey
ALTER TABLE "materials" DROP CONSTRAINT "materials_structureId_fkey";

-- DropForeignKey
ALTER TABLE "structures" DROP CONSTRAINT "structures_dependencyId_fkey";

-- DropForeignKey
ALTER TABLE "structures" DROP CONSTRAINT "structures_infrastructureId_fkey";

-- DropIndex
DROP INDEX "actions_dependencyId_idx";

-- DropIndex
DROP INDEX "actions_infrastructureId_idx";

-- DropIndex
DROP INDEX "actions_structureId_idx";

-- DropIndex
DROP INDEX "idx_material_attributes";

-- DropIndex
DROP INDEX "materials_dependencyId_idx";

-- DropIndex
DROP INDEX "materials_infrastructureId_idx";

-- DropIndex
DROP INDEX "materials_structureId_idx";

-- AlterTable
ALTER TABLE "actions" DROP COLUMN "dependencyId",
DROP COLUMN "infrastructureId",
DROP COLUMN "structureId",
ADD COLUMN     "locationId" INTEGER;

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "dependencyId",
DROP COLUMN "infrastructureId",
DROP COLUMN "structureId",
ADD COLUMN     "locationId" INTEGER;

-- DropTable
DROP TABLE "dependencies";

-- DropTable
DROP TABLE "infrastructures";

-- DropTable
DROP TABLE "structures";

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "path" TEXT NOT NULL DEFAULT '/',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "infraTypeId" INTEGER,
    "parentId" INTEGER,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "locations_parentId_idx" ON "locations"("parentId");

-- CreateIndex
CREATE INDEX "locations_path_idx" ON "locations"("path");

-- CreateIndex
CREATE INDEX "locations_infraTypeId_idx" ON "locations"("infraTypeId");

-- CreateIndex
CREATE INDEX "actions_locationId_idx" ON "actions"("locationId");

-- CreateIndex
CREATE INDEX "materials_locationId_idx" ON "materials"("locationId");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_infraTypeId_fkey" FOREIGN KEY ("infraTypeId") REFERENCES "infrastructure_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
