-- AlterTable
ALTER TABLE "actions" ALTER COLUMN "materialId" DROP NOT NULL,
ADD COLUMN "infrastructureId" INTEGER,
ADD COLUMN "dependencyId" INTEGER,
ADD COLUMN "structureId" INTEGER,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "actions_infrastructureId_idx" ON "actions"("infrastructureId");
CREATE INDEX "actions_dependencyId_idx" ON "actions"("dependencyId");
CREATE INDEX "actions_structureId_idx" ON "actions"("structureId");

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_infrastructureId_fkey" FOREIGN KEY ("infrastructureId") REFERENCES "infrastructures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "actions" ADD CONSTRAINT "actions_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "dependencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "actions" ADD CONSTRAINT "actions_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ==================== CUSTOM CHECK CONSTRAINTS & INDEXES ====================

-- Actions: exactly one target (XOR check for material, infrastructure, dependency, or structure)
ALTER TABLE "actions" ADD CONSTRAINT action_single_target CHECK (
  ("materialId" IS NOT NULL)::int +
  ("infrastructureId" IS NOT NULL)::int +
  ("dependencyId" IS NOT NULL)::int +
  ("structureId" IS NOT NULL)::int = 1
);

-- Structures: exactly one parent (infrastructure or dependency)
ALTER TABLE "structures" ADD CONSTRAINT structure_single_parent CHECK (
  ("infrastructureId" IS NOT NULL)::int +
  ("dependencyId" IS NOT NULL)::int = 1
);

-- Materials: exactly one parent (infrastructure, dependency or structure)
ALTER TABLE "materials" ADD CONSTRAINT material_single_parent CHECK (
  ("infrastructureId" IS NOT NULL)::int +
  ("dependencyId" IS NOT NULL)::int +
  ("structureId" IS NOT NULL)::int = 1
);

-- GIN index for queries on attributes JSON
CREATE INDEX idx_material_attributes ON "materials" USING GIN (attributes);

-- Partial unique indexes for soft delete
CREATE UNIQUE INDEX uq_infrastructures_code ON "infrastructures" (code) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX uq_users_email ON "users" (email) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX uq_material_types_code ON "material_types" (code) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX uq_materials_code ON "materials" (code) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX uq_action_types_code ON "action_types" (code) WHERE "deletedAt" IS NULL;

-- Dependencies: code unique in root (parentId IS NULL) by infrastructure
CREATE UNIQUE INDEX uq_dep_root_code ON "dependencies" ("infrastructureId", code) WHERE "parentId" IS NULL;

-- MaterialCategory: enumValues only if dataType = ENUM
ALTER TABLE "material_categories" ADD CONSTRAINT chk_enum_values CHECK (
  "dataType" = 'ENUM' OR array_length("enumValues", 1) IS NULL
);
