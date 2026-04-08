import { Router } from "express";
import nodemailer from "nodemailer";
import { db, workbookOrdersTable } from "../db.js";
import { toWaPhone } from "../lib/phone.js";

const router = Router();

const ADMIN_EMAIL = "info@bikalima.com";
const WA_NUMBER = "97455377065";
const FROM_ADDRESS =
  process.env.SMTP_FROM ??
  `"بكلمة – Bikalima" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) {
    console.warn("[SMTP] Missing config — workbook order emails will not be sent.");
    return null;
  }
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

function buildAdminHtml(p) {
  const formatLabel =
    p.format === "pdf"
      ? "نسخة رقمية (PDF)"
      : "نسخة مطبوعة";
  const waText = encodeURIComponent(
    `أهلاً *${p.buyerName}* 📚\n\nأتواصل معك من فريق *بكلمة* بخصوص طلبك.\n\n` +
    `• الكراسة: *${p.workbookTitle}*\n• الصيغة: ${formatLabel}\n• العدد: ${p.quantity}\n• المجموع: *${p.displayTotal}*\n\n` +
    `هل لديك أي استفسار؟ — فريق بكلمة ✦`
  );
  const now = new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman", dateStyle: "long", timeStyle: "short" });

  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:620px;margin:0 auto;background:#f0f2f1;">
  <table cellpadding="0" cellspacing="0" bgcolor="#0d3d36" style="width:100%;background:linear-gradient(150deg,#07201c 0%,#1a5c52 100%);">
    <tr>
      <td bgcolor="#0d3d36" style="padding:24px 32px 20px;">
        <span style="display:inline-block;background:#f59e0b;color:#1a0a00;font-size:11px;padding:5px 14px;border-radius:20px;">⚡ طلب كراسة — إجراء مطلوب</span>
        <h1 style="margin:12px 0 4px;color:#fff;font-size:22px;">طلب شراء كراسة جديد</h1>
        <p style="margin:0;color:#b0d8d2;font-size:12px;">${now}</p>
      </td>
      <td bgcolor="#0d3d36" style="padding:20px 16px;vertical-align:top;">
        <div style="background:#1a5045;border:1px solid #2d7a6a;border-radius:12px;padding:14px 18px;min-width:140px;">
          <p style="margin:0 0 2px;font-size:12px;color:#c8e8e1;">المشتري</p>
          <p style="margin:0;font-size:14px;color:#fff;">${p.buyerName}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#d4eee9;" dir="ltr">${p.buyerPhone}</p>
        </div>
      </td>
    </tr>
  </table>
  <div style="background:#fff;padding:8px 32px 24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;width:42%;border-bottom:1px solid #f0f0f0;">الكراسة</td><td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;">${p.workbookTitle || p.workbookId}</td></tr>
      <tr><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">الصيغة</td><td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;">${formatLabel}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">عدد النسخ</td><td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;">${p.quantity} نسخة</td></tr>
      <tr><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">سعر النسخة</td><td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;">${p.displayUnitPrice} (${p.currencyCode})</td></tr>
      ${p.format === "print" && p.deliveryAddress ? `<tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">عنوان التوصيل</td><td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;">${p.deliveryAddress}</td></tr>` : ""}
      <tr><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">الاسم</td><td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;">${p.buyerName}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">البريد</td><td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;" dir="ltr">${p.buyerEmail}</td></tr>
      <tr><td style="padding:12px 14px;color:#0d3b32;font-size:14px;">المجموع الكلي</td><td style="padding:12px 14px;color:#1a5c52;font-size:15px;">${p.displayTotal}</td></tr>
    </table>
  </div>
  <div style="padding:0 32px 36px;text-align:center;">
    <a href="https://wa.me/${toWaPhone(p.buyerPhone)}?text=${waText}" target="_blank"
       style="display:inline-block;background:#25D366;color:#fff;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;">
      💬 تواصل الآن مع ${p.buyerName}
    </a>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.82);">معيار رضا العملاء: رد أولي خلال ٢٤ ساعة ✦ بكلمة</p>
  </div>
</div>`;
}

