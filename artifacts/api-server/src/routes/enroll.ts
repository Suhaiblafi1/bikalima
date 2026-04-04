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

const PROGRAM_META: Record<string, { price: number; hours: number; sessions: number; id: string }> = {
  "المتحدث المؤثر":                   { price: 70,  hours: 27, sessions: 14, id: "core" },
  "المدرب المعتمد":                   { price: 110, hours: 40, sessions: 20, id: "tot"  },
  "تأهيل المعلمين لتعليم الأطفال":   { price: 90,  hours: 21, sessions: 11, id: "teachers" },
  "المتحدث الصغير":                   { price: 50,  hours: 18, sessions: 9,  id: "children" },
  "The Influential Speaker":           { price: 70,  hours: 27, sessions: 14, id: "core" },
  "The Certified Trainer":             { price: 110, hours: 40, sessions: 20, id: "tot"  },
  "Qualifying Educators to Teach Children": { price: 90, hours: 21, sessions: 11, id: "teachers" },
  "The Young Speaker":                 { price: 50,  hours: 18, sessions: 9,  id: "children" },
  "L'Orateur Influent":                { price: 70,  hours: 27, sessions: 14, id: "core" },
  "Le Formateur Certifié":             { price: 110, hours: 40, sessions: 20, id: "tot"  },
  "Qualifier les Éducateurs pour les Enfants": { price: 90, hours: 21, sessions: 11, id: "teachers" },
  "Le Jeune Orateur":                  { price: 50,  hours: 18, sessions: 9,  id: "children" },
};

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
    `أهلاً ${p.name} 👋\n\nأتواصل معك من فريق *بكلمة* 🎙️ بخصوص طلب تسجيلك في برنامج *${p.program}*.\n\nوصل طلبك بنجاح، ويسعدنا الترحيب بك.\n\nهل أنت متاح الآن لنتفق على تفاصيل الانطلاق؟\n\nفريق بكلمة ✦`
  );
  const now = new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman", dateStyle: "long", timeStyle: "short" });
  const actions = [
    "تواصل مع المتقدم خلال ٢٤ ساعة من استلام هذا الإشعار",
    "تأكيد توفر الأماكن في البرنامج المطلوب",
    "إرسال تفاصيل التسجيل أو رابط الدفع",
    "متابعة خلال ٤٨ ساعة للتأكد من اكتمال التسجيل",
  ];
  return `<div dir="rtl" style="font-family:Tahoma,'Geeza Pro','Al Nile',Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;background:#f0f2f1;">
  <table cellpadding="0" cellspacing="0" style="width:100%;background:linear-gradient(150deg,#07201c 0%,#1a5c52 100%);">
    <tr>
      <td style="padding:24px 32px 20px;">
        <table cellpadding="0" cellspacing="0"><tr><td>
          <span style="display:inline-block;background:#f59e0b;color:#1a0a00;font-size:11px;font-weight:800;padding:5px 14px;border-radius:20px;letter-spacing:0.5px;">⚡ إجراء مطلوب</span>
        </td></tr></table>
        <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;font-weight:800;">طلب تسجيل جديد — فردي</h1>
        <p style="margin:0;color:#b0d8d2;font-size:12px;">${now}</p>
      </td>
      <td style="padding:20px 32px 20px 0;vertical-align:top;text-align:left;">
        <div style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.38);border-radius:12px;padding:14px 18px;min-width:140px;">
          <p style="margin:0 0 2px;font-size:12px;color:#c8e8e1;">المتقدم</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${p.name || "—"}</p>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.90);" dir="ltr">${p.phone || "—"}</p>
        </div>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" style="width:100%;background:#fff;border-bottom:1px solid #eee;">
    <tr>
      <td style="padding:20px 32px 20px 16px;width:50%;vertical-align:top;">
        <div style="background:#f0faf8;border-radius:10px;padding:14px 16px;border:1px solid #c7e8e1;">
          <p style="margin:0 0 3px;font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">البرنامج</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a5c52;">${p.program || "—"}</p>
        </div>
      </td>
      <td style="padding:20px 16px 20px 32px;width:50%;vertical-align:top;">
        <div style="background:#f0faf8;border-radius:10px;padding:14px 16px;border:1px solid #c7e8e1;">
          <p style="margin:0 0 3px;font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">نوع التدريب</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a5c52;">${modeLabel(p.mode) || "—"}</p>
        </div>
      </td>
    </tr>
  </table>
  <div style="background:#fff;padding:8px 32px 24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
      ${rows.map(([label, value], i) => `<tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};"><td style="padding:10px 14px;color:#6b7280;width:42%;border-bottom:1px solid #f0f0f0;">${label}</td><td style="padding:10px 14px;color:#111;font-weight:600;border-bottom:1px solid #f0f0f0;">${value ?? "—"}</td></tr>`).join("")}
    </table>
  </div>
  <div style="padding:0 32px 24px;">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-right:4px solid #f59e0b;border-radius:10px;padding:20px 22px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:800;color:#92400e;">📋 الخطوات المطلوبة منك الآن</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${actions.map((step, i) => `<tr><td style="width:28px;padding:0 12px 10px 0;vertical-align:top;"><div style="width:22px;height:22px;border-radius:11px;background:#f59e0b;color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:22px;">${i + 1}</div></td><td style="padding:2px 0 10px;font-size:13px;color:#78350f;line-height:1.55;vertical-align:top;">${step}</td></tr>`).join("")}
      </table>
    </div>
  </div>
  <div style="padding:0 32px 36px;text-align:center;">
    <a href="https://wa.me/${toWaPhone(p.phone)}?text=${waMsg}" target="_blank"
       style="display:inline-block;background:#25D366;color:#fff;font-weight:800;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;letter-spacing:0.3px;">
      💬 تواصل الآن مع ${p.name}
    </a>
    <p style="margin:12px 0 0;color:#b0b8b6;font-size:12px;" dir="ltr">${p.phone}</p>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.85);">معيار رضا العملاء: رد أولي خلال ٢٤ ساعة — متابعة كاملة خلال ٧٢ ساعة ✦ بكلمة</p>
  </div>
