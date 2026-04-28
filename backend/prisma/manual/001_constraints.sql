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

-- Partial unique indexes para soft delete (evitan conflictos con registros borrados)
CREATE UNIQUE INDEX uq_infrastructures_code ON infrastructures (code)
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX uq_users_email ON users (email)
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX uq_material_types_code ON material_types (code)
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX uq_materials_code ON materials (code)
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX uq_action_types_code ON action_types (code)
  WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX uq_action_statuses_code ON action_statuses (code)
  WHERE "deletedAt" IS NULL;

-- Dependency: uniqueness de code en root (parentId IS NULL) por infrastructure
CREATE UNIQUE INDEX uq_dep_root_code ON dependencies ("infrastructureId", code)
  WHERE "parentId" IS NULL;

-- MaterialCategory: enumValues solo puede tener valores si dataType = ENUM
ALTER TABLE material_categories
ADD CONSTRAINT chk_enum_values CHECK (
  "dataType" = 'ENUM' OR array_length("enumValues", 1) IS NULL
);
