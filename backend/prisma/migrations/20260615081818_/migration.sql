/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `material_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "action_materials" ADD COLUMN     "snapshot" JSONB;

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "material_types" ADD COLUMN     "customAttributes" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_photos" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" INTEGER NOT NULL,
    "actionId" INTEGER,

    CONSTRAINT "location_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "location_photos_locationId_idx" ON "location_photos"("locationId");

-- CreateIndex
CREATE INDEX "location_photos_actionId_idx" ON "location_photos"("actionId");

-- CreateIndex
CREATE UNIQUE INDEX "material_types_code_key" ON "material_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "location_photos" ADD CONSTRAINT "location_photos_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_photos" ADD CONSTRAINT "location_photos_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
