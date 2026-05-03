import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useMyEvaluations, type DashEvaluation } from "@/hooks/use-dashboard-data";

type Lang = "ar" | "en";

const EVAL_STATUS_LABELS: Record<DashEvaluation["status"], { ar: string; en: string; cls: string }> = {
  pending:    { ar: "بانتظار التقييم",      en: "Pending review",       cls: "bg-amber-100 text-amber-800" },
  in_review:  { ar: "قيد التقييم",          en: "Under review",         cls: "bg-sky-100 text-sky-800" },
  completed:  { ar: "تم التقييم",           en: "Completed",            cls: "bg-emerald-100 text-emerald-800" },
  converted:  { ar: "تحوّل إلى مسار تعلّم", en: "Converted to program", cls: "bg-violet-100 text-violet-800" },
  cancelled:  { ar: "ملغى",                 en: "Cancelled",            cls: "bg-red-100 text-red-800" },
};

const RUBRIC_LABELS: { key: string; ar: string; en: string }[] = [
  { key: "clarity", ar: "الوضوح", en: "Clarity" },
  { key: "voice", ar: "الصوت", en: "Voice" },
  { key: "body_language", ar: "لغة الجسد", en: "Body language" },
  { key: "structure", ar: "الهيكلة", en: "Structure" },
  { key: "content", ar: "المحتوى", en: "Content" },
  { key: "presence", ar: "الحضور", en: "Presence" },
  { key: "impact", ar: "التأثير", en: "Impact" },
];

const PROGRAM_LABELS: Record<string, { ar: string; en: string; slug: string | null }> = {
  core:     { ar: "البرنامج الأساسي",       en: "Core Program",          slug: "core" },
  tot:      { ar: "تدريب المدربين (ToT)",   en: "Train the Trainer",     slug: "tot" },
  teachers: { ar: "المعلمين والمربين",      en: "Educators & Parents",   slug: "teachers" },
  children: { ar: "برنامج الأطفال",         en: "Children's Program",    slug: "children" },
  none:     { ar: "لا توصية محددة",         en: "No specific program",   slug: null },
};

function MarkdownLite({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let buf: string[] = [];
  const flushPara = (i: number) => {
    if (buf.length === 0) return;
    blocks.push(
      <p key={`p-${i}`} className="leading-relaxed whitespace-pre-wrap">
        {renderInline(buf.join("\n"))}
      </p>,
    );
    buf = [];
  };
  function renderInline(s: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*/g;
    let last = 0; let m: RegExpExecArray | null; let i = 0;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) parts.push(<span key={i++}>{s.slice(last, m.index)}</span>);
      parts.push(<strong key={i++}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < s.length) parts.push(<span key={i++}>{s.slice(last)}</span>);
    return parts;
  }
  let bullets: string[] = [];
  const flushBullets = (i: number) => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`ul-${i}`} className="list-disc ms-6 space-y-1">
        {bullets.map((b, j) => <li key={j}>{renderInline(b)}</li>)}
      </ul>,
    );
    bullets = [];
  };
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line === "") { flushPara(i); flushBullets(i); return; }
    if (/^##\s+/.test(line)) {
      flushPara(i); flushBullets(i);
      blocks.push(<h4 key={`h-${i}`} className="font-bold text-base mt-3">{line.replace(/^##\s+/, "")}</h4>);
    } else if (/^-\s+/.test(line)) {
      flushPara(i);
      bullets.push(line.replace(/^-\s+/, ""));
    } else {
      flushBullets(i);
      buf.push(line);
    }
  });
  flushPara(lines.length); flushBullets(lines.length);
  return <div className="space-y-3 text-sm text-foreground">{blocks}</div>;
}

