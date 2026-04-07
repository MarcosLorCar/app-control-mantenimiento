-- AlterTable
ALTER TABLE "infrastructures" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "action_materials_action_id_idx" ON "action_materials"("action_id");

-- CreateIndex
CREATE INDEX "actions_infrastructure_id_idx" ON "actions"("infrastructure_id");

-- CreateIndex
CREATE INDEX "actions_performed_by_idx" ON "actions"("performed_by");

-- CreateIndex
CREATE INDEX "actions_action_type_id_idx" ON "actions"("action_type_id");

-- CreateIndex
CREATE INDEX "actions_performed_at_idx" ON "actions"("performed_at");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");