function buildApplicantHtml(p) {
  const lang = (["ar", "en"].includes(p.lang) ? p.lang : "ar");
  const dir = lang === "ar" ? "rtl" : "ltr";
  const bSide = lang === "ar" ? "right" : "left";
  const formatLabel =
    lang === "ar"
      ? p.format === "pdf" ? "نسخة رقمية (PDF)" : "نسخة مطبوعة"
      : p.format === "pdf" ? "Digital Copy (PDF)" : "Printed Copy";
  const waText = encodeURIComponent(
    lang === "ar"
      ? `أهلاً فريق بكلمة 📚\n\nاسمي *${p.buyerName}* وطلبت للتو عبر الموقع.\n• الكراسة: *${p.workbookTitle}*\n• الصيغة: ${formatLabel}\n• المجموع: ${p.displayTotal}\n\nأودّ الاستفسار عن الخطوات القادمة.\n\nشكراً 🙏`
      : `Hello Bikalima team 📚\n\nMy name is *${p.buyerName}* and I just placed an order.\n• Workbook: *${p.workbookTitle}*\n• Format: ${formatLabel}\n• Total: ${p.displayTotal}\n\nI'd like to know the next steps.\n\nThank you 🙏`
  );
  const hero = lang === "ar"
    ? `${p.buyerName}، طلبك وصلنا — المعرفة في طريقها إليك ✦`
    : `${p.buyerName}, your order is in — knowledge is on its way ✦`;
  const body = lang === "ar"
    ? `تلقّينا طلب شراء <strong>${p.workbookTitle}</strong> بنجاح تام.`
    : `We've successfully received your order for <strong>${p.workbookTitle}</strong>.`;
  const note = lang === "ar"
    ? (p.format === "print"
      ? "سيتواصل معك أحد أعضاء فريقنا قريباً لتأكيد تفاصيل الشحن."
      : "سيتم إرسال رابط التحميل إلى بريدك الإلكتروني في أقرب وقت.")
    : (p.format === "print"
      ? "A member of our team will contact you soon to confirm shipping details."
      : "Your order is being processed and a download link will be sent to your email shortly.");

  return `<div dir="${dir}" style="font-family:Tahoma,Arial,sans-serif;max-width:620px;margin:0 auto;background:#f0f0ee;">
  <table cellpadding="0" cellspacing="0" bgcolor="#0f4a40" style="width:100%;background:linear-gradient(160deg,#07201c 0%,#1a5c52 50%,#25786a 100%);">
    <tr><td bgcolor="#0f4a40" style="padding:52px 32px 44px;text-align:center;">
      <p style="margin:0 0 6px;font-size:32px;">📚</p>
      <h1 style="margin:0;font-size:24px;color:#fff;line-height:1.35;">${hero}</h1>
    </td></tr>
  </table>
  <div style="background:#fff;padding:36px 32px 24px;">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#1f2937;">${body}</p>
    <div style="background:#f8faff;border:1px solid #c7d2fe;border-radius:10px;padding:20px 22px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="background:#f0f4ff;"><td style="padding:9px 12px;color:#374151;width:42%;border-bottom:1px solid #e0e7ff;">${lang === "ar" ? "الكراسة" : "Workbook"}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${p.workbookTitle}</td></tr>
        <tr><td style="padding:9px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${lang === "ar" ? "الصيغة" : "Format"}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${formatLabel}</td></tr>
        <tr style="background:#f0f4ff;"><td style="padding:9px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${lang === "ar" ? "عدد النسخ" : "Quantity"}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${p.quantity}</td></tr>
        <tr><td style="padding:9px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${lang === "ar" ? "سعر النسخة" : "Unit Price"}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${p.displayUnitPrice}</td></tr>
        ${p.format === "print" && p.deliveryAddress ? `<tr style="background:#f0f4ff;"><td style="padding:9px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${lang === "ar" ? "عنوان التوصيل" : "Delivery Address"}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${p.deliveryAddress}</td></tr>` : ""}
        <tr style="background:#e8f0ff;"><td style="padding:11px 12px;color:#1e3a5f;font-size:14px;">${lang === "ar" ? "المجموع" : "Total"}</td><td style="padding:11px 12px;font-size:18px;color:#1a5c52;">${p.displayTotal}</td></tr>
      </table>
    </div>
    <div style="background:#f0faf8;border-${bSide}:4px solid #1a5c52;border-radius:4px;padding:13px 18px;">
      <p style="margin:0;font-size:13px;color:#0d3b32;line-height:1.7;">${note}</p>
    </div>
  </div>
  <div style="background:#fff;padding:24px 32px;text-align:center;">
    <a href="https://wa.me/${WA_NUMBER}?text=${waText}" target="_blank"
       style="display:inline-block;background:linear-gradient(135deg,#25D366,#1aa34a);color:#fff;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;">
      💬 ${lang === "ar" ? "تواصل مع فريق بكلمة" : "Chat with the Bikalima team"}
    </a>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.88);">${lang === "ar" ? "بكلمة ✦ صناعة الأثر" : "Bikalima ✦ The Art of Impactful Speech"} | ${ADMIN_EMAIL}</p>
  </div>
