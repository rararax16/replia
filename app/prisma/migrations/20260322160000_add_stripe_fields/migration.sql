ALTER TABLE "users"
  ADD COLUMN "stripe_customer_id" TEXT,
  ADD COLUMN "stripe_subscription_id" TEXT;

ALTER TABLE "users"
  ADD CONSTRAINT "users_stripe_customer_id_key" UNIQUE ("stripe_customer_id");

ALTER TABLE "users"
  ADD CONSTRAINT "users_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");
