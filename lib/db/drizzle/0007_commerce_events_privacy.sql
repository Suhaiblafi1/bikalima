ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "recorded_price" integer;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "zoom_price" integer;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "blended_price" integer;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "delivery_formats" jsonb;

UPDATE "courses"
SET "recorded_price" = COALESCE("recorded_price", "discount_price", "price"),
    "delivery_formats" = COALESCE("delivery_formats", '["recorded"]'::jsonb)
WHERE "recorded_price" IS NULL OR "delivery_formats" IS NULL;

-- Product decision: speech reviews are human-only. Remove the obsolete
-- toggle so it cannot reappear in the admin feature-flags screen.
DELETE FROM "feature_flags" WHERE "key" = 'ai_evaluation';

CREATE TABLE IF NOT EXISTS "in_person_courses" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "course_id" varchar,
  "program_id" varchar,
  "title_ar" varchar NOT NULL,
  "title_en" varchar NOT NULL,
  "description_ar" text,
  "description_en" text,
  "organization_ar" varchar,
  "organization_en" varchar,
  "trainer_ar" varchar,
  "trainer_en" varchar,
  "location_ar" varchar NOT NULL,
  "location_en" varchar NOT NULL,
  "country_code" varchar(2),
  "timezone" varchar DEFAULT 'Asia/Amman' NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "registration_deadline" timestamp with time zone,
  "capacity" integer NOT NULL,
  "price" integer,
  "currency" varchar(3) DEFAULT 'JOD' NOT NULL,
  "status" varchar(20) DEFAULT 'draft' NOT NULL,
  "waitlist_enabled" boolean DEFAULT true NOT NULL,
  "created_by_id" varchar,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "in_person_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null,
  CONSTRAINT "in_person_courses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null,
  CONSTRAINT "in_person_courses_capacity_positive" CHECK ("capacity" > 0),
  CONSTRAINT "in_person_courses_dates_valid" CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "in_person_courses_status_valid" CHECK ("status" IN ('draft', 'published', 'closed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS "in_person_courses_starts_at_idx" ON "in_person_courses" ("starts_at");
CREATE INDEX IF NOT EXISTS "in_person_courses_status_idx" ON "in_person_courses" ("status");

CREATE TABLE IF NOT EXISTS "in_person_course_registrations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" varchar NOT NULL,
  "user_id" varchar,
  "full_name" varchar NOT NULL,
  "email" varchar NOT NULL,
  "phone" varchar NOT NULL,
  "note" text,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "manage_token_hash" varchar(64) NOT NULL,
  "reminder_sent_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "source" varchar DEFAULT 'website' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "in_person_registrations_event_fk" FOREIGN KEY ("event_id") REFERENCES "public"."in_person_courses"("id") ON DELETE cascade,
  CONSTRAINT "in_person_registrations_user_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null,
  CONSTRAINT "in_person_registrations_status_valid" CHECK ("status" IN ('pending', 'confirmed', 'waitlisted', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS "in_person_registrations_event_idx" ON "in_person_course_registrations" ("event_id");
CREATE INDEX IF NOT EXISTS "in_person_registrations_status_idx" ON "in_person_course_registrations" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "in_person_registrations_manage_token_unique" ON "in_person_course_registrations" ("manage_token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "in_person_registrations_active_email_unique"
  ON "in_person_course_registrations" ("event_id", lower("email"))
  WHERE "status" <> 'cancelled';

ALTER TABLE "speech_evaluations" ADD COLUMN IF NOT EXISTS "privacy_consent_at" timestamp with time zone;
ALTER TABLE "speech_evaluations" ADD COLUMN IF NOT EXISTS "privacy_consent_version" varchar(32);
ALTER TABLE "speech_evaluations" ADD COLUMN IF NOT EXISTS "retention_expires_at" timestamp with time zone;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_provider" varchar(24);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivery_format" varchar(16) DEFAULT 'recorded' NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_session_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_intent_id" varchar;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp with time zone;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refunded_at" timestamp with time zone;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refund_amount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "failure_code" varchar;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_payment_session_unique" ON "orders" ("payment_session_id") WHERE "payment_session_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "orders_payment_intent_idx" ON "orders" ("payment_intent_id");

CREATE TABLE IF NOT EXISTS "discount_code_reservations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "discount_code_id" varchar NOT NULL,
  "order_id" varchar NOT NULL,
  "status" varchar(16) DEFAULT 'held' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "released_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "discount_reservations_code_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE cascade,
  CONSTRAINT "discount_reservations_order_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade,
  CONSTRAINT "discount_reservations_status_valid" CHECK ("status" IN ('held', 'consumed', 'released', 'expired'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "discount_code_reservations_order_unique" ON "discount_code_reservations" ("order_id");
CREATE INDEX IF NOT EXISTS "discount_code_reservations_code_status_idx" ON "discount_code_reservations" ("discount_code_id", "status");
CREATE INDEX IF NOT EXISTS "discount_code_reservations_expiry_idx" ON "discount_code_reservations" ("expires_at");

CREATE TABLE IF NOT EXISTS "order_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" varchar NOT NULL,
  "type" varchar(48) NOT NULL,
  "provider_event_id" varchar,
  "actor_user_id" varchar,
  "data" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "order_events_order_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade,
  CONSTRAINT "order_events_actor_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null
);

CREATE INDEX IF NOT EXISTS "order_events_order_idx" ON "order_events" ("order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "order_events_provider_event_unique" ON "order_events" ("provider_event_id") WHERE "provider_event_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "payment_webhook_events" (
  "id" varchar PRIMARY KEY NOT NULL,
  "provider" varchar(24) NOT NULL,
  "event_type" varchar(80) NOT NULL,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "anonymous_id" varchar(64) NOT NULL,
  "event_name" varchar(64) NOT NULL,
  "path" varchar(500) NOT NULL,
  "properties" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "analytics_events_created_idx" ON "analytics_events" ("created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_name_idx" ON "analytics_events" ("event_name");
