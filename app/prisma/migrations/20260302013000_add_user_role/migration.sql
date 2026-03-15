CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

ALTER TABLE "users"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

UPDATE "users"
SET "role" = 'ADMIN';
