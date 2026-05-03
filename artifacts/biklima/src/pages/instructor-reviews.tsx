import { useEffect, useMemo, useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedRoute } from "@/components/route-guards";
import { useMe } from "@/hooks/use-me";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mic, Video as VideoIcon, MessageSquare, Star, Clock, CheckCircle2, AlertTriangle,
  ArrowLeft, Loader2, ListChecks,
} from "lucide-react";

type Submission = {
  id: string;
  activityId: string;
  userId: string;
  lessonId: string;
  status: "pending" | "completed" | "needs_revision";
  attemptNumber: number;
  mediaUrl: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  activityType: string;
  activityTitleAr: string;
  lessonTitleAr: string;
  courseId: string;
  courseTitleAr: string;
  courseSlug: string | null;
  studentEmail: string;
  studentFirst: string | null;
  studentLast: string | null;
};

type RubricCriterion = { key: string; ar: string };

type DetailResponse = {
  submission: Submission;
  activity: { id: string; type: string; titleAr: string; instructionsAr: string | null; config: Record<string, unknown> } | null;
  reviews: { id: string; rubricScores: Record<string, number>; totalScore: number | null; feedbackAr: string | null; decision: string; createdAt: string }[];
  student: { email: string; firstName: string | null; lastName: string | null } | null;
  rubricCriteria: RubricCriterion[];
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار المراجعة", completed: "معتمد", needs_revision: "يحتاج تعديل",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  needs_revision: "bg-rose-100 text-rose-700",
};

function ActivityIcon({ type }: { type: string }) {
  if (type === "voice_recording") return <Mic className="w-4 h-4" />;
  if (type === "video_submission") return <VideoIcon className="w-4 h-4" />;
  if (type === "coach_feedback") return <MessageSquare className="w-4 h-4" />;
  return <ListChecks className="w-4 h-4" />;
}

function InstructorReviewsPageInner() {
  const apiBase = getApiBase();
  const { role, isLoading } = useMe();
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [list, setList] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState<"pass" | "needs_revision">("pass");
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase}/instructor/submissions?status=${tab}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : { submissions: [] })
      .then((d) => setList(d.submissions ?? []))
      .finally(() => setLoading(false));
  }, [apiBase, tab]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openDetail = useCallback((id: string) => {
    setOpenId(id);
    setDetail(null);
    setScores({});
    setFeedback("");
    setDecision("pass");
    fetch(`${apiBase}/instructor/submissions/${id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((d: DetailResponse | null) => {
        if (d) {
          setDetail(d);
          const init: Record<string, number> = {};
          for (const c of d.rubricCriteria) init[c.key] = 7;
          setScores(init);
        }
      });
  }, [apiBase]);

  const total = useMemo(() =>
    detail ? detail.rubricCriteria.reduce((s, c) => s + (scores[c.key] ?? 0), 0) : 0,
    [detail, scores]);

  const submitReview = async () => {
    if (!openId) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${apiBase}/instructor/submissions/${openId}/review`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubricScores: scores, feedbackAr: feedback, decision }),
      });
      if (r.ok) {
        setOpenId(null); setDetail(null);
        fetchList();
      }
    } finally { setSubmitting(false); }
  };

  if (isLoading) return <AppShell><div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div></AppShell>;
  if (role !== "trainer" && role !== "admin") {
    return (
      <AppShell>
        <div className="container mx-auto p-8 text-center">
          <p className="text-muted-foreground">هذه الصفحة للمدرّبين فقط.</p>
        </div>
      </AppShell>
    );
  }

  if (openId && detail) {
    const s = detail.submission;
    return (
      <AppShell containerClassName="" breadcrumb={[{ label: "مراجعة التسليمات", href: "/instructor/reviews" }, { label: detail.activity?.titleAr ?? "تسليم" }]}>
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-5">
          <Button variant="ghost" size="sm" onClick={() => { setOpenId(null); setDetail(null); }} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> رجوع للقائمة
          </Button>

          <Card>
            <CardContent className="p-5 space-y-2">
              <p className="text-xs text-muted-foreground">الطالب</p>
              <p className="font-bold">{detail.student?.firstName ?? ""} {detail.student?.lastName ?? ""} — {detail.student?.email}</p>
              <p className="text-xs text-muted-foreground">المحاولة #{s.attemptNumber} • {new Date(s.createdAt).toLocaleString("ar")}</p>
              <p className="text-sm">النشاط: <strong>{detail.activity?.titleAr}</strong></p>
              {detail.activity?.instructionsAr && (
                <p className="text-xs text-muted-foreground whitespace-pre-line">{detail.activity.instructionsAr}</p>
              )}
            </CardContent>
          </Card>

          {/* Submission media */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="font-bold text-sm">التسليم</p>
              {s.mediaUrl?.startsWith("data:audio/") && (
                <audio src={s.mediaUrl} controls className="w-full" />
              )}
              {s.mediaUrl && /^https?:\/\//.test(s.mediaUrl) && (
                <a href={s.mediaUrl} target="_blank" rel="noreferrer" className="text-primary underline text-sm break-all">{s.mediaUrl}</a>
              )}
              {s.payload && Object.keys(s.payload).length > 0 && (
                <pre className="bg-muted/40 p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-[200px]">
                  {JSON.stringify(s.payload, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* Rubric */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">معايير التقييم (10 معايير × 10 نقاط = 100)</p>
                <span className="font-bold text-primary">{total} / 100</span>
              </div>
              <div className="space-y-2">
                {detail.rubricCriteria.map(c => (
                  <div key={c.key} className="flex items-center gap-3">
                    <span className="text-sm flex-1">{c.ar}</span>
                    <input type="range" min={0} max={10} step={1} value={scores[c.key] ?? 0}
                      onChange={(e) => setScores({ ...scores, [c.key]: Number(e.target.value) })}
                      className="flex-1 max-w-[200px]" />
                    <span className="w-8 text-end font-bold text-sm">{scores[c.key] ?? 0}</span>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">ملاحظاتك للطالب</label>
                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-lg border border-border text-sm"
                  placeholder="اكتب ملاحظات تفصيلية، نقاط القوة، ونقاط التطوير..." />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={decision === "pass"} onChange={() => setDecision("pass")} /> اعتماد ✓
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={decision === "needs_revision"} onChange={() => setDecision("needs_revision")} /> طلب تعديل
                </label>
                <Button onClick={submitReview} disabled={submitting} className="ms-auto">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <CheckCircle2 className="w-4 h-4 me-2" />}
                  إرسال المراجعة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell containerClassName="" breadcrumb={[{ label: "مراجعة التسليمات" }]}>
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">مراجعة تسليمات الطلاب</h1>
          <div className="flex gap-2">
            {(["pending", "completed"] as const).map(tk => (
              <button key={tk} onClick={() => setTab(tk)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === tk ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {tk === "pending" ? "بانتظار المراجعة" : "تمت المراجعة"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد تسليمات في هذه القائمة.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {list.map(s => (
              <Card key={s.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => openDetail(s.id)}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ActivityIcon type={s.activityType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold truncate">{s.activityTitleAr}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_COLOR[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{s.courseTitleAr} • {s.lessonTitleAr}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(s.studentFirst ?? "") + " " + (s.studentLast ?? "")} ({s.studentEmail}) — المحاولة #{s.attemptNumber}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(s.createdAt).toLocaleDateString("ar")}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function InstructorReviewsPage() {
  return <ProtectedRoute><InstructorReviewsPageInner /></ProtectedRoute>;
}
