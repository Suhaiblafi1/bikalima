import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { db, workbookOrdersTable } from "@workspace/db";
import { registerLeadFromForm } from "../lib/leads.js";
import { toWaPhone } from "../lib/phone.js";

const workbookOrderRouter = Router();

const ADMIN_EMAIL = "info@bikalima.com";
const FROM_ADDRESS = process.env.SMTP_FROM ?? `"بكلمة – Bikalima" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;
const WA_NUMBER = "97455377065";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) {
    console.warn("[SMTP] Missing config — SMTP_HOST, SMTP_USER, or SMTP_PASS not set. Emails will not be sent.");
    return null;
  }
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

function buildWorkbookAdminHtml(p: {
  workbookTitle: string;
  workbookId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerCountry?: string;
  notes?: string;
  quantity: number;
  format: string;
  deliveryAddress?: string;
  displayUnitPrice: string;
  displayTotal: string;
  currencyCode: string;
  lang: string;
}) {
  const formatLabel = p.format === "pdf"
    ? "نسخة رقمية (PDF) / Digital (PDF)"
    : "نسخة مطبوعة / Printed Copy";

  const waText = encodeURIComponent(
    `أهلاً *${p.buyerName}* 📚\n\nأتواصل معك من فريق *بكلمة* للمتابعة بخصوص طلبك.\n\n` +
    `📦 *تفاصيل الطلب:*\n` +
    `• الكراسة: *${p.workbookTitle}*\n` +
    `• الصيغة: ${formatLabel}\n` +
    `• العدد: ${p.quantity} نسخة\n` +
    `• المجموع: *${p.displayTotal} دينار*\n` +
    (p.format === "print" && p.deliveryAddress ? `• عنوان التوصيل: ${p.deliveryAddress}\n` : "") +
    `\n` +
    (p.format === "pdf"
      ? `سنرسل رابط التحميل إلى بريدك الإلكتروني قريباً ✉️`
      : `نحتاج لتأكيد عنوان التوصيل وإتمام عملية الدفع لبدء الشحن 🚚`) +
    `\n\nهل لديك أي استفسار؟ 😊\n\n— فريق بكلمة ✦`
  );
  const now = new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman", dateStyle: "long", timeStyle: "short" });
  const actions = [
    `تواصل مع ${p.buyerName} لتأكيد الطلب خلال ٢٤ ساعة`,
    p.format === "pdf" ? "إرسال رابط تحميل الـ PDF إلى بريد المشتري" : "تنسيق عملية الطباعة والشحن",
    p.format === "print" ? "تأكيد عنوان التوصيل وحساب رسوم الشحن" : "التحقق من اكتمال التحميل بنجاح",
    "متابعة رضا العميل خلال ٤٨ ساعة بعد التسليم",
  ];

  return `<div dir="rtl" style="font-family:Tahoma,'Geeza Pro','Al Nile',Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;background:#f0f2f1;">
  <table cellpadding="0" cellspacing="0" bgcolor="#0d3d36" style="width:100%;background-color:#0d3d36;background:linear-gradient(150deg,#07201c 0%,#1a5c52 100%);">
    <tr>
      <td bgcolor="#0d3d36" style="padding:24px 32px 20px;">
        <table cellpadding="0" cellspacing="0"><tr><td>
          <span style="display:inline-block;background:#f59e0b;color:#1a0a00;font-size:11px;padding:5px 14px;border-radius:20px;letter-spacing:0.5px;">⚡ طلب كراسة — إجراء مطلوب</span>
        </td></tr></table>
        <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;">طلب شراء كراسة جديد</h1>
        <p style="margin:0;color:#b0d8d2;font-size:12px;">${now}</p>
      </td>
      <td bgcolor="#0d3d36" style="padding:20px 20px 20px 16px;vertical-align:top;text-align:left;">
        <div style="background:#1a5045;border:1px solid #2d7a6a;border-radius:12px;padding:14px 18px;min-width:140px;">
          <p style="margin:0 0 2px;font-size:12px;color:#c8e8e1;">المشتري</p>
          <p style="margin:0;font-size:14px;color:#ffffff;">${escapeHtml(p.buyerName)}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#d4eee9;" dir="ltr">${p.buyerPhone}</p>
        </div>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" style="width:100%;background:#fff;border-bottom:1px solid #eee;">
    <tr>
      <td style="padding:20px 32px 20px 16px;width:50%;vertical-align:top;">
        <div style="background:#f0faf8;border-radius:10px;padding:14px 16px;border:1px solid #c7e8e1;">
          <p style="margin:0 0 3px;font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">الكراسة</p>
          <p style="margin:0;font-size:13px;color:#1a5c52;">${escapeHtml(p.workbookTitle || p.workbookId)}</p>
        </div>
      </td>
      <td style="padding:20px 16px 20px 32px;width:50%;vertical-align:top;">
        <div style="background:#f0faf8;border-radius:10px;padding:14px 16px;border:1px solid #c7e8e1;">
          <p style="margin:0 0 3px;font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">المجموع</p>
          <p style="margin:0;font-size:18px;color:#1a5c52;">${p.displayTotal}</p>
          <p style="margin:2px 0 0;font-size:11px;color:#6b7280;">${p.quantity} × ${p.displayUnitPrice} (${p.currencyCode})</p>
        </div>
      </td>
    </tr>
  </table>
  <div style="background:#fff;padding:8px 32px 24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;width:42%;border-bottom:1px solid #f0f0f0;">الكراسة</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">${escapeHtml(p.workbookTitle || p.workbookId)}</td></tr>
      <tr><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">الصيغة</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">${formatLabel}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">عدد النسخ</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">${p.quantity} نسخة</td></tr>
      <tr><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">سعر النسخة</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">${p.displayUnitPrice} (${p.currencyCode})</td></tr>
      ${p.format === "print" && p.deliveryAddress ? `<tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">عنوان التوصيل</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">${escapeHtml(p.deliveryAddress)}</td></tr>` : ""}
      <tr><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">الاسم</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">${escapeHtml(p.buyerName)}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">البريد</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;" dir="ltr">${escapeHtml(p.buyerEmail)}</td></tr>
      ${p.buyerCountry ? `<tr><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">الدولة</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;">${escapeHtml(p.buyerCountry)}</td></tr>` : ""}
      ${p.notes ? `<tr style="background:#f9fafb;"><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;vertical-align:top;">ملاحظات</td><td style="padding:10px 14px;color:#374151;border-bottom:1px solid #f0f0f0;white-space:pre-wrap;">${escapeHtml(p.notes)}</td></tr>` : ""}
      <tr><td style="padding:12px 14px;color:#0d3b32;font-size:14px;">المجموع الكلي</td><td style="padding:12px 14px;color:#1a5c52;font-size:15px;">${p.displayTotal}</td></tr>
    </table>
  </div>
  <div style="padding:16px 32px 24px;">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-right:4px solid #f59e0b;border-radius:10px;padding:20px 22px;">
      <p style="margin:0 0 14px;font-size:13px;color:#92400e;">📋 الخطوات المطلوبة منك الآن</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${actions.map((step, i) => `<tr><td style="width:28px;padding:0 12px 10px 0;vertical-align:top;"><div style="width:22px;height:22px;border-radius:11px;background:#f59e0b;color:#fff;font-size:11px;text-align:center;line-height:22px;">${i + 1}</div></td><td style="padding:2px 0 10px;font-size:13px;color:#78350f;line-height:1.55;vertical-align:top;">${step}</td></tr>`).join("")}
      </table>
    </div>
  </div>
  <div style="padding:0 32px 36px;text-align:center;">
    <a href="https://wa.me/${toWaPhone(p.buyerPhone)}?text=${waText}" target="_blank"
       style="display:inline-block;background:#25D366;color:#fff;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;letter-spacing:0.3px;">
      💬 تواصل الآن مع ${escapeHtml(p.buyerName)}
    </a>
    <p style="margin:12px 0 0;color:#6b7280;font-size:12px;" dir="ltr">${escapeHtml(p.buyerPhone)} · ${escapeHtml(p.buyerEmail)}</p>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.82);">معيار رضا العملاء: رد أولي خلال ٢٤ ساعة — متابعة كاملة خلال ٧٢ ساعة ✦ بكلمة</p>
  </div>
