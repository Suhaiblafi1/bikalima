ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expires_at" timestamp with time zone;
