DO $$
DECLARE
  admin_email TEXT := 'aspida.rara16@gmail.com';
  admin_password_hash TEXT := '191e4744283590df61e64174964da1fd:6fe8bbf16a6326f2af3eac3a604a2c55ec1ff286a96cb3f74243caf97f011b7686975002f7163397dfb2b05dfbbe7c3980b42abaeb64f73c17680367f8e38d8c';
  admin_tenant_id TEXT;
  admin_user_id TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "email" = admin_email
  ) THEN
    RETURN;
  END IF;

  admin_tenant_id := md5(random()::text || clock_timestamp()::text || admin_email || ':tenant');
  admin_user_id := md5(random()::text || clock_timestamp()::text || admin_email || ':user');

  INSERT INTO "tenants" (
    "id",
    "name",
    "created_at",
    "updated_at"
  ) VALUES (
    admin_tenant_id,
    '初期管理者テナント',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  INSERT INTO "users" (
    "id",
    "tenant_id",
    "email",
    "password_hash",
    "role",
    "created_at",
    "updated_at"
  ) VALUES (
    admin_user_id,
    admin_tenant_id,
    admin_email,
    admin_password_hash,
    'ADMIN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
END $$;
