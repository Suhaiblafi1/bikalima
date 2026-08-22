import { createHash, randomBytes } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { z } from "zod";
import {
  db,
  inPersonCoursesTable,
  inPersonCourseRegistrationsTable,
  coursesTable,
} from "@workspace/db";
import { and, asc, desc, eq, gte, inArray, lte, ne, or, sql } from "drizzle-orm";
import { requireAdmin, requireRole } from "../lib/admin.js";
import { recordAuditLog } from "../lib/platform.js";
import { registerLeadFromForm } from "../lib/leads.js";
import { sendWhatsAppText } from "../lib/whatsapp.js";
import { applyAdHocLimit } from "../middlewares/security.js";

const router: IRouter = Router();
const EVENT_STATUSES = ["draft", "published", "closed", "cancelled"] as const;
const REGISTRATION_STATUSES = ["pending", "confirmed", "waitlisted", "cancelled"] as const;

const eventObject = z.object({
  courseId: z.string().trim().max(80).nullable().optional(),
  programId: z.string().trim().max(80).nullable().optional(),
  titleAr: z.string().trim().min(2).max(200),
  titleEn: z.string().trim().min(2).max(200),
  descriptionAr: z.string().trim().max(3000).nullable().optional(),
  descriptionEn: z.string().trim().max(3000).nullable().optional(),
  organizationAr: z.string().trim().max(200).nullable().optional(),
  organizationEn: z.string().trim().max(200).nullable().optional(),
  trainerAr: z.string().trim().max(160).nullable().optional(),
  trainerEn: z.string().trim().max(160).nullable().optional(),
  locationAr: z.string().trim().min(2).max(300),
  locationEn: z.string().trim().min(2).max(300),
  countryCode: z.string().trim().length(2).toUpperCase().nullable().optional(),
  timezone: z.string().trim().min(3).max(80).default("Asia/Amman"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  registrationDeadline: z.coerce.date().nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(10000),
  price: z.coerce.number().int().min(0).nullable().optional(),
  currency: z.string().trim().length(3).toUpperCase().default("JOD"),
  status: z.enum(EVENT_STATUSES).default("draft"),
  waitlistEnabled: z.boolean().default(true),
});

const eventSchema = eventObject.superRefine((data, ctx) => {
  if (data.endsAt <= data.startsAt) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "تاريخ النهاية يجب أن يكون بعد البداية" });
  }
  if (data.registrationDeadline && data.registrationDeadline > data.startsAt) {
    ctx.addIssue({ code: "custom", path: ["registrationDeadline"], message: "موعد إغلاق التسجيل يجب أن يسبق بداية الدورة" });
  }
});
const eventPatchSchema = eventObject.partial();

const registrationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200).transform((v) => v.toLowerCase()),
  phone: z.string().trim().min(7).max(40),
  note: z.string().trim().max(1000).optional(),
  source: z.string().trim().max(80).optional(),
});

const manageSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(40).optional(),
  note: z.string().trim().max(1000).nullable().optional(),
  cancel: z.boolean().optional(),
});

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getPublicOrigin(req: Request): string {
  const fromEnv = process.env.PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

function mailTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

function formatEventDate(value: Date, locale: "ar-JO" | "en-GB", timezone: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  }).format(value);
}

