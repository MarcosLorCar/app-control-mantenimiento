-- Drop total unique indexes that are incompatible with soft delete
-- These will be replaced by partial unique indexes (WHERE deletedAt IS NULL)

-- DropIndex
DROP INDEX IF EXISTS "users_email_key";

-- DropIndex
DROP INDEX IF EXISTS "infrastructures_code_key";

-- DropIndex
DROP INDEX IF EXISTS "material_types_code_key";

-- DropIndex
DROP INDEX IF EXISTS "materials_code_key";

-- DropIndex
DROP INDEX IF EXISTS "action_types_code_key";

-- DropIndex
DROP INDEX IF EXISTS "action_statuses_code_key";
