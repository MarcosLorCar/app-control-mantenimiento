-- AlterTable
ALTER TABLE "dependencies" ALTER COLUMN "code" DROP NOT NULL;

-- AlterTable
ALTER TABLE "infrastructures" ADD COLUMN     "infraTypeId" INTEGER,
ALTER COLUMN "code" DROP NOT NULL;

-- AlterTable
ALTER TABLE "materials" ALTER COLUMN "code" DROP NOT NULL;

-- AlterTable
ALTER TABLE "structures" ALTER COLUMN "code" DROP NOT NULL;

-- CreateTable
CREATE TABLE "infrastructure_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "infrastructure_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "infrastructure_types_name_key" ON "infrastructure_types"("name");

-- CreateIndex
CREATE INDEX "infrastructures_infraTypeId_idx" ON "infrastructures"("infraTypeId");

-- AddForeignKey
ALTER TABLE "infrastructures" ADD CONSTRAINT "infrastructures_infraTypeId_fkey" FOREIGN KEY ("infraTypeId") REFERENCES "infrastructure_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "dependencies_infrastructureId_parentId_code_key" RENAME TO "dependencies_infra_parent_code_key";
