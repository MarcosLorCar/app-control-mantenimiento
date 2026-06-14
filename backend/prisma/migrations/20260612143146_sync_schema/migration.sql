/*
  Warnings:

  - You are about to drop the column `typeId` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `serialNumber` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the `_ActionToMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `action_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `material_categories` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `infraTypeId` on table `locations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "MaterialOperation" AS ENUM ('INSTALL', 'UNINSTALL');

-- DropForeignKey
ALTER TABLE "_ActionToMaterial" DROP CONSTRAINT "_ActionToMaterial_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActionToMaterial" DROP CONSTRAINT "_ActionToMaterial_B_fkey";

-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_typeId_fkey";

-- DropForeignKey
ALTER TABLE "locations" DROP CONSTRAINT "locations_infraTypeId_fkey";

-- DropForeignKey
ALTER TABLE "material_categories" DROP CONSTRAINT "material_categories_materialTypeId_fkey";

-- AlterTable
ALTER TABLE "actions" DROP COLUMN "typeId";

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "type",
ALTER COLUMN "infraTypeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "materials" DROP COLUMN "serialNumber";

-- DropTable
DROP TABLE "_ActionToMaterial";

-- DropTable
DROP TABLE "action_types";

-- DropTable
DROP TABLE "material_categories";

-- DropEnum
DROP TYPE "DataType";

-- CreateTable
CREATE TABLE "fixed_properties" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STRING',

    CONSTRAINT "fixed_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_materials" (
    "actionId" INTEGER NOT NULL,
    "materialId" INTEGER NOT NULL,
    "operation" "MaterialOperation" NOT NULL,

    CONSTRAINT "action_materials_pkey" PRIMARY KEY ("actionId","materialId")
);

-- CreateIndex
CREATE UNIQUE INDEX "fixed_properties_code_key" ON "fixed_properties"("code");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_infraTypeId_fkey" FOREIGN KEY ("infraTypeId") REFERENCES "infrastructure_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_materials" ADD CONSTRAINT "action_materials_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_materials" ADD CONSTRAINT "action_materials_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
