ALTER TABLE "ig_accounts"
  ADD COLUMN "user_id" TEXT;

ALTER TABLE "reply_rules"
  ADD COLUMN "user_id" TEXT;

ALTER TABLE "inbound_events"
  ADD COLUMN "user_id" TEXT;

ALTER TABLE "outbound_replies"
  ADD COLUMN "user_id" TEXT;

UPDATE "ig_accounts" AS account
SET "user_id" = (
  SELECT "id"
  FROM "users"
  WHERE "users"."tenant_id" = account."tenant_id"
  ORDER BY "created_at" ASC, "id" ASC
  LIMIT 1
)
WHERE account."user_id" IS NULL;

UPDATE "reply_rules" AS rule
SET "user_id" = (
  SELECT "id"
  FROM "users"
  WHERE "users"."tenant_id" = rule."tenant_id"
  ORDER BY "created_at" ASC, "id" ASC
  LIMIT 1
)
WHERE rule."user_id" IS NULL;

UPDATE "inbound_events" AS event
SET "user_id" = (
  SELECT "id"
  FROM "users"
  WHERE "users"."tenant_id" = event."tenant_id"
  ORDER BY "created_at" ASC, "id" ASC
  LIMIT 1
)
WHERE event."user_id" IS NULL;

UPDATE "outbound_replies" AS reply
SET "user_id" = event."user_id"
FROM "inbound_events" AS event
WHERE reply."inbound_event_id" = event."id"
  AND reply."user_id" IS NULL;

UPDATE "outbound_replies" AS reply
SET "user_id" = (
  SELECT "id"
  FROM "users"
  WHERE "users"."tenant_id" = reply."tenant_id"
  ORDER BY "created_at" ASC, "id" ASC
  LIMIT 1
)
WHERE reply."user_id" IS NULL;

ALTER TABLE "ig_accounts"
  ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "reply_rules"
  ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "inbound_events"
  ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "outbound_replies"
  ALTER COLUMN "user_id" SET NOT NULL;

DROP INDEX "ig_accounts_tenant_id_idx";
DROP INDEX "reply_rules_tenant_id_channel_is_active_priority_idx";
DROP INDEX "inbound_events_tenant_id_external_event_id_key";
DROP INDEX "inbound_events_tenant_id_channel_created_at_idx";
DROP INDEX "outbound_replies_tenant_id_status_created_at_idx";

CREATE INDEX "ig_accounts_tenant_id_user_id_idx" ON "ig_accounts"("tenant_id", "user_id");
CREATE INDEX "reply_rules_tenant_id_user_id_channel_is_active_priority_idx" ON "reply_rules"("tenant_id", "user_id", "channel", "is_active", "priority");
CREATE UNIQUE INDEX "inbound_events_tenant_id_user_id_external_event_id_key" ON "inbound_events"("tenant_id", "user_id", "external_event_id");
CREATE INDEX "inbound_events_tenant_id_user_id_channel_created_at_idx" ON "inbound_events"("tenant_id", "user_id", "channel", "created_at");
CREATE INDEX "outbound_replies_tenant_id_user_id_status_created_at_idx" ON "outbound_replies"("tenant_id", "user_id", "status", "created_at");

ALTER TABLE "ig_accounts" ADD CONSTRAINT "ig_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reply_rules" ADD CONSTRAINT "reply_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inbound_events" ADD CONSTRAINT "inbound_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "outbound_replies" ADD CONSTRAINT "outbound_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
