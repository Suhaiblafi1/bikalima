import { useMemo } from "react";
import { useLocation } from "wouter";
import { Quote, ShieldCheck } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { testimonials as testimonialsData } from "@/programsData";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] || "") + (parts[parts.length - 1][0] || "");
}

/**
 * Two things a visitor deciding whether to pay 70–155 JOD needs, and which
 * the programme page carried none of: someone else's word, and an answer to
 * "what if it doesn't work for me".
 *
 * The testimonials are deliberately headed "من متدربي بكلمة" rather than
 * "graduates of this programme". The data behind them carries a name and a
 * role but no programme, so claiming they came from this one would be an
 * attribution nobody can support. Tagging them by programme upstream is what
 * would earn the stronger heading.
 *
 * The refund line is not a new promise. It is the policy already published in
 * the terms, moved next to the price where the doubt actually occurs — the
 * terms page is not where someone hesitating over a button goes looking.
 */
export function ProgramProof({ count = 3 }: { count?: number }) {
  const { lang } = useLang();
  const [, navigate] = useLocation();
  const isRtl = lang === "ar";

  const items = useMemo(() => {
    const all = testimonialsData[lang] ?? testimonialsData.ar;
    return all.slice(0, count);
  }, [lang, count]);

  if (items.length === 0) return null;

  return (
    <section className="space-y-4" data-testid="program-proof">
      <div
        className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success-muted p-4"
        data-testid="program-guarantee"
      >
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-bold text-success">
            {isRtl ? "الاسترداد قبل البدء" : "Refundable before it starts"}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground/80">
            {isRtl
              ? "يحق لك طلب استرداد كامل المبلغ حتى خمسة أيام عمل قبل بدء الدورة."
              : "You may request a full refund up to five business days before the course starts."}{" "}
            <button
              type="button"
              onClick={() => navigate("/terms")}
              className="font-semibold text-success underline underline-offset-2 hover:opacity-80"
            >
              {isRtl ? "الشروط كاملة" : "Full terms"}
            </button>
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-muted-foreground">
          {isRtl ? "من متدربي بكلمة" : "From Bikalima trainees"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((tm) => (
            <figure
              key={tm.name}
              className="rounded-2xl border border-border bg-card p-4"
              data-testid="program-testimonial"
            >
              <Quote className="mb-2 h-4 w-4 text-primary/50" aria-hidden />
              <blockquote className="text-[13px] leading-relaxed text-foreground/85">
                {tm.quote}
              </blockquote>
              <figcaption className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                  {initialsFor(tm.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold">{tm.name}</span>
                  {tm.role && (
                    <span className="block truncate text-[11px] text-muted-foreground">{tm.role}</span>
                  )}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