</div>`;
}

function buildWorkbookApplicantConfirmationHtml(p: {
  workbookTitle: string;
  workbookId: string;
  buyerName: string;
  buyerPhone: string;
  quantity: number;
  format: string;
  deliveryAddress?: string;
  displayUnitPrice: string;
  displayTotal: string;
  lang: string;
}) {
  const lang = (["ar", "en", "fr"].includes(p.lang) ? p.lang : "ar") as "ar" | "en" | "fr";
  const dir = lang === "ar" ? "rtl" : "ltr";

  const formatLabels: Record<"ar" | "en" | "fr", Record<"pdf" | "print", string>> = {
    ar: { pdf: "نسخة رقمية (PDF)", print: "نسخة مطبوعة" },
    en: { pdf: "Digital Copy (PDF)", print: "Printed Copy" },
    fr: { pdf: "Copie numérique (PDF)", print: "Copie imprimée" },
  };
  const formatLabel = formatLabels[lang][p.format as "pdf" | "print"] || p.format;

  const waText = encodeURIComponent(
    lang === "ar"
      ? `أهلاً فريق بكلمة 📚\n\nاسمي *${p.buyerName}* وطلبت للتو عبر الموقع.\n\n` +
        `📦 *تفاصيل طلبي:*\n• الكراسة: *${p.workbookTitle}*\n• الصيغة: ${formatLabels.ar[p.format as "pdf"|"print"]}\n• العدد: ${p.quantity} نسخة\n• المجموع: ${p.displayTotal} دينار\n\n` +
        `أودّ الاستفسار عن الخطوات القادمة لاستلام الطلب.\n\nشكراً 🙏`
      : lang === "fr"
      ? `Bonjour l'équipe Bikalima 📚\n\nJe m'appelle *${p.buyerName}* et je viens de passer une commande.\n\n` +
        `📦 *Détails de ma commande :*\n• Cahier : *${p.workbookTitle}*\n• Format : ${formatLabels.fr[p.format as "pdf"|"print"]}\n• Quantité : ${p.quantity} exemplaire(s)\n• Total : ${p.displayTotal} JOD\n\n` +
        `J'aimerais connaître les prochaines étapes pour recevoir ma commande.\n\nMerci 🙏`
      : `Hello Bikalima team 📚\n\nMy name is *${p.buyerName}* and I just placed an order.\n\n` +
        `📦 *My order details:*\n• Workbook: *${p.workbookTitle}*\n• Format: ${formatLabels.en[p.format as "pdf"|"print"]}\n• Quantity: ${p.quantity} copy/copies\n• Total: ${p.displayTotal} JOD\n\n` +
        `I'd like to know the next steps to receive my order.\n\nThank you 🙏`
  );

  const texts: Record<"ar" | "en" | "fr", Record<string, string>> = {
    ar: {
      hero: `${escapeHtml(p.buyerName)}، طلبك وصلنا — المعرفة في طريقها إليك ✦`,
      greeting: `${escapeHtml(p.buyerName)}،`,
      body: `تلقّينا طلب شراء <strong>${escapeHtml(p.workbookTitle)}</strong> بنجاح تام. نحن سعداء بثقتك في مواد بكلمة التدريبية.`,
      note: p.format === "print"
        ? "سيتواصل معك أحد أعضاء فريقنا قريباً لتأكيد تفاصيل الشحن والتوصيل. السعر المذكور لا يشمل رسوم التوصيل."
        : "سيتم مراجعة طلبك وإرسال رابط التحميل إلى بريدك الإلكتروني في أقرب وقت.",
      stepsTitle: "ما الذي يحدث الآن",
      s1t: "استلام الطلب", s1d: "اكتمل — وصلنا طلبك بنجاح ✓",
      s2t: p.format === "pdf" ? "إعداد رابط التحميل" : "تجهيز ومعالجة الطلب",
      s2d: p.format === "pdf" ? "جارٍ الآن — سيصلك الرابط قريباً" : "جارٍ الآن — التنسيق مع الطباعة والشحن",
      s3t: p.format === "pdf" ? "تسليم الـ PDF" : "الشحن والتوصيل",
      s3d: p.format === "pdf" ? "سيصلك رابط التحميل عبر البريد" : "سيتم التواصل معك لتأكيد التوصيل",
      summaryTitle: "ملخص الطلب",
      workbookLabel: "الكراسة",
      formatLabel: "الصيغة",
      quantityLabel: "عدد النسخ",
      unitLabel: "سعر النسخة",
      deliveryLabel: "عنوان التوصيل",
      totalLabel: "المجموع الكلي",
      shippingNote: "* السعر لا يشمل رسوم التوصيل — سيتم التواصل لحساب رسوم الشحن",
      quote: "لا تُقاس الكلمات بعددها، بل بالأثر الذي تتركه في القلوب.",
      waBtn: "تواصل مع فريق بكلمة",
      footer: "بكلمة ✦ صناعة الأثر وفن الإلقاء والخطابة",
    },
    en: {
      hero: `${escapeHtml(p.buyerName)}, your order is in — knowledge is on its way ✦`,
      greeting: `${escapeHtml(p.buyerName)},`,
      body: `We've successfully received your order for <strong>${escapeHtml(p.workbookTitle)}</strong>. Thank you for choosing Bikalima's training materials.`,
      note: p.format === "print"
        ? "A member of our team will contact you soon to confirm shipping details. Price does not include delivery fees."
        : "Your order is being processed and a download link will be sent to your email shortly.",
      stepsTitle: "What happens next",
      s1t: "Order Received", s1d: "Complete — your order is confirmed ✓",
      s2t: p.format === "pdf" ? "Preparing Download Link" : "Processing Your Order",
      s2d: p.format === "pdf" ? "In progress — link coming soon" : "In progress — coordinating print & shipping",
      s3t: p.format === "pdf" ? "PDF Delivery" : "Shipping & Delivery",
      s3d: p.format === "pdf" ? "Download link will be sent to your email" : "We'll contact you to confirm delivery",
      summaryTitle: "Order Summary",
      workbookLabel: "Workbook",
      formatLabel: "Format",
      quantityLabel: "Quantity",
      unitLabel: "Unit Price",
      deliveryLabel: "Delivery Address",
      totalLabel: "Total",
      shippingNote: "* Price does not include shipping fees — we will contact you to calculate delivery costs",
      quote: "Words are not measured by their count, but by the impression they leave on hearts.",
      waBtn: "Chat with the Bikalima team",
      footer: "Bikalima ✦ The Art of Impactful Speech",
    },
    fr: {
      hero: `${escapeHtml(p.buyerName)}, votre commande est reçue — la connaissance arrive ✦`,
      greeting: `${escapeHtml(p.buyerName)},`,
      body: `Nous avons bien reçu votre commande pour <strong>${escapeHtml(p.workbookTitle)}</strong>. Merci de faire confiance aux supports Bikalima.`,
      note: p.format === "print"
        ? "Un membre de notre équipe vous contactera bientôt pour les détails de livraison. Le prix n'inclut pas les frais de port."
        : "Votre commande est en cours de traitement et un lien de téléchargement vous sera envoyé par e-mail.",
      stepsTitle: "Ce qui se passe maintenant",
      s1t: "Commande reçue", s1d: "Confirmée — votre commande est enregistrée ✓",
      s2t: p.format === "pdf" ? "Préparation du lien" : "Traitement de la commande",
      s2d: p.format === "pdf" ? "En cours — lien bientôt disponible" : "En cours — coordination impression & envoi",
      s3t: p.format === "pdf" ? "Livraison PDF" : "Expédition & livraison",
      s3d: p.format === "pdf" ? "Le lien sera envoyé par e-mail" : "Nous vous contacterons pour confirmer la livraison",
      summaryTitle: "Résumé de la commande",
      workbookLabel: "Cahier",
      formatLabel: "Format",
      quantityLabel: "Quantité",
      unitLabel: "Prix unitaire",
      deliveryLabel: "Adresse de livraison",
      totalLabel: "Total",
      shippingNote: "* Le prix n'inclut pas les frais de port — nous vous contacterons pour calculer les frais",
      quote: "Les mots ne se mesurent pas à leur nombre, mais à l'empreinte qu'ils laissent dans les cœurs.",
      waBtn: "Contacter l'équipe Bikalima",
      footer: "Bikalima ✦ L'art de la parole impactante",
    },
  };

  const t = texts[lang];
  const bSide = lang === "ar" ? "right" : "left";

  const steps = [
    { icon: "✓", title: t.s1t, desc: t.s1d, bg: "#1a5c52", textColor: "#0d3b32", descColor: "#374151", borderColor: "#1a5c52", rowBg: "#e8f5f2" },
    { icon: "2", title: t.s2t, desc: t.s2d, bg: "#f59e0b", textColor: "#7c2d12", descColor: "#92400e", borderColor: "#f59e0b", rowBg: "#fef3c7" },
    { icon: "3", title: t.s3t, desc: t.s3d, bg: "#94a3b8", textColor: "#334155", descColor: "#475569", borderColor: "#cbd5e1", rowBg: "#f1f5f9" },
  ];

  return `<div dir="${dir}" style="font-family:Tahoma,'Geeza Pro','Al Nile',Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;background:#f0f0ee;">
  <table cellpadding="0" cellspacing="0" bgcolor="#0f4a40" style="width:100%;background-color:#0f4a40;background:linear-gradient(160deg,#07201c 0%,#1a5c52 50%,#25786a 100%);">
    <tr><td bgcolor="#0f4a40" style="padding:52px 32px 44px;text-align:center;">
      <p style="margin:0 0 6px;font-size:32px;">📚</p>
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;color:#b0d8d2;text-transform:uppercase;">${lang === "ar" ? "بكلمة ✦ مكتبة المعرفة" : lang === "fr" ? "Bikalima ✦ Bibliothèque" : "Bikalima ✦ Knowledge Library"}</p>
      <h1 style="margin:0;font-size:24px;color:#ffffff;line-height:1.35;">${t.hero}</h1>
    </td></tr>
  </table>
  <div style="background:#fff;padding:36px 32px 24px;">
    <p style="margin:0 0 4px;font-size:18px;color:#1a5c52;">${t.greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#1f2937;">${t.body}</p>
    <div style="background:#f8faff;border:1px solid #c7d2fe;border-radius:10px;padding:20px 22px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;color:#4338ca;text-transform:uppercase;">${t.summaryTitle}</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="background:#f0f4ff;"><td style="padding:9px 12px;color:#374151;width:42%;border-bottom:1px solid #e0e7ff;">${t.workbookLabel}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${escapeHtml(p.workbookTitle)}</td></tr>
        <tr><td style="padding:9px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${t.formatLabel}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${formatLabel}</td></tr>
        <tr style="background:#f0f4ff;"><td style="padding:9px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${t.quantityLabel}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${p.quantity} ${lang === "ar" ? "نسخة" : lang === "fr" ? "exemplaire(s)" : "copy/copies"}</td></tr>
        <tr><td style="padding:9px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${t.unitLabel}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${p.displayUnitPrice}</td></tr>
        ${p.format === "print" && p.deliveryAddress ? `<tr style="background:#f0f4ff;"><td style="padding:9px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${t.deliveryLabel}</td><td style="padding:9px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${escapeHtml(p.deliveryAddress)}</td></tr>` : ""}
        <tr style="background:#e8f0ff;"><td style="padding:11px 12px;color:#1e3a5f;font-size:14px;">${t.totalLabel}</td><td style="padding:11px 12px;font-size:18px;color:#1a5c52;">${p.displayTotal}</td></tr>
      </table>
      ${p.format === "print" ? `<p style="margin:10px 0 0;font-size:11px;color:#6b7280;">${t.shippingNote}</p>` : ""}
    </div>
    <div style="background:#f0faf8;border-${bSide}:4px solid #1a5c52;border-radius:4px;padding:13px 18px;margin-bottom:0;">
      <p style="margin:0;font-size:13px;color:#0d3b32;line-height:1.7;">${t.note}</p>
    </div>
  </div>
  <div style="background:#fff;padding:8px 32px 32px;">
    <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;color:#6b7280;text-transform:uppercase;">${t.stepsTitle}</p>
    ${steps.map((s, i) => `<div style="border-${bSide}:4px solid ${s.borderColor};background:${s.rowBg};border-radius:4px;padding:13px 18px;margin-bottom:${i < 2 ? "8px" : "0"};">
      <table cellpadding="0" cellspacing="0" style="width:100%;"><tr>
        <td style="width:32px;vertical-align:top;padding:0 12px 0 0;">
          <div style="width:28px;height:28px;border-radius:14px;background:${s.bg};color:#fff;font-size:12px;text-align:center;line-height:28px;">${s.icon}</div>
        </td>
        <td style="vertical-align:top;">
          <p style="margin:0 0 2px;font-size:13px;color:${s.textColor};">${s.title}</p>
          <p style="margin:0;font-size:12px;color:${s.descColor};">${s.desc}</p>
        </td>
      </tr></table>
    </div>`).join("")}
  </div>
  <div style="background:#f0faf8;padding:28px 32px;text-align:center;border-top:2px solid #d1ede9;border-bottom:2px solid #d1ede9;">
    <p style="margin:0 0 4px;font-size:36px;color:#7ec8bc;line-height:1;font-family:Georgia,serif;">&#8220;</p>
    <p style="margin:0;font-size:15px;font-style:italic;color:#1f2937;line-height:1.75;max-width:420px;margin:0 auto;">${t.quote}</p>
    <p style="margin:4px 0 0;font-size:36px;color:#7ec8bc;line-height:1;font-family:Georgia,serif;">&#8221;</p>
  </div>
  <div style="background:#fff;padding:32px 32px;text-align:center;">
    <a href="https://wa.me/${WA_NUMBER}?text=${waText}" target="_blank"
       style="display:inline-block;background:linear-gradient(135deg,#25D366,#1aa34a);color:#fff;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;letter-spacing:0.3px;">
      💬 ${t.waBtn}
    </a>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.88);">${t.footer} | ${ADMIN_EMAIL}</p>
  </div>
</div>`;
}

