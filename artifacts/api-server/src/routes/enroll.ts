import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { db, enrollmentRequestsTable } from "@workspace/db";
import { toWaPhone } from "../lib/phone.js";

const enrollRouter = Router();

const RECIPIENT = "info@bikalima.com";
const FROM_ADDRESS = process.env.SMTP_FROM ?? `"بكلمة" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);

  if (!host || !user || !pass) {
    console.warn("[SMTP] Missing config — SMTP_HOST, SMTP_USER, or SMTP_PASS not set. Emails will not be sent.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}


function modeLabel(mode: string) {
  const map: Record<string, string> = {
    "combined": "مسجّل وبث مباشر",
    "group-inperson": "جماعي وجاهي",
    "private": "تدريب خاص ١:١",
  };
  return map[mode] ?? mode;
}

function buildIndividualHtml(p: Record<string, string>) {
  const rows = [
    ["الاسم الكامل", p.name],
    ["رقم الهاتف", p.phone],
    ["البريد الإلكتروني", p.email],
    ["البرنامج المطلوب", p.program],
    ["الفئة المستهدفة", p.category],
    ["نوع التدريب", modeLabel(p.mode)],
    ["سبب الانضمام", p.reason || "—"],
    ["رابط خطاب سابق (يوتيوب)", p.youtube ? `<a href="${p.youtube}" style="color:#1a5c52;">${p.youtube}</a>` : "—"],
    ["كود الخصم", p.discount || "—"],
    ["لغة المتقدم", p.lang === "en" ? "English" : p.lang === "fr" ? "Français" : "العربية"],
  ];
  const waMsg = encodeURIComponent(
    `أهلاً ${p.name} ✦\n\nوصل طلبك لبرنامج *${p.program}* وأنا سعيد/ة بتواصلك مع فريق *بكلمة* 🎙️\n\n` +
    `*ملخص طلبك:*\n• البرنامج: ${p.program}\n• نوع التدريب: ${modeLabel(p.mode)}\n\n` +
    `سأتواصل معك خلال ٢٤ ساعة لتأكيد جميع التفاصيل والخطوات القادمة.\n\nفريق بكلمة ✦`
  );
  return `
    <div dir="rtl" style="font-family:Georgia,'Times New Roman',Arial,sans-serif;max-width:620px;margin:0 auto;background:#f4f6f5;padding:0;border-radius:0;">
      <div style="background:linear-gradient(135deg,#1a5c52 0%,#0f3d35 100%);padding:32px 36px;text-align:center;">
        <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:3px;text-transform:uppercase;">بكلمة ✦ Bikalima</p>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:normal;letter-spacing:1px;">طلب تسجيل فردي جديد</h1>
        <div style="margin:14px auto 0;width:40px;height:2px;background:rgba(255,255,255,0.25);"></div>
      </div>

      <div style="background:#fff;margin:0;padding:32px 36px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;font-family:Arial,sans-serif;">
          <tbody>
            ${rows.map(([label, value], i) => `
              <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};">
                <td style="padding:11px 16px;color:#6b7280;width:42%;border-bottom:1px solid #f0f0f0;font-size:13px;">${label}</td>
                <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${value ?? "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="padding:20px 36px 32px;background:#fff;border-top:1px solid #f0f0f0;text-align:center;">
        <a href="https://wa.me/${toWaPhone(p.phone)}?text=${waMsg}" target="_blank"
           style="display:inline-block;background:#25D366;color:#fff;font-family:Arial,sans-serif;font-weight:bold;padding:13px 30px;border-radius:50px;text-decoration:none;font-size:14px;letter-spacing:0.5px;">
          💬 فتح محادثة واتساب مع ${p.name}
        </a>
        <p style="margin:20px 0 0;color:#9ca3af;font-size:11px;font-family:Arial,sans-serif;">بكلمة ✦ برنامج الخطابة والإلقاء التحويلي | info@bikalima.com</p>
      </div>
    </div>
  `;
}

function buildInstitutionHtml(p: Record<string, string>) {
  const rows = [
    ["اسم المؤسسة", p.orgName],
    ["المسؤول عن التواصل", p.contactPerson],
    ["رقم الهاتف", p.phone],
    ["البريد الإلكتروني", p.email],
    ["البرنامج المطلوب", p.program || "—"],
    ["عدد الطلاب المتوقع", p.studentCount || "—"],
    ["عدد المعلمين للتأهيل", p.teacherCount || "—"],
    ["عدد الكراسات المطلوبة", p.workbookCount || "—"],
    ["رسالة إضافية", p.orgMessage || "—"],
    ["كود الخصم", p.discount || "—"],
    ["لغة التواصل", p.lang === "en" ? "English" : p.lang === "fr" ? "Français" : "العربية"],
  ];
  const waMsg = encodeURIComponent(
    `أهلاً ${p.contactPerson} ✦\n\nشكراً لاهتمام مؤسسة *${p.orgName}* ببرنامج *بكلمة* 🎙️\n\n` +
    `*ملخص الطلب المؤسسي:*\n• البرنامج: ${p.program || "—"}\n• عدد الطلاب: ${p.studentCount || "—"}\n• عدد المعلمين: ${p.teacherCount || "—"}\n\n` +
    `يسعدنا جدوالة اجتماع لمناقشة تفاصيل الشراكة وتصميم برنامج مخصص لمؤسستكم.\n\nفريق بكلمة ✦`
  );
  return `
    <div dir="rtl" style="font-family:Georgia,'Times New Roman',Arial,sans-serif;max-width:620px;margin:0 auto;background:#f4f6f5;padding:0;">
      <div style="background:linear-gradient(135deg,#1a5c52 0%,#0f3d35 100%);padding:32px 36px;text-align:center;">
        <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:3px;text-transform:uppercase;">بكلمة ✦ Bikalima</p>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:normal;letter-spacing:1px;">طلب تسجيل مؤسسي جديد</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.55);font-size:13px;">مؤسسة تعليمية / شريك مؤسسي</p>
        <div style="margin:14px auto 0;width:40px;height:2px;background:rgba(255,255,255,0.25);"></div>
      </div>

      <div style="background:#fff;padding:32px 36px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;font-family:Arial,sans-serif;">
          <tbody>
            ${rows.map(([label, value], i) => `
              <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};">
                <td style="padding:11px 16px;color:#6b7280;width:42%;border-bottom:1px solid #f0f0f0;font-size:13px;">${label}</td>
                <td style="padding:11px 16px;color:#111827;font-weight:600;border-bottom:1px solid #f0f0f0;">${value ?? "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div style="padding:20px 36px 32px;background:#fff;border-top:1px solid #f0f0f0;text-align:center;">
        <a href="https://wa.me/${toWaPhone(p.phone)}?text=${waMsg}" target="_blank"
           style="display:inline-block;background:#25D366;color:#fff;font-family:Arial,sans-serif;font-weight:bold;padding:13px 30px;border-radius:50px;text-decoration:none;font-size:14px;letter-spacing:0.5px;">
          💬 فتح محادثة واتساب مع ${p.contactPerson || p.orgName}
        </a>
        <p style="margin:20px 0 0;color:#9ca3af;font-size:11px;font-family:Arial,sans-serif;">بكلمة ✦ برنامج الخطابة والإلقاء التحويلي | info@bikalima.com</p>
      </div>
    </div>
  `;
}

function buildApplicantConfirmationHtml(p: Record<string, string>, isInstitution: boolean) {
  const lang = p.lang || "ar";
  const name = isInstitution ? (p.contactPerson || p.orgName) : p.name;
  const program = p.program || "—";
  const mode = isInstitution ? null : modeLabel(p.mode);
  const waNumber = "97455377065";
  const waText = encodeURIComponent(
    lang === "ar"
      ? `أهلاً، أنا ${name} وتقدمت للتسجيل في برنامج "${program}" عبر الموقع. أودّ الاستفسار عن الخطوات القادمة.`
      : lang === "fr"
      ? `Bonjour, je suis ${name} et j'ai soumis une demande d'inscription au programme "${program}". Je souhaite en savoir plus sur les prochaines étapes.`
      : `Hello, I'm ${name} and I just applied for the "${program}" program on your website. I'd love to know more about the next steps.`
  );

  const texts: Record<string, Record<string, string>> = {
    ar: {
      label: "بكلمة ✦ تم استلام طلبك",
      greeting: `أهلاً ${name}،`,
      line1: "وصل طلبك — وبدأت رحلتك! ✦",
      line2: `تلقّينا طلب تسجيلك في برنامج <strong>${program}</strong>${mode ? ` — ${mode}` : ""}، ونحن سعداء بانضمامك.`,
      line3: "سيتواصل معك أحد أعضاء فريقنا خلال ٢٤–٤٨ ساعة لتأكيد التفاصيل وتوجيهك نحو الخطوات القادمة.",
      step1Label: "التقديم",
      step1Desc: "تم بنجاح ✓",
      step2Label: "التواصل",
      step2Desc: "خلال ٢٤–٤٨ ساعة",
      step3Label: "الانطلاق",
      step3Desc: "رحلتك التحويلية",
      quote: "لا تُقاس الكلمات بعددها، بل بالأثر الذي تتركه في القلوب.",
      waBtn: "تواصل مع الفريق عبر واتساب",
      footer: "بكلمة ✦ صناعة الأثر وفن الإلقاء والخطابة",
    },
    en: {
      label: "Bikalima ✦ We've Got Your Request",
      greeting: `Hello ${name},`,
      line1: "You're in — your journey has begun! ✦",
      line2: `We've received your enrollment request for the <strong>${program}</strong> program${mode ? ` — ${mode}` : ""}. We're excited to have you.`,
      line3: "A member of our team will reach out within 24–48 hours to confirm the details and walk you through the next steps.",
      step1Label: "Applied",
      step1Desc: "Done ✓",
      step2Label: "Outreach",
      step2Desc: "Within 24–48 hours",
      step3Label: "Launch",
      step3Desc: "Your transformation",
      quote: "Words are not measured by their count, but by the impression they leave on hearts.",
      waBtn: "Chat with our team on WhatsApp",
      footer: "Bikalima ✦ The Art of Impactful Speech",
    },
    fr: {
      label: "Bikalima ✦ Votre demande est reçue",
      greeting: `Bonjour ${name},`,
      line1: "C'est parti — votre parcours commence ! ✦",
      line2: `Nous avons bien reçu votre demande d'inscription au programme <strong>${program}</strong>${mode ? ` — ${mode}` : ""}. Nous sommes ravis de vous accueillir.`,
      line3: "Un membre de notre équipe vous contactera dans les 24–48 heures pour confirmer les détails et vous guider vers les prochaines étapes.",
      step1Label: "Candidature",
      step1Desc: "Envoyée ✓",
      step2Label: "Contact",
      step2Desc: "Sous 24–48 heures",
      step3Label: "Démarrage",
      step3Desc: "Votre transformation",
      quote: "Les mots ne se mesurent pas à leur nombre, mais à l'empreinte qu'ils laissent dans les cœurs.",
      waBtn: "Contacter l'équipe sur WhatsApp",
      footer: "Bikalima ✦ L'art de la parole impactante",
    },
  };
  const t = texts[lang] || texts.ar;
  const dir = lang === "ar" ? "rtl" : "ltr";
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

        <div style="background:#f9fafb;border-radius:10px;padding:20px 24px;margin-bottom:28px;border:1px solid #e9efee;">
          <p style="margin:0 0 14px;font-size:12px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">${lang === "ar" ? "رحلتك في ٣ خطوات" : lang === "fr" ? "Votre parcours en 3 étapes" : "Your journey in 3 steps"}</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="text-align:center;padding:8px 4px;width:33%;">
                <div style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:50%;background:#1a5c52;color:#fff;font-size:13px;font-weight:bold;text-align:center;margin-bottom:6px;">1</div>
                <p style="margin:0;font-size:13px;font-weight:bold;color:#1a5c52;">${t.step1Label}</p>
                <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${t.step1Desc}</p>
              </td>
              <td style="text-align:center;color:#d1d5db;font-size:20px;padding-bottom:20px;">→</td>
              <td style="text-align:center;padding:8px 4px;width:33%;">
                <div style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:50%;background:#e5f2f0;color:#1a5c52;font-size:13px;font-weight:bold;text-align:center;margin-bottom:6px;">2</div>
                <p style="margin:0;font-size:13px;font-weight:bold;color:#374151;">${t.step2Label}</p>
                <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${t.step2Desc}</p>
              </td>
              <td style="text-align:center;color:#d1d5db;font-size:20px;padding-bottom:20px;">→</td>
              <td style="text-align:center;padding:8px 4px;width:33%;">
                <div style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:50%;background:#e5f2f0;color:#1a5c52;font-size:13px;font-weight:bold;text-align:center;margin-bottom:6px;">3</div>
                <p style="margin:0;font-size:13px;font-weight:bold;color:#374151;">${t.step3Label}</p>
                <p style="margin:2px 0 0;font-size:11px;color:#9ca3af;">${t.step3Desc}</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="border-${borderSide}:3px solid #1a5c52;padding:14px 20px;background:#f0faf8;border-radius:4px;margin-bottom:28px;">
          <p style="margin:0;color:#1a5c52;font-style:italic;font-size:14px;line-height:1.7;">${t.quote}</p>
        </div>

        <div style="text-align:center;">
          <a href="https://wa.me/${waNumber}?text=${waText}" target="_blank"
             style="display:inline-block;background:#25D366;color:#fff;font-weight:bold;font-family:Arial,sans-serif;padding:13px 32px;border-radius:50px;text-decoration:none;font-size:14px;letter-spacing:0.5px;">
            💬 ${t.waBtn}
          </a>
        </div>
      </div>

      <div style="padding:20px 36px;text-align:center;background:#f4f6f5;">
        <p style="margin:0;color:#9ca3af;font-size:11px;">${t.footer} | info@bikalima.com</p>
      </div>
    </div>
  `;
}

enrollRouter.post("/enroll", async (req: Request, res: Response) => {
  const payload = req.body as Record<string, string>;
  const log = req.log ?? console;

  let dbStored = false;
  try {
    const userId = req.isAuthenticated() ? req.user?.id : null;
    const isInstitution = payload.type === "institution";

    await db.insert(enrollmentRequestsTable).values({
      userId: userId || null,
      applicantType: isInstitution ? "institution" : "individual",
      fullName: isInstitution ? (payload.contactPerson || payload.orgName) : payload.name,
      email: payload.email,
      phone: payload.phone,
      programId: payload.program || "",
      trainingType: payload.mode || null,
      privateMode: payload.privateMode || null,
      youtubeLink: payload.youtube || null,
      discountCode: payload.discount || null,
      institutionName: isInstitution ? payload.orgName : null,
      studentCount: payload.studentCount ? parseInt(payload.studentCount) : null,
      teacherCount: payload.teacherCount ? parseInt(payload.teacherCount) : null,
      workbooksNeeded: payload.workbookCount ? parseInt(payload.workbookCount) : null,
      message: payload.reason || payload.orgMessage || null,
      formData: payload,
    });

    dbStored = true;
    log.info({ applicantType: payload.type, program: payload.program }, "Enrollment stored in DB");
  } catch (err) {
    log.error({ err }, "Failed to store enrollment in DB");
  }

  const transporter = buildTransporter();
  if (transporter) {
    const isInstitution = payload.type === "institution";
    const subject = isInstitution
      ? `بكلمة ✦ طلب مؤسسي — ${payload.orgName}`
      : `بكلمة ✦ طلب تسجيل جديد — ${payload.name} / ${payload.program}`;
    const html = isInstitution
      ? buildInstitutionHtml(payload)
      : buildIndividualHtml(payload);
    log.info({ from: FROM_ADDRESS, admin: RECIPIENT, applicant: payload.email }, "[SMTP] Sending enrollment emails");
    try {
      await transporter.sendMail({
        from: FROM_ADDRESS,
        to: RECIPIENT,
        replyTo: payload.email,
        subject,
        html,
      });
      log.info({ to: RECIPIENT }, "Enrollment email sent to admin");
    } catch (err) {
      log.error({ err }, "[SMTP] Failed to send enrollment email to admin");
    }

    if (payload.email) {
      const isInstitution = payload.type === "institution";
      const lang = payload.lang || "ar";
      const confirmSubject =
        lang === "fr"
          ? `Bikalima ✦ Votre demande a bien été reçue`
          : lang === "en"
          ? `Bikalima ✦ Your request is in — the journey begins`
          : `بكلمة ✦ وصل طلبك — رحلتك بدأت`;
      try {
        await transporter.sendMail({
          from: FROM_ADDRESS,
          to: payload.email,
          replyTo: RECIPIENT,
          subject: confirmSubject,
          html: buildApplicantConfirmationHtml(payload, isInstitution),
        });
        log.info({ to: payload.email }, "Confirmation email sent to applicant");
      } catch (err) {
        log.error({ err }, "[SMTP] Failed to send confirmation email to applicant");
      }
    }
  } else {
    log.warn("[SMTP] Not configured — enrollment email not sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS.");
  }

  if (!dbStored) {
    res.status(500).json({ success: false, message: "Failed to save enrollment. Please try again." });
    return;
  }

  res.status(200).json({ success: true, message: "Enrollment received" });
});

enrollRouter.get("/my/enrollment-requests", async (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { eq, desc } = await import("drizzle-orm");
    const requests = await db
      .select()
      .from(enrollmentRequestsTable)
      .where(eq(enrollmentRequestsTable.userId, req.user.id))
      .orderBy(desc(enrollmentRequestsTable.createdAt));
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

export default enrollRouter;
