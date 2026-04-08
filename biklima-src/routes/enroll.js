import { Router } from "express";
import nodemailer from "nodemailer";
import { db, enrollmentRequestsTable } from "../db.js";
import { toWaPhone } from "../lib/phone.js";

const router = Router();

const RECIPIENT = "info@bikalima.com";
const FROM_ADDRESS =
  process.env.SMTP_FROM ??
  `"بكلمة" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) {
    console.warn("[SMTP] Missing config — enrollment emails will not be sent.");
    return null;
  }
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

function modeLabel(mode) {
  const map = {
    combined: "مسجّل وبث مباشر",
    "group-inperson": "جماعي وجاهي",
    private: "تدريب خاص ١:١",
  };
  return map[mode] ?? mode;
}

const PROGRAM_META = {
  "المتحدث المؤثر":                 { price: 70,  hours: 27, sessions: 14, id: "core" },
  "المدرب المعتمد":                 { price: 110, hours: 40, sessions: 20, id: "tot" },
  "تأهيل المعلمين لتعليم الأطفال": { price: 90,  hours: 21, sessions: 11, id: "teachers" },
  "المتحدث الصغير":                 { price: 50,  hours: 18, sessions: 9,  id: "children" },
  "The Influential Speaker":         { price: 70,  hours: 27, sessions: 14, id: "core" },
  "The Certified Trainer":           { price: 110, hours: 40, sessions: 20, id: "tot" },
  "Qualifying Educators to Teach Children": { price: 90, hours: 21, sessions: 11, id: "teachers" },
  "The Young Speaker":               { price: 50,  hours: 18, sessions: 9,  id: "children" },
};

function buildIndividualHtml(p) {
  const rows = [
    ["الاسم الكامل", p.name],
    ["رقم الهاتف", p.phone],
    ["البريد الإلكتروني", p.email],
    ["البرنامج المطلوب", p.program],
    ["الفئة المستهدفة", p.category],
    ["نوع التدريب", modeLabel(p.mode)],
    ["سبب الانضمام", p.reason || "—"],
    ["رابط خطاب سابق (يوتيوب)", p.youtube ? `<a href="${p.youtube}">${p.youtube}</a>` : "—"],
    ["كود الخصم", p.discount || "—"],
    ["لغة المتقدم", p.lang === "en" ? "English" : "العربية"],
  ];
  const waMsg = encodeURIComponent(
    `أهلاً *${p.name}* 🎙️\n\nأتواصل معك من فريق *بكلمة* بخصوص طلب تسجيلك.\n\n` +
    `📋 *ملخص طلبك:*\n• البرنامج: *${p.program}*\n• نوع التدريب: ${modeLabel(p.mode)}\n\n` +
    `نحن سعداء باهتمامك — هل أنت متاح الآن؟ 🤝\n\n— فريق بكلمة ✦`
  );
  const now = new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman", dateStyle: "long", timeStyle: "short" });
  const actions = [
    "تواصل مع المتقدم خلال ٢٤ ساعة من استلام هذا الإشعار",
    "تأكيد توفر الأماكن في البرنامج المطلوب",
    "إرسال تفاصيل التسجيل أو رابط الدفع",
    "متابعة خلال ٤٨ ساعة للتأكد من اكتمال التسجيل",
  ];
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:620px;margin:0 auto;background:#f0f2f1;">
  <table cellpadding="0" cellspacing="0" bgcolor="#0d3d36" style="width:100%;background:linear-gradient(150deg,#07201c 0%,#1a5c52 100%);">
    <tr>
      <td bgcolor="#0d3d36" style="padding:24px 32px 20px;">
        <span style="display:inline-block;background:#f59e0b;color:#1a0a00;font-size:11px;padding:5px 14px;border-radius:20px;">⚡ إجراء مطلوب</span>
        <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;">طلب تسجيل جديد — فردي</h1>
        <p style="margin:0;color:#b0d8d2;font-size:12px;">${now}</p>
      </td>
      <td bgcolor="#0d3d36" style="padding:20px 16px;vertical-align:top;">
        <div style="background:#1a5045;border:1px solid #2d7a6a;border-radius:12px;padding:14px 18px;min-width:140px;">
          <p style="margin:0 0 2px;font-size:12px;color:#c8e8e1;">المتقدم</p>
          <p style="margin:0;font-size:15px;color:#ffffff;">${p.name || "—"}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#d4eee9;" dir="ltr">${p.phone || "—"}</p>
        </div>
      </td>
    </tr>
  </table>
  <div style="background:#fff;padding:8px 32px 24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
      ${rows.map(([label, value], i) => `<tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"};"><td style="padding:10px 14px;color:#6b7280;width:42%;border-bottom:1px solid #f0f0f0;">${label}</td><td style="padding:10px 14px;color:#111;border-bottom:1px solid #f0f0f0;">${value ?? "—"}</td></tr>`).join("")}
    </table>
  </div>
  <div style="padding:16px 32px 24px;">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-right:4px solid #f59e0b;border-radius:10px;padding:20px 22px;">
      <p style="margin:0 0 14px;font-size:13px;color:#92400e;">📋 الخطوات المطلوبة منك الآن</p>
      ${actions.map((step, i) => `<div style="display:flex;gap:10px;margin-bottom:10px;"><div style="width:22px;height:22px;border-radius:11px;background:#f59e0b;color:#fff;font-size:11px;text-align:center;line-height:22px;flex-shrink:0;">${i + 1}</div><div style="font-size:13px;color:#78350f;line-height:1.55;">${step}</div></div>`).join("")}
    </div>
  </div>
  <div style="padding:0 32px 36px;text-align:center;">
    <a href="https://wa.me/${toWaPhone(p.phone)}?text=${waMsg}" target="_blank"
       style="display:inline-block;background:#25D366;color:#fff;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;">
      💬 تواصل الآن مع ${p.name}
    </a>
    <p style="margin:12px 0 0;color:#b0b8b6;font-size:12px;" dir="ltr">${p.phone}</p>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.85);">معيار رضا العملاء: رد أولي خلال ٢٤ ساعة ✦ بكلمة</p>
  </div>
</div>`;
}

