import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";

const consultationRouter = Router();

const ADMIN_EMAIL = "info@bikalima.com";
const FROM_ADDRESS = process.env.SMTP_FROM ?? `"بكلمة – Bikalima" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  if (!host || !user || !pass) {
    console.warn("[SMTP] Missing config — consultation emails will not be sent.");
    return null;
  }
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

function buildICS(opts: {
  uid: string;
  name: string;
  email: string;
  dateStr: string;
  timeStr: string;
  lang: string;
}): string {
  const { uid, name, email, dateStr, timeStr, lang } = opts;

  const [day, month, year] = dateStr.split("/").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  const pad = (n: number) => String(n).padStart(2, "0");
  const dtStart = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
  const endHour = hour + 1;
  const dtEnd = `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(minute)}00`;
  const now = new Date();
  const dtStamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}Z`;

  const summaryAr = "استشارة مجانية — بكلمة";
  const summaryEn = "Free Consultation — Bikalima";
  const summary = lang === "ar" ? summaryAr : summaryEn;

  const descAr = `جلستك المجانية مع صهيب الخوالدة | Bikalima\\nسيتم التواصل معك على: ${email}`;
  const descEn = `Your free consultation with Suhaib Al-Khawaldeh | Bikalima\\nWe'll reach out to you at: ${email}`;
  const description = lang === "ar" ? descAr : descEn;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bikalima//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}@bikalima.com`,
    `DTSTAMP:${dtStamp}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "LOCATION:Zoom / Online",
    `ORGANIZER;CN=صهيب الخوالدة:mailto:${ADMIN_EMAIL}`,
    `ATTENDEE;PARTSTAT=NEEDS-ACTION;CN=${name}:mailto:${email}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    lang === "ar"
      ? "DESCRIPTION:تذكير: جلستك مع بكلمة خلال 15 دقيقة"
      : "DESCRIPTION:Reminder: Your Bikalima session in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildUserHtml(opts: {
  name: string;
  dateStr: string;
  timeStr: string;
  notes: string;
  lang: string;
}): string {
  const { name, dateStr, timeStr, notes, lang } = opts;
  const isAr = lang === "ar";
  return `
<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${lang}">
<head><meta charset="UTF-8"><style>
  body{font-family:Arial,sans-serif;background:#f8f5f0;color:#1a1a1a;margin:0;padding:0}
  .wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,.08)}
  .header{background:#7c4a2d;padding:32px 28px;color:#fff;text-align:center}
  .logo{font-family:Georgia,serif;font-size:28px;font-weight:700;letter-spacing:1px}
  .tagline{font-size:12px;opacity:.7;margin-top:4px}
  .body{padding:32px 28px}
  .badge{display:inline-block;background:#7c4a2d1a;color:#7c4a2d;border-radius:999px;padding:6px 16px;font-size:13px;font-weight:600;margin-bottom:20px}
  h2{font-family:Georgia,serif;font-size:22px;margin:0 0 12px}
  p{font-size:15px;line-height:1.7;color:#444;margin:0 0 12px}
  .card{background:#f8f5f0;border-radius:12px;padding:20px;margin:20px 0}
  .row{display:flex;gap:8px;align-items:center;margin-bottom:10px;font-size:14px}
  .label{color:#888;min-width:90px}
  .value{font-weight:600;color:#1a1a1a}
  .note{background:#fff8f0;border:1px solid #e8d5c0;border-radius:8px;padding:14px;font-size:13px;color:#666;margin-top:8px}
  .footer{padding:20px 28px;background:#f0ebe3;font-size:12px;color:#888;text-align:center;border-top:1px solid #e8d5c0}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">بكلمة · Bikalima</div>
    <div class="tagline">منهج متكامل في فن الخطابة والتأثير</div>
  </div>
  <div class="body">
    <div class="badge">${isAr ? "✅ تم تأكيد موعدك" : "✅ Booking Confirmed"}</div>
    <h2>${isAr ? `مرحباً ${name}،` : `Hello ${name},`}</h2>
    <p>${isAr ? "تم حجز جلستك الاستشارية المجانية بنجاح. ستجد تفاصيل الموعد أدناه، وقد أرفقنا دعوة التقويم لإضافتها مباشرة." : "Your free consultation session has been booked successfully. Find the details below. A calendar invite is attached."}</p>
    <div class="card">
      <div class="row"><span class="label">${isAr ? "التاريخ" : "Date"}:</span><span class="value">${dateStr}</span></div>
      <div class="row"><span class="label">${isAr ? "الوقت" : "Time"}:</span><span class="value">${timeStr}</span></div>
      <div class="row"><span class="label">${isAr ? "المنصة" : "Platform"}:</span><span class="value">Zoom</span></div>
      ${notes ? `<div class="note"><strong>${isAr ? "ملاحظاتك:" : "Your notes:"}</strong><br>${notes}</div>` : ""}
    </div>
    <p>${isAr ? "سيتواصل معك صهيب الخوالدة قريباً لتأكيد الموعد وإرسال رابط Zoom." : "Suhaib Al-Khawaldeh will reach out to confirm and send the Zoom link."}</p>
    <p style="margin-top:20px;font-size:13px;color:#888">${isAr ? "للاستفسار: info@bikalima.com" : "Questions? info@bikalima.com"}</p>
  </div>
  <div class="footer">Bikalima · بكلمة · © ${new Date().getFullYear()}</div>
</div>
</body></html>`;
}

