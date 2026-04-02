import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { db, enrollmentRequestsTable } from "@workspace/db";
import { toWaPhone } from "../lib/phone.js";

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
        <a href="https://wa.me/${toWaPhone(p.phone)}" target="_blank" style="display:inline-block;background:#25D366;color:white;font-weight:bold;padding:10px 24px;border-radius:50px;text-decoration:none;font-size:14px;">💬 تواصل عبر واتساب مع المتقدم</a>
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
        <a href="https://wa.me/${toWaPhone(p.phone)}" target="_blank" style="display:inline-block;background:#25D366;color:white;font-weight:bold;padding:10px 24px;border-radius:50px;text-decoration:none;font-size:14px;">💬 تواصل عبر واتساب مع المؤسسة</a>
      </div>
      <p style="margin-top:16px;color:#6b7280;font-size:12px;text-align:center;">بكلمة — برنامج الخطابة التحويلي | suhaib@ilgholding.com</p>
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
        from: `"بكلمة - نماذج التسجيل" <${process.env.SMTP_USER}>`,
        to: RECIPIENT,
        replyTo: payload.email,
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