function buildInstitutionHtml(p) {
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
  ];
  const waMsg = encodeURIComponent(
    `أهلاً *${p.contactPerson || p.orgName}* 🎙️\n\n` +
    `أتواصل معك من فريق *بكلمة* بخصوص طلب الشراكة من *${p.orgName}*.\n\n` +
    `• البرنامج: *${p.program}*\n\nمتى يناسبكم الحديث؟ 📅\n\n— فريق بكلمة ✦`
  );
  const now = new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman", dateStyle: "long", timeStyle: "short" });
  const actions = [
    `تواصل مع ${p.contactPerson || "المسؤول"} خلال ٢٤ ساعة`,
    "جدولة اجتماع لمناقشة البرنامج المؤسسي",
    "إعداد عرض سعر مخصص بناءً على الأعداد",
    "إرسال مقترح الشراكة الرسمي وخطة التنفيذ",
  ];
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:620px;margin:0 auto;background:#f0f2f1;">
  <table cellpadding="0" cellspacing="0" bgcolor="#0d3d36" style="width:100%;background:linear-gradient(150deg,#07201c 0%,#1a5c52 100%);">
    <tr>
      <td bgcolor="#0d3d36" style="padding:24px 32px 20px;">
        <span style="display:inline-block;background:#f59e0b;color:#1a0a00;font-size:11px;padding:5px 14px;border-radius:20px;">⚡ شراكة مؤسسية</span>
        <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;">طلب تسجيل مؤسسي جديد</h1>
        <p style="margin:0;color:#b0d8d2;font-size:12px;">${now}</p>
      </td>
      <td bgcolor="#0d3d36" style="padding:20px 16px;vertical-align:top;">
        <div style="background:#1a5045;border:1px solid #2d7a6a;border-radius:12px;padding:14px 18px;">
          <p style="margin:0 0 2px;font-size:12px;color:#c8e8e1;">المؤسسة</p>
          <p style="margin:0;font-size:14px;color:#ffffff;">${p.orgName || "—"}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#d4eee9;">${p.contactPerson || "—"}</p>
        </div>
      </td>
    </tr>
  </table>
  <div style="background:#fff;padding:8px 32px 24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
      ${rows.map(([label, value], i) => `<tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"};"><td style="padding:10px 14px;color:#6b7280;width:42%;border-bottom:1px solid #f0f0f0;">${label}</td><td style="padding:10px 14px;color:#111;border-bottom:1px solid #f0f0f0;">${value ?? "—"}</td></tr>`).join("")}
    </table>
  </div>
  <div style="padding:16px 32px 24px;">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-right:4px solid #f59e0b;border-radius:10px;padding:20px 22px;">
      <p style="margin:0 0 14px;font-size:13px;color:#92400e;">📋 الخطوات المطلوبة منك الآن</p>
      ${actions.map((step, i) => `<div style="display:flex;gap:10px;margin-bottom:10px;"><div style="width:22px;height:22px;border-radius:11px;background:#f59e0b;color:#fff;font-size:11px;text-align:center;line-height:22px;flex-shrink:0;">${i + 1}</div><div style="font-size:13px;color:#78350f;line-height:1.55;">${step}</div></div>`).join("")}
    </div>
  </div>
  <div style="padding:0 32px 36px;text-align:center;">
    <a href="https://wa.me/${toWaPhone(p.phone)}?text=${waMsg}" target="_blank"
       style="display:inline-block;background:#25D366;color:#fff;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;">
      💬 تواصل مع ${p.contactPerson || p.orgName}
    </a>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.85);">معيار رضا العملاء: رد أولي خلال ٢٤ ساعة ✦ بكلمة</p>
  </div>
