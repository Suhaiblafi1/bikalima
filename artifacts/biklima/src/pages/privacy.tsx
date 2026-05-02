import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { useSiteSettings } from "@/hooks/use-site-settings";

const FALLBACK = {
  ar: `# سياسة الخصوصية

نحن في بكلمة نحترم خصوصية زوارنا ومتدربينا ونلتزم بحماية بياناتهم الشخصية. توضّح هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها.

## البيانات التي نجمعها
- بيانات التواصل (الاسم، البريد الإلكتروني، رقم الواتساب).
- معلومات التسجيل في الدورات والبرامج.
- محتوى نماذج التقييم والاستفسارات التي ترسلها لنا.

## كيف نستخدم بياناتك
- التواصل معك بخصوص البرامج التدريبية والاستفسارات.
- إرسال تقييم خطابك أو رد على طلب الاستشارة.
- تحسين جودة دوراتنا وفهم احتياجات متدربينا.

## المشاركة مع الغير
لا نبيع بياناتك لأي طرف ثالث. قد نشاركها فقط مع مزوّدي خدمات أساسيين (مثل خدمات البريد الإلكتروني) لتنفيذ خدماتنا.

## حقوقك
يحق لك في أي وقت طلب الاطلاع على بياناتك أو تعديلها أو حذفها بمراسلتنا على البريد الإلكتروني الموجود في الموقع.

## التحديثات
قد نُحدّث هذه السياسة من حين لآخر. سيظهر تاريخ آخر تحديث في أعلى هذه الصفحة.`,
  en: `# Privacy Policy

At Bikalima, we respect the privacy of our visitors and trainees and are committed to protecting their personal data. This policy explains how we collect, use, and safeguard your information.

## Data we collect
- Contact information (name, email, WhatsApp number).
- Course and program registration details.
- Content of evaluation forms and inquiries you submit.

## How we use your data
- To communicate with you about training programs and inquiries.
- To send you your speech evaluation or respond to consultation requests.
- To improve the quality of our courses and understand our trainees' needs.

## Sharing with third parties
We do not sell your data to any third party. We may share it only with essential service providers (such as email services) to deliver our services.

## Your rights
You may request access to, correction of, or deletion of your data at any time by contacting us at the email address on the website.

## Updates
We may update this policy from time to time. The last-updated date will appear at the top of this page.`,
};

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let listBuf: string[] = [];

  const flushList = () => {
    if (listBuf.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="list-disc ms-6 my-3 space-y-1.5 text-foreground/85">
        {listBuf.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    );
    listBuf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      out.push(<h1 key={i} className="font-serif text-3xl md:text-4xl font-bold mt-6 mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      flushList();
      out.push(<h2 key={i} className="font-serif text-xl md:text-2xl font-bold mt-6 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      flushList();
      out.push(<h3 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("- ")) {
      listBuf.push(line.slice(2));
    } else {
      flushList();
      out.push(<p key={i} className="text-foreground/85 leading-relaxed my-3">{line}</p>);
    }
  }
  flushList();
  return out;
}

export default function PrivacyPage() {
  const { lang } = useLang();
  const { data, isLoading } = useSiteSettings();

  const heading = lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy";
  const settings = data?.settings;
  const fromDb = lang === "ar" ? settings?.privacyPolicyAr : settings?.privacyPolicyEn;
  const content = (fromDb && fromDb.trim().length > 0) ? fromDb : FALLBACK[lang];

  return (
    <AppShell containerClassName="container mx-auto px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{lang === "ar" ? "جارٍ التحميل..." : "Loading..."}</span>
          </div>
        )}
        <article className="prose-like" data-testid="privacy-content">
          <h1 className="sr-only">{heading}</h1>
          {renderMarkdown(content)}
        </article>
      </div>
    </AppShell>
  );
}
