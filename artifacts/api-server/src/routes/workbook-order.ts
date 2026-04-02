import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { db, workbookOrdersTable } from "@workspace/db";
import { toWaPhone } from "../lib/phone.js";

const workbookOrderRouter = Router();

const RECIPIENT = "suhaib@ilgholding.com";


function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

workbookOrderRouter.post("/workbook-order", async (req: Request, res: Response) => {
  try {
    const { workbookId, workbookTitle, quantity, format, deliveryAddress, buyerName, buyerPhone, buyerEmail, unitPrice, lang } = req.body;
    const total = (unitPrice ?? 0) * (quantity ?? 1);

    const userId = req.isAuthenticated() ? req.user?.id : null;

    await db.insert(workbookOrdersTable).values({
      userId: userId || null,
      workbookId: workbookId || "unknown",
      quantity: quantity || 1,
      format: format || "pdf",
      buyerName: buyerName || "",
      buyerEmail: buyerEmail || "",
      buyerPhone: buyerPhone || "",
      deliveryAddress: format === "print" ? deliveryAddress : null,
      totalPrice: total,
      currency: "JOD",
    });

    const formatLabel = format === "pdf" ? "نسخة رقمية (PDF)" : "نسخة مطبوعة";

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
        <div style="background:#2d7a6d;padding:24px 32px;color:#fff">
          <h1 style="margin:0;font-size:22px">📚 طلب شراء كراسة جديد</h1>
        </div>
        <div style="padding:24px 32px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#666;width:140px">الكراسة</td><td style="padding:8px 0;font-weight:bold">${workbookTitle ?? workbookId}</td></tr>
            <tr><td style="padding:8px 0;color:#666">الاسم</td><td style="padding:8px 0;font-weight:bold">${buyerName}</td></tr>
            <tr><td style="padding:8px 0;color:#666">الهاتف</td><td style="padding:8px 0;font-weight:bold">${buyerPhone}</td></tr>
            <tr><td style="padding:8px 0;color:#666">البريد</td><td style="padding:8px 0;font-weight:bold">${buyerEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#666">الصيغة</td><td style="padding:8px 0;font-weight:bold">${formatLabel}</td></tr>
            <tr><td style="padding:8px 0;color:#666">العدد</td><td style="padding:8px 0;font-weight:bold">${quantity}</td></tr>
            <tr><td style="padding:8px 0;color:#666">السعر للنسخة</td><td style="padding:8px 0;font-weight:bold">${unitPrice} JOD</td></tr>
            <tr><td style="padding:8px 0;color:#666;font-weight:bold">المجموع</td><td style="padding:8px 0;font-weight:bold;color:#2d7a6d;font-size:18px">${total} JOD</td></tr>
            ${format === "print" && deliveryAddress ? `<tr><td style="padding:8px 0;color:#666">عنوان التوصيل</td><td style="padding:8px 0;font-weight:bold">${deliveryAddress}</td></tr>` : ""}
          </table>
          ${format === "print" ? '<p style="color:#b45309;font-size:12px;margin-top:16px">⚠️ السعر لا يشمل رسوم التوصيل</p>' : ""}
          <p style="color:#999;font-size:11px;margin-top:24px">اللغة: ${lang} • ${new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman" })}</p>
          <div style="margin-top:16px;text-align:center;">
            <a href="https://wa.me/${toWaPhone(buyerPhone)}?text=${encodeURIComponent(`السلام عليكم ${buyerName} 👋\n\nشكراً على طلبك لكراسة *بكلمة* 📚\n\n📋 *ملخص طلبك:*\n• الكراسة: ${workbookTitle}\n• العدد: ${quantity} نسخة\n• الصيغة: ${formatLabel}\n\nسنتواصل معك قريباً لتأكيد تفاصيل الاستلام.\n\nفريق بكلمة ✨`)}" target="_blank" style="display:inline-block;background:#25D366;color:white;font-weight:bold;padding:10px 24px;border-radius:50px;text-decoration:none;font-size:14px;">💬 تواصل عبر واتساب مع المشتري</a>
          </div>
        </div>
      </div>`;

    const transporter = buildTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"بكلمة" <${process.env.SMTP_USER}>`,
        to: RECIPIENT,
        replyTo: buyerEmail,
        subject: `طلب كراسة: ${workbookTitle} — ${buyerName}`,
        html,
      });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("Workbook order error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

workbookOrderRouter.get("/my/orders", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { eq, desc } = await import("drizzle-orm");
    const orders = await db
      .select()
      .from(workbookOrdersTable)
      .where(eq(workbookOrdersTable.userId, req.user.id))
      .orderBy(desc(workbookOrdersTable.createdAt));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default workbookOrderRouter;
