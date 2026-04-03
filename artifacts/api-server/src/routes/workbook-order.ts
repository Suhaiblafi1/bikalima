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
    `السلام عليكم ${p.buyerName} 👋\n\nشكراً على طلبك لكراسة *بكلمة* 📚\n\n📋 *ملخص طلبك:*\n• الكراسة: ${p.workbookTitle}\n• العدد: ${p.quantity} نسخة\n• الصيغة: ${formatLabel}\n• المجموع: ${p.displayTotal}\n\nسنتواصل معك قريباً لتأكيد تفاصيل الاستلام.\n\nفريق بكلمة ✨`
  );

  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f4f7f6;padding:24px;border-radius:16px;">
      <div style="background:linear-gradient(135deg,#1a5c52,#25786A);padding:28px 32px;border-radius:12px;text-align:center;margin-bottom:20px;">
        <div style="font-size:36px;margin-bottom:8px;">📚</div>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:bold;">طلب كراسة جديد</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">بكلمة — Bikalima</p>
      </div>

      <div style="background:#fff;border-radius:12px;padding:28px 32px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
        <h2 style="margin:0 0 20px;font-size:18px;color:#1a5c52;border-bottom:2px solid #e5f2f0;padding-bottom:12px;">تفاصيل الطلب</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#f0faf8;">
            <td style="padding:10px 12px;color:#666;width:150px;border-radius:6px 0 0 6px;">📚 الكراسة</td>
            <td style="padding:10px 12px;font-weight:bold;color:#111;border-radius:0 6px 6px 0;">${p.workbookTitle || p.workbookId}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;color:#666;">🗂️ الصيغة</td>
            <td style="padding:10px 12px;font-weight:bold;">${formatLabel}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:10px 12px;color:#666;">🔢 العدد</td>
            <td style="padding:10px 12px;font-weight:bold;">${p.quantity} نسخة</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;color:#666;">💰 سعر النسخة</td>
            <td style="padding:10px 12px;font-weight:bold;">${p.displayUnitPrice} (${p.currencyCode})</td>
          </tr>
          <tr style="background:#e8f9f5;">
            <td style="padding:12px;color:#1a5c52;font-weight:bold;font-size:16px;">💵 المجموع</td>
            <td style="padding:12px;font-weight:bold;color:#1a5c52;font-size:18px;">${p.displayTotal}</td>
          </tr>
          ${p.format === "print" && p.deliveryAddress ? `
          <tr>
            <td style="padding:10px 12px;color:#666;">📦 عنوان التوصيل</td>
            <td style="padding:10px 12px;font-weight:bold;">${p.deliveryAddress}</td>
          </tr>` : ""}
        </table>
        ${p.format === "print" ? '<p style="color:#b45309;font-size:12px;margin-top:12px;padding:8px 12px;background:#fffbeb;border-radius:6px;border:1px solid #fde68a;">⚠️ السعر لا يشمل رسوم التوصيل</p>' : ""}
      </div>

      <div style="background:#fff;border-radius:12px;padding:28px 32px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
        <h2 style="margin:0 0 20px;font-size:18px;color:#1a5c52;border-bottom:2px solid #e5f2f0;padding-bottom:12px;">بيانات المشتري</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr style="background:#f0faf8;">
            <td style="padding:10px 12px;color:#666;width:150px;">👤 الاسم</td>
            <td style="padding:10px 12px;font-weight:bold;">${p.buyerName}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;color:#666;">📞 الهاتف</td>
            <td style="padding:10px 12px;font-weight:bold;" dir="ltr">${p.buyerPhone}</td>
          </tr>
          <tr style="background:#f9f9f9;">
            <td style="padding:10px 12px;color:#666;">📧 البريد</td>
            <td style="padding:10px 12px;font-weight:bold;" dir="ltr">${p.buyerEmail}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;color:#666;">🌐 اللغة</td>
            <td style="padding:10px 12px;font-weight:bold;">${p.lang}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-top:20px;">
        <a href="https://wa.me/${toWaPhone(p.buyerPhone)}?text=${waText}"
           target="_blank"
           style="display:inline-block;background:#25D366;color:white;font-weight:bold;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:15px;box-shadow:0 4px 12px rgba(37,211,102,0.3);">
          💬 تواصل مع المشتري عبر واتساب
        </a>
      </div>

      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:24px;">
        ${new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman" })} • بكلمة Admin
      </p>
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
      ? `السلام عليكم، أنا ${p.buyerName} وطلبت كراسة "${p.workbookTitle}". أودّ الاستفسار عن الطلب.`
      : lang === "fr"
      ? `Bonjour, je suis ${p.buyerName} et j'ai commandé le cahier "${p.workbookTitle}". Je souhaite me renseigner sur ma commande.`
      : `Hello, I'm ${p.buyerName} and I ordered the workbook "${p.workbookTitle}". I'd like to ask about my order.`
  );

  const texts: Record<"ar" | "en" | "fr", Record<string, string>> = {
    ar: {
      greeting: `مرحباً ${p.buyerName}،`,
      line1: "وصل طلبك بنجاح! 🎉",
      line2: `لقد استلمنا طلب شراء كراسة <strong>${p.workbookTitle}</strong> بنجاح.`,
      line3: p.format === "print"
        ? "سيتواصل معك فريقنا قريباً لتأكيد تفاصيل الشحن والتوصيل."
        : "سيصلك رابط التحميل بعد التأكيد ومعالجة الطلب.",
      deliveryLabel: "عنوان التوصيل",
      formatLabel: "الصيغة",
      quantityLabel: "العدد",
      unitLabel: "سعر النسخة",
      totalLabel: "المجموع",
      quote: `"كل كلمة تكتبها اليوم قد تُغيّر مسار شخص ما غداً."`,
      waBtn: "تواصل مع الفريق عبر واتساب",
      footer: "بكلمة — صناعة الأثر وفن الإلقاء والخطابة",
      nextStepsLabel: "الخطوات القادمة",
      nextSteps: p.format === "print"
        ? "سيتواصل معك أحد أعضاء الفريق لتأكيد تفاصيل التوصيل وتنسيق الشحن. السعر لا يشمل رسوم التوصيل."
        : "سيتم مراجعة طلبك وإرسال رابط التحميل لنسخة الـ PDF إلى بريدك الإلكتروني.",
    },
    en: {
      greeting: `Hello ${p.buyerName},`,
      line1: "Your order has been received! 🎉",
      line2: `We've received your order for the <strong>${p.workbookTitle}</strong> workbook.`,
      line3: p.format === "print"
        ? "Our team will contact you soon to confirm shipping details."
        : "Your download link will be sent after order processing.",
      deliveryLabel: "Delivery Address",
      formatLabel: "Format",
      quantityLabel: "Quantity",
      unitLabel: "Unit Price",
      totalLabel: "Total",
      quote: `"Every word you write today might change someone's path tomorrow."`,
      waBtn: "Chat with Us on WhatsApp",
      footer: "Bikalima — The Art of Impactful Speech",
      nextStepsLabel: "Next Steps",
      nextSteps: p.format === "print"
        ? "A team member will contact you to confirm delivery details and arrange shipping. Price does not include delivery fees."
        : "Your order will be reviewed and a PDF download link will be sent to your email.",
    },
    fr: {
      greeting: `Bonjour ${p.buyerName},`,
      line1: "Votre commande a bien été reçue ! 🎉",
      line2: `Nous avons bien reçu votre commande pour le cahier <strong>${p.workbookTitle}</strong>.`,
      line3: p.format === "print"
        ? "Notre équipe vous contactera bientôt pour confirmer les détails de livraison."
        : "Votre lien de téléchargement sera envoyé après traitement de la commande.",
      deliveryLabel: "Adresse de livraison",
      formatLabel: "Format",
      quantityLabel: "Quantité",
      unitLabel: "Prix unitaire",
      totalLabel: "Total",
      quote: `"Chaque mot que vous écrivez aujourd'hui peut changer le parcours de quelqu'un demain."`,
      waBtn: "Contacter l'équipe sur WhatsApp",
      footer: "Bikalima — L'art de la parole impactante",
      nextStepsLabel: "Prochaines étapes",
      nextSteps: p.format === "print"
        ? "Un membre de l'équipe vous contactera pour confirmer les détails de livraison. Le prix n'inclut pas les frais de livraison."
        : "Votre commande sera traitée et un lien de téléchargement PDF vous sera envoyé par e-mail.",
    },
  };

  const t = texts[lang];

  return `
    <div dir="${dir}" style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;background:#f4f7f6;padding:24px;border-radius:16px;">
      <div style="background:linear-gradient(135deg,#1a5c52,#25786A);padding:32px 24px;border-radius:12px;text-align:center;margin-bottom:20px;">
        <div style="font-size:40px;margin-bottom:10px;">📚</div>
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold;">بكلمة — Bikalima</h1>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${t.footer}</p>
      </div>

      <div style="background:#fff;border-radius:12px;padding:28px 32px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.07);">
        <h2 style="margin:0 0 12px;font-size:20px;color:#1a5c52;">${t.greeting}</h2>
        <p style="font-size:20px;font-weight:bold;color:#111;margin:0 0 12px;">${t.line1}</p>
        <p style="color:#374151;line-height:1.75;margin:0 0 12px;" dir="${dir}">${t.line2}</p>
        <p style="color:#374151;line-height:1.75;margin:0 0 24px;" dir="${dir}">${t.line3}</p>

        <div style="background:#f0faf8;border-radius:10px;padding:20px;margin-bottom:20px;border:1px solid #d1ede9;">
          <h3 style="margin:0 0 14px;font-size:15px;color:#1a5c52;font-weight:bold;">🧾 ${lang === "ar" ? "ملخص الطلب" : lang === "fr" ? "Résumé de la commande" : "Order Summary"}</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:7px 0;color:#555;width:45%;">${t.formatLabel}</td>
              <td style="padding:7px 0;font-weight:bold;">${formatLabel}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#555;">${t.quantityLabel}</td>
              <td style="padding:7px 0;font-weight:bold;">${p.quantity}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;color:#555;">${t.unitLabel}</td>
              <td style="padding:7px 0;font-weight:bold;">${p.displayUnitPrice}</td>
            </tr>
            <tr style="border-top:2px solid #d1ede9;margin-top:8px;">
              <td style="padding:10px 0;color:#1a5c52;font-weight:bold;font-size:16px;">${t.totalLabel}</td>
              <td style="padding:10px 0;font-weight:bold;color:#1a5c52;font-size:18px;">${p.displayTotal}</td>
            </tr>
            ${p.format === "print" && p.deliveryAddress ? `
            <tr>
              <td style="padding:7px 0;color:#555;">${t.deliveryLabel}</td>
              <td style="padding:7px 0;font-weight:bold;">${p.deliveryAddress}</td>
            </tr>` : ""}
          </table>
        </div>

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
          <p style="margin:0;font-size:14px;color:#92400e;font-weight:bold;">📌 ${t.nextStepsLabel}</p>
          <p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.6;">${t.nextSteps}</p>
        </div>

        <div style="border-${lang === "ar" ? "right" : "left"}:4px solid #25786A;padding:12px 16px;background:#f0faf8;border-radius:6px;margin-bottom:24px;">
          <p style="margin:0;color:#1a5c52;font-style:italic;font-size:15px;">${t.quote}</p>
        </div>

        <div style="text-align:center;">
          <a href="https://wa.me/${WA_NUMBER}?text=${waText}"
             target="_blank"
             style="display:inline-block;background:#25D366;color:white;font-weight:bold;padding:13px 30px;border-radius:50px;text-decoration:none;font-size:15px;box-shadow:0 4px 12px rgba(37,211,102,0.3);">
            💬 ${t.waBtn}
          </a>
        </div>
      </div>

      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">${t.footer} | ${ADMIN_EMAIL}</p>
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
            subject: `📚 طلب كراسة: ${workbookTitle ?? workbookId} — ${buyerName}`,
            html: adminHtml,
          }),
          buyerEmail
            ? transporter.sendMail({
                from: FROM_ADDRESS,
                to: buyerEmail,
                replyTo: ADMIN_EMAIL,
                subject:
                  lang === "fr"
                    ? `Bikalima — Commande confirmée : ${workbookTitle ?? workbookId}`
                    : lang === "en"
                    ? `Bikalima — Order Confirmed: ${workbookTitle ?? workbookId}`
                    : `بكلمة — تأكيد طلب: ${workbookTitle ?? workbookId}`,
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
