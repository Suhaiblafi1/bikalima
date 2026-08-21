CREATE TABLE IF NOT EXISTS "discount_codes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" varchar(64) NOT NULL,
  "discount_type" varchar(16) NOT NULL,
  "discount_value" integer NOT NULL,
  "course_id" varchar,
  "is_active" boolean DEFAULT true NOT NULL,
  "starts_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "max_uses" integer,
  "used_count" integer DEFAULT 0 NOT NULL,
  "created_by_id" varchar,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "discount_codes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade,
  CONSTRAINT "discount_codes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null
);

CREATE UNIQUE INDEX IF NOT EXISTS "discount_codes_code_unique" ON "discount_codes" USING btree ("code");
CREATE INDEX IF NOT EXISTS "discount_codes_course_idx" ON "discount_codes" USING btree ("course_id");

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "original_amount" integer;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_code_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_code" varchar(64);

DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_code_id_discount_codes_id_fk"
    FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
