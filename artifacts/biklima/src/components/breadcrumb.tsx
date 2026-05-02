import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Home as HomeIcon } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { getBaseUrl } from "@/lib/site-config";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const isRtl = lang === "ar";
  const Sep = isRtl ? ChevronLeft : ChevronRight;
  const baseUrl = getBaseUrl();

  const go = (href?: string) => {
    if (!href) return;
    navigate(href);
  };

  return (
    <nav
      aria-label={isRtl ? "مسار التنقل" : "Breadcrumb"}
      className="border-b border-border/60 bg-secondary/30"
    >
      <div className="container mx-auto px-4 md:px-6 py-3">
        <ol className="flex items-center gap-2 text-sm flex-wrap">
          <li>
            <button
              onClick={() => navigate(baseUrl ? `${baseUrl}/` : "/")}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              aria-label={isRtl ? "الرئيسية" : "Home"}
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>{isRtl ? "الرئيسية" : "Home"}</span>
            </button>
          </li>
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
                <Sep className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                {isLast || !item.href ? (
                  <span
                    className="font-bold text-foreground truncate max-w-[60vw] md:max-w-none"
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <button
                    onClick={() => go(item.href)}
                    className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[40vw] md:max-w-none"
                  >
                    {item.label}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
