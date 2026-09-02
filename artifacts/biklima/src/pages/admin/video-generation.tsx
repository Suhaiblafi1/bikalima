import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Clapperboard, Copy, Download, HardDriveUpload, Library,
  Loader2, Plus, RefreshCw, Sparkles, ToggleRight, Trash2, X,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, FIELD_MEDIA_CATEGORIES } from "./_shared";
import { toast } from "@/hooks/use-toast";
import { refreshFeatureFlags } from "@/hooks/use-feature-flag";

/**
 * Short-video generation (MiniMax H3).
 *
 * Two things shape this page. First, generation costs money per output
 * second, so the two gates in front of it — the `video_generation` flag and
 * the provider key — are shown as state the admin can read and act on, not
 * as a failed request. Second, a job is asynchronous: the provider answers
 * with an id and the file appears minutes later, so the list polls the
 * unfinished jobs (which is also what makes the server reconcile them) and
 * stops the moment nothing is pending.
 */

type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

type Job = {
  id: string;
  provider: string;
  model: string;
  externalTaskId: string | null;
  status: JobStatus;
  purpose: string | null;
  prompt: string;
  resolution: string;
  duration: number;
  ratio: string;
  videoUrl: string | null;
  storedUrl: string | null;
  storedKey: string | null;
  fieldMediaId: string | null;
  usage: { total_seconds?: number; output_seconds?: number } | null;
  errorMessage: string | null;
  requestedById: string | null;
  requestedByEmail?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

type GeneratorStatus = {
  flag: string;
  flagEnabled: boolean;
  configured: boolean;
  missingEnvVars: string[];
  model: string;
  storage: {
    configured: boolean;
    provider: string;
    missingEnvVars: string[];
  };
  limits: {
    minDuration: number;
    maxDuration: number;
    maxPromptLength: number;
    resolutions: string[];
    ratios: string[];
  };
};

type ConditionType = "image_url" | "video_url" | "audio_url";
type ConditionRow = { type: ConditionType; url: string; role: string };

const STATUS_LABELS: Record<JobStatus, string> = {
  queued: "في الانتظار",
  running: "قيد التوليد",
  succeeded: "جاهز",
  failed: "فشل",
  cancelled: "ملغى",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  queued: "bg-amber-100 text-amber-800",
  running: "bg-blue-100 text-blue-800",
  succeeded: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-700",
};

/** Mirrors the server's own role table, so the UI cannot offer an invalid pair. */
const ROLES_BY_TYPE: Record<ConditionType, { value: string; label: string }[]> = {
  image_url: [
    { value: "first_frame", label: "الإطار الأول" },
    { value: "last_frame", label: "الإطار الأخير" },
    { value: "reference_image", label: "صورة مرجعية" },
  ],
  video_url: [{ value: "reference_video", label: "فيديو مرجعي" }],
  audio_url: [{ value: "reference_audio", label: "صوت مرجعي" }],
};

const TYPE_LABELS: Record<ConditionType, string> = {
  image_url: "صورة",
  video_url: "فيديو",
  audio_url: "صوت",
};

/** Ready-made starting points for the clips this platform actually needs. */
const PURPOSE_OPTIONS = [
  { value: "video_library", label: "مكتبة الفيديو" },
  { value: "promo", label: "مقطع ترويجي" },
  { value: "gallery", label: "تحريك صور المعرض" },
  { value: "social", label: "منصات التواصل" },
  { value: "other", label: "أخرى" },
];

const PENDING: JobStatus[] = ["queued", "running"];
const POLL_INTERVAL_MS = 8000;

function isPending(job: Job): boolean {
  return PENDING.includes(job.status);
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminVideoGenerationPage() {
  const apiFetch = useApiFetch();
  const [, navigate] = useLocation();

  const [status, setStatus] = useState<GeneratorStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [enablingFlag, setEnablingFlag] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Which job's save form is open, and the metadata being typed into it.
  const [saveFormJobId, setSaveFormJobId] = useState<string | null>(null);
  const [saveTitleAr, setSaveTitleAr] = useState("");
  const [saveCategory, setSaveCategory] = useState("");
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(8);
  const [ratio, setRatio] = useState("16:9");
  const [resolution, setResolution] = useState("768P");
  const [purpose, setPurpose] = useState("video_library");
  const [conditions, setConditions] = useState<ConditionRow[]>([]);

  const ready = Boolean(status?.flagEnabled && status?.configured);
  const limits = status?.limits;

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await apiFetch("/admin/video-generation/status");
      if (!response.ok) {
        setStatus(null);
        return;
      }
      const data = (await response.json()) as GeneratorStatus;
      setStatus(data);
      // Clamp the form to whatever this deployment's model actually accepts.
      setDuration((current) => Math.min(Math.max(current, data.limits.minDuration), data.limits.maxDuration));
      setResolution((current) => (data.limits.resolutions.includes(current) ? current : data.limits.resolutions[0]));
      setRatio((current) => (data.limits.ratios.includes(current) ? current : data.limits.ratios[0]));
    } catch {
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, [apiFetch]);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const response = await apiFetch("/admin/video-generation/jobs?limit=50");
      if (!response.ok) {
        setJobs([]);
        return;
      }
      const data = (await response.json()) as { jobs: Job[] };
      setJobs(data.jobs ?? []);
    } catch {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (!status?.flagEnabled) return;
    void loadJobs();
  }, [status?.flagEnabled, loadJobs]);

  const pendingIds = useMemo(
    () => jobs.filter(isPending).map((job) => job.id),
    [jobs],
  );

  // Reading one job is also what makes the server ask the provider about it,
  // so this loop is the refresh. It exists only while something is
  // unfinished, and pauses with the tab so a forgotten open tab does not
  // poll all night.
  const pendingIdsRef = useRef<string[]>([]);
  pendingIdsRef.current = pendingIds;

  useEffect(() => {
    if (!ready || pendingIds.length === 0) return;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      for (const id of pendingIdsRef.current.slice(0, 8)) {
        try {
          const response = await apiFetch(`/admin/video-generation/jobs/${id}`);
          if (!response.ok) continue;
          const data = (await response.json()) as { job: Job };
          setJobs((current) => current.map((job) => (job.id === data.job.id ? { ...job, ...data.job } : job)));
        } catch {
          // A failed poll says nothing about the job; the next tick retries.
        }
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ready, pendingIds.length, apiFetch]);

  const enableFlag = async () => {
    if (!status) return;
    setEnablingFlag(true);
    try {
      const response = await apiFetch(`/admin/feature-flags/${encodeURIComponent(status.flag)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true }),
      });
      if (!response.ok) {
        toast({ title: "تعذّر تفعيل الميزة", variant: "destructive" });
        return;
      }
      refreshFeatureFlags().catch(() => {});
      await loadStatus();
      toast({ title: "تم تفعيل توليد الفيديو" });
    } finally {
      setEnablingFlag(false);
    }
  };

  const addCondition = (type: ConditionType) => {
    setConditions((current) => [
      ...current,
      { type, url: "", role: ROLES_BY_TYPE[type][0].value },
    ]);
  };

  const updateCondition = (index: number, patch: Partial<ConditionRow>) => {
    setConditions((current) =>
      current.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        // Changing the type invalidates the old role, so re-seed it.
        if (patch.type && patch.type !== row.type) next.role = ROLES_BY_TYPE[patch.type][0].value;
        return next;
      }),
    );
  };

  const submit = async () => {
    setFormError(null);
    const filled = conditions.filter((row) => row.url.trim() !== "");
    setCreating(true);
    try {
      const response = await apiFetch("/admin/video-generation/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration,
          ratio,
          resolution,
          purpose: purpose || undefined,
          conditions: filled.map((row) => ({ type: row.type, url: row.url.trim(), role: row.role })),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        job?: Job;
        error?: string;
        reason?: string;
        missingEnvVars?: string[];
      };

      if (!response.ok) {
        setFormError(data.error ?? "تعذّر بدء التوليد.");
        toast({ title: data.error ?? "تعذّر بدء التوليد", variant: "destructive" });
        // A closed gate means the page's picture of the world is stale.
        if (data.reason === "feature_disabled" || data.reason === "not_configured") {
          await loadStatus();
        }
        // A refused attempt that the server did record (a provider rejection,
        // say) belongs in the list, where its reason can be read.
        if (data.job) setJobs((current) => [data.job as Job, ...current]);
        return;
      }

      if (data.job) setJobs((current) => [data.job as Job, ...current]);
      toast({ title: "بدأ التوليد", description: "سيظهر المقطع في القائمة عند جهوزه." });
    } catch {
      setFormError("خطأ في الاتصال.");
    } finally {
      setCreating(false);
    }
  };

  /**
   * Copy the clip out of the provider and into our own storage, as a draft
   * row in the media library. The provider's link expires, so this is the
   * step that decides whether a clip we paid for still exists tomorrow.
   */
  const saveToLibrary = async (job: Job) => {
    setSavingJobId(job.id);
    try {
      const response = await apiFetch(`/admin/video-generation/jobs/${job.id}/save-to-library`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleAr: saveTitleAr.trim(),
          category: saveCategory || undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        job?: Job;
        error?: string;
        reason?: string;
      };
      if (!response.ok) {
        toast({ title: data.error ?? "تعذّر حفظ المقطع", variant: "destructive" });
        // An expired provider link is terminal for this clip: refresh the row
        // so the page stops offering a button that cannot work.
        if (data.reason === "provider_link_expired") await loadJobs();
        if (data.reason === "storage_not_configured") await loadStatus();
        return;
      }
      if (data.job) {
        setJobs((current) => current.map((row) => (row.id === job.id ? { ...row, ...data.job } : row)));
      }
      setSaveFormJobId(null);
      setSaveTitleAr("");
      setSaveCategory("");
      toast({
        title: "حُفظ في المكتبة كمسودة",
        description: "راجعه من «من الميدان» وانشره ليظهر على الموقع.",
      });
    } catch {
      toast({ title: "خطأ في الاتصال", variant: "destructive" });
    } finally {
      setSavingJobId(null);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "تم نسخ الرابط" });
    } catch {
      toast({ title: "تعذّر النسخ", variant: "destructive" });
    }
  };

  const promptTooShort = prompt.trim().length < 8;
  const maxPrompt = limits?.maxPromptLength ?? 7000;

  return (
    <AdminLayout activeKey="video-generation">
      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clapperboard className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-lg">توليد الفيديو</h1>
            {status?.model && (
              <span className="text-[11px] font-mono text-muted-foreground" dir="ltr">{status.model}</span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ms-auto"
              onClick={() => { void loadStatus(); void loadJobs(); }}
              disabled={jobsLoading}
              data-testid="vg-refresh"
            >
              <RefreshCw className={`w-4 h-4 me-1 ${jobsLoading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            مقاطع من {limits?.minDuration ?? 4} إلى {limits?.maxDuration ?? 15} ثانية بصوت أصلي، من وصف نصي أو
            إطار أول/أخير أو مراجع. مناسب لمكتبة الفيديو والمقاطع الترويجية وتحريك صور المعرض — لا لمحتوى الدروس.
            كل مقطع يُحاسب عليه المزوّد بالثانية.
          </p>

          {statusLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">جاري التحميل…</div>
          ) : !status ? (
            <div className="py-8 text-center text-muted-foreground text-sm">تعذّر قراءة حالة التكامل.</div>
          ) : (
            <>
              {!status.flagEnabled && (
                <div
                  className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center"
                  data-testid="vg-flag-disabled"
                >
                  <ToggleRight className="w-5 h-5 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-bold">الميزة معطّلة</p>
                    <p className="text-xs mt-0.5 leading-relaxed">
                      مفتاح <span className="font-mono" dir="ltr">{status.flag}</span> مغلق. يبدأ مغلقاً لأن
                      التوليد مدفوع؛ فعّله عندما تريد البدء فعلاً.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={enableFlag} disabled={enablingFlag} data-testid="vg-enable-flag">
                      {enablingFlag ? <Loader2 className="w-4 h-4 animate-spin" /> : "تفعيل الآن"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate("/admin/feature-flags")}>
                      مفاتيح الميزات
                    </Button>
                  </div>
                </div>
              )}

              {!status.configured && (
                <div
                  className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
                  data-testid="vg-not-configured"
                >
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-bold">التكامل غير مُهيَّأ</p>
                    <p className="text-xs mt-0.5 leading-relaxed">
                      المتغيرات الناقصة في بيئة الخادم:{" "}
                      <span className="font-mono" dir="ltr">{status.missingEnvVars.join(", ") || "—"}</span>.
                      تُضاف من إعدادات النشر ولا يمكن ضبطها من هنا.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {ready && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-bold">مقطع جديد</h2>
            </div>

            <div>
              <label htmlFor="vg-prompt" className="text-[11px] text-muted-foreground mb-1 block">
                وصف المشهد والصوت *
              </label>
              <textarea
                id="vg-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value.slice(0, maxPrompt))}
                rows={5}
                className="w-full border rounded-lg p-2 text-sm bg-background resize-y"
                placeholder="مدرّب يفتتح خطابه أمام قاعة صغيرة… ثم صوت تصفيق خفيف من الجمهور، وموسيقى هادئة في الخلفية."
                data-testid="vg-prompt"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  اذكر ثلاثة أشياء: المشهد، والصوت المحيط، والموسيقى. الوصف الدقيق هو أهم عامل في جودة الناتج.
                </p>
                <span className="text-[11px] text-muted-foreground shrink-0 ms-2" dir="ltr">
                  {prompt.length} / {maxPrompt}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="vg-duration" className="text-[11px] text-muted-foreground mb-1 block">المدة (ثانية)</label>
                <Input
                  id="vg-duration"
                  type="number"
                  min={limits?.minDuration ?? 4}
                  max={limits?.maxDuration ?? 15}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  dir="ltr"
                  data-testid="vg-duration"
                />
              </div>
              <div>
                <label htmlFor="vg-ratio" className="text-[11px] text-muted-foreground mb-1 block">الأبعاد</label>
                <select
                  id="vg-ratio"
                  value={ratio}
                  onChange={(event) => setRatio(event.target.value)}
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  data-testid="vg-ratio"
                >
                  {(limits?.ratios ?? []).map((value) => (
                    <option key={value} value={value} dir="ltr">{value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="vg-resolution" className="text-[11px] text-muted-foreground mb-1 block">الدقة</label>
                <select
                  id="vg-resolution"
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  data-testid="vg-resolution"
                >
                  {(limits?.resolutions ?? []).map((value) => (
                    <option key={value} value={value} dir="ltr">{value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="vg-purpose" className="text-[11px] text-muted-foreground mb-1 block">الغرض</label>
                <select
                  id="vg-purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  className="w-full border rounded-lg p-2 text-sm bg-background"
                  data-testid="vg-purpose"
                >
                  {PURPOSE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-muted-foreground">مرفقات مرجعية (اختيارية)</span>
                <div className="flex gap-1 ms-auto">
                  {(Object.keys(ROLES_BY_TYPE) as ConditionType[]).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant="outline"
                      onClick={() => addCondition(type)}
                      disabled={conditions.length >= 12}
                      data-testid={`vg-add-${type}`}
                    >
                      <Plus className="w-3.5 h-3.5 me-1" />
                      {TYPE_LABELS[type]}
                    </Button>
                  ))}
                </div>
              </div>

              {conditions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  بدون مرفقات يُبنى المقطع من الوصف وحده. أضف صورة كإطار أول لتحريك صورة موجودة، أو مراجع
                  لتثبيت شخصية وصوت متسقين. الروابط يجب أن تكون <span dir="ltr">https</span> وعلنية لأن المزوّد
                  يقرؤها بنفسه؛ والمرفق الصوتي لا يصلح وحده.
                </p>
              ) : (
                <ul className="space-y-2">
                  {conditions.map((row, index) => (
                    <li key={index} className="grid grid-cols-1 sm:grid-cols-[7rem_1fr_9rem_auto] gap-2 items-center">
                      <select
                        value={row.type}
                        onChange={(event) => updateCondition(index, { type: event.target.value as ConditionType })}
                        className="w-full border rounded-lg p-2 text-sm bg-background"
                        aria-label="نوع المرفق"
                      >
                        {(Object.keys(TYPE_LABELS) as ConditionType[]).map((type) => (
                          <option key={type} value={type}>{TYPE_LABELS[type]}</option>
                        ))}
                      </select>
                      <Input
                        value={row.url}
                        onChange={(event) => updateCondition(index, { url: event.target.value })}
                        dir="ltr"
                        placeholder="https://…"
                        data-testid={`vg-condition-url-${index}`}
                      />
                      <select
                        value={row.role}
                        onChange={(event) => updateCondition(index, { role: event.target.value })}
                        className="w-full border rounded-lg p-2 text-sm bg-background"
                        aria-label="دور المرفق"
                      >
                        {ROLES_BY_TYPE[row.type].map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConditions((current) => current.filter((_, i) => i !== index))}
                        aria-label="حذف المرفق"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" data-testid="vg-form-error">
                <X className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={submit} disabled={creating || promptTooShort} data-testid="vg-submit">
                {creating ? <Loader2 className="w-4 h-4 me-1 animate-spin" /> : <Sparkles className="w-4 h-4 me-1" />}
                ابدأ التوليد
              </Button>
              {promptTooShort && (
                <span className="text-[11px] text-muted-foreground">اكتب وصفاً من 8 أحرف على الأقل.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {status?.flagEnabled && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-primary" />
              <h2 className="font-bold">المقاطع</h2>
              <span className="text-xs text-muted-foreground ms-auto" data-testid="vg-jobs-count">
                {jobs.length} مهمة
                {pendingIds.length > 0 && ` — ${pendingIds.length} قيد التوليد`}
              </span>
            </div>

            {jobsLoading && jobs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">جاري التحميل…</div>
            ) : jobs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm" data-testid="vg-jobs-empty">
                لا توجد مهام بعد.
              </div>
            ) : (
              <ul className="space-y-3">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className="rounded-xl border border-border p-3 sm:p-4"
                    data-testid={`vg-job-${job.id}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[job.status]}`}>
                        {STATUS_LABELS[job.status]}
                      </span>
                      {isPending(job) && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                      <span className="text-[11px] text-muted-foreground" dir="ltr">
                        {job.resolution} · {job.duration}s · {job.ratio}
                      </span>
                      {job.purpose && (
                        <span className="text-[11px] text-muted-foreground">
                          {PURPOSE_OPTIONS.find((option) => option.value === job.purpose)?.label ?? job.purpose}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground ms-auto" dir="ltr">
                        {formatDateTime(job.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm mt-2 leading-relaxed line-clamp-3">{job.prompt}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      {job.requestedByEmail && <span dir="ltr">{job.requestedByEmail}</span>}
                      {job.usage?.output_seconds != null && (
                        <span>الثواني المحاسَبة: <span dir="ltr">{job.usage.output_seconds}</span></span>
                      )}
                    </div>

                    {job.status === "failed" && job.errorMessage && (
                      <p className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                        {job.errorMessage}
                      </p>
                    )}

                    {job.status === "succeeded" && job.videoUrl && (
                      <div className="mt-3 space-y-2">
                        <video
                          src={job.videoUrl}
                          controls
                          preload="metadata"
                          className="w-full max-w-md rounded-xl border border-border bg-black"
                          data-testid={`vg-video-${job.id}`}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={job.videoUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="w-3.5 h-3.5 me-1" />
                              تنزيل
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => copyLink(job.videoUrl!)}>
                            <Copy className="w-3.5 h-3.5 me-1" />
                            نسخ الرابط
                          </Button>
                          {/* The warning stands only while the clip lives
                              nowhere but at the provider. Once it is in our
                              storage the honest thing to say is the opposite. */}
                          {job.fieldMediaId ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                              <Library className="w-3.5 h-3.5" />
                              محفوظ في تخزيننا ومسجَّل في المكتبة كمسودة
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700">
                              الرابط مؤقّت عند المزوّد — احفظه لتبقى نسخة عندنا.
                            </span>
                          )}
                        </div>

                        {job.fieldMediaId ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate("/admin/field-media")}
                              data-testid={`vg-open-library-${job.id}`}
                            >
                              <Library className="w-3.5 h-3.5 me-1" />
                              افتح في «من الميدان»
                            </Button>
                            {job.storedUrl && (
                              <Button size="sm" variant="ghost" onClick={() => copyLink(job.storedUrl!)}>
                                <Copy className="w-3.5 h-3.5 me-1" />
                                نسخ الرابط الدائم
                              </Button>
                            )}
                          </div>
                        ) : !status?.storage.configured ? (
                          <p className="text-[11px] text-muted-foreground leading-relaxed" data-testid={`vg-storage-missing-${job.id}`}>
                            الحفظ يحتاج تخزيناً مُهيَّأً. المتغيرات الناقصة:{" "}
                            <span className="font-mono" dir="ltr">
                              {status?.storage.missingEnvVars.join(", ") || "—"}
                            </span>
                            . حتى ذلك الحين نزّل المقطع يدوياً قبل انتهاء الرابط.
                          </p>
                        ) : saveFormJobId === job.id ? (
                          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[11px] text-muted-foreground mb-1 block">
                                  عنوان المقطع (عربي) *
                                </label>
                                <Input
                                  value={saveTitleAr}
                                  onChange={(event) => setSaveTitleAr(event.target.value)}
                                  placeholder="مثلاً: افتتاحية قوية أمام جمهور صغير"
                                  data-testid={`vg-save-title-${job.id}`}
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-muted-foreground mb-1 block">التصنيف</label>
                                <select
                                  value={saveCategory}
                                  onChange={(event) => setSaveCategory(event.target.value)}
                                  className="w-full border rounded-lg p-2 text-sm bg-background"
                                  data-testid={`vg-save-category-${job.id}`}
                                >
                                  <option value="">— بلا تصنيف —</option>
                                  {FIELD_MEDIA_CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>
                                      {category.labelAr}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              يُنزَّل المقطع من المزوّد ويُرفع إلى تخزيننا، ثم يُسجَّل في «من الميدان»
                              كمسودة — لا يظهر على الموقع قبل أن تنشره.
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveToLibrary(job)}
                                disabled={savingJobId === job.id || saveTitleAr.trim().length < 2}
                                data-testid={`vg-save-confirm-${job.id}`}
                              >
                                {savingJobId === job.id
                                  ? <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />
                                  : <HardDriveUpload className="w-3.5 h-3.5 me-1" />}
                                احفظ
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSaveFormJobId(null)}
                                disabled={savingJobId === job.id}
                              >
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSaveFormJobId(job.id);
                              // Seed the title from the purpose rather than the
                              // prompt: a 500-character scene description makes
                              // a terrible library title.
                              setSaveTitleAr("");
                              setSaveCategory("");
                            }}
                            data-testid={`vg-save-${job.id}`}
                          >
                            <HardDriveUpload className="w-3.5 h-3.5 me-1" />
                            احفظ في مكتبة الفيديو
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
