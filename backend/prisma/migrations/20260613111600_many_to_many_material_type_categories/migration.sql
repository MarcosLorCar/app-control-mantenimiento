-- CreateTable
CREATE TABLE "_InfrastructureTypeToMaterialType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_InfrastructureTypeToMaterialType_AB_unique" ON "_InfrastructureTypeToMaterialType"("A", "B");

-- CreateIndex
CREATE INDEX "_InfrastructureTypeToMaterialType_B_index" ON "_InfrastructureTypeToMaterialType"("B");

-- AddForeignKey
ALTER TABLE "_InfrastructureTypeToMaterialType" ADD CONSTRAINT "_InfrastructureTypeToMaterialType_A_fkey" FOREIGN KEY ("A") REFERENCES "infrastructure_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InfrastructureTypeToMaterialType" ADD CONSTRAINT "_InfrastructureTypeToMaterialType_B_fkey" FOREIGN KEY ("B") REFERENCES "material_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copy existing data from one-to-many to the new many-to-many junction table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='material_types' AND column_name='infraTypeId'
    ) THEN
        -- Copy existing data
        INSERT INTO "_InfrastructureTypeToMaterialType" ("A", "B")
        SELECT "infraTypeId", "id" FROM "material_types" WHERE "infraTypeId" IS NOT NULL;

        -- Drop foreign key constraint if exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name='material_types_infraTypeId_fkey'
        ) THEN
            ALTER TABLE "material_types" DROP CONSTRAINT "material_types_infraTypeId_fkey";
        END IF;

        -- Drop column
        ALTER TABLE "material_types" DROP COLUMN "infraTypeId";
    END IF;
END $$;
