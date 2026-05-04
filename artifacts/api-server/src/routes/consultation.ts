import { Router, type Request, type Response } from "express";
import nodemailer from "nodemailer";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, consultationBookingsTable } from "@workspace/db";
import { registerLeadFromForm } from "../lib/leads.js";
import { applyAdHocLimit } from "../middlewares/security.js";

const consultationRouter = Router();

const ADMIN_EMAIL = "info@bikalima.com";

// Rate-limit + zod validation is shared via the security middleware so
// every 429 response carries Retry-After consistently.
const FROM_ADDRESS = process.env.SMTP_FROM ?? `"بكلمة – Bikalima" <${process.env.SMTP_USER ?? "info@bikalima.com"}>`;

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
  const { name: rawName, dateStr, timeStr, notes: rawNotes, lang } = opts;
  const name = esc(rawName);
  const notes = esc(rawNotes);
  const isAr = lang === "ar";
  const zoomLink = process.env.ZOOM_MEETING_URL ?? "";

  const tips = isAr ? [
    { icon: "🎯", title: "حدِّد هدفك بدقة", body: "قبل الجلسة، اكتب جملة واحدة تصف التحدي الذي تريد حلّه. كلما كان سؤالك أوضح، كانت الجلسة أعمق وأكثر فائدة لك." },
    { icon: "📝", title: "ضع أسئلتك مسبقاً", body: "اكتب 2–3 أسئلة تريد الإجابة عنها حتماً. ستساعدك على الاستفادة الكاملة من الوقت دون أن ينتهي قبل أن تصل لما تريد." },
    { icon: "🎙️", title: "استعدّ بمثال حيّ", body: "فكّر في موقف حقيقي واجهت فيه تحدياً في الإلقاء أو التواصل. المثال الواقعي يجعل الجلسة عملية وقابلة للتطبيق فوراً." },
    { icon: "🔕", title: "أبعد المشتتات", body: "اجلس في مكان هادئ، أغلق الإشعارات، وخصص هذه الساعة كاملاً لنفسك. الانتباه الكامل هو أثمن ما تقدمه لجلستك." },
    { icon: "✍️", title: "أحضر ورقة وقلم", body: "ستخرج بأفكار ونصائح مخصصة لك — دوّن كل شيء فوراً. الكلمة المكتوبة تبقى، والكلمة المسموعة تطير." },
  ] : [
    { icon: "🎯", title: "Define Your Goal Clearly", body: "Before the session, write one sentence describing the challenge you want to address. The clearer your question, the deeper and more impactful the session will be." },
    { icon: "📝", title: "Prepare Your Questions", body: "Write 2–3 questions you absolutely want answered. This ensures you make the most of every minute without running out of time." },
    { icon: "🎙️", title: "Bring a Real Example", body: "Think of a specific situation where you faced a speaking or communication challenge. Real examples make the session practical and immediately actionable." },
    { icon: "🔕", title: "Eliminate Distractions", body: "Find a quiet space, silence your notifications, and dedicate this full hour to yourself. Your full attention is the greatest gift you can give this session." },
    { icon: "✍️", title: "Bring Paper and Pen", body: "You'll walk away with personalized insights and tips — write everything down immediately. Written words stay; heard words fly." },
  ];

  return `
<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}" lang="${isAr ? "ar" : "en"}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;background:#f4f1ed;color:#1a1a1a;margin:0;padding:24px 12px}
  .wrap{max-width:560px;margin:0 auto}
  .card{background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.09)}
  .header{background:linear-gradient(135deg,#1a6b5a 0%,#0d4d3d 100%);padding:40px 32px;text-align:center;position:relative}
  .header::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:32px;background:#fff;border-radius:32px 32px 0 0}
  .logo{font-family:Georgia,serif;font-size:36px;font-weight:700;color:#fff;letter-spacing:1px}
  .tagline{font-size:12px;color:rgba(255,255,255,.7);margin-top:6px;letter-spacing:.5px}
  .confirmed{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:6px 18px;font-size:13px;font-weight:600;margin-top:20px}
  .body{padding:32px}
  h1{font-family:Georgia,serif;font-size:24px;margin:0 0 8px;color:#0d4d3d}
  .subtitle{font-size:15px;color:#666;margin:0 0 28px;line-height:1.6}
  .session-box{background:linear-gradient(135deg,#f0faf7,#e8f5f0);border:1px solid #b2ddd4;border-radius:16px;padding:24px;margin:0 0 32px}
  .session-title{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#1a6b5a;margin:0 0 16px}
  .info-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .info-icon{width:36px;height:36px;border-radius:10px;background:#1a6b5a;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
  .info-label{font-size:12px;color:#888}
  .info-value{font-size:15px;font-weight:700;color:#0d4d3d}
  .zoom-btn{display:block;background:#2d8cff;color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:700;font-size:15px;margin-top:16px;letter-spacing:.3px}
  .tips-section{margin:0 0 28px}
  .tips-heading{font-family:Georgia,serif;font-size:18px;font-weight:700;color:#0d4d3d;margin:0 0 4px}
  .tips-sub{font-size:13px;color:#888;margin:0 0 20px}
  .tip{display:flex;gap:14px;align-items:flex-start;margin-bottom:18px}
  .tip-icon{font-size:24px;flex-shrink:0;margin-top:2px}
  .tip-title{font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 3px}
  .tip-body{font-size:13px;color:#666;line-height:1.6;margin:0}
  .user-note{background:#fffbf5;border:1px solid #f0d9b5;border-radius:12px;padding:16px;margin:0 0 28px}
  .note-label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#c07a2a;margin:0 0 6px}
  .note-text{font-size:14px;color:#555;line-height:1.6;margin:0}
  .footer-quote{background:#0d4d3d;border-radius:14px;padding:20px 24px;margin:0 0 28px;text-align:center}
  .quote-text{font-family:Georgia,serif;font-size:15px;color:rgba(255,255,255,.9);line-height:1.7;margin:0 0 8px}
  .quote-author{font-size:12px;color:rgba(255,255,255,.5)}
  .contact-row{text-align:center;font-size:13px;color:#aaa;margin:0 0 8px}
  .contact-row a{color:#1a6b5a;text-decoration:none;font-weight:600}
  .copyright{text-align:center;font-size:11px;color:#ccc}
</style></head>
<body>
<div class="wrap">
<div class="card">
  <div class="header">
    <div class="logo">بكلمة</div>
    <div class="tagline">${isAr ? "منهج متكامل في فن الخطابة والتأثير" : "A Complete Methodology in Public Speaking & Influence"}</div>
    <div class="confirmed">✓ &nbsp;${isAr ? "تم تأكيد موعدك" : "Session Confirmed"}</div>
  </div>
  <div class="body">
    <h1>${isAr ? `مرحباً ${name} 👋` : `Hello ${name} 👋`}</h1>
    <p class="subtitle">${isAr
      ? "موعدك مع صهيب الخوالدة مؤكّد. اضغط الزر أدناه للدخول على Zoom مباشرة في وقت الجلسة."
      : "Your session with Suhaib Al-Khawaldeh is confirmed. Click the button below to join Zoom directly at session time."
    }</p>

    ${zoomLink
      ? `<a class="zoom-btn" href="${zoomLink}" style="display:block;background:#2D8CFF;color:#fff;text-decoration:none;text-align:center;padding:16px 24px;border-radius:14px;font-weight:700;font-size:16px;margin:0 0 28px;letter-spacing:.3px">🎥 &nbsp;${isAr ? "انضم للجلسة عبر Zoom" : "Join Session on Zoom"}</a>`
      : ``
    }

    <div class="session-box">
      <div class="session-title">${isAr ? "📅 تفاصيل الجلسة" : "📅 Session Details"}</div>
      <div class="info-row">
        <div class="info-icon">🗓</div>
        <div><div class="info-label">${isAr ? "التاريخ" : "Date"}</div><div class="info-value">${dateStr}</div></div>
      </div>
      <div class="info-row">
        <div class="info-icon">⏰</div>
        <div><div class="info-label">${isAr ? "الوقت" : "Time"}</div><div class="info-value">${timeStr}</div></div>
      </div>
      <div class="info-row">
        <div class="info-icon">💻</div>
        <div><div class="info-label">${isAr ? "المنصة" : "Platform"}</div><div class="info-value">Zoom</div></div>
      </div>
      ${zoomLink
        ? `<p style="margin:12px 0 0;font-size:13px;color:#555;text-align:center;line-height:1.6">${isAr ? "الرابط أعلاه يمكنك حفظه وفتحه في موعد جلستك مباشرة." : "Save the link above and open it at your session time."}</p>`
        : `<p style="margin:16px 0 0;font-size:13px;color:#888;text-align:center">${isAr ? "سيصلك رابط Zoom على بريدك قبل الموعد مباشرة." : "Your Zoom link will be sent to you shortly before the session."}</p>`
      }
    </div>

    ${notes ? `<div class="user-note"><div class="note-label">${isAr ? "ملاحظاتك" : "Your Notes"}</div><div class="note-text">${notes}</div></div>` : ""}

    <div class="tips-section">
      <div class="tips-heading">${isAr ? "كيف تستغل جلستك على أكمل وجه؟" : "How to Get the Most from Your Session"}</div>
      <p class="tips-sub">${isAr ? "٥ نصائح من صهيب الخوالدة لجلسة استثنائية:" : "5 tips from Suhaib Al-Khawaldeh for an exceptional session:"}</p>
      ${tips.map(tip => `
      <div class="tip">
        <div class="tip-icon">${tip.icon}</div>
        <div>
          <div class="tip-title">${tip.title}</div>
          <p class="tip-body">${tip.body}</p>
        </div>
      </div>`).join("")}
    </div>

    <div class="footer-quote">
      <div class="quote-text">"${isAr ? "لا تخف من صوتك... خف من اليوم الذي تُقرر فيه ألا تتكلم." : "Don't fear your voice… fear the day you decide not to speak."}"</div>
      <div class="quote-author">— ${isAr ? "صهيب الخوالدة" : "Suhaib Al-Khawaldeh"}</div>
    </div>

    <div class="contact-row">${isAr ? "استفسار؟ راسلنا:" : "Questions? Write to us:"} <a href="mailto:info@bikalima.com">info@bikalima.com</a></div>
    <div class="copyright">© ${new Date().getFullYear()} Bikalima · بكلمة</div>
  </div>
</div>
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
  const { name: rawName, email: rawEmail, phone: rawPhone, dateStr, timeStr, notes: rawNotes } = opts;
  const name = esc(rawName);
  const email = esc(rawEmail);
  const phone = esc(rawPhone);
  const notes = esc(rawNotes);
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

const BookConsultationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  date: z.string().trim().min(1).max(20),
  time: z.string().trim().min(1).max(20),
  notes: z.string().max(2000).optional(),
  lang: z.string().max(10).optional(),
  consultationType: z.string().max(60).optional(),
  programId: z.string().max(80).optional(),
  programTitle: z.string().max(200).optional(),
});

consultationRouter.post("/book-consultation", async (req: Request, res: Response) => {
  // req.ip is populated from x-forwarded-for under `trust proxy = 1`.
  // applyAdHocLimit handles the 429 + Retry-After response for us.
  const clientIp = req.ip ?? "unknown";
  if (!applyAdHocLimit(res, `book-consultation:${clientIp}`, 3, 60 * 60 * 1000)) return;

  const parsed = BookConsultationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", issues: parsed.error.issues });
    return;
  }
  const { name, email, phone, date, time, notes, lang, consultationType, programId, programTitle } = parsed.data;

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

  // ── Persist booking + register/upsert lead ─────────────────────
  let bookingId: string | null = null;
  try {
    const [row] = await db
      .insert(consultationBookingsTable)
      .values({
        fullName: name,
        email,
        phone: phoneText,
        preferredDate: date,
        preferredTime: time,
        notes: notesText || null,
        consultationType: consultationType ?? null,
        interestProgramId: programId ?? null,
        interestProgramTitle: programTitle ?? null,
        status: "requested",
      })
      .returning({ id: consultationBookingsTable.id });
    bookingId = row.id;

    const { leadId } = await registerLeadFromForm({
      contact: {
        fullName: name,
        phone: phoneText || null,
        email,
        source: "consultation",
        interestProgramTitle: programTitle ?? null,
      },
      activity: {
        type: "linked_consultation",
        summaryAr: `حجز جلسة استشارة — ${date} الساعة ${time}`,
        relatedEntityType: "consultation",
        relatedEntityId: bookingId ?? undefined,
        payload: { date, time, notes: notesText },
      },
      trigger: "consultation.created",
      triggerPayload: { date, time },
    });
    if (bookingId) {
      await db
        .update(consultationBookingsTable)
        .set({ leadId })
        .where(eq(consultationBookingsTable.id, bookingId));
    }
  } catch (err) {
    console.warn("[Consultation] CRM upsert failed:", err);
  }

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