async function sendRegistrationConfirmation(args: {
  req: Request;
  event: typeof inPersonCoursesTable.$inferSelect;
  registration: typeof inPersonCourseRegistrationsTable.$inferSelect;
  token: string;
}) {
  const { req, event, registration, token } = args;
  const manageUrl = `${getPublicOrigin(req)}/manage-registration?token=${encodeURIComponent(token)}`;
  const isWaitlisted = registration.status === "waitlisted";
  const transporter = mailTransport();
  if (transporter) {
    const subject = isWaitlisted
      ? `قائمة الانتظار — ${event.titleAr} | بكلمة`
      : `استلمنا تسجيلك — ${event.titleAr} | بكلمة`;
    const text = [
      `مرحباً ${registration.fullName}،`,
      isWaitlisted
        ? "اكتملت المقاعد حالياً وأضفناك إلى قائمة الانتظار. سنتواصل معك عند توفر مقعد."
        : "استلمنا طلب تسجيلك، وسيتواصل معك فريق بكلمة لتأكيد المقعد والدفع.",
      `الموعد: ${formatEventDate(event.startsAt, "ar-JO", event.timezone)}`,
      `المكان: ${event.locationAr}`,
      `إدارة أو إلغاء الطلب: ${manageUrl}`,
    ].join("\n\n");
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"بكلمة" <${process.env.SMTP_USER}>`,
      to: registration.email,
      subject,
      text,
    }).catch((err) => req.log.warn({ err }, "in-person confirmation email failed"));
  }
  await sendWhatsAppText(
    registration.phone,
    `${isWaitlisted ? "أضفناك إلى قائمة الانتظار" : "استلمنا تسجيلك"} في ${event.titleAr}. الموعد: ${formatEventDate(event.startsAt, "ar-JO", event.timezone)}. إدارة الطلب: ${manageUrl}`,
  ).catch((err) => req.log.warn({ err }, "in-person confirmation WhatsApp failed"));
}

async function sendSeatAvailableNotice(args: {
  req: Request;
  event: typeof inPersonCoursesTable.$inferSelect;
  registration: typeof inPersonCourseRegistrationsTable.$inferSelect;
}) {
  const { req, event, registration } = args;
  const message = `توفر لك مقعد في دورة ${event.titleAr}. أصبح طلبك قيد التأكيد وسيتواصل معك فريق بكلمة لإتمام التسجيل.`;
  const attempts: Promise<unknown>[] = [sendWhatsAppText(registration.phone, message)];
  const transporter = mailTransport();
  if (transporter) {
    attempts.push(transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"بكلمة" <${process.env.SMTP_USER}>`,
      to: registration.email,
      subject: `توفر مقعد — ${event.titleAr} | بكلمة`,
      text: message,
    }));
  }
  const outcomes = await Promise.allSettled(attempts);
  outcomes.forEach((outcome) => {
    if (outcome.status === "rejected") req.log.warn({ err: outcome.reason }, "seat available notification failed");
  });
}

async function notifyEventChange(args: {
  req: Request;
  event: typeof inPersonCoursesTable.$inferSelect;
  registrations: Array<typeof inPersonCourseRegistrationsTable.$inferSelect>;
  cancelled: boolean;
}) {
  const { req, event, registrations, cancelled } = args;
  const transporter = mailTransport();
  const message = cancelled
    ? `تم إلغاء دورة ${event.titleAr}. سيتواصل معك فريق بكلمة بشأن أي ترتيبات مالية مرتبطة بالتسجيل.`
    : `تم تحديث موعد دورة ${event.titleAr}. الموعد: ${formatEventDate(event.startsAt, "ar-JO", event.timezone)} — المكان: ${event.locationAr}`;
  for (let offset = 0; offset < registrations.length; offset += 50) {
    const batch = registrations.slice(offset, offset + 50).flatMap((registration) => {
      const attempts: Promise<unknown>[] = [sendWhatsAppText(registration.phone, message)];
      if (transporter) attempts.push(transporter.sendMail({
        from: process.env.SMTP_FROM ?? `"بكلمة" <${process.env.SMTP_USER}>`,
        to: registration.email,
        subject: `${cancelled ? "إلغاء" : "تحديث"} — ${event.titleAr} | بكلمة`,
        text: message,
      }));
      return attempts;
    });
    const outcomes = await Promise.allSettled(batch);
    outcomes.forEach((outcome) => {
      if (outcome.status === "rejected") req.log.warn({ err: outcome.reason }, "event update notification failed");
    });
  }
}

