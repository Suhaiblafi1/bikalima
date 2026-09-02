import { Router, type IRouter, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { z } from "zod";
import {
  db,
  ordersTable,
  coursesTable,
  enrollmentsTable,
  discountCodesTable,
  discountCodeReservationsTable,
  orderEventsTable,
  paymentWebhookEventsTable,
} from "@workspace/db";
import { eq, desc, and, inArray, lte, ne, sql } from "drizzle-orm";
import { paymentService, toMinorUnits as toStripeMinorUnits } from "../integrations/paymentService.js";
import { isFeatureEnabled } from "../lib/platform.js";
import { authRateLimit } from "../middlewares/security.js";

const router: IRouter = Router();
// Tight per-IP ceiling on checkout creation: prevents Stripe-session abuse
// and accidental floods from a misbehaving client. 12 attempts / 5 min.
const orderCreateLimiter = authRateLimit(12, 5 * 60_000);
const discountValidateLimiter = authRateLimit(30, 5 * 60_000);

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character] ?? character);
}

const SMTP_FROM =
  process.env.SMTP_FROM ?? `"بكلمة" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

function getPublicOrigin(req: Request): string {
  const fromEnv = process.env.PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const domains = (process.env.REPLIT_DOMAINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (domains.length > 0) return `https://${domains[0]}`;
  const dev = process.env.REPLIT_DEV_DOMAIN;
  if (dev) return `https://${dev}`;
  // This origin becomes Stripe's success_url and cancel_url, so in production
  // it must come from a trusted deployment setting and never from a
  // caller-controlled Host header — the same rule appOrigin() enforces for
  // password links. validateEnvironment() also requires PUBLIC_APP_URL in
  // production, but that is a separate check that could be relaxed
  // independently of this one; a redirect target after payment is not
  // something to leave resting on it.
  if (process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_APP_URL must be configured in production");
  }
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

/** The pool, or a transaction inside it — same convention as creditSkillPoints. */
type Executor = Pick<typeof db, "insert">;

async function ensureEnrollment(userId: string, courseId: string, executor: Executor = db): Promise<void> {
  await executor
    .insert(enrollmentsTable)
    .values({ userId, courseId, status: "active" })
    .onConflictDoNothing({ target: [enrollmentsTable.userId, enrollmentsTable.courseId] });
}

// Strict zod schema for the order-create request. Centralises shape +
// length limits and produces a uniform 400 response on failure.
const CreateOrderSchema = z.object({
  courseId: z.string().trim().min(1).max(80),
  deliveryFormat: z.enum(["recorded", "zoom", "blended"]).default("recorded"),
  buyerName: z.string().trim().min(1).max(120),
  buyerEmail: z.string().trim().email().max(200),
  buyerPhone: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .refine((v) => /^\d{7,15}$/.test(v.replace(/[\s\-().+]/g, "")), {
      message: "Invalid phone number",
    }),
  paymentNotes: z.string().max(500).optional().nullable(),
  discountCode: z.string().trim().max(64).optional(),
});

const ValidateDiscountSchema = z.object({
  courseId: z.string().trim().min(1).max(80),
  deliveryFormat: z.enum(["recorded", "zoom", "blended"]).default("recorded"),
  code: z.string().trim().min(3).max(64),
});

type AppliedDiscount = {
  id: string;
  code: string;
  discountAmount: number;
  finalAmount: number;
};

async function resolveDiscount(codeInput: string, courseId: string, originalAmount: number): Promise<AppliedDiscount | null> {
  const code = codeInput.trim().toUpperCase();
  if (!code) return null;
  const [discount] = await db
    .select()
    .from(discountCodesTable)
    .where(eq(discountCodesTable.code, code))
    .limit(1);
  if (!discount || !discount.isActive) return null;

  const now = Date.now();
  if (discount.startsAt && discount.startsAt.getTime() > now) return null;
  if (discount.expiresAt && discount.expiresAt.getTime() < now) return null;
  if (discount.courseId && discount.courseId !== courseId) return null;
  await db.update(discountCodeReservationsTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(discountCodeReservationsTable.status, "held"), lte(discountCodeReservationsTable.expiresAt, new Date())));
  if (discount.maxUses !== null) {
    const [held] = await db.select({ count: sql<number>`count(*)::int` })
      .from(discountCodeReservationsTable)
      .where(and(eq(discountCodeReservationsTable.discountCodeId, discount.id), eq(discountCodeReservationsTable.status, "held")));
    if (discount.usedCount + (held?.count ?? 0) >= discount.maxUses) return null;
  }

  const rawDiscount = discount.discountType === "percent"
    ? Math.floor(originalAmount * discount.discountValue / 100)
    : discount.discountValue;
  const discountAmount = Math.max(0, Math.min(originalAmount, rawDiscount));
  return {
    id: discount.id,
    code: discount.code,
    discountAmount,
    finalAmount: Math.max(0, originalAmount - discountAmount),
  };
}

