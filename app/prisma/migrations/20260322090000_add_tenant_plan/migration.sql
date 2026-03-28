-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('FREE', 'PRO');

-- Add plan fields to users
ALTER TABLE "users"
  ADD COLUMN "plan" "TenantPlan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "plan_expires_at" TIMESTAMP(3),
  ADD COLUMN "plan_auto_renew" BOOLEAN NOT NULL DEFAULT false;

-- Drop old unique constraints that include tenant_id
ALTER TABLE "ig_accounts" DROP CONSTRAINT IF EXISTS "ig_accounts_tenant_id_platform_user_id_key";
ALTER TABLE "inbound_events" DROP CONSTRAINT IF EXISTS "inbound_events_tenant_id_user_id_external_event_id_key";

-- Drop old indexes
DROP INDEX IF EXISTS "ig_accounts_tenant_id_user_id_idx";
DROP INDEX IF EXISTS "reply_rules_tenant_id_user_id_channel_is_active_priority_idx";
DROP INDEX IF EXISTS "inbound_events_tenant_id_user_id_channel_created_at_idx";
DROP INDEX IF EXISTS "outbound_replies_tenant_id_user_id_status_created_at_idx";
DROP INDEX IF EXISTS "users_tenant_id_idx";

-- Drop tenant_id foreign key constraints
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_tenant_id_fkey";
ALTER TABLE "ig_accounts" DROP CONSTRAINT IF EXISTS "ig_accounts_tenant_id_fkey";
ALTER TABLE "reply_rules" DROP CONSTRAINT IF EXISTS "reply_rules_tenant_id_fkey";
ALTER TABLE "inbound_events" DROP CONSTRAINT IF EXISTS "inbound_events_tenant_id_fkey";
ALTER TABLE "outbound_replies" DROP CONSTRAINT IF EXISTS "outbound_replies_tenant_id_fkey";

-- Drop tenant_id columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "ig_accounts" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "reply_rules" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "inbound_events" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "outbound_replies" DROP COLUMN IF EXISTS "tenant_id";

-- Add new unique constraints
ALTER TABLE "ig_accounts" ADD CONSTRAINT "ig_accounts_user_id_platform_user_id_key" UNIQUE ("user_id", "platform_user_id");
ALTER TABLE "inbound_events" ADD CONSTRAINT "inbound_events_user_id_external_event_id_key" UNIQUE ("user_id", "external_event_id");

-- Add new indexes
CREATE INDEX "ig_accounts_user_id_idx" ON "ig_accounts"("user_id");
CREATE INDEX "reply_rules_user_id_channel_is_active_priority_idx" ON "reply_rules"("user_id", "channel", "is_active", "priority");
CREATE INDEX "inbound_events_user_id_channel_created_at_idx" ON "inbound_events"("user_id", "channel", "created_at");
CREATE INDEX "outbound_replies_user_id_status_created_at_idx" ON "outbound_replies"("user_id", "status", "created_at");

-- Drop tenants table
DROP TABLE IF EXISTS "tenants";