</div>`
;}

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
    `أهلاً ${p.contactPerson} 👋\n\nأتواصل معك من فريق *بكلمة* 🎙️ بخصوص طلب الشراكة المؤسسية لـ *${p.orgName}*.\n\nوصل طلبكم بنجاح، ويسعدنا التواصل لجدولة اجتماع لمناقشة تفاصيل البرنامج المخصص لمؤسستكم.\n\nمتى يناسبكم الحديث؟\n\nفريق بكلمة ✦`
  );
  const now = new Date().toLocaleString("ar-JO", { timeZone: "Asia/Amman", dateStyle: "long", timeStyle: "short" });
  const actions = [
    `تواصل مع ${p.contactPerson || "المسؤول"} خلال ٢٤ ساعة`,
    "جدولة اجتماع لمناقشة البرنامج المؤسسي",
    "إعداد عرض سعر مخصص بناءً على الأعداد",
    "إرسال مقترح الشراكة الرسمي وخطة التنفيذ",
  ];
  return `<div dir="rtl" style="font-family:Tahoma,'Geeza Pro','Al Nile',Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;background:#f0f2f1;">
  <table cellpadding="0" cellspacing="0" style="width:100%;background:linear-gradient(150deg,#07201c 0%,#1a5c52 100%);">
    <tr>
      <td style="padding:24px 32px 20px;">
        <table cellpadding="0" cellspacing="0"><tr><td>
          <span style="display:inline-block;background:#f59e0b;color:#1a0a00;font-size:11px;font-weight:800;padding:5px 14px;border-radius:20px;letter-spacing:0.5px;">⚡ شراكة مؤسسية — إجراء مطلوب</span>
        </td></tr></table>
        <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;font-weight:800;">طلب تسجيل مؤسسي جديد</h1>
        <p style="margin:0;color:#b0d8d2;font-size:12px;">${now}</p>
      </td>
      <td style="padding:20px 32px 20px 0;vertical-align:top;text-align:left;">
        <div style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.38);border-radius:12px;padding:14px 18px;min-width:140px;">
          <p style="margin:0 0 2px;font-size:12px;color:#c8e8e1;">المؤسسة</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#fff;">${p.orgName || "—"}</p>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.90);">${p.contactPerson || "—"}</p>
        </div>
      </td>
    </tr>
  </table>
  <table cellpadding="0" cellspacing="0" style="width:100%;background:#fff;border-bottom:1px solid #eee;">
    <tr>
      <td style="padding:20px 32px 20px 16px;width:50%;vertical-align:top;">
        <div style="background:#f0faf8;border-radius:10px;padding:14px 16px;border:1px solid #c7e8e1;">
          <p style="margin:0 0 3px;font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">البرنامج</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a5c52;">${p.program || "—"}</p>
        </div>
      </td>
      <td style="padding:20px 16px 20px 32px;width:50%;vertical-align:top;">
        <div style="background:#f0faf8;border-radius:10px;padding:14px 16px;border:1px solid #c7e8e1;">
          <p style="margin:0 0 3px;font-size:10px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">حجم المجموعة</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a5c52;">${p.studentCount ? `${p.studentCount} طالب` : "—"}</p>
        </div>
      </td>
    </tr>
  </table>
  <div style="background:#fff;padding:8px 32px 24px;">
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
      ${rows.map(([label, value], i) => `<tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"};"><td style="padding:10px 14px;color:#6b7280;width:42%;border-bottom:1px solid #f0f0f0;">${label}</td><td style="padding:10px 14px;color:#111;font-weight:600;border-bottom:1px solid #f0f0f0;">${value ?? "—"}</td></tr>`).join("")}
    </table>
  </div>
  <div style="padding:0 32px 24px;">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-right:4px solid #f59e0b;border-radius:10px;padding:20px 22px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:800;color:#92400e;">📋 الخطوات المطلوبة منك الآن</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${actions.map((step, i) => `<tr><td style="width:28px;padding:0 12px 10px 0;vertical-align:top;"><div style="width:22px;height:22px;border-radius:11px;background:#f59e0b;color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:22px;">${i + 1}</div></td><td style="padding:2px 0 10px;font-size:13px;color:#78350f;line-height:1.55;vertical-align:top;">${step}</td></tr>`).join("")}
      </table>
    </div>
  </div>
  <div style="padding:0 32px 36px;text-align:center;">
    <a href="https://wa.me/${toWaPhone(p.phone)}?text=${waMsg}" target="_blank"
       style="display:inline-block;background:#25D366;color:#fff;font-weight:800;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;letter-spacing:0.3px;">
      💬 تواصل مع ${p.contactPerson || p.orgName}
    </a>
    <p style="margin:12px 0 0;color:#b0b8b6;font-size:12px;" dir="ltr">${p.phone}</p>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.85);">معيار رضا العملاء: رد أولي خلال ٢٤ ساعة — متابعة كاملة خلال ٧٢ ساعة ✦ بكلمة</p>
  </div>