</div>`;
}

function buildApplicantConfirmationHtml(p, isInstitution) {
  const lang = p.lang || "ar";
  const name = isInstitution ? (p.contactPerson || p.orgName) : p.name;
  const program = p.program || "—";
  const mode = isInstitution ? null : modeLabel(p.mode);
  const waNumber = "97455377065";
  const waText = encodeURIComponent(
    lang === "ar"
      ? `أهلاً فريق بكلمة 🎙️\n\nاسمي *${name}* وقد سجّلت للتو عبر الموقع.\n• البرنامج: *${program}*\n${mode ? `• نوع التدريب: ${mode}\n` : ""}أودّ الاستفسار عن الخطوات القادمة.\n\nشكراً 🙏`
      : `Hello Bikalima team 🎙️\n\nMy name is *${name}* and I just enrolled.\n• Program: *${program}*\n${mode ? `• Training mode: ${mode}\n` : ""}I'd love to know the next steps.\n\nThank you 🙏`
  );
  const dir = lang === "ar" ? "rtl" : "ltr";
  const bSide = lang === "ar" ? "right" : "left";
  const hero = lang === "ar" ? `أهلاً ${name} — رحلتك بدأت الآن ✦` : `Welcome, ${name} — your journey starts now ✦`;
  const body = lang === "ar"
    ? `وصل طلبك لبرنامج <strong>${program}</strong>${mode ? ` (${mode})` : ""} إلى فريقنا بنجاح. نحن سعداء بانضمامك.`
    : `Your enrollment request for <strong>${program}</strong>${mode ? ` (${mode})` : ""} has reached our team. We're thrilled to have you.`;
  const note = lang === "ar"
    ? "سيتواصل معك أحد أعضاء فريق بكلمة خلال ٢٤–٤٨ ساعة لتأكيد التفاصيل."
    : "A member of the Bikalima team will reach out within 24–48 hours to confirm details.";
  const meta = PROGRAM_META[program];

  return `<div dir="${dir}" style="font-family:Tahoma,Arial,sans-serif;max-width:620px;margin:0 auto;background:#f0f0ee;">
  <table cellpadding="0" cellspacing="0" bgcolor="#0f4a40" style="width:100%;background:linear-gradient(160deg,#07201c 0%,#1a5c52 50%,#25786a 100%);">
    <tr><td bgcolor="#0f4a40" style="padding:52px 32px 44px;text-align:center;">
      <p style="margin:0 0 6px;font-size:32px;">🎙️</p>
      <p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;color:#b0d8d2;text-transform:uppercase;">${lang === "ar" ? "بكلمة ✦ صناعة الأثر وفن الإلقاء" : "Bikalima ✦ The Art of Impactful Speech"}</p>
      <h1 style="margin:0;font-size:24px;color:#ffffff;line-height:1.35;">${hero}</h1>
    </td></tr>
  </table>
  <div style="background:#fff;padding:36px 32px 24px;">
    <p style="margin:0 0 4px;font-size:18px;color:#1a5c52;">${name}،</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#1f2937;">${body}</p>
    <div style="background:#f0faf8;border-${bSide}:4px solid #1a5c52;border-radius:4px;padding:13px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#0d3b32;line-height:1.7;">${note}</p>
    </div>
    ${meta ? `<div style="background:#f8faff;border:1px solid #c7d2fe;border-radius:10px;padding:20px 22px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:8px 12px;color:#374151;width:42%;border-bottom:1px solid #e0e7ff;">${lang === "ar" ? "نوع التدريب" : "Training type"}</td><td style="padding:8px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${mode || "—"}</td></tr>
        <tr style="background:#f0f4ff;"><td style="padding:8px 12px;color:#374151;border-bottom:1px solid #e0e7ff;">${lang === "ar" ? "المدة" : "Duration"}</td><td style="padding:8px 12px;color:#1e3a5f;border-bottom:1px solid #e0e7ff;">${meta.hours} ${lang === "ar" ? "ساعة" : "hours"} / ${meta.sessions} ${lang === "ar" ? "جلسة" : "sessions"}</td></tr>
        <tr><td style="padding:10px 12px;color:#1e3a5f;font-size:14px;">${lang === "ar" ? "السعر" : "Price"}</td><td style="padding:10px 12px;font-size:18px;color:#1a5c52;">${meta.price} JOD</td></tr>
      </table>
    </div>` : ""}
  </div>
  <div style="padding:24px 32px 36px;text-align:center;">
    <a href="https://wa.me/${waNumber}?text=${waText}" target="_blank"
       style="display:inline-block;background:linear-gradient(135deg,#25D366,#1aa34a);color:#fff;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;">
      💬 ${lang === "ar" ? "تواصل مع فريق بكلمة" : "Chat with the Bikalima team"}
    </a>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.85);">${lang === "ar" ? "بكلمة ✦ صناعة الأثر وفن الإلقاء والخطابة" : "Bikalima ✦ The Art of Impactful Speech"}</p>
  </div>
</div>`;
}

