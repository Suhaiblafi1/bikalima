-- A phone number that can identify an account, so it can be signed in with.
-- Additive: an index, no column or constraint altered. Partial, so the many
-- existing users with no phone are unaffected and can stay that way.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_phone"
  ON "users" USING btree ("phone")
  WHERE "phone" IS NOT NULL;
