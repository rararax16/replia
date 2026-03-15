-- CreateEnum
CREATE TYPE "EventChannel" AS ENUM ('DM', 'COMMENT');

-- CreateEnum
CREATE TYPE "ReplyStatus" AS ENUM ('STUBBED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "tenants" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ig_accounts" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "platform_user_id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "access_token_encrypted" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ig_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reply_rules" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "channel" "EventChannel" NOT NULL,
  "keyword" TEXT NOT NULL,
  "reply_text" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "reply_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_events" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "channel" "EventChannel" NOT NULL,
  "external_event_id" TEXT NOT NULL,
  "sender_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "matched_rule_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "inbound_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_replies" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "inbound_event_id" TEXT,
  "reply_text" TEXT NOT NULL,
  "status" "ReplyStatus" NOT NULL DEFAULT 'STUBBED',
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "outbound_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "ig_accounts_tenant_id_platform_user_id_key" ON "ig_accounts"("tenant_id", "platform_user_id");

-- CreateIndex
CREATE INDEX "ig_accounts_tenant_id_idx" ON "ig_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "reply_rules_tenant_id_channel_is_active_priority_idx" ON "reply_rules"("tenant_id", "channel", "is_active", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_events_tenant_id_external_event_id_key" ON "inbound_events"("tenant_id", "external_event_id");

-- CreateIndex
CREATE INDEX "inbound_events_tenant_id_channel_created_at_idx" ON "inbound_events"("tenant_id", "channel", "created_at");

-- CreateIndex
CREATE INDEX "outbound_replies_tenant_id_status_created_at_idx" ON "outbound_replies"("tenant_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ig_accounts" ADD CONSTRAINT "ig_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reply_rules" ADD CONSTRAINT "reply_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_events" ADD CONSTRAINT "inbound_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_replies" ADD CONSTRAINT "outbound_replies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_replies" ADD CONSTRAINT "outbound_replies_inbound_event_id_fkey" FOREIGN KEY ("inbound_event_id") REFERENCES "inbound_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