</div>`;
}

function buildApplicantConfirmationHtml(p: Record<string, string>, isInstitution: boolean) {
  const lang = p.lang || "ar";
  const name = isInstitution ? (p.contactPerson || p.orgName) : p.name;
  const program = p.program || "—";
  const mode = isInstitution ? null : modeLabel(p.mode);
  const waNumber = "97455377065";
  const waText = encodeURIComponent(
    lang === "ar"
      ? `أهلاً فريق بكلمة 🎙️\nأنا ${name}، سجّلت في برنامج "${program}" للتو عبر الموقع.\nأودّ الاستفسار عن خطوات الانطلاق 🙏`
      : lang === "fr"
      ? `Bonjour équipe Bikalima 🎙️\nJe suis ${name}, je viens de m'inscrire au programme "${program}" sur le site.\nJ'aimerais en savoir plus sur les prochaines étapes 🙏`
      : `Hello Bikalima team 🎙️\nI'm ${name}, I just enrolled in the "${program}" program on your website.\nI'd love to know more about the next steps 🙏`
  );

  type Lang = "ar" | "en" | "fr";
  const tMap: Record<Lang, {
    hero: string; heroSub: string; greeting: string; body: string; note: string;
    stepsTitle: string;
    s1t: string; s1d: string; s2t: string; s2d: string; s3t: string; s3d: string; s4t: string; s4d: string;
    quote: string; waBtn: string; footer: string;
  }> = {
    ar: {
      hero: `أهلاً ${name} — رحلتك بدأت الآن ✦`,
      heroSub: "بكلمة ✦ صناعة الأثر وفن الإلقاء",
      greeting: `${name}،`,
      body: `وصل طلبك لبرنامج <strong>${program}</strong>${mode ? ` (${mode})` : ""} إلى فريقنا بنجاح. نحن سعداء بانضمامك، وهذه بداية قصة جديدة بكل معنى الكلمة.`,
      note: "سيتواصل معك أحد أعضاء فريق بكلمة خلال ٢٤–٤٨ ساعة لتأكيد التفاصيل وتوجيهك في الخطوات القادمة.",
      stepsTitle: "ما الذي يحدث الآن",
      s1t: "تقديم الطلب", s1d: "اكتمل — وصلنا طلبك بنجاح ✓",
      s2t: "مراجعة الفريق", s2d: "جارٍ الآن — خلال ٢٤–٤٨ ساعة",
      s3t: "التواصل والتأكيد", s3d: "سنتواصل معك لتأكيد التسجيل",
      s4t: "انطلاق رحلتك", s4d: "بداية برنامجك التحويلي",
      quote: "لا تُقاس الكلمات بعددها، بل بالأثر الذي تتركه في القلوب.",
      waBtn: "تواصل مع فريق بكلمة",
      footer: "بكلمة ✦ صناعة الأثر وفن الإلقاء والخطابة",
    },
    en: {
      hero: `Welcome, ${name} — your journey starts now ✦`,
      heroSub: "Bikalima ✦ The Art of Impactful Speech",
      greeting: `${name},`,
      body: `Your enrollment request for <strong>${program}</strong>${mode ? ` (${mode})` : ""} has reached our team. We're thrilled to have you, and this is the beginning of something truly meaningful.`,
      note: "A member of the Bikalima team will reach out within 24–48 hours to confirm details and guide you through the next steps.",
      stepsTitle: "What happens next",
      s1t: "Application", s1d: "Complete — we've received your request ✓",
      s2t: "Team Review", s2d: "In progress — within 24–48 hours",
      s3t: "Outreach & Confirmation", s3d: "We'll contact you to confirm enrollment",
      s4t: "Your Journey Begins", s4d: "Start your transformational program",
      quote: "Words are not measured by their count, but by the impression they leave on hearts.",
      waBtn: "Chat with the Bikalima team",
      footer: "Bikalima ✦ The Art of Impactful Speech",
    },
    fr: {
      hero: `Bienvenue, ${name} — votre parcours commence ✦`,
      heroSub: "Bikalima ✦ L'art de la parole impactante",
      greeting: `${name},`,
      body: `Votre demande d'inscription au programme <strong>${program}</strong>${mode ? ` (${mode})` : ""} est bien arrivée. Nous sommes ravis de vous accueillir — c'est le début d'une belle aventure.`,
      note: "Un membre de l'équipe Bikalima vous contactera dans les 24–48 heures pour confirmer les détails et vous guider.",
      stepsTitle: "Ce qui se passe maintenant",
      s1t: "Candidature", s1d: "Reçue — votre demande est enregistrée ✓",
      s2t: "Examen de l'équipe", s2d: "En cours — sous 24–48 heures",
      s3t: "Contact & Confirmation", s3d: "Nous vous contacterons pour confirmer",
      s4t: "Début de votre parcours", s4d: "Démarrez votre programme de transformation",
      quote: "Les mots ne se mesurent pas à leur nombre, mais à l'empreinte qu'ils laissent dans les cœurs.",
      waBtn: "Contacter l'équipe Bikalima",
      footer: "Bikalima ✦ L'art de la parole impactante",
    },
  };
  const t = tMap[(lang as Lang)] || tMap.ar;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const bSide = lang === "ar" ? "right" : "left";

  const meta = PROGRAM_META[program];
  const steps = [
    { done: true,  active: false, icon: "✓", title: t.s1t, desc: t.s1d,  bg: "#1a5c52", textColor: "#0d3b32", descColor: "#374151", borderColor: "#1a5c52", rowBg: "#e8f5f2" },
    { done: false, active: true,  icon: "2", title: t.s2t, desc: t.s2d,  bg: "#f59e0b", textColor: "#7c2d12", descColor: "#92400e", borderColor: "#f59e0b", rowBg: "#fef3c7" },
    { done: false, active: false, icon: "3", title: t.s3t, desc: t.s3d,  bg: "#94a3b8", textColor: "#334155", descColor: "#475569", borderColor: "#cbd5e1", rowBg: "#f1f5f9" },
    { done: false, active: false, icon: "4", title: t.s4t, desc: t.s4d,  bg: "#94a3b8", textColor: "#334155", descColor: "#475569", borderColor: "#cbd5e1", rowBg: "#f1f5f9" },
  ];

  const priceLabel = lang === "ar" ? "السعر" : lang === "fr" ? "Tarif" : "Price";
  const hoursLabel = lang === "ar" ? "المدة" : lang === "fr" ? "Durée" : "Duration";
  const sessionsLabel = lang === "ar" ? "الجلسات" : lang === "fr" ? "Séances" : "Sessions";
  const hoursUnit = lang === "ar" ? "ساعة" : lang === "fr" ? "heures" : "hours";
  const sessionsUnit = lang === "ar" ? "جلسة" : lang === "fr" ? "séances" : "sessions";
  const modeLabel2 = lang === "ar" ? "نوع التدريب" : lang === "fr" ? "Type de formation" : "Training type";
  const priceNote = lang === "ar" ? "* السعر يمثل تسجيل مسجل + بث مباشر — يختلف حسب نوع التدريب المختار"
    : lang === "fr" ? "* Tarif pour accès enregistré + direct — varie selon le type de formation"
    : "* Price is for recorded + live stream access — varies by training type";

  return `<div dir="${dir}" style="font-family:Tahoma,'Geeza Pro','Al Nile',Arial,Helvetica,sans-serif;max-width:620px;margin:0 auto;background:#f0f0ee;">
  <div style="background:linear-gradient(160deg,#07201c 0%,#1a5c52 50%,#25786a 100%);padding:52px 32px 44px;text-align:center;">
    <p style="margin:0 0 6px;font-size:32px;">🎙️</p>
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;color:rgba(255,255,255,0.88);text-transform:uppercase;">${t.heroSub}</p>
    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.35;">${t.hero}</h1>
  </div>
  <div style="background:#fff;padding:36px 32px 24px;">
    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a5c52;">${t.greeting}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#1f2937;">${t.body}</p>
    <div style="background:#f0faf8;border-${bSide}:4px solid #1a5c52;border-radius:4px;padding:13px 18px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#0d3b32;font-weight:600;line-height:1.7;">${t.note}</p>
    </div>
    ${meta ? `<div style="background:#f8faff;border:1px solid #c7d2fe;border-radius:10px;padding:20px 22px;margin-bottom:0;">
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:8px 12px;color:#374151;width:42%;border-bottom:1px solid #e0e7ff;font-weight:500;">${modeLabel2}</td><td style="padding:8px 12px;color:#1e3a5f;font-weight:700;border-bottom:1px solid #e0e7ff;">${mode || "—"}</td></tr>
        <tr style="background:#f0f4ff;"><td style="padding:8px 12px;color:#374151;width:42%;border-bottom:1px solid #e0e7ff;font-weight:500;">${hoursLabel}</td><td style="padding:8px 12px;color:#1e3a5f;font-weight:700;border-bottom:1px solid #e0e7ff;">${meta.hours} ${hoursUnit} / ${meta.sessions} ${sessionsUnit}</td></tr>
        <tr><td style="padding:10px 12px;color:#1e3a5f;font-weight:800;font-size:14px;">${priceLabel}</td><td style="padding:10px 12px;font-size:18px;font-weight:800;color:#1a5c52;">${meta.price} JOD</td></tr>
      </table>
      <p style="margin:10px 0 0;font-size:11px;color:#6b7280;">${priceNote}</p>
    </div>` : ""}
  </div>
  <div style="background:#fff;padding:8px 32px 32px;">
    <p style="margin:0 0 16px;font-size:10px;letter-spacing:3px;color:#6b7280;font-weight:700;text-transform:uppercase;">${t.stepsTitle}</p>
    ${steps.map((s, i) => `<div style="border-${bSide}:4px solid ${s.borderColor};background:${s.rowBg};border-radius:4px;padding:13px 18px;margin-bottom:${i < 3 ? "8px" : "0"};">
      <table cellpadding="0" cellspacing="0" style="width:100%;"><tr>
        <td style="width:32px;vertical-align:top;padding:0 12px 0 0;">
          <div style="width:28px;height:28px;border-radius:14px;background:${s.bg};color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:28px;">${s.icon}</div>
        </td>
        <td style="vertical-align:top;">
          <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${s.textColor};">${s.title}</p>
          <p style="margin:0;font-size:12px;color:${s.descColor};font-weight:500;">${s.desc}</p>
        </td>
      </tr></table>
    </div>`).join("")}
  </div>
  <div style="background:#f0faf8;padding:28px 32px;text-align:center;border-top:2px solid #d1ede9;border-bottom:2px solid #d1ede9;">
    <p style="margin:0 0 4px;font-size:36px;color:#7ec8bc;line-height:1;font-family:Georgia,serif;">&#8220;</p>
    <p style="margin:0;font-size:15px;font-style:italic;color:#1f2937;line-height:1.75;max-width:420px;margin:0 auto;font-weight:500;">${t.quote}</p>
    <p style="margin:4px 0 0;font-size:36px;color:#7ec8bc;line-height:1;font-family:Georgia,serif;">&#8221;</p>
  </div>
  <div style="background:#fff;padding:32px 32px;text-align:center;">
    <a href="https://wa.me/${waNumber}?text=${waText}" target="_blank"
       style="display:inline-block;background:linear-gradient(135deg,#25D366,#1aa34a);color:#fff;font-weight:800;padding:15px 36px;border-radius:50px;text-decoration:none;font-size:15px;letter-spacing:0.3px;">
      💬 ${t.waBtn}
    </a>
  </div>
  <div style="background:#1a5c52;padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.88);">${t.footer} | info@bikalima.com</p>
  </div>
</div>`;
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