router.post("/enroll", async (req, res) => {
  try {
    const p = req.body;
    const isInstitution = p.applicantType === "institution";
    const userId = req.isAuthenticated() ? req.user?.id : null;

    await db.insert(enrollmentRequestsTable).values({
      userId: userId || null,
      applicantType: isInstitution ? "institution" : "individual",
      fullName: isInstitution ? (p.contactPerson || p.orgName || "") : (p.name || ""),
      email: p.email || "",
      phone: p.phone || "",
      programId: p.program || "",
      trainingType: p.mode || null,
      youtubeLink: p.youtube || null,
      discountCode: p.discount || null,
      institutionName: isInstitution ? p.orgName : null,
      studentCount: p.studentCount ? parseInt(p.studentCount, 10) : null,
      teacherCount: p.teacherCount ? parseInt(p.teacherCount, 10) : null,
      workbooksNeeded: p.workbookCount ? parseInt(p.workbookCount, 10) : null,
      message: (isInstitution ? p.orgMessage : p.reason) || null,
      formData: p,
    });

    const transporter = buildTransporter();
    if (transporter) {
      const adminHtml = isInstitution
        ? buildInstitutionHtml(p)
        : buildIndividualHtml(p);
      const applicantHtml = buildApplicantConfirmationHtml(p, isInstitution);

      const adminSubject = isInstitution
        ? `🏫 طلب مؤسسي جديد — ${p.orgName || p.contactPerson}`
        : `🎙️ طلب تسجيل جديد — ${p.name} (${p.program})`;
      const applicantSubject =
        p.lang === "ar" || !p.lang
          ? `وصل طلبك بنجاح — بكلمة 🎙️`
          : `Your enrollment request received — Bikalima 🎙️`;

      try {
        await Promise.all([
          transporter.sendMail({
            from: FROM_ADDRESS,
            to: RECIPIENT,
            replyTo: p.email,
            subject: adminSubject,
            html: adminHtml,
          }),
          transporter.sendMail({
            from: FROM_ADDRESS,
            to: p.email,
            subject: applicantSubject,
            html: applicantHtml,
          }),
        ]);
      } catch (emailErr) {
        console.error("[Enroll] Email error:", emailErr);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Enroll] Error:", err);
    res.status(500).json({ error: "Failed to submit enrollment" });
  }
});

export default router;