</div>`;
}

router.post("/workbook-order", async (req, res) => {
  try {
    const {
      workbookId, workbookTitle, quantity, format, deliveryAddress,
      buyerName, buyerPhone, buyerEmail, unitPrice, lang,
      currencyCode, displayUnitPrice, displayTotal,
    } = req.body;

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
      currency: currencyCode || "JOD",
    });

    const transporter = buildTransporter();
    if (transporter) {
      const adminHtml = buildAdminHtml({
        workbookTitle: workbookTitle ?? workbookId,
        workbookId: workbookId || "unknown",
        buyerName: buyerName || "",
        buyerPhone: buyerPhone || "",
        buyerEmail: buyerEmail || "",
        quantity: quantity || 1,
        format: format || "pdf",
        deliveryAddress: format === "print" ? deliveryAddress : undefined,
        displayUnitPrice: displayUnitPrice || `${unitPrice} JOD`,
        displayTotal: displayTotal || `${total} JOD`,
        currencyCode: currencyCode || "JOD",
        lang: lang || "ar",
      });
      const applicantHtml = buildApplicantHtml({
        workbookTitle: workbookTitle ?? workbookId,
        workbookId: workbookId || "unknown",
        buyerName: buyerName || "",
        buyerPhone: buyerPhone || "",
        quantity: quantity || 1,
        format: format || "pdf",
        deliveryAddress: format === "print" ? deliveryAddress : undefined,
        displayUnitPrice: displayUnitPrice || `${unitPrice} JOD`,
        displayTotal: displayTotal || `${total} JOD`,
        lang: lang || "ar",
      });

      try {
        await Promise.all([
          transporter.sendMail({
            from: FROM_ADDRESS,
            to: ADMIN_EMAIL,
            replyTo: buyerEmail,
            subject: `📚 طلب كراسة جديد — ${buyerName} (${workbookTitle || workbookId})`,
            html: adminHtml,
          }),
          transporter.sendMail({
            from: FROM_ADDRESS,
            to: buyerEmail,
            subject: lang === "ar" || !lang
              ? `وصل طلبك بنجاح — بكلمة 📚`
              : `Your order received — Bikalima 📚`,
            html: applicantHtml,
          }),
        ]);
      } catch (emailErr) {
        console.error("[WorkbookOrder] Email error:", emailErr);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[WorkbookOrder] Error:", err);
    res.status(500).json({ error: "Failed to submit workbook order" });
  }
});

export default router;
