import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

// ── Accreditations ──────────────────────────────────────────────────────
// Institutional accreditations / certifications the platform holds (e.g.
// ISO, ministry of education, training-quality bodies, partnerships).
//
// Public landing page lists these with badges, validity dates, scope, and
// a verification link. Admins manage them in /admin/accreditations.

export const accreditationsTable = pgTable(
  "accreditations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

    // Display
    nameAr: varchar("name_ar").notNull(),
    nameEn: varchar("name_en"),
    descriptionAr: text("description_ar"),
    descriptionEn: text("description_en"),

    // Issuer (الجهة المانحة)
    issuerNameAr: varchar("issuer_name_ar").notNull(),
    issuerNameEn: varchar("issuer_name_en"),
    issuerCountry: varchar("issuer_country", { length: 80 }),
    issuerWebsite: varchar("issuer_website"),
    issuerLogoUrl: varchar("issuer_logo_url"),

    // Identification
    accreditationNumber: varchar("accreditation_number"),
    scopeAr: text("scope_ar"),
    scopeEn: text("scope_en"),

    // Validity (مدة الاعتماد)
    issueDate: date("issue_date").notNull(),
    expiryDate: date("expiry_date"), // null = no expiry / lifetime
    // active | expired | pending_renewal | revoked | suspended
    status: varchar("status", { length: 24 })
      .$type<"active" | "expired" | "pending_renewal" | "revoked" | "suspended">()
      .notNull()
      .default("active"),

    // Documents
    certificateFileUrl: varchar("certificate_file_url"), // signed PDF
    verificationUrl: varchar("verification_url"),       // public link on issuer's portal

    // Display controls
    badgeColor: varchar("badge_color", { length: 24 }).notNull().default("amber"),
    displayOrder: integer("display_order").notNull().default(0),
    isPublic: boolean("is_public").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),

    notes: text("notes"), // admin-only
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_accred_status").on(t.status),
    index("idx_accred_public").on(t.isPublic, t.displayOrder),
    index("idx_accred_expiry").on(t.expiryDate),
  ],
);

// History of renewals — every time an accreditation is renewed/extended.
export const accreditationRenewalsTable = pgTable("accreditation_renewals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accreditationId: varchar("accreditation_id")
    .notNull()
    .references(() => accreditationsTable.id, { onDelete: "cascade" }),
  previousExpiryDate: date("previous_expiry_date"),
  newExpiryDate: date("new_expiry_date").notNull(),
  renewedOn: date("renewed_on").notNull(),
  newCertificateFileUrl: varchar("new_certificate_file_url"),
  notes: text("notes"),
  actorUserId: varchar("actor_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Policies & Terms ────────────────────────────────────────────────────
// Versioned policy documents (terms of service, privacy, refund, code of
// conduct, child-safeguarding, etc.). Replaces the single privacyPolicyAr
// /termsAr fields on site_settings with first-class versioned docs.
//
// Each policy has a stable `slug` and a numeric `version`. Bumping the
// version forces a re-acceptance from anyone whose latest acceptance is for
// an older version (when `requiresAcceptance = true`).

export const policyDocumentsTable = pgTable(
  "policy_documents",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: varchar("slug", { length: 64 }).notNull(),
    version: integer("version").notNull().default(1),

    titleAr: varchar("title_ar").notNull(),
    titleEn: varchar("title_en"),
    summaryAr: text("summary_ar"),
    summaryEn: text("summary_en"),
    bodyAr: text("body_ar").notNull(),
    bodyEn: text("body_en"),

    effectiveDate: date("effective_date").notNull(),
    requiresAcceptance: boolean("requires_acceptance").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),

    icon: varchar("icon", { length: 32 }).notNull().default("scroll-text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("UQ_policy_slug_version").on(t.slug, t.version),
    index("idx_policy_published").on(t.isPublished, t.displayOrder),
  ],
);

// One row per (user, policy slug, version) acceptance event. Used to prove
// the user agreed to a specific version on a specific date.
export const policyAcceptancesTable = pgTable(
  "policy_acceptances",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    policySlug: varchar("policy_slug", { length: 64 }).notNull(),
    version: integer("version").notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 512 }),
  },
  (t) => [
    uniqueIndex("UQ_policy_acceptance").on(t.userId, t.policySlug, t.version),
    index("idx_policy_acceptance_user").on(t.userId),
  ],
);