workbookOrderRouter.post("/workbook-order", async (req: Request, res: Response) => {
  try {
    const {
      workbookId,
      workbookTitle,
      quantity,
      format,
      deliveryAddress,
      buyerName,
      buyerPhone,
      buyerEmail,
      buyerCountry,
      notes,
      unitPrice,
      lang,
      currencyCode,
      displayUnitPrice,
      displayTotal,
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
      buyerCountry: buyerCountry || null,
      notes: notes || null,
      deliveryAddress: format === "print" ? deliveryAddress : null,
      totalPrice: total,
      currency: currencyCode || "JOD",
      leadSource: "website",
      syncStatus: "pending",
    });

    // ── CRM: register/upsert as a lead and fire automations ───────────
    try {
      await registerLeadFromForm({
        contact: {
          fullName: buyerName || buyerEmail || buyerPhone || "بدون اسم",
          phone: buyerPhone || null,
          email: buyerEmail || null,
          country: buyerCountry || null,
          source: "workbook_order",
          interestProgramTitle: workbookTitle || workbookId || null,
        },
        activity: {
          type: "linked_workbook_order",
          summaryAr: `طلب كراسة: ${workbookTitle || workbookId} (${format || "pdf"})`,
          relatedEntityType: "workbook_order",
        },
        trigger: "workbook_order.created",
        triggerPayload: { workbookId, format: format || "pdf" },
      });
    } catch (err) {
      console.warn("[CRM] workbook lead upsert failed:", err);
    }

    const transporter = buildTransporter();
    if (transporter) {
      console.info(`[SMTP] Sending workbook order emails — from: ${FROM_ADDRESS}, admin: ${ADMIN_EMAIL}, buyer: ${buyerEmail}`);
      const adminHtml = buildWorkbookAdminHtml({
        workbookTitle: workbookTitle ?? workbookId,
        workbookId: workbookId || "unknown",
        buyerName: buyerName || "",
        buyerPhone: buyerPhone || "",
        buyerEmail: buyerEmail || "",
        buyerCountry: buyerCountry || "",
        notes: notes || "",
        quantity: quantity || 1,
        format: format || "pdf",
        deliveryAddress: format === "print" ? deliveryAddress : undefined,
        displayUnitPrice: displayUnitPrice || `${unitPrice} JOD`,
        displayTotal: displayTotal || `${total} JOD`,
        currencyCode: currencyCode || "JOD",
        lang: lang || "ar",
      });

      const applicantHtml = buildWorkbookApplicantConfirmationHtml({
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
            subject: `بكلمة ✦ طلب كراسة — ${workbookTitle ?? workbookId} / ${buyerName}`,
            html: adminHtml,
          }),
          buyerEmail
            ? transporter.sendMail({
                from: FROM_ADDRESS,
                to: buyerEmail,
                replyTo: ADMIN_EMAIL,
                subject:
                  lang === "fr"
                    ? `Bikalima ✦ Votre commande est confirmée — ${workbookTitle ?? workbookId}`
                    : lang === "en"
                    ? `Bikalima ✦ Your order is confirmed — ${workbookTitle ?? workbookId}`
                    : `بكلمة ✦ وصل طلبك — ${workbookTitle ?? workbookId}`,
                html: applicantHtml,
              })
            : Promise.resolve(),
        ]);
        console.info("[SMTP] Workbook order emails sent successfully.");
      } catch (mailErr: unknown) {
        const msg = mailErr instanceof Error ? mailErr.message : String(mailErr);
        console.error("[SMTP] Failed to send workbook order email:", msg);
      }
    } else {
      console.warn("[SMTP] Transporter is null — emails not sent for workbook order.");
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("Workbook order error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

workbookOrderRouter.get("/my/workbook-orders", async (req: Request, res: Response) => {
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

// ── Owned workbooks (the "مكتباتي" tab) ──────────────────────────────
// Returns the catalog entry for every workbook the learner has actually
// purchased — i.e. workbook_orders that are fulfilled (confirmed for
// digital/PDF, or shipped/delivered for print). Rows are de-duplicated by
// workbook so multiple orders of the same title appear once with the
// most recent fulfillment metadata.
workbookOrderRouter.get("/my/workbooks", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { eq, and, desc, inArray } = await import("drizzle-orm");
    const { workbooksTable } = await import("@workspace/db");
    const orders = await db
      .select()
      .from(workbookOrdersTable)
      .where(
        and(
          eq(workbookOrdersTable.userId, req.user.id),
          inArray(workbookOrdersTable.status, ["confirmed", "shipped", "delivered"] as const),
        ),
      )
      .orderBy(desc(workbookOrdersTable.createdAt));

    if (orders.length === 0) {
      res.json({ workbooks: [] });
      return;
    }

    const workbookIds = Array.from(new Set(orders.map((o) => o.workbookId).filter(Boolean)));
    const catalog = workbookIds.length
      ? await db.select().from(workbooksTable).where(inArray(workbooksTable.id, workbookIds))
      : [];
    const catalogById = new Map(catalog.map((w) => [w.id, w]));

    const seen = new Set<string>();
    const items: Array<Record<string, unknown>> = [];
    for (const o of orders) {
      if (seen.has(o.workbookId)) continue;
      seen.add(o.workbookId);
      const wb = catalogById.get(o.workbookId);
      items.push({
        orderId: o.id,
        workbookId: o.workbookId,
        format: o.format,
        status: o.status,
        purchasedAt: o.createdAt,
        slug: wb?.slug ?? null,
        titleAr: wb?.titleAr ?? null,
        titleEn: wb?.titleEn ?? null,
        descriptionAr: wb?.descriptionAr ?? null,
        descriptionEn: wb?.descriptionEn ?? null,
        coverImageUrl: wb?.coverImageUrl ?? null,
        samplePdfUrl: wb?.samplePdfUrl ?? null,
      });
    }

    res.json({ workbooks: items });
  } catch (err) {
    req.log.error({ err }, "GET /my/workbooks failed");
    res.status(500).json({ error: "Failed to fetch owned workbooks" });
  }
});

export default workbookOrderRouter;
