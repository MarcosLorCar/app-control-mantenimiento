-- AlterTable
ALTER TABLE "infrastructures" ADD COLUMN     "infra_type_id" INTEGER;

-- CreateTable
CREATE TABLE "infrastructure_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "infrastructure_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "infrastructure_types_name_key" ON "infrastructure_types"("name");

-- CreateIndex
CREATE INDEX "infrastructures_infra_type_id_idx" ON "infrastructures"("infra_type_id");

-- AddForeignKey
ALTER TABLE "infrastructures" ADD CONSTRAINT "infrastructures_infra_type_id_fkey" FOREIGN KEY ("infra_type_id") REFERENCES "infrastructure_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
