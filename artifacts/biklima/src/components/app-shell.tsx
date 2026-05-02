import { type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";
import { useLang } from "@/hooks/useLang";

type Lang = "ar" | "en";

/**
 * AppShell wraps inner LMS pages (dashboard, admin, learn, course-detail,
 * checkout, confirmation) with the unified SiteHeader and SiteFooter.
 *
 * The legacy `lang` / `onLangChange` props are accepted for backward
 * compatibility with existing pages, but the header/footer now consume the
 * global useLang hook directly so the entire site stays in sync.
 */
export function AppShell({
  children,
  containerClassName = "container mx-auto px-4 py-6",
  breadcrumb,
  hideFooter = false,
}: {
  // legacy / unused — kept for back-compat
  lang?: Lang;
  onLangChange?: (l: Lang) => void;
  children: ReactNode;
  containerClassName?: string;
  breadcrumb?: BreadcrumbItem[];
  hideFooter?: boolean;
}) {
  const { lang } = useLang();
  const isRtl = lang === "ar";

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <SiteHeader />
      {/* Spacer for fixed header */}
      <div aria-hidden className="h-16 md:h-20 shrink-0" />
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
      <main className={`flex-1 ${containerClassName}`}>{children}</main>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}
