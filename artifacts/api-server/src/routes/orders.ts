import { Router, type IRouter, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import {
  db,
  ordersTable,
  coursesTable,
  enrollmentsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

const SMTP_FROM =
  process.env.SMTP_FROM ?? `"بكلمة" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) {
    console.warn("[SMTP] Missing config — LMS order emails will not be sent.");
    return null;
  }
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

router.post("/orders", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "يجب تسجيل الدخول أولاً لإتمام الطلب" });
    return;
  }
  try {
    const { courseId, buyerName, buyerEmail, buyerPhone, paymentNotes } = req.body;
    if (!courseId || !buyerName || !buyerEmail || !buyerPhone) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [course] = await db
      .select({ id: coursesTable.id, titleAr: coursesTable.titleAr, titleEn: coursesTable.titleEn, price: coursesTable.price })
      .from(coursesTable)
      .where(eq(coursesTable.id, courseId));

    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }

    const userId = req.user.id;

    const [order] = await db.insert(ordersTable).values({
      userId,
      courseId: course.id,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.toLowerCase().trim(),
      buyerPhone: buyerPhone.trim(),
      amount: course.price ?? null,
      currency: "JOD",
      status: "pending",
      paymentNotes: paymentNotes?.trim() || null,
    }).returning();

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

    res.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error("POST /orders error:", err);
    res.status(500).json({ error: "Failed to submit order" });
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
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}

router.get("/my/orders", handleMyOrders);
router.get("/my/lms-orders", handleMyOrders);

export { router as ordersRouter };
export default router;