function buildAdminHtml(opts: {
  name: string;
  email: string;
  phone: string;
  dateStr: string;
  timeStr: string;
  notes: string;
}): string {
  const { name, email, phone, dateStr, timeStr, notes } = opts;
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body{font-family:Arial,sans-serif;background:#f8f5f0;color:#1a1a1a;margin:0;padding:0}
  .wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,.08)}
  .header{background:#1a1a1a;padding:24px 28px;color:#fff}
  .body{padding:28px}
  h2{font-family:Georgia,serif;font-size:20px;margin:0 0 16px}
  .row{display:flex;gap:8px;margin-bottom:10px;font-size:14px;border-bottom:1px solid #f0ebe3;padding-bottom:8px}
  .label{color:#888;min-width:110px;font-weight:600}
  .value{color:#1a1a1a}
  .note{background:#f8f5f0;border-radius:8px;padding:12px;font-size:13px;margin-top:12px}
</style></head>
<body>
<div class="wrap">
  <div class="header"><strong>🗓 حجز جلسة استشارية جديدة — بكلمة</strong></div>
  <div class="body">
    <h2>تفاصيل الحجز</h2>
    <div class="row"><span class="label">الاسم:</span><span class="value">${name}</span></div>
    <div class="row"><span class="label">البريد الإلكتروني:</span><span class="value">${email}</span></div>
    <div class="row"><span class="label">الجوال:</span><span class="value">${phone || "—"}</span></div>
    <div class="row"><span class="label">التاريخ:</span><span class="value">${dateStr}</span></div>
    <div class="row"><span class="label">الوقت:</span><span class="value">${timeStr}</span></div>
    ${notes ? `<div class="note"><strong>ملاحظات العميل:</strong><br>${notes}</div>` : ""}
  </div>
</div>
</body></html>`;
}

consultationRouter.post("/book-consultation", async (req: Request, res: Response) => {
  const { name, email, phone, date, time, notes, lang } = req.body as {
    name: string;
    email: string;
    phone?: string;
    date: string;
    time: string;
    notes?: string;
    lang?: string;
  };

  if (!name || !email || !date || !time) {
    res.status(400).json({ error: "name, email, date, and time are required" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const usedLang = lang ?? "ar";
  const notesText = notes ?? "";
  const phoneText = phone ?? "";

  const icsContent = buildICS({ uid, name, email, dateStr: date, timeStr: time, lang: usedLang });
  const userHtml = buildUserHtml({ name, dateStr: date, timeStr: time, notes: notesText, lang: usedLang });
  const adminHtml = buildAdminHtml({ name, email, phone: phoneText, dateStr: date, timeStr: time, notes: notesText });

  const isAr = usedLang === "ar";
  const subjectUser = isAr
    ? `تم تأكيد موعدك — بكلمة · ${date} الساعة ${time}`
    : `Booking Confirmed — Bikalima · ${date} at ${time}`;
  const subjectAdmin = `🗓 حجز جديد من ${name} — ${date} الساعة ${time}`;

  const transporter = buildTransporter();
  if (transporter) {
    const icsAttachment = {
      filename: "bikalima-consultation.ics",
      content: icsContent,
      contentType: "text/calendar; method=REQUEST",
    };

    try {
      await Promise.all([
        transporter.sendMail({
          from: FROM_ADDRESS,
          to: email,
          subject: subjectUser,
          html: userHtml,
          attachments: [icsAttachment],
        }),
        transporter.sendMail({
          from: FROM_ADDRESS,
          to: ADMIN_EMAIL,
          subject: subjectAdmin,
          html: adminHtml,
          attachments: [icsAttachment],
        }),
      ]);
    } catch (err) {
      console.error("[Consultation] Email send error:", err);
    }
  }

  res.json({ success: true });
});

export default consultationRouter;
