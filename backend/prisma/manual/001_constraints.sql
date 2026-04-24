-- Structure: exactamente un padre (infrastructure o dependency)
-- Nota: Prisma genera columnas camelCase sin @map, por eso se usan nombres camelCase
ALTER TABLE "structures"
ADD CONSTRAINT structure_single_parent CHECK (
  ("infrastructureId" IS NOT NULL)::int +
  ("dependencyId" IS NOT NULL)::int = 1
);

-- Material: exactamente un padre (infrastructure, dependency o structure)
ALTER TABLE "materials"
ADD CONSTRAINT material_single_parent CHECK (
  ("infrastructureId" IS NOT NULL)::int +
  ("dependencyId" IS NOT NULL)::int +
  ("structureId" IS NOT NULL)::int = 1
);

-- GIN index para queries sobre attributes JSON
CREATE INDEX idx_material_attributes ON "materials" USING GIN (attributes);
