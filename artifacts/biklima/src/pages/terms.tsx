import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useLang } from "@/hooks/useLang";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { usePageMeta } from "@/hooks/use-page-meta";

const FALLBACK = {
  ar: `# الشروط والأحكام

مرحباً بك في موقع بكلمة. باستخدامك لخدماتنا فإنك توافق على الالتزام بالشروط التالية.

## التسجيل في البرامج
- يجب تقديم بيانات صحيحة وحديثة عند التسجيل.
- التسجيل في الدورات الوجاهية يخضع لتوفّر المقاعد ولا يُعتبر مؤكّداً إلا بعد إتمام الدفع.

## الدفع والاسترداد
- جميع الأسعار المعلنة بالعملة المحددة على الموقع.
- يحق للمتدرب طلب الاسترداد قبل بدء الدورة بخمسة أيام عمل.
- لا يتم استرداد المبلغ بعد بدء الدورة، إلا في حالات استثنائية يقدّرها فريق بكلمة.

## الكراسات والمواد التدريبية
- جميع الكراسات والمحتوى التدريبي محفوظة الحقوق لصالح بكلمة.
- يُمنع إعادة بيع أو نشر أي محتوى دون إذن خطي مسبق.

## السلوك في الدورات
- نلتزم باحترام جميع المتدربين، ويحق لنا إيقاف أي مشترك يخالف الآداب العامة.

## التواصل
لأي استفسار حول الشروط، تواصل معنا عبر البريد الإلكتروني المعروض في الموقع.`,
  en: `# Terms & Conditions

Welcome to the Bikalima website. By using our services, you agree to be bound by the following terms.

## Program Registration
- You must provide accurate and current information when registering.
- In-person course registrations are subject to seat availability and are confirmed only after payment is completed.

## Payments and Refunds
- All listed prices are in the currency shown on the site.
- Trainees may request a refund up to five business days before the course starts.
- Refunds are not issued after the course has started, except in exceptional cases at Bikalima's discretion.

## Workbooks and Training Materials
- All workbooks and training content are the copyrighted property of Bikalima.
- Reselling or republishing any content without prior written permission is prohibited.

## Conduct in Programs
- We are committed to respecting all trainees and reserve the right to remove any participant who violates basic etiquette.

## Contact
For any questions about these terms, please contact us using the email address displayed on the site.`,
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

export default function TermsPage() {
  const { lang } = useLang();
  const { data, isLoading } = useSiteSettings();

  const heading = lang === "ar" ? "الشروط والأحكام" : "Terms & Conditions";
  // Per-page SEO: indexable, stable canonical, language-aware description.
  usePageMeta({
    title: heading,
    description:
      lang === "ar"
        ? "الشروط التي تحكم استخدامك لخدمات بكلمة، التسجيل، والدفع، والاسترداد."
        : "The terms governing your use of Bikalima — registration, payment, and refunds.",
    canonicalPath: "/terms",
  });
  const settings = data?.settings;
  const fromDb = lang === "ar" ? settings?.termsAr : settings?.termsEn;
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
        <article className="prose-like" data-testid="terms-content">
          <h1 className="sr-only">{heading}</h1>
          {renderMarkdown(content)}
        </article>
      </div>
    </AppShell>
  );
}
