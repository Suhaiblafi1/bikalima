import { Router, type IRouter, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { z } from "zod";
import {
  db,
  ordersTable,
  coursesTable,
  enrollmentsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { paymentService, toMinorUnits as toStripeMinorUnits } from "../integrations/paymentService.js";
import { isFeatureEnabled } from "../lib/platform.js";
import { authRateLimit } from "../middlewares/security.js";

const router: IRouter = Router();
// Tight per-IP ceiling on checkout creation: prevents Stripe-session abuse
// and accidental floods from a misbehaving client. 12 attempts / 5 min.
const orderCreateLimiter = authRateLimit(12, 5 * 60_000);

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
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.get("host") ?? "localhost";
  return `${proto}://${host}`;
}

async function ensureEnrollment(userId: string, courseId: string): Promise<void> {
  const existing = await db
    .select({ id: enrollmentsTable.id })
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(enrollmentsTable).values({ userId, courseId, status: "active" });
}

// Strict zod schema for the order-create request. Centralises shape +
// length limits and produces a uniform 400 response on failure.
const CreateOrderSchema = z.object({
  courseId: z.string().trim().min(1).max(80),
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
    const { courseId, buyerName, buyerEmail, buyerPhone, paymentNotes } = parsed.data;

    const [course] = await db
      .select({ id: coursesTable.id, slug: coursesTable.slug, titleAr: coursesTable.titleAr, titleEn: coursesTable.titleEn, price: coursesTable.price, discountPrice: coursesTable.discountPrice })
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId));

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const userId = req.user.id;
    const chargeAmount = course.discountPrice ?? course.price ?? 0;

    // If course is free, enroll immediately and skip the payment gateway.
    if (chargeAmount <= 0) {
      const [order] = await db.insert(ordersTable).values({
        userId,
        courseId: course.id,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerPhone: buyerPhone.trim(),
        amount: 0,
        currency: "JOD",
        status: "paid",
        paymentNotes: paymentNotes?.trim() || null,
      }).returning();
      await ensureEnrollment(userId, course.id);
      res.json({ success: true, orderId: order.id, paid: true });
      return;
    }

    if (!paymentsEnabled) {
      res.status(503).json({ error: "الدفع الإلكتروني معطّل مؤقتاً" });
      return;
    }

    const [order] = await db.insert(ordersTable).values({
      userId,
      courseId: course.id,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.toLowerCase().trim(),
      buyerPhone: buyerPhone.trim(),
      amount: chargeAmount,
      currency: "JOD",
      status: "pending",
      paymentNotes: paymentNotes?.trim() || null,
    }).returning();

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
        },
      });

      if (result.ok) {
        res.json({ success: true, orderId: order.id, checkoutUrl: result.url, sessionId: result.sessionId });
        return;
      }

      req.log.error({ result }, "stripe checkout session creation failed");
      // Mark the order failed so admins can see it didn't go through.
      await db.update(ordersTable).set({ status: "failed", updatedAt: new Date() }).where(eq(ordersTable.id, order.id));
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
      const adminHtml = `
<div dir="rtl" style="font-family:Tajawal,Arial,sans-serif;max-width:600px;margin:auto;background:#f9f7f2;border-radius:12px;overflow:hidden">
  <div style="background:#25786A;padding:24px 28px">
    <h2 style="color:#fff;margin:0;font-size:22px">طلب تسجيل جديد في دورة</h2>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">بكلمة — منصة التدريب</p>
  </div>
  <div style="padding:24px 28px;background:#fff">
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:8px 0;color:#555;width:140px">الدورة</td><td style="padding:8px 0;font-weight:bold;color:#1a1a1a">${course.titleAr}</td></tr>
      <tr><td style="padding:8px 0;color:#555">الاسم</td><td style="padding:8px 0;color:#1a1a1a">${buyerName}</td></tr>
      <tr><td style="padding:8px 0;color:#555">البريد</td><td style="padding:8px 0;color:#1a1a1a" dir="ltr">${buyerEmail}</td></tr>
      <tr><td style="padding:8px 0;color:#555">الهاتف</td><td style="padding:8px 0;color:#1a1a1a" dir="ltr">${buyerPhone}</td></tr>
      ${paymentNotes ? `<tr><td style="padding:8px 0;color:#555">ملاحظات</td><td style="padding:8px 0;color:#1a1a1a">${paymentNotes}</td></tr>` : ""}
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
    <p style="font-size:16px;color:#1a1a1a">مرحباً ${buyerName}،</p>
    <p style="color:#555;line-height:1.6">لقد تلقّينا طلب تسجيلك في دورة <strong>${course.titleAr}</strong>. سيتواصل معك فريقنا قريباً لإتمام إجراءات الدفع وتفعيل حسابك.</p>
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
    req.log.error({ err }, "POST /orders error");
    res.status(500).json({ error: "Failed to submit order" });
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

    // Mark order paid (idempotent) and ensure the enrollment exists.
    if (order.status !== "paid") {
      await db
        .update(ordersTable)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(ordersTable.id, order.id));
    }

    if (order.courseId && order.userId) {
      await ensureEnrollment(order.userId, order.courseId);
    }

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
        currency: ordersTable.currency,
        status: ordersTable.status,
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