async function cancelRegistrationAndPromote(id: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT ${inPersonCourseRegistrationsTable.id} FROM ${inPersonCourseRegistrationsTable} WHERE ${inPersonCourseRegistrationsTable.id} = ${id} FOR UPDATE`);
    const [current] = await tx.select().from(inPersonCourseRegistrationsTable)
      .where(eq(inPersonCourseRegistrationsTable.id, id)).limit(1);
    if (!current) return null;
    await tx.execute(sql`SELECT ${inPersonCoursesTable.id} FROM ${inPersonCoursesTable} WHERE ${inPersonCoursesTable.id} = ${current.eventId} FOR UPDATE`);
    const [event] = await tx.select().from(inPersonCoursesTable)
      .where(eq(inPersonCoursesTable.id, current.eventId)).limit(1);
    if (!event) return null;
    if (current.status === "cancelled") return { registration: current, event, promoted: null };

    const [registration] = await tx.update(inPersonCourseRegistrationsTable).set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(inPersonCourseRegistrationsTable.id, current.id)).returning();

    let promoted: typeof inPersonCourseRegistrationsTable.$inferSelect | null = null;
    if (current.status === "pending" || current.status === "confirmed") {
      const [next] = await tx.select().from(inPersonCourseRegistrationsTable)
        .where(and(
          eq(inPersonCourseRegistrationsTable.eventId, current.eventId),
          eq(inPersonCourseRegistrationsTable.status, "waitlisted"),
        ))
        .orderBy(asc(inPersonCourseRegistrationsTable.createdAt))
        .limit(1);
      if (next) {
        [promoted] = await tx.update(inPersonCourseRegistrationsTable).set({
          status: "pending",
          updatedAt: new Date(),
        }).where(and(
          eq(inPersonCourseRegistrationsTable.id, next.id),
          eq(inPersonCourseRegistrationsTable.status, "waitlisted"),
        )).returning();
      }
    }
    return { registration, event, promoted };
  });
}

router.get("/in-person-courses", async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: inPersonCoursesTable.id,
        courseId: inPersonCoursesTable.courseId,
        programId: inPersonCoursesTable.programId,
        titleAr: inPersonCoursesTable.titleAr,
        titleEn: inPersonCoursesTable.titleEn,
        descriptionAr: inPersonCoursesTable.descriptionAr,
        descriptionEn: inPersonCoursesTable.descriptionEn,
        organizationAr: inPersonCoursesTable.organizationAr,
        organizationEn: inPersonCoursesTable.organizationEn,
        trainerAr: inPersonCoursesTable.trainerAr,
        trainerEn: inPersonCoursesTable.trainerEn,
        locationAr: inPersonCoursesTable.locationAr,
        locationEn: inPersonCoursesTable.locationEn,
        countryCode: inPersonCoursesTable.countryCode,
        timezone: inPersonCoursesTable.timezone,
        startsAt: inPersonCoursesTable.startsAt,
        endsAt: inPersonCoursesTable.endsAt,
        registrationDeadline: inPersonCoursesTable.registrationDeadline,
        capacity: inPersonCoursesTable.capacity,
        price: inPersonCoursesTable.price,
        currency: inPersonCoursesTable.currency,
        waitlistEnabled: inPersonCoursesTable.waitlistEnabled,
        registeredCount: sql<number>`count(${inPersonCourseRegistrationsTable.id}) filter (where ${inPersonCourseRegistrationsTable.status} in ('pending', 'confirmed'))::int`,
      })
      .from(inPersonCoursesTable)
      .leftJoin(inPersonCourseRegistrationsTable, eq(inPersonCourseRegistrationsTable.eventId, inPersonCoursesTable.id))
      .where(and(eq(inPersonCoursesTable.status, "published"), gte(inPersonCoursesTable.endsAt, new Date())))
      .groupBy(inPersonCoursesTable.id)
      .orderBy(asc(inPersonCoursesTable.startsAt));
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json({
      courses: rows.map((row) => ({
        ...row,
        spotsLeft: Math.max(0, row.capacity - row.registeredCount),
        registrationOpen:
          (!row.registrationDeadline || row.registrationDeadline > new Date()) &&
          (row.registeredCount < row.capacity || row.waitlistEnabled),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load in-person courses" });
  }
});

router.post("/in-person-courses/:id/register", async (req: Request, res: Response) => {
  if (!applyAdHocLimit(res, `in-person-register:${req.ip ?? "unknown"}`, 8, 60 * 60_000)) return;
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات التسجيل غير صالحة", issues: parsed.error.issues });
    return;
  }
  const token = randomBytes(32).toString("base64url");
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`
        SELECT ${inPersonCoursesTable.id} FROM ${inPersonCoursesTable}
        WHERE ${inPersonCoursesTable.id} = ${req.params.id}
        FOR UPDATE
      `);
      const [event] = await tx.select().from(inPersonCoursesTable).where(eq(inPersonCoursesTable.id, req.params.id)).limit(1);
      if (!event || event.status !== "published") return { kind: "not_found" as const };
      const now = new Date();
      if (event.endsAt <= now || (event.registrationDeadline && event.registrationDeadline <= now)) {
        return { kind: "closed" as const };
      }
      const normalizedPhone = parsed.data.phone.replace(/\D/g, "");
      const [duplicate] = await tx.select({ id: inPersonCourseRegistrationsTable.id })
        .from(inPersonCourseRegistrationsTable)
        .where(and(
          eq(inPersonCourseRegistrationsTable.eventId, event.id),
          ne(inPersonCourseRegistrationsTable.status, "cancelled"),
          or(
            sql`lower(${inPersonCourseRegistrationsTable.email}) = ${parsed.data.email}`,
            sql`regexp_replace(${inPersonCourseRegistrationsTable.phone}, '[^0-9]', '', 'g') = ${normalizedPhone}`,
          ),
        )).limit(1);
      if (duplicate) return { kind: "duplicate" as const };
      const [counts] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(inPersonCourseRegistrationsTable)
        .where(and(
          eq(inPersonCourseRegistrationsTable.eventId, event.id),
          inArray(inPersonCourseRegistrationsTable.status, ["pending", "confirmed"]),
        ));
      const activeCount = counts?.count ?? 0;
      if (activeCount >= event.capacity && !event.waitlistEnabled) return { kind: "full" as const };
      const status = activeCount >= event.capacity ? "waitlisted" as const : "pending" as const;
      const [registration] = await tx.insert(inPersonCourseRegistrationsTable).values({
        eventId: event.id,
        userId: req.isAuthenticated() ? req.user?.id ?? null : null,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        note: parsed.data.note || null,
        status,
        manageTokenHash: tokenHash(token),
        source: parsed.data.source || "website",
      }).returning();
      return { kind: "created" as const, event, registration };
    });

    if (result.kind === "not_found") return void res.status(404).json({ error: "الدورة غير موجودة" });
    if (result.kind === "closed") return void res.status(409).json({ error: "انتهى التسجيل في هذه الدورة" });
    if (result.kind === "full") return void res.status(409).json({ error: "اكتملت المقاعد" });
    if (result.kind === "duplicate") return void res.status(409).json({ error: "لديك تسجيل قائم بالفعل في هذه الدورة" });

    await Promise.allSettled([
      sendRegistrationConfirmation({ req, event: result.event, registration: result.registration, token }),
      registerLeadFromForm({
        contact: { fullName: result.registration.fullName, email: result.registration.email, phone: result.registration.phone, source: "enrollment" },
        activity: {
          type: "linked_enrollment",
          summaryAr: `تسجيل ${result.registration.status === "waitlisted" ? "قائمة انتظار" : "جديد"}: ${result.event.titleAr}`,
          relatedEntityType: "in_person_registration",
          relatedEntityId: result.registration.id,
        },
        trigger: "in_person_registration.created",
        triggerPayload: { eventId: result.event.id, registrationStatus: result.registration.status },
      }),
    ]);
    res.status(201).json({
      ok: true,
      registrationId: result.registration.id,
      status: result.registration.status,
      manageToken: token,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "لديك تسجيل قائم بالفعل في هذه الدورة" });
      return;
    }
    req.log.error({ err }, "in-person registration failed");
    res.status(500).json({ error: "تعذّر إرسال التسجيل" });
  }
});

router.get("/in-person-registrations/manage/:token", async (req: Request, res: Response) => {
  const [row] = await db
    .select({
      id: inPersonCourseRegistrationsTable.id,
      fullName: inPersonCourseRegistrationsTable.fullName,
      email: inPersonCourseRegistrationsTable.email,
      phone: inPersonCourseRegistrationsTable.phone,
      note: inPersonCourseRegistrationsTable.note,
      status: inPersonCourseRegistrationsTable.status,
      eventTitleAr: inPersonCoursesTable.titleAr,
      eventTitleEn: inPersonCoursesTable.titleEn,
      startsAt: inPersonCoursesTable.startsAt,
      locationAr: inPersonCoursesTable.locationAr,
      locationEn: inPersonCoursesTable.locationEn,
    })
    .from(inPersonCourseRegistrationsTable)
    .innerJoin(inPersonCoursesTable, eq(inPersonCoursesTable.id, inPersonCourseRegistrationsTable.eventId))
    .where(eq(inPersonCourseRegistrationsTable.manageTokenHash, tokenHash(req.params.token)))
    .limit(1);
  if (!row) return void res.status(404).json({ error: "الرابط غير صالح" });
  res.set("Cache-Control", "no-store");
  res.json({ registration: row });
});

router.patch("/in-person-registrations/manage/:token", async (req: Request, res: Response) => {
  if (!applyAdHocLimit(res, `in-person-manage:${req.ip ?? "unknown"}`, 20, 60 * 60_000)) return;
  const parsed = manageSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "بيانات التعديل غير صالحة" });
  const update: Partial<typeof inPersonCourseRegistrationsTable.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.fullName !== undefined) update.fullName = parsed.data.fullName;
  if (parsed.data.phone !== undefined) update.phone = parsed.data.phone;
  if (parsed.data.note !== undefined) update.note = parsed.data.note || null;
  if (parsed.data.cancel) {
    const [row] = await db.select({ id: inPersonCourseRegistrationsTable.id })
      .from(inPersonCourseRegistrationsTable)
      .where(eq(inPersonCourseRegistrationsTable.manageTokenHash, tokenHash(req.params.token)))
      .limit(1);
    if (!row) return void res.status(404).json({ error: "الرابط غير صالح" });
    const result = await cancelRegistrationAndPromote(row.id);
    if (!result) return void res.status(404).json({ error: "الرابط غير صالح" });
    if (result.promoted) await sendSeatAvailableNotice({ req, event: result.event, registration: result.promoted });
    if (Object.keys(update).length > 1) {
      const [updated] = await db.update(inPersonCourseRegistrationsTable).set(update)
        .where(eq(inPersonCourseRegistrationsTable.id, result.registration.id)).returning();
      return void res.json({ registration: updated });
    }
    return void res.json({ registration: result.registration });
  }
  const [updated] = await db.update(inPersonCourseRegistrationsTable)
    .set(update)
    .where(eq(inPersonCourseRegistrationsTable.manageTokenHash, tokenHash(req.params.token)))
    .returning();
  if (!updated) return void res.status(404).json({ error: "الرابط غير صالح" });
  res.json({ registration: updated });
});

router.get("/admin/in-person-courses", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "sales")) return;
  const events = await db.select({
    id: inPersonCoursesTable.id,
    courseId: inPersonCoursesTable.courseId,
    programId: inPersonCoursesTable.programId,
    titleAr: inPersonCoursesTable.titleAr,
    titleEn: inPersonCoursesTable.titleEn,
    descriptionAr: inPersonCoursesTable.descriptionAr,
    descriptionEn: inPersonCoursesTable.descriptionEn,
    organizationAr: inPersonCoursesTable.organizationAr,
    organizationEn: inPersonCoursesTable.organizationEn,
    trainerAr: inPersonCoursesTable.trainerAr,
    trainerEn: inPersonCoursesTable.trainerEn,
    locationAr: inPersonCoursesTable.locationAr,
    locationEn: inPersonCoursesTable.locationEn,
    countryCode: inPersonCoursesTable.countryCode,
    timezone: inPersonCoursesTable.timezone,
    startsAt: inPersonCoursesTable.startsAt,
    endsAt: inPersonCoursesTable.endsAt,
    registrationDeadline: inPersonCoursesTable.registrationDeadline,
    capacity: inPersonCoursesTable.capacity,
    price: inPersonCoursesTable.price,
    currency: inPersonCoursesTable.currency,
    status: inPersonCoursesTable.status,
    waitlistEnabled: inPersonCoursesTable.waitlistEnabled,
    courseTitleAr: coursesTable.titleAr,
    registrationsCount: sql<number>`count(${inPersonCourseRegistrationsTable.id})::int`,
  }).from(inPersonCoursesTable)
    .leftJoin(coursesTable, eq(coursesTable.id, inPersonCoursesTable.courseId))
    .leftJoin(inPersonCourseRegistrationsTable, eq(inPersonCourseRegistrationsTable.eventId, inPersonCoursesTable.id))
    .groupBy(inPersonCoursesTable.id, coursesTable.titleAr)
    .orderBy(desc(inPersonCoursesTable.startsAt));
  res.json({ courses: events });
});

router.post("/admin/in-person-courses", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "بيانات الدورة غير صالحة", issues: parsed.error.issues });
  const [created] = await db.insert(inPersonCoursesTable).values({ ...parsed.data, createdById: req.user?.id ?? null }).returning();
  await recordAuditLog({
    actor: { id: req.user?.id ?? null, email: req.user?.email ?? null },
    action: "in_person_course.create",
    entityType: "in_person_course",
    entityId: created.id,
    description: `Created in-person course ${created.titleAr}`,
    after: created,
  });
  res.status(201).json({ course: created });
});

router.patch("/admin/in-person-courses/:id", async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const [current] = await db.select().from(inPersonCoursesTable).where(eq(inPersonCoursesTable.id, req.params.id)).limit(1);
  if (!current) return void res.status(404).json({ error: "الدورة غير موجودة" });
  const parsed = eventPatchSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "بيانات التعديل غير صالحة", issues: parsed.error.issues });
  const startsAt = parsed.data.startsAt ?? current.startsAt;
  const endsAt = parsed.data.endsAt ?? current.endsAt;
  const deadline = parsed.data.registrationDeadline === undefined ? current.registrationDeadline : parsed.data.registrationDeadline;
  if (endsAt <= startsAt || (deadline && deadline > startsAt)) return void res.status(400).json({ error: "تواريخ الدورة غير صالحة" });
  const [updated] = await db.update(inPersonCoursesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(inPersonCoursesTable.id, current.id)).returning();
  const cancelledNow = current.status !== "cancelled" && updated.status === "cancelled";
  const scheduleChanged =
    startsAt.getTime() !== current.startsAt.getTime() ||
    endsAt.getTime() !== current.endsAt.getTime() ||
    updated.locationAr !== current.locationAr ||
    updated.locationEn !== current.locationEn;
  if (cancelledNow || scheduleChanged) {
    const registrations = await db.select().from(inPersonCourseRegistrationsTable).where(and(
      eq(inPersonCourseRegistrationsTable.eventId, current.id),
      inArray(inPersonCourseRegistrationsTable.status, ["pending", "confirmed", "waitlisted"]),
    ));
    if (cancelledNow && registrations.length > 0) {
      await db.update(inPersonCourseRegistrationsTable).set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
        .where(and(
          eq(inPersonCourseRegistrationsTable.eventId, current.id),
          inArray(inPersonCourseRegistrationsTable.status, ["pending", "confirmed", "waitlisted"]),
        ));
    }
    if (registrations.length > 0) await notifyEventChange({ req, event: updated, registrations, cancelled: cancelledNow });
  }
  await recordAuditLog({
    actor: { id: req.user?.id ?? null, email: req.user?.email ?? null },
    action: "in_person_course.update",
    entityType: "in_person_course",
    entityId: current.id,
    description: `Updated in-person course ${current.titleAr}`,
    before: current,
    after: updated,
  });
  res.json({ course: updated });
});

router.get("/admin/in-person-courses/:id/registrations", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "sales")) return;
  const registrations = await db.select().from(inPersonCourseRegistrationsTable)
    .where(eq(inPersonCourseRegistrationsTable.eventId, req.params.id))
    .orderBy(asc(inPersonCourseRegistrationsTable.createdAt));
  res.json({ registrations: registrations.map(({ manageTokenHash: _hidden, ...row }) => row) });
});

router.patch("/admin/in-person-registrations/:id", async (req: Request, res: Response) => {
  if (!requireRole(req, res, "supervisor", "sales")) return;
  const status = req.body?.status as (typeof REGISTRATION_STATUSES)[number] | undefined;
  if (status && !REGISTRATION_STATUSES.includes(status)) return void res.status(400).json({ error: "حالة غير صالحة" });
  if (status === "cancelled") {
    const result = await cancelRegistrationAndPromote(req.params.id);
    if (!result) return void res.status(404).json({ error: "التسجيل غير موجود" });
    if (result.promoted) await sendSeatAvailableNotice({ req, event: result.event, registration: result.promoted });
    return void res.json({ registration: result.registration });
  }
  const update: Partial<typeof inPersonCourseRegistrationsTable.$inferInsert> = { updatedAt: new Date() };
  if (status) update.status = status;
  if (typeof req.body?.note === "string") update.note = req.body.note.slice(0, 1000);
  const updated = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(inPersonCourseRegistrationsTable)
      .where(eq(inPersonCourseRegistrationsTable.id, req.params.id)).limit(1);
    if (!current) return null;
    if ((status === "pending" || status === "confirmed") && current.status !== "pending" && current.status !== "confirmed") {
      await tx.execute(sql`SELECT ${inPersonCoursesTable.id} FROM ${inPersonCoursesTable} WHERE ${inPersonCoursesTable.id} = ${current.eventId} FOR UPDATE`);
      const [event] = await tx.select().from(inPersonCoursesTable).where(eq(inPersonCoursesTable.id, current.eventId)).limit(1);
      const [counts] = await tx.select({ count: sql<number>`count(*)::int` }).from(inPersonCourseRegistrationsTable)
        .where(and(
          eq(inPersonCourseRegistrationsTable.eventId, current.eventId),
          inArray(inPersonCourseRegistrationsTable.status, ["pending", "confirmed"]),
        ));
      if (!event || (counts?.count ?? 0) >= event.capacity) return "full" as const;
    }
    const [row] = await tx.update(inPersonCourseRegistrationsTable).set(update)
      .where(eq(inPersonCourseRegistrationsTable.id, current.id)).returning();
    return row;
  });
  if (updated === "full") return void res.status(409).json({ error: "اكتملت سعة الدورة؛ أبقِ التسجيل في قائمة الانتظار" });
  if (!updated) return void res.status(404).json({ error: "التسجيل غير موجود" });
  res.json({ registration: updated });
});

router.post("/cron/in-person-reminders", async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return void res.status(401).json({ error: "Unauthorized" });
  const now = new Date();
  const from = new Date(now.getTime() + 20 * 60 * 60_000);
  const to = new Date(now.getTime() + 26 * 60 * 60_000);
  const rows = await db.select({
    registration: inPersonCourseRegistrationsTable,
    event: inPersonCoursesTable,
  }).from(inPersonCourseRegistrationsTable)
    .innerJoin(inPersonCoursesTable, eq(inPersonCoursesTable.id, inPersonCourseRegistrationsTable.eventId))
    .where(and(
      inArray(inPersonCourseRegistrationsTable.status, ["pending", "confirmed"]),
      sql`${inPersonCourseRegistrationsTable.reminderSentAt} IS NULL`,
      gte(inPersonCoursesTable.startsAt, from),
      lte(inPersonCoursesTable.startsAt, to),
      ne(inPersonCoursesTable.status, "cancelled"),
    ));
  let sent = 0;
  for (const row of rows) {
    const message = `تذكير: دورة ${row.event.titleAr} غداً في ${formatEventDate(row.event.startsAt, "ar-JO", row.event.timezone)} — ${row.event.locationAr}`;
    const transporter = mailTransport();
    const whatsapp = await sendWhatsAppText(row.registration.phone, message);
    let delivered = whatsapp.ok;
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? `"بكلمة" <${process.env.SMTP_USER}>`,
          to: row.registration.email,
          subject: `تذكير بموعد ${row.event.titleAr}`,
          text: message,
        });
        delivered = true;
      } catch (err) {
        req.log.warn({ err, registrationId: row.registration.id }, "in-person reminder email failed");
      }
    }
    if (delivered) {
      await db.update(inPersonCourseRegistrationsTable).set({ reminderSentAt: new Date(), updatedAt: new Date() }).where(eq(inPersonCourseRegistrationsTable.id, row.registration.id));
      sent += 1;
    }
  }
  res.json({ ok: true, sent });
});

export default router;
