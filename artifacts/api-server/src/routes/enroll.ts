import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";

const enrollRouter = Router();

const RECIPIENT = "suhaib@ilgholding.com";

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
    "group-online": "جماعي عن بعد",
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
      <p style="margin-top:24px;color:#6b7280;font-size:12px;text-align:center;">بكلمة — برنامج الخطابة التحويلي | suhaib@ilgholding.com</p>
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
      <p style="margin-top:24px;color:#6b7280;font-size:12px;text-align:center;">بكلمة — برنامج الخطابة التحويلي | suhaib@ilgholding.com</p>
    </div>
  `;
}

enrollRouter.post("/enroll", async (req: Request, res: Response) => {
  const payload = req.body as Record<string, string>;
  const log = req.log ?? console;

  if (payload.type === "individual") {
    log.info(
      {
        applicantType: "individual",
        name: payload.name,
        program: payload.program,
        mode: payload.mode,
        category: payload.category,
        lang: payload.lang,
        hasYoutube: !!payload.youtube,
        hasDiscount: !!payload.discount,
      },
      "Individual enrollment received",
    );
  } else if (payload.type === "institution") {
    log.info(
      {
        applicantType: "institution",
        orgName: payload.orgName,
        program: payload.program,
        studentCount: payload.studentCount,
        teacherCount: payload.teacherCount,
        lang: payload.lang,
        hasDiscount: !!payload.discount,
      },
      "Institution enrollment received",
    );
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
        from: `"بكلمة - نماذج التسجيل" <${process.env.SMTP_USER}>`,
        to: RECIPIENT,
        subject,
        html,
      });
      log.info({ to: RECIPIENT }, "Enrollment email sent");
    } catch (err) {
      log.error({ err }, "Failed to send enrollment email");
    }
  } else {
    log.warn("SMTP not configured — enrollment email not sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS.");
  }

  res.status(200).json({ success: true, message: "Enrollment received" });
});

export default enrollRouter;
