import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { db, enrollmentRequestsTable } from "@workspace/db";
import { toWaPhone } from "../lib/phone.js";

const enrollRouter = Router();

const RECIPIENT = "info@bikalima.com";

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);

  if (!host || !user || !pass) return null;

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
    ["الاسم", p.name],
    ["الهاتف", p.phone],
    ["البريد", p.email],
    ["البرنامج", p.program],
    ["الفئة", p.category],
    ["نوع التدريب", modeLabel(p.mode)],
    ["سبب الانضمام", p.reason || "—"],
    ["رابط خطاب (يوتيوب)", p.youtube ? `<a href="${p.youtube}">${p.youtube}</a>` : "—"],
    ["كود الخصم", p.discount || "—"],
    ["اللغة", p.lang || "ar"],
  ];
  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
      <div style="background:#1a5c52;color:white;padding:20px 24px;border-radius:8px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:22px;">📩 طلب تسجيل جديد — بكلمة</h1>
        <p style="margin:8px 0 0;opacity:0.8;font-size:14px;">نوع المتقدم: فرد</p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tbody>
          ${rows.map(([label, value]) => `
            <tr>
              <td style="padding:12px 16px;background:#f3f4f6;font-weight:bold;width:40%;border-bottom:1px solid #e5e7eb;">${label}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">${value ?? "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div style="margin-top:20px;text-align:center;">
        <a href="https://wa.me/${toWaPhone(p.phone)}?text=${encodeURIComponent(`السلام عليكم ${p.name} 👋\n\nشكراً جزيلاً على تسجيلك في برنامج *بكلمة* 🎙️\n\n📋 *ملخص طلبك:*\n• البرنامج: ${p.program}\n• نوع التدريب: ${modeLabel(p.mode)}\n\nسنتواصل معك قريباً لتأكيد جميع التفاصيل والخطوات القادمة.\n\nفريق بكلمة ✨`)}" target="_blank" style="display:inline-block;background:#25D366;color:white;font-weight:bold;padding:10px 24px;border-radius:50px;text-decoration:none;font-size:14px;">💬 تواصل عبر واتساب مع المتقدم</a>
      </div>
      <p style="margin-top:16px;color:#6b7280;font-size:12px;text-align:center;">بكلمة — برنامج الخطابة التحويلي | suhaib@ilgholding.com</p>
    </div>
  `;
}

function buildInstitutionHtml(p: Record<string, string>) {
  const rows = [
    ["اسم المؤسسة", p.orgName],
    ["المسؤول للتواصل", p.contactPerson],
    ["الهاتف", p.phone],
    ["البريد", p.email],
    ["البرنامج المطلوب", p.program || "—"],
    ["عدد الطلاب المتوقع", p.studentCount],
    ["عدد المعلمين للتأهيل", p.teacherCount],
    ["عدد الكراسات", p.workbookCount || "—"],
    ["رسالة إضافية", p.orgMessage || "—"],
    ["كود الخصم", p.discount || "—"],
    ["اللغة", p.lang || "ar"],
  ];
  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
      <div style="background:#1a5c52;color:white;padding:20px 24px;border-radius:8px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:22px;">🏫 طلب تسجيل مؤسسي — بكلمة</h1>
        <p style="margin:8px 0 0;opacity:0.8;font-size:14px;">نوع المتقدم: مؤسسة تعليمية</p>
      </div>
      <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tbody>
          ${rows.map(([label, value]) => `
            <tr>
              <td style="padding:12px 16px;background:#f3f4f6;font-weight:bold;width:40%;border-bottom:1px solid #e5e7eb;">${label}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">${value ?? "—"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div style="margin-top:20px;text-align:center;">
        <a href="https://wa.me/${toWaPhone(p.phone)}?text=${encodeURIComponent(`السلام عليكم ${p.contactPerson} 👋\n\nشكراً لاهتمام مؤسستكم *${p.orgName}* ببرنامج *بكلمة* 🎙️\n\n📋 *ملخص طلبكم:*\n• البرنامج المطلوب: ${p.program || "—"}\n• عدد الطلاب المتوقع: ${p.studentCount || "—"}\n\nسنتواصل معكم قريباً لتأكيد التفاصيل والخطوات القادمة.\n\nفريق بكلمة ✨`)}" target="_blank" style="display:inline-block;background:#25D366;color:white;font-weight:bold;padding:10px 24px;border-radius:50px;text-decoration:none;font-size:14px;">💬 تواصل عبر واتساب مع المؤسسة</a>
      </div>
      <p style="margin-top:16px;color:#6b7280;font-size:12px;text-align:center;">بكلمة — برنامج الخطابة التحويلي | suhaib@ilgholding.com</p>
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
      ? `السلام عليكم، أنا ${name} وقدمت طلب تسجيل في برنامج ${program} عبر الموقع. أودّ الاستفسار عن التفاصيل.`
      : lang === "fr"
      ? `Bonjour, je suis ${name} et j'ai soumis une demande d'inscription au programme ${program}. Je souhaite avoir plus de détails.`
      : `Hello, I'm ${name} and I submitted an enrollment request for the ${program} program. I'd like to know more details.`
  );

  const texts: Record<string, Record<string, string>> = {
    ar: {
      greeting: `أهلاً ${name}،`,
      line1: "وصل طلبك بنجاح! 🎉",
      line2: `لقد استلمنا طلب تسجيلك في برنامج <strong>${program}</strong>${mode ? ` (${mode})` : ""}.`,
      line3: "سيتواصل معك فريقنا خلال ٢٤-٤٨ ساعة لتأكيد التفاصيل والخطوات القادمة.",
      quote: `"الكلمة الواحدة قادرة على تغيير مسار حياتك."`,
      waBtn: "تواصل معنا عبر واتساب",
      footer: "بكلمة — صناعة الأثر وفن الإلقاء والخطابة",
    },
    en: {
      greeting: `Hello ${name},`,
      line1: "Your request has been received! 🎉",
      line2: `We've received your enrollment request for the <strong>${program}</strong> program${mode ? ` (${mode})` : ""}.`,
      line3: "Our team will contact you within 24–48 hours to confirm the details and next steps.",
      quote: `"One word can change the course of your life."`,
      waBtn: "Contact us on WhatsApp",
      footer: "Bikalima — The Art of Impactful Speech",
    },
    fr: {
      greeting: `Bonjour ${name},`,
      line1: "Votre demande a bien été reçue ! 🎉",
      line2: `Nous avons bien reçu votre demande d'inscription au programme <strong>${program}</strong>${mode ? ` (${mode})` : ""}.`,
      line3: "Notre équipe vous contactera dans les 24–48 heures pour confirmer les détails et les prochaines étapes.",
      quote: `"Un seul mot peut changer le cours de votre vie."`,
      waBtn: "Nous contacter sur WhatsApp",
      footer: "Bikalima — L'art de la parole impactante",
    },
  };
  const t = texts[lang] || texts.ar;
  const dir = lang === "ar" ? "rtl" : "ltr";

  return `
    <div dir="${dir}" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
      <div style="background:linear-gradient(135deg,#1a5c52,#25786A);color:white;padding:28px 24px;border-radius:10px;margin-bottom:24px;text-align:center;">
        <div style="font-size:38px;margin-bottom:8px;">🎙️</div>
        <h1 style="margin:0;font-size:24px;font-weight:bold;">بكلمة — Bikalima</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:14px;">${t.footer}</p>
      </div>

      <div style="background:white;padding:24px;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.08);margin-bottom:20px;">
        <h2 style="margin:0 0 12px;font-size:20px;color:#1a5c52;">${t.greeting}</h2>
        <p style="font-size:18px;font-weight:bold;color:#111;margin:0 0 12px;">${t.line1}</p>
        <p style="color:#374151;line-height:1.7;margin:0 0 12px;" dir="${dir}">${t.line2}</p>
        <p style="color:#374151;line-height:1.7;margin:0 0 20px;" dir="${dir}">${t.line3}</p>
        <div style="border-${lang === "ar" ? "right" : "left"}:4px solid #25786A;padding:12px 16px;background:#f0faf8;border-radius:6px;margin-bottom:20px;">
          <p style="margin:0;color:#1a5c52;font-style:italic;font-size:15px;">${t.quote}</p>
        </div>
        <div style="text-align:center;">
          <a href="https://wa.me/${waNumber}?text=${waText}" target="_blank"
             style="display:inline-block;background:#25D366;color:white;font-weight:bold;padding:12px 28px;border-radius:50px;text-decoration:none;font-size:15px;">
            💬 ${t.waBtn}
          </a>
        </div>
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">${t.footer} | suhaib@ilgholding.com</p>
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
      ? `[بكلمة] طلب مؤسسي — ${payload.orgName}`
      : `[بكلمة] طلب تسجيل — ${payload.name} / ${payload.program}`;
    const html = isInstitution
      ? buildInstitutionHtml(payload)
      : buildIndividualHtml(payload);
    try {
      await transporter.sendMail({
        from: `"بكلمة - نماذج التسجيل" <info@bikalima.com>`,
        to: RECIPIENT,
        replyTo: payload.email,
        subject,
        html,
      });
      log.info({ to: RECIPIENT }, "Enrollment email sent to admin");
    } catch (err) {
      log.error({ err }, "Failed to send enrollment email to admin");
    }

    if (payload.email) {
      const isInstitution = payload.type === "institution";
      const lang = payload.lang || "ar";
      const confirmSubject =
        lang === "fr"
          ? `Bikalima — Confirmation de votre demande`
          : lang === "en"
          ? `Bikalima — Your enrollment request received`
          : `بكلمة — تم استلام طلبك بنجاح ✅`;
      try {
        await transporter.sendMail({
          from: `"بكلمة" <info@bikalima.com>`,
          to: payload.email,
          replyTo: RECIPIENT,
          subject: confirmSubject,
          html: buildApplicantConfirmationHtml(payload, isInstitution),
        });
        log.info({ to: payload.email }, "Confirmation email sent to applicant");
      } catch (err) {
        log.error({ err }, "Failed to send confirmation email to applicant");
      }
    }
  } else {
    log.warn("SMTP not configured — enrollment email not sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS.");
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