export default function StudentEvaluationsTab({ lang }: { lang: Lang }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: items = [], isLoading, isError } = useMyEvaluations(user?.id ?? null);
  const isAr = lang === "ar";
  const error = isError ? (isAr ? "تعذّر تحميل التقييمات." : "Failed to load evaluations.") : null;

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8 space-y-4">
        <h3 className="font-bold text-xl flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          {isAr ? "تقييمات الخطاب" : "Speech Evaluations"}
        </h3>

        {isLoading ? (
          <div className="flex justify-center py-10" data-testid="evaluations-loading">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3" data-testid="evaluations-error">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 space-y-3" data-testid="evaluations-empty">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Mic className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-muted-foreground">
              {isAr ? "لم تُرسل أي خطاب للتقييم بعد." : "You haven't submitted any speech for evaluation yet."}
            </p>
            <Button
              onClick={() => navigate("/#speech-evaluation")}
              className="rounded-full bg-primary text-white hover:bg-primary/90"
              data-testid="evaluations-submit-cta"
            >
              {isAr ? "أرسل خطابك للتقييم" : "Submit a speech"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4" data-testid="evaluations-list">
            {items.map((ev) => {
              const statusMeta = EVAL_STATUS_LABELS[ev.status];
              const isPublished = !!ev.reportPublishedAt && !!ev.finalReportMd;
              const recoMeta = ev.programRecommendation ? PROGRAM_LABELS[ev.programRecommendation] : null;
              return (
                <div
                  key={ev.id}
                  className="border border-border rounded-2xl p-5 space-y-3 bg-background"
                  data-testid={`evaluation-card-${ev.id}`}
                >
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${statusMeta.cls}`}>
                        {statusMeta[lang]}
                      </span>
                      {isPublished && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          {isAr ? "التقرير منشور" : "Report published"}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {isAr ? "أُرسل في" : "Submitted"}{" "}
                        {(() => { try { return new Date(ev.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US"); } catch { return ev.createdAt; } })()}
                      </span>
                    </div>
                    {typeof ev.overallScore === "number" && isPublished && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{isAr ? "النتيجة" : "Score"}</span>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-base">
                          {ev.overallScore}/100
                        </span>
                      </div>
                    )}
                  </div>

                  {isPublished ? (
                    <>
                      {ev.rubricScores && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {RUBRIC_LABELS.map((r) => {
                            const v = ev.rubricScores?.[r.key];
                            if (typeof v !== "number") return null;
                            const note = ev.rubricNotes?.[r.key];
                            return (
                              <div key={r.key} className="bg-muted/40 rounded-lg p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground">{r[lang]}</span>
                                  <span className="font-bold text-foreground">{v}</span>
                                </div>
                                {note && (
                                  <p
                                    className="mt-1 text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap"
                                    data-testid={`rubric-note-${r.key}-${ev.id}`}
                                  >
                                    {note}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {recoMeta && (
                        <div className="flex flex-wrap items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3">
                          <div className="flex-1 min-w-[200px]">
                            <div className="text-[11px] text-muted-foreground">
                              {isAr ? "البرنامج الموصى به" : "Recommended program"}
                            </div>
                            <div className="font-bold text-primary">{recoMeta[lang]}</div>
                          </div>
                          {recoMeta.slug && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/courses/${recoMeta.slug}`)}
                              className="rounded-full bg-primary text-white hover:bg-primary/90"
                              data-testid={`enroll-cta-${ev.id}`}
                            >
                              {isAr ? "سجّل في هذا البرنامج" : "Enroll in this program"}
                              {isAr ? <ArrowLeft className="w-3.5 h-3.5 ms-1" /> : <ArrowRight className="w-3.5 h-3.5 ms-1" />}
                            </Button>
                          )}
                        </div>
                      )}

                      {ev.finalReportMd && (
                        <div className="bg-card border border-border rounded-xl p-4" data-testid={`evaluation-report-${ev.id}`}>
                          <div className="font-bold text-sm mb-2 text-muted-foreground">
                            {isAr ? "التقرير النهائي" : "Final report"}
                          </div>
                          <MarkdownLite text={ev.finalReportMd} />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isAr
                        ? "سيظهر تقريرك الكامل هنا بمجرد أن يكمل المدرّب التقييم."
                        : "Your full report will appear here once a trainer publishes it."}
                    </p>
                  )}

                  {ev.speechTopic && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-bold">{isAr ? "موضوع الخطاب: " : "Topic: "}</span>{ev.speechTopic}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
