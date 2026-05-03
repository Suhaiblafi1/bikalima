// Shared field schema for the home page CMS. Mirrored on the API server
// at artifacts/api-server/src/cms/sections-schema.ts. Keep both in sync.

export const HOME_SECTION_KEYS = [
  "hero",
  "about-trainer",
  "why-bikalima",
  "programs",
  "events",
  "gallery-preview",
  "field-videos",
  "testimonials",
  "faq",
  "enrollment-form",
  "footer",
] as const;

export type SectionKey = (typeof HOME_SECTION_KEYS)[number];

export type FieldType = "text" | "textarea" | "image" | "url";

export type FieldDef = {
  key: string;
  type: FieldType;
  labelAr: string;
  labelEn: string;
  placeholderAr?: string;
  placeholderEn?: string;
};

export type SectionContent = Record<string, string>;

export type SectionRecord = {
  sectionKey: string;
  contentAr: Record<string, unknown> | null;
  contentEn: Record<string, unknown> | null;
  visible: boolean;
  orderIndex: number;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
};

export const SECTION_FIELDS: Record<SectionKey, FieldDef[]> = {
  hero: [
    { key: "titleLine1",   type: "text",     labelAr: "عنوان (سطر ١)",      labelEn: "Title (line 1)" },
    { key: "titleLine2",   type: "text",     labelAr: "عنوان (سطر ٢)",      labelEn: "Title (line 2)" },
    { key: "subtitle",     type: "textarea", labelAr: "النص التعريفي",       labelEn: "Subtitle" },
    { key: "ctaPrimary",   type: "text",     labelAr: "زر أساسي",            labelEn: "Primary CTA" },
    { key: "ctaSecondary", type: "text",     labelAr: "زر ثانوي",            labelEn: "Secondary CTA" },
    { key: "badgeText",    type: "text",     labelAr: "نص الشارة",           labelEn: "Badge text" },
  ],
  "about-trainer": [
    { key: "heading",       type: "text",     labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading",    type: "text",     labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
    { key: "bioParagraph1", type: "textarea", labelAr: "الفقرة الأولى",   labelEn: "Bio paragraph 1" },
    { key: "bioParagraph2", type: "textarea", labelAr: "الفقرة الثانية",  labelEn: "Bio paragraph 2" },
    { key: "ctaLabel",      type: "text",     labelAr: "نص الزر",         labelEn: "CTA label" },
  ],
  "why-bikalima": [
    { key: "heading",     type: "text",     labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading",  type: "text",     labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
    { key: "point1Title", type: "text",     labelAr: "نقطة ١ — العنوان", labelEn: "Point 1 — title" },
    { key: "point1Body",  type: "textarea", labelAr: "نقطة ١ — النص",    labelEn: "Point 1 — body" },
    { key: "point2Title", type: "text",     labelAr: "نقطة ٢ — العنوان", labelEn: "Point 2 — title" },
    { key: "point2Body",  type: "textarea", labelAr: "نقطة ٢ — النص",    labelEn: "Point 2 — body" },
    { key: "point3Title", type: "text",     labelAr: "نقطة ٣ — العنوان", labelEn: "Point 3 — title" },
    { key: "point3Body",  type: "textarea", labelAr: "نقطة ٣ — النص",    labelEn: "Point 3 — body" },
  ],
  programs: [
    { key: "heading",    type: "text", labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading", type: "text", labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
  ],
  events: [
    { key: "heading",    type: "text", labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading", type: "text", labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
    { key: "ctaLabel",   type: "text", labelAr: "نص الزر",         labelEn: "CTA label" },
  ],
  "gallery-preview": [
    { key: "heading",    type: "text", labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading", type: "text", labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
  ],
  "field-videos": [
    { key: "heading",    type: "text", labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading", type: "text", labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
  ],
  testimonials: [
    { key: "heading",    type: "text", labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading", type: "text", labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
  ],
  faq: [
    { key: "heading",    type: "text", labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading", type: "text", labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
  ],
  "enrollment-form": [
    { key: "heading",     type: "text", labelAr: "العنوان",        labelEn: "Heading" },
    { key: "subheading",  type: "text", labelAr: "العنوان الفرعي",  labelEn: "Subheading" },
    { key: "submitLabel", type: "text", labelAr: "نص زر الإرسال",   labelEn: "Submit label" },
  ],
  footer: [
    { key: "tagline",          type: "textarea", labelAr: "وصف موجز",          labelEn: "Tagline" },
    { key: "copyrightSuffix",  type: "text",     labelAr: "إضافة حقوق النشر",  labelEn: "Copyright suffix" },
  ],
};

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === "string" && (HOME_SECTION_KEYS as readonly string[]).includes(value);
}

// Read a single field value from the loaded CMS map. Falls back to the
// caller-provided string whenever the section row is missing, the field is
// absent, or the stored value is empty.
export function getSectionContent(
  cms: Partial<Record<SectionKey, SectionRecord | null>> | null | undefined,
  key: SectionKey,
  lang: "ar" | "en",
  field: string,
  fallback: string,
): string {
  if (!cms) return fallback;
  const row = cms[key];
  if (!row) return fallback;
  const bag = (lang === "ar" ? row.contentAr : row.contentEn) as Record<string, unknown> | null;
  if (!bag) return fallback;
  const v = bag[field];
  if (typeof v === "string" && v.trim().length > 0) return v;
  return fallback;
}
