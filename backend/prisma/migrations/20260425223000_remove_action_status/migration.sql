-- Remove ActionStatus model and statusId from actions

ALTER TABLE "actions" DROP COLUMN "statusId";

DROP TABLE "action_statuses";