export async function markOrderPaid(args: {
  orderId: string;
  paymentSessionId?: string | null;
  paymentIntentId?: string | null;
  providerEventId?: string | null;
  source: "verify" | "webhook" | "admin" | "free";
  actorUserId?: string | null;
}) {
  const now = new Date();
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT ${ordersTable.id} FROM ${ordersTable} WHERE ${ordersTable.id} = ${args.orderId} FOR UPDATE`);
    const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, args.orderId)).limit(1);
    if (!order) return null;
    // An administrator cannot revive a cancelled order manually. A signed
    // provider event is still honoured because money may already have moved.
    if (order.status === "cancelled" && args.source === "admin") throw new Error("order_not_payable");

    if (order.status !== "paid" && order.status !== "refunded" && order.status !== "partially_refunded") {
      await tx.update(ordersTable).set({
        status: "paid",
        paidAt: order.paidAt ?? now,
        paymentProvider: order.paymentProvider ?? "stripe",
        paymentSessionId: args.paymentSessionId ?? order.paymentSessionId,
        paymentIntentId: args.paymentIntentId ?? order.paymentIntentId,
        failureCode: null,
        updatedAt: now,
      }).where(eq(ordersTable.id, order.id));

      const [reservation] = await tx.select().from(discountCodeReservationsTable)
        .where(eq(discountCodeReservationsTable.orderId, order.id))
        .limit(1);
      if (reservation?.status === "held") {
        const [consumed] = await tx.update(discountCodeReservationsTable).set({ status: "consumed", consumedAt: now, updatedAt: now })
          .where(and(eq(discountCodeReservationsTable.id, reservation.id), eq(discountCodeReservationsTable.status, "held")))
          .returning({ id: discountCodeReservationsTable.id });
        if (consumed) {
          await tx.update(discountCodesTable).set({ usedCount: sql`${discountCodesTable.usedCount} + 1`, updatedAt: now })
            .where(eq(discountCodesTable.id, reservation.discountCodeId));
        }
      } else if (reservation && reservation.status !== "consumed") {
        await tx.execute(sql`SELECT ${discountCodesTable.id} FROM ${discountCodesTable} WHERE ${discountCodesTable.id} = ${reservation.discountCodeId} FOR UPDATE`);
        const [discount] = await tx.select().from(discountCodesTable)
          .where(eq(discountCodesTable.id, reservation.discountCodeId)).limit(1);
        const [held] = await tx.select({ count: sql<number>`count(*)::int` }).from(discountCodeReservationsTable)
          .where(and(eq(discountCodeReservationsTable.discountCodeId, reservation.discountCodeId), eq(discountCodeReservationsTable.status, "held")));
        const available = !!discount?.isActive && (discount.maxUses === null || discount.usedCount + (held?.count ?? 0) < discount.maxUses);
        if (!available && args.source === "admin") throw new Error("discount_reservation_expired");
        const [consumed] = await tx.update(discountCodeReservationsTable).set({ status: "consumed", consumedAt: now, releasedAt: null, updatedAt: now })
          .where(and(
            eq(discountCodeReservationsTable.id, reservation.id),
            inArray(discountCodeReservationsTable.status, ["expired", "released"]),
          )).returning({ id: discountCodeReservationsTable.id });
        if (consumed) {
          await tx.update(discountCodesTable).set({ usedCount: sql`${discountCodesTable.usedCount} + 1`, updatedAt: now })
            .where(eq(discountCodesTable.id, reservation.discountCodeId));
        }
      }
    }

    await tx.insert(orderEventsTable).values({
      orderId: order.id,
      type: "payment_succeeded",
      providerEventId: args.providerEventId ?? null,
      actorUserId: args.actorUserId ?? null,
      data: { source: args.source, paymentSessionId: args.paymentSessionId ?? null, paymentIntentId: args.paymentIntentId ?? null },
    }).onConflictDoNothing();

    // The access the buyer paid for lands in the same transaction as the
    // payment itself. Enrolling after the commit left a window where an
    // order was durably "paid" with no enrollment row and no course access,
    // and nothing re-drove it afterwards — reachable from all three callers
    // (webhook, verify-session, admin approve). The insert is idempotent, so
    // pulling it inside costs nothing.
    if (order.userId && order.courseId) await ensureEnrollment(order.userId, order.courseId, tx);
    return order;
  });
  return result;
}

export async function releaseDiscountReservation(orderId: string, reason: string): Promise<void> {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(discountCodeReservationsTable)
      .set({ status: "released", releasedAt: now, updatedAt: now })
      .where(and(eq(discountCodeReservationsTable.orderId, orderId), eq(discountCodeReservationsTable.status, "held")));
    await tx.insert(orderEventsTable).values({ orderId, type: "discount_released", data: { reason } });
  });
}

router.post("/discount-codes/validate", discountValidateLimiter, async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
    return;
  }
  const parsed = ValidateDiscountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ valid: false, error: "بيانات كود الخصم غير صالحة" });
    return;
  }
  const [course] = await db
    .select({ id: coursesTable.id, price: coursesTable.price, discountPrice: coursesTable.discountPrice, recordedPrice: coursesTable.recordedPrice, zoomPrice: coursesTable.zoomPrice, blendedPrice: coursesTable.blendedPrice, deliveryFormats: coursesTable.deliveryFormats })
    .from(coursesTable)
    .where(and(eq(coursesTable.id, parsed.data.courseId), eq(coursesTable.isPublished, true)))
    .limit(1);
  if (!course) {
    res.status(404).json({ valid: false, error: "الدورة غير موجودة" });
    return;
  }
  if (course.deliveryFormats?.length && !course.deliveryFormats.includes(parsed.data.deliveryFormat)) {
    res.status(400).json({ valid: false, error: "صيغة الدراسة غير متاحة" }); return;
  }
  const originalAmount = parsed.data.deliveryFormat === "zoom"
    ? (course.zoomPrice ?? course.price ?? 0)
    : parsed.data.deliveryFormat === "blended"
      ? (course.blendedPrice ?? course.price ?? 0)
      : (course.recordedPrice ?? course.discountPrice ?? course.price ?? 0);
  const discount = await resolveDiscount(parsed.data.code, course.id, originalAmount);
  if (!discount) {
    res.status(400).json({ valid: false, error: "الكود غير صالح أو انتهت صلاحيته" });
    return;
  }
  res.json({ valid: true, code: discount.code, originalAmount, discountAmount: discount.discountAmount, finalAmount: discount.finalAmount });
});

router.post("/orders", orderCreateLimiter, async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "يجب تسجيل الدخول أولاً لإتمام الطلب" });
    return;
  }
  try {
    // Server-side enforcement of the `payments` feature flag. Free
    // courses (chargeAmount <= 0) are still allowed below since they
    // never touch the payment gateway.
    const paymentsEnabled = await isFeatureEnabled("payments");
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
      return;
    }
    const { courseId, deliveryFormat, buyerName, buyerEmail, buyerPhone, paymentNotes, discountCode } = parsed.data;

    const [course] = await db
      .select({ id: coursesTable.id, slug: coursesTable.slug, titleAr: coursesTable.titleAr, titleEn: coursesTable.titleEn, price: coursesTable.price, discountPrice: coursesTable.discountPrice, recordedPrice: coursesTable.recordedPrice, zoomPrice: coursesTable.zoomPrice, blendedPrice: coursesTable.blendedPrice, deliveryFormats: coursesTable.deliveryFormats })
      .from(coursesTable)
      .where(and(eq(coursesTable.id, courseId), eq(coursesTable.isPublished, true)));

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const userId = req.user.id;
    if (course.deliveryFormats?.length && !course.deliveryFormats.includes(deliveryFormat)) {
      res.status(400).json({ error: "صيغة الدراسة غير متاحة لهذه الدورة" }); return;
    }
    const originalAmount = deliveryFormat === "zoom"
      ? (course.zoomPrice ?? course.price ?? 0)
      : deliveryFormat === "blended"
        ? (course.blendedPrice ?? course.price ?? 0)
        : (course.recordedPrice ?? course.discountPrice ?? course.price ?? 0);
    const discount = discountCode ? await resolveDiscount(discountCode, course.id, originalAmount) : null;
    if (discountCode && !discount) {
      res.status(400).json({ error: "كود الخصم غير صالح أو انتهت صلاحيته" });
      return;
    }
    const chargeAmount = discount?.finalAmount ?? originalAmount;

    if (chargeAmount > 0 && !paymentsEnabled) {
      res.status(503).json({ error: "الدفع الإلكتروني معطّل مؤقتاً" });
      return;
    }

    const orderStatus = chargeAmount <= 0 ? "paid" : "pending";
    const order = await db.transaction(async (tx) => {
      const [created] = await tx.insert(ordersTable).values({
        userId,
        courseId: course.id,
        deliveryFormat,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerPhone: buyerPhone.trim(),
        amount: chargeAmount,
        originalAmount,
        discountAmount: discount?.discountAmount ?? 0,
        discountCodeId: discount?.id ?? null,
        discountCode: discount?.code ?? null,
        currency: "JOD",
        status: orderStatus,
        paymentProvider: chargeAmount > 0 && paymentService.isEnabled() ? "stripe" : "manual",
        paidAt: chargeAmount <= 0 ? new Date() : null,
        paymentNotes: paymentNotes?.trim() || null,
      }).returning();

      if (discount) {
        await tx.execute(sql`SELECT ${discountCodesTable.id} FROM ${discountCodesTable} WHERE ${discountCodesTable.id} = ${discount.id} FOR UPDATE`);
        await tx.update(discountCodeReservationsTable).set({ status: "expired", updatedAt: new Date() })
          .where(and(eq(discountCodeReservationsTable.status, "held"), lte(discountCodeReservationsTable.expiresAt, new Date())));
        const [fresh] = await tx.select().from(discountCodesTable).where(eq(discountCodesTable.id, discount.id)).limit(1);
        const [held] = await tx.select({ count: sql<number>`count(*)::int` }).from(discountCodeReservationsTable)
          .where(and(eq(discountCodeReservationsTable.discountCodeId, discount.id), eq(discountCodeReservationsTable.status, "held")));
        if (!fresh?.isActive || (fresh.maxUses !== null && fresh.usedCount + (held?.count ?? 0) >= fresh.maxUses)) {
          throw new Error("discount_exhausted");
        }
        const consumed = chargeAmount <= 0;
        await tx.insert(discountCodeReservationsTable).values({
          discountCodeId: discount.id,
          orderId: created.id,
          status: consumed ? "consumed" : "held",
          // Five-minute buffer beyond the 30-minute Stripe session avoids a
          // race between session completion and reservation cleanup.
          expiresAt: new Date(Date.now() + (paymentService.isEnabled() ? 35 : 48 * 60) * 60_000),
          consumedAt: consumed ? new Date() : null,
        });
        if (consumed) {
          await tx.update(discountCodesTable).set({ usedCount: sql`${discountCodesTable.usedCount} + 1`, updatedAt: new Date() })
            .where(eq(discountCodesTable.id, discount.id));
        }
      }
      await tx.insert(orderEventsTable).values({
        orderId: created.id,
        type: chargeAmount <= 0 ? "payment_succeeded" : "order_created",
        actorUserId: userId,
        data: { deliveryFormat, discountCode: discount?.code ?? null, amount: chargeAmount },
      });
      return created;
    });

    // If course is free, enroll immediately and skip the payment gateway.
    if (chargeAmount <= 0) {
      await ensureEnrollment(userId, course.id);
      res.json({ success: true, orderId: order.id, paid: true });
      return;
    }

    // If a payment gateway is configured, create a checkout session and
    // hand the user off to it. The success page will verify the session
    // and grant access.
    if (paymentService.isEnabled()) {
      const origin = getPublicOrigin(req);
      const slug = course.slug ?? course.id;
      const successUrl = `${origin}/confirmation?slug=${encodeURIComponent(slug)}&order_id=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/checkout?slug=${encodeURIComponent(slug)}&payment=cancelled`;

      const result = await paymentService.createCheckoutSession({
        amount: chargeAmount,
        currency: "JOD",
        description: course.titleAr,
        customerEmail: buyerEmail.toLowerCase().trim(),
        successUrl,
        cancelUrl,
        metadata: {
          orderId: order.id,
          courseId: course.id,
          userId,
          discountCode: discount?.code ?? "",
        },
        idempotencyKey: `checkout-order-${order.id}`,
      });

      if (result.ok) {
        await db.transaction(async (tx) => {
          await tx.update(ordersTable).set({ paymentSessionId: result.sessionId, paymentProvider: "stripe", updatedAt: new Date() }).where(eq(ordersTable.id, order.id));
          await tx.insert(orderEventsTable).values({ orderId: order.id, type: "checkout_session_created", data: { sessionId: result.sessionId } });
        });
        res.json({ success: true, orderId: order.id, checkoutUrl: result.url, sessionId: result.sessionId });
        return;
      }

      req.log.error({ result }, "stripe checkout session creation failed");
      // Mark the order failed so admins can see it didn't go through.
      await db.update(ordersTable).set({ status: "failed", failureCode: result.reason === "error" ? result.message : "not_configured", updatedAt: new Date() }).where(eq(ordersTable.id, order.id));
      await releaseDiscountReservation(order.id, "checkout_session_failed");
      res.status(502).json({
        error:
          result.reason === "not_configured"
            ? "Payment gateway not configured"
            : `Payment gateway error: ${result.message}`,
      });
      return;
    }

    // ── Fallback: no payment gateway configured. Keep the legacy
    // manual-confirmation flow (admin emails, contact-the-buyer).
    const transporter = buildTransporter();
    if (transporter) {
      const safeTitle = escapeHtml(course.titleAr);
      const safeName = escapeHtml(buyerName);
      const safeEmail = escapeHtml(buyerEmail);
      const safePhone = escapeHtml(buyerPhone);
      const safeNotes = paymentNotes ? escapeHtml(paymentNotes) : "";
      const adminHtml = `
<div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;max-width:600px;margin:auto;background:#f9f7f2;border-radius:12px;overflow:hidden">
  <div style="background:#25786A;padding:24px 28px">
    <h2 style="color:#fff;margin:0;font-size:22px">طلب تسجيل جديد في دورة</h2>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">بكلمة — منصة التدريب</p>
  </div>
  <div style="padding:24px 28px;background:#fff">
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:8px 0;color:#555;width:140px">الدورة</td><td style="padding:8px 0;font-weight:bold;color:#1a1a1a">${safeTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#555">الاسم</td><td style="padding:8px 0;color:#1a1a1a">${safeName}</td></tr>
      <tr><td style="padding:8px 0;color:#555">البريد</td><td style="padding:8px 0;color:#1a1a1a" dir="ltr">${safeEmail}</td></tr>
      <tr><td style="padding:8px 0;color:#555">الهاتف</td><td style="padding:8px 0;color:#1a1a1a" dir="ltr">${safePhone}</td></tr>
      ${safeNotes ? `<tr><td style="padding:8px 0;color:#555">ملاحظات</td><td style="padding:8px 0;color:#1a1a1a">${safeNotes}</td></tr>` : ""}
    </table>
    <div style="margin-top:20px;padding:12px 16px;background:#f0faf7;border-radius:8px;border-right:4px solid #25786A">
      <p style="margin:0;font-size:13px;color:#25786A">يرجى مراجعة الطلب في لوحة الإدارة والموافقة عليه بعد التحقق من الدفع.</p>
    </div>
  </div>
</div>`;
      const studentHtml = `
<div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;max-width:600px;margin:auto;background:#f9f7f2;border-radius:12px;overflow:hidden">
  <div style="background:#25786A;padding:24px 28px">
    <h2 style="color:#fff;margin:0;font-size:22px">تم استلام طلبك</h2>
  </div>
  <div style="padding:24px 28px;background:#fff">
    <p style="font-size:16px;color:#1a1a1a">مرحباً ${safeName}،</p>
    <p style="color:#555;line-height:1.6">لقد تلقّينا طلب تسجيلك في دورة <strong>${safeTitle}</strong>. سيتواصل معك فريقنا قريباً لإتمام إجراءات الدفع وتفعيل حسابك.</p>
    <p style="color:#555;font-size:14px">للاستفسار: <a href="mailto:info@bikalima.com" style="color:#25786A">info@bikalima.com</a></p>
  </div>
</div>`;
      await Promise.allSettled([
        transporter.sendMail({ from: SMTP_FROM, to: "info@bikalima.com", subject: `طلب تسجيل — ${course.titleAr}`, html: adminHtml }),
        transporter.sendMail({ from: SMTP_FROM, to: buyerEmail, subject: `تم استلام طلبك — ${course.titleAr} | بكلمة`, html: studentHtml }),
      ]);
    }

    res.json({ success: true, orderId: order.id, manualReview: true });
  } catch (err) {
    if ((err as Error).message === "discount_exhausted") {
      res.status(409).json({ error: "نفدت مرات استخدام كود الخصم" });
      return;
    }
    req.log.error({ err }, "POST /orders error");
    res.status(500).json({ error: "Failed to submit order" });
  }
});

router.post("/webhooks/stripe", async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (typeof signature !== "string" || !rawBody) {
    res.status(400).json({ error: "Missing Stripe signature" });
    return;
  }
  const event = paymentService.verifyWebhook(rawBody, signature);
  if (!event.ok) {
    res.status(event.reason === "not_configured" ? 503 : 400).json({ error: event.message });
    return;
  }
  try {
    const [claimed] = await db.insert(paymentWebhookEventsTable).values({
      id: event.eventId,
      provider: "stripe",
      eventType: event.eventType,
    }).onConflictDoNothing().returning({ id: paymentWebhookEventsTable.id });
    if (!claimed) {
      res.json({ received: true, duplicate: true });
      return;
    }

    const orderId = event.metadata.orderId;
    if (!orderId) {
      req.log.warn({ eventId: event.eventId, eventType: event.eventType }, "Stripe event without order metadata");
      res.json({ received: true, ignored: true });
      return;
    }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) {
      req.log.warn({ eventId: event.eventId, orderId }, "Stripe event references missing order");
      res.json({ received: true, ignored: true });
      return;
    }

    if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.eventType) && event.paid) {
      if (event.currency && order.currency && event.currency.toLowerCase() !== order.currency.toLowerCase()) {
        throw new Error("webhook_currency_mismatch");
      }
      if (event.amountTotal != null && order.amount != null && event.amountTotal !== toStripeMinorUnits(order.amount, order.currency ?? "JOD")) {
        throw new Error("webhook_amount_mismatch");
      }
      await markOrderPaid({
        orderId: order.id,
        paymentSessionId: event.sessionId,
        paymentIntentId: event.paymentIntentId,
        providerEventId: event.eventId,
        source: "webhook",
      });
    } else if (["checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.eventType)) {
      await db.update(ordersTable).set({
        status: event.eventType === "checkout.session.expired" ? "expired" : "failed",
        failureCode: event.eventType,
        updatedAt: new Date(),
      }).where(and(eq(ordersTable.id, order.id), ne(ordersTable.status, "paid")));
      await releaseDiscountReservation(order.id, event.eventType);
    }
    res.json({ received: true });
  } catch (err) {
    req.log.error({ err, eventId: event.eventId }, "Stripe webhook processing failed");
    // Release the claim when processing did not finish. Stripe can then retry
    // the same event; completed events remain claimed and idempotent.
    await db.delete(paymentWebhookEventsTable)
      .where(eq(paymentWebhookEventsTable.id, event.eventId))
      .catch((deleteErr) => req.log.error({ deleteErr, eventId: event.eventId }, "Failed to release webhook claim"));
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Verifies a Stripe Checkout session, marks the order paid (idempotent),
// and creates the enrollment so the student can immediately access the
// course on the success page.
//
// SECURITY: the order id is taken authoritatively from the Stripe session's
// metadata — never from the client — and we cross-check that the session's
// metadata user/course and the session's amount/currency match the order
// we created. This prevents a buyer from paying a cheap order and using
// that session to mark an expensive order paid.
router.post("/orders/verify-session", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const sessionId = String(req.body?.sessionId ?? "").trim();
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }
    if (!paymentService.isEnabled()) {
      res.status(503).json({ error: "Payment gateway not configured" });
      return;
    }

    const status = await paymentService.getSessionStatus(sessionId);
    if (!status.ok) {
      res.status(502).json({
        error:
          status.reason === "not_configured"
            ? "Payment gateway not configured"
            : `Payment verification failed: ${status.message}`,
      });
      return;
    }

    // Authoritative binding: the order id MUST come from the session
    // metadata that we set when creating the session. Any client-supplied
    // orderId is ignored.
    const orderId = status.metadata.orderId;
    const metaUserId = status.metadata.userId;
    const metaCourseId = status.metadata.courseId;
    if (!orderId || !metaUserId || !metaCourseId) {
      res.status(400).json({ error: "Session is not bound to an order" });
      return;
    }

    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId));

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // The session metadata must match the order, AND the order must
    // belong to the calling user. Any mismatch is a tampering attempt.
    if (
      order.userId !== metaUserId ||
      order.courseId !== metaCourseId ||
      order.userId !== req.user.id
    ) {
      req.log.warn(
        { orderId, sessionId, userId: req.user.id },
        "verify-session: session/order/user mismatch",
      );
      res.status(403).json({ error: "Session does not match this order" });
      return;
    }

    if (!status.paid) {
      if (order.status === "pending") {
        await db
          .update(ordersTable)
          .set({ status: "awaiting_payment", updatedAt: new Date() })
          .where(eq(ordersTable.id, order.id));
      }
      res.json({ paid: false, status: order.status });
      return;
    }

    // Verify the amount Stripe actually charged matches what we recorded
    // for this order (in the same minor-unit convention Stripe uses).
    if (status.currency && order.currency && status.currency.toLowerCase() !== order.currency.toLowerCase()) {
      req.log.warn({ orderId, sessionId }, "verify-session: currency mismatch");
      res.status(409).json({ error: "Payment currency does not match order" });
      return;
    }
    if (status.amountTotal != null && order.amount != null) {
      const expectedMinor = toStripeMinorUnits(order.amount, order.currency ?? "JOD");
      if (status.amountTotal !== expectedMinor) {
        req.log.warn(
          { orderId, sessionId, expectedMinor, actual: status.amountTotal },
          "verify-session: amount mismatch",
        );
        res.status(409).json({ error: "Payment amount does not match order" });
        return;
      }
    }

    // Mark paid, consume any held discount, and grant access atomically/idempotently.
    await markOrderPaid({
      orderId: order.id,
      paymentSessionId: status.sessionId,
      paymentIntentId: status.paymentIntentId,
      source: "verify",
      actorUserId: req.user.id,
    });

    res.json({ paid: true, orderId: order.id, courseId: order.courseId });
  } catch (err) {
    req.log.error({ err }, "POST /orders/verify-session error");
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

async function handleMyOrders(req: Request, res: Response): Promise<void> {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        courseId: ordersTable.courseId,
        courseTitleAr: coursesTable.titleAr,
        courseTitleEn: coursesTable.titleEn,
        amount: ordersTable.amount,
        originalAmount: ordersTable.originalAmount,
        discountAmount: ordersTable.discountAmount,
        discountCode: ordersTable.discountCode,
        deliveryFormat: ordersTable.deliveryFormat,
        currency: ordersTable.currency,
        status: ordersTable.status,
        paymentProvider: ordersTable.paymentProvider,
        paidAt: ordersTable.paidAt,
        refundedAt: ordersTable.refundedAt,
        refundAmount: ordersTable.refundAmount,
        paymentNotes: ordersTable.paymentNotes,
        adminNotes: ordersTable.adminNotes,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .leftJoin(coursesTable, eq(ordersTable.courseId, coursesTable.id))
      .where(eq(ordersTable.userId, req.user.id))
      .orderBy(desc(ordersTable.createdAt));

    res.json({ orders });
  } catch (err) {
    req.log.error({ err }, "fetch my orders failed");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}

router.get("/my/orders", handleMyOrders);
router.get("/my/lms-orders", handleMyOrders);

export { router as ordersRouter };
export default router;
