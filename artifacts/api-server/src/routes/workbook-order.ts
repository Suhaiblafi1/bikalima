import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { db, workbookOrdersTable } from "@workspace/db";
import { toWaPhone } from "../lib/phone.js";

const workbookOrderRouter = Router();

const ADMIN_EMAIL = "info@bikalima.com";
const FROM_ADDRESS = process.env.SMTP_FROM ?? `"بكلمة – Bikalima" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;
const WA_NUMBER = "97455377065";

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
    `أهلاً ${p.buyerName} ✦\n\nشكراً على طلبك لكراسة *${p.workbookTitle}* من *بكلمة* 📚\n\n` +
    `*ملخص الطلب:*\n• الكراسة: ${p.workbookTitle}\n• العدد: ${p.quantity} نسخة\n• الصيغة: ${formatLabel}\n• المجموع: ${p.displayTotal}\n\n` +
    `سأتواصل معك قريباً لتأكيد تفاصيل الاستلام والشحن.\n\nفريق بكلمة ✦`
  );

  return `
    <div dir="rtl" style="font-family:Georgia,'Times New Roman',Arial,sans-serif;max-width:620px;margin:0 auto;background:#f4f6f5;padding:0;">
      <div style="background:linear-gradient(135deg,#1a5c52 0%,#0f3d35 100%);padding:32px 36px;text-align:center;">
        <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:3px;text-transform:uppercase;">بكلمة ✦ Bikalima</p>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:normal;letter-spacing:1px;">طلب كراسة جديد</h1>
        <div style="margin:14px auto 0;width:40px;height:2px;background:rgba(255,255,255,0.25);"></div>
      </div>

      <div style="background:#fff;padding:28px 36px 0;">
        <h2 style="margin:0 0 16px;font-size:14px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-weight:normal;font-family:Arial,sans-serif;">تفاصيل الطلب</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;font-family:Arial,sans-serif;">
          <tr style="background:#f9fafb;">
            <td style="padding:11px 16px;color:#6b7280;width:42%;border-bottom:1px solid #f0f0f0;font-size:13px;">الكراسة</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${p.workbookTitle || p.workbookId}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;color:#6b7280;border-bottom:1px solid #f0f0f0;font-size:13px;">الصيغة</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${formatLabel}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:11px 16px;color:#6b7280;border-bottom:1px solid #f0f0f0;font-size:13px;">عدد النسخ</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${p.quantity} نسخة</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;color:#6b7280;border-bottom:1px solid #f0f0f0;font-size:13px;">سعر النسخة</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${p.displayUnitPrice} (${p.currencyCode})</td>
          </tr>
          <tr style="background:#e8f5f2;">
            <td style="padding:13px 16px;color:#1a5c52;font-weight:bold;font-size:14px;border-bottom:1px solid #d1ede9;">المجموع الكلي</td>
            <td style="padding:13px 16px;font-weight:bold;color:#1a5c52;font-size:17px;border-bottom:1px solid #d1ede9;">${p.displayTotal}</td>
          </tr>
          ${p.format === "print" && p.deliveryAddress ? `
          <tr>
            <td style="padding:11px 16px;color:#6b7280;border-bottom:1px solid #f0f0f0;font-size:13px;">عنوان التوصيل</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${p.deliveryAddress}</td>
          </tr>` : ""}
        </table>
        ${p.format === "print" ? '<p style="margin:12px 0 0;padding:10px 14px;background:#fffbeb;border-radius:6px;border-right:3px solid #f59e0b;font-size:12px;color:#92400e;font-family:Arial,sans-serif;">السعر لا يشمل رسوم التوصيل — سيتم التواصل لتنسيق الشحن.</p>' : ""}
      </div>

      <div style="background:#fff;padding:24px 36px 0;margin-top:20px;border-top:1px solid #f0f0f0;">
        <h2 style="margin:0 0 16px;font-size:14px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-weight:normal;font-family:Arial,sans-serif;">بيانات المشتري</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;font-family:Arial,sans-serif;">
          <tr style="background:#f9fafb;">
            <td style="padding:11px 16px;color:#6b7280;width:42%;border-bottom:1px solid #f0f0f0;font-size:13px;">الاسم</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${p.buyerName}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;color:#6b7280;border-bottom:1px solid #f0f0f0;font-size:13px;">رقم الهاتف</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;" dir="ltr">${p.buyerPhone}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:11px 16px;color:#6b7280;border-bottom:1px solid #f0f0f0;font-size:13px;">البريد الإلكتروني</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;" dir="ltr">${p.buyerEmail}</td>
          </tr>
          <tr>
            <td style="padding:11px 16px;color:#6b7280;border-bottom:1px solid #f0f0f0;font-size:13px;">لغة المشتري</td>
            <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${p.lang === "en" ? "English" : p.lang === "fr" ? "Français" : "العربية"}</td>
          </tr>
        </table>
      </div>

      <div style="padding:24px 36px 32px;background:#fff;text-align:center;border-top:1px solid #f0f0f0;margin-top:20px;">
        <a href="https://wa.me/${toWaPhone(p.buyerPhone)}?text=${waText}"
           target="_blank"
           style="display:inline-block;background:#25D366;color:#fff;font-family:Arial,sans-serif;font-weight:bold;padding:13px 30px;border-radius:50px;text-decoration:none;font-size:14px;letter-spacing:0.5px;">
          💬 فتح محادثة واتساب مع ${p.buyerName}
        </a>
        <p style="margin:20px 0 0;color:#9ca3af;font-size:11px;font-family:Arial,sans-serif;">
          ${new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman" })} ✦ بكلمة Admin
        </p>
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
      ? `أهلاً، أنا ${p.buyerName} وطلبت كراسة "${p.workbookTitle}" من بكلمة. أودّ الاستفسار عن الخطوات القادمة لاستلام الطلب.`
      : lang === "fr"
      ? `Bonjour, je suis ${p.buyerName} et j'ai commandé le cahier "${p.workbookTitle}" chez Bikalima. Je souhaite me renseigner sur les prochaines étapes.`
      : `Hello, I'm ${p.buyerName} and I just ordered the "${p.workbookTitle}" workbook from Bikalima. I'd love to know what happens next.`
  );

  const texts: Record<"ar" | "en" | "fr", Record<string, string>> = {
    ar: {
      label: "بكلمة ✦ تم استلام طلبك",
      greeting: `أهلاً ${p.buyerName}،`,
      line1: "وصل طلبك — وكراستك في الطريق إليك! ✦",
      line2: `تلقّينا طلب شراء كراسة <strong>${p.workbookTitle}</strong> بنجاح، ونحن سعداء بثقتك بنا.`,
      line3: p.format === "print"
        ? "سيتواصل معك أحد أعضاء فريقنا قريباً لتأكيد تفاصيل الشحن والتوصيل."
        : "سيتم مراجعة طلبك وإرسال رابط التحميل إلى بريدك الإلكتروني.",
      deliveryLabel: "عنوان التوصيل",
      formatLabel: "الصيغة",
      quantityLabel: "العدد",
      unitLabel: "سعر النسخة",
      totalLabel: "المجموع",
      summaryTitle: "ملخص الطلب",
      nextStepsLabel: "الخطوات القادمة",
      nextSteps: p.format === "print"
        ? "سيتواصل معك أحد أعضاء الفريق لتنسيق الشحن والتوصيل. السعر لا يشمل رسوم التوصيل."
        : "سيتم مراجعة طلبك وإرسال رابط تحميل الـ PDF إلى بريدك الإلكتروني.",
      quote: "لا تُقاس الكلمات بعددها، بل بالأثر الذي تتركه في القلوب.",
      waBtn: "تواصل مع الفريق عبر واتساب",
      footer: "بكلمة ✦ صناعة الأثر وفن الإلقاء والخطابة",
    },
    en: {
      label: "Bikalima ✦ Your Order Is Confirmed",
      greeting: `Hello ${p.buyerName},`,
      line1: "Your order is in — your workbook is on its way! ✦",
      line2: `We've received your order for the <strong>${p.workbookTitle}</strong> workbook. Thank you for choosing Bikalima.`,
      line3: p.format === "print"
        ? "A member of our team will contact you soon to confirm shipping details."
        : "Your download link will be sent to your email after order processing.",
      deliveryLabel: "Delivery Address",
      formatLabel: "Format",
      quantityLabel: "Quantity",
      unitLabel: "Unit Price",
      totalLabel: "Total",
      summaryTitle: "Order Summary",
      nextStepsLabel: "Next Steps",
      nextSteps: p.format === "print"
        ? "A team member will reach out to arrange shipping. Price does not include delivery fees."
        : "Your order will be reviewed and a PDF download link will be sent to your email.",
      quote: "Words are not measured by their count, but by the impression they leave on hearts.",
      waBtn: "Chat with our team on WhatsApp",
      footer: "Bikalima ✦ The Art of Impactful Speech",
    },
    fr: {
      label: "Bikalima ✦ Votre commande est confirmée",
      greeting: `Bonjour ${p.buyerName},`,
      line1: "Votre commande est reçue — votre cahier arrive ! ✦",
      line2: `Nous avons bien reçu votre commande pour le cahier <strong>${p.workbookTitle}</strong>. Merci de nous faire confiance.`,
      line3: p.format === "print"
        ? "Un membre de notre équipe vous contactera bientôt pour confirmer les détails de livraison."
        : "Votre lien de téléchargement sera envoyé après traitement de la commande.",
      deliveryLabel: "Adresse de livraison",
      formatLabel: "Format",
      quantityLabel: "Quantité",
      unitLabel: "Prix unitaire",
      totalLabel: "Total",
      summaryTitle: "Résumé de la commande",
      nextStepsLabel: "Prochaines étapes",
      nextSteps: p.format === "print"
        ? "Un membre de l'équipe vous contactera pour organiser la livraison. Le prix n'inclut pas les frais de livraison."
        : "Votre commande sera traitée et un lien de téléchargement PDF vous sera envoyé par e-mail.",
      quote: "Les mots ne se mesurent pas à leur nombre, mais à l'empreinte qu'ils laissent dans les cœurs.",
      waBtn: "Contacter l'équipe sur WhatsApp",
      footer: "Bikalima ✦ L'art de la parole impactante",
    },
  };

  const t = texts[lang];
  const borderSide = lang === "ar" ? "right" : "left";

  return `
    <div dir="${dir}" style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f4f6f5;padding:0;">
      <div style="background:linear-gradient(135deg,#1a5c52 0%,#0f3d35 100%);padding:36px 32px;text-align:center;">
        <p style="margin:0 0 8px;color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:3px;text-transform:uppercase;">بكلمة ✦ Bikalima</p>
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:normal;letter-spacing:0.5px;">${t.label}</h1>
        <div style="margin:16px auto 0;width:40px;height:2px;background:rgba(255,255,255,0.25);"></div>
      </div>

      <div style="background:#fff;padding:32px 36px;">
        <h2 style="margin:0 0 6px;font-size:20px;color:#1a5c52;font-weight:bold;">${t.greeting}</h2>
        <p style="font-size:18px;font-weight:bold;color:#111;margin:0 0 16px;">${t.line1}</p>
        <p style="color:#374151;line-height:1.75;margin:0 0 12px;" dir="${dir}">${t.line2}</p>
        <p style="color:#374151;line-height:1.75;margin:0 0 28px;" dir="${dir}">${t.line3}</p>

        <div style="background:#f0faf8;border-radius:10px;padding:20px 24px;margin-bottom:20px;border:1px solid #d1ede9;">
          <p style="margin:0 0 14px;font-size:12px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">${t.summaryTitle}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:8px 0;color:#555;width:45%;border-bottom:1px solid #e5efed;">${t.formatLabel}</td>
              <td style="padding:8px 0;font-weight:600;border-bottom:1px solid #e5efed;">${formatLabel}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#555;border-bottom:1px solid #e5efed;">${t.quantityLabel}</td>
              <td style="padding:8px 0;font-weight:600;border-bottom:1px solid #e5efed;">${p.quantity}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#555;border-bottom:1px solid #e5efed;">${t.unitLabel}</td>
              <td style="padding:8px 0;font-weight:600;border-bottom:1px solid #e5efed;">${p.displayUnitPrice}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#1a5c52;font-weight:bold;font-size:15px;">${t.totalLabel}</td>
              <td style="padding:10px 0;font-weight:bold;color:#1a5c52;font-size:17px;">${p.displayTotal}</td>
            </tr>
            ${p.format === "print" && p.deliveryAddress ? `
            <tr>
              <td style="padding:8px 0;color:#555;border-top:1px solid #e5efed;">${t.deliveryLabel}</td>
              <td style="padding:8px 0;font-weight:600;border-top:1px solid #e5efed;">${p.deliveryAddress}</td>
            </tr>` : ""}
          </table>
        </div>

        <div style="background:#fffbeb;border-${borderSide}:3px solid #f59e0b;padding:13px 18px;border-radius:4px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;font-weight:bold;color:#92400e;">${t.nextStepsLabel}</p>
          <p style="margin:5px 0 0;font-size:13px;color:#78350f;line-height:1.6;">${t.nextSteps}</p>
        </div>

        <div style="border-${borderSide}:3px solid #1a5c52;padding:14px 20px;background:#f0faf8;border-radius:4px;margin-bottom:28px;">
          <p style="margin:0;color:#1a5c52;font-style:italic;font-size:14px;line-height:1.7;">${t.quote}</p>
        </div>

        <div style="text-align:center;">
          <a href="https://wa.me/${WA_NUMBER}?text=${waText}"
             target="_blank"
             style="display:inline-block;background:#25D366;color:#fff;font-weight:bold;font-family:Arial,sans-serif;padding:13px 32px;border-radius:50px;text-decoration:none;font-size:14px;letter-spacing:0.5px;">
            💬 ${t.waBtn}
          </a>
        </div>
      </div>

      <div style="padding:20px 36px;text-align:center;background:#f4f6f5;">
        <p style="margin:0;color:#9ca3af;font-size:11px;">${t.footer} | ${ADMIN_EMAIL}</p>
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
      deliveryAddress: format === "print" ? deliveryAddress : null,
      totalPrice: total,
      currency: currencyCode || "JOD",
    });

    const transporter = buildTransporter();
    if (transporter) {
      console.info(`[SMTP] Sending workbook order emails — from: ${FROM_ADDRESS}, admin: ${ADMIN_EMAIL}, buyer: ${buyerEmail}`);
      const adminHtml = buildWorkbookAdminHtml({
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
