import { useState, useRef, useEffect } from "react";
import {
  Play, FileText, ListChecks, MessageSquare, Wand2, Mic,
  Video as VideoIcon, MoveHorizontal, GitBranch, Smile, Star, Trophy,
  CheckCircle2, Loader2, AlertTriangle, Square, ChevronRight, ChevronLeft,
} from "lucide-react";

export type ActivityType =
  | "video" | "text" | "quiz" | "reflection" | "speech_builder"
  | "voice_recording" | "video_submission" | "drag_drop" | "scenario"
  | "self_assessment" | "coach_feedback" | "challenge";

export interface Activity {
  id: string;
  lessonId: string;
  type: ActivityType;
  titleAr: string;
  titleEn: string | null;
  instructionsAr: string | null;
  instructionsEn: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
  isRequired: boolean;
  skillKeys: string[];
  pointsReward: number;
}

export type SubmissionStatus = "pending" | "completed" | "needs_revision" | null;

export const ACTIVITY_TYPE_META: Record<ActivityType, { ar: string; icon: React.ElementType; color: string }> = {
  video:            { ar: "فيديو",            icon: Play,            color: "text-rose-600 bg-rose-50" },
  text:             { ar: "محتوى نصي",        icon: FileText,        color: "text-slate-600 bg-slate-50" },
  quiz:             { ar: "اختبار",           icon: ListChecks,      color: "text-amber-600 bg-amber-50" },
  reflection:       { ar: "تأمّل",            icon: MessageSquare,   color: "text-violet-600 bg-violet-50" },
  speech_builder:   { ar: "بنّاء الخطاب",     icon: Wand2,           color: "text-blue-600 bg-blue-50" },
  voice_recording:  { ar: "تسجيل صوتي",       icon: Mic,             color: "text-pink-600 bg-pink-50" },
  video_submission: { ar: "تسليم فيديو",      icon: VideoIcon,       color: "text-indigo-600 bg-indigo-50" },
  drag_drop:        { ar: "اسحب وأفلت",       icon: MoveHorizontal,  color: "text-teal-600 bg-teal-50" },
  scenario:         { ar: "سيناريو",          icon: GitBranch,       color: "text-orange-600 bg-orange-50" },
  self_assessment:  { ar: "تقييم ذاتي",       icon: Smile,           color: "text-emerald-600 bg-emerald-50" },
  coach_feedback:   { ar: "ملاحظات المدرّب",   icon: Star,            color: "text-yellow-600 bg-yellow-50" },
  challenge:        { ar: "تحدٍّ",            icon: Trophy,          color: "text-fuchsia-600 bg-fuchsia-50" },
};

function ytId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function VideoEmbed({ url, type }: { url: string; type?: string }) {
  if (!url) return null;
  if (type === "vimeo" || /vimeo\.com/.test(url)) {
    const id = vimeoId(url);
    return (
      <div className="w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {id ? (
          <iframe src={`https://player.vimeo.com/video/${id}`} className="w-full h-full" allowFullScreen />
        ) : <video src={url} controls className="w-full h-full" />}
      </div>
    );
  }
  const id = ytId(url);
  return (
    <div className="w-full bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
      {id ? (
        <iframe src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`} className="w-full h-full" allowFullScreen />
      ) : <video src={url} controls className="w-full h-full" />}
    </div>
  );
}

interface PlayerProps {
  activity: Activity;
  status: SubmissionStatus;
  onSubmit: (data: { payload?: Record<string, unknown>; mediaUrl?: string; autoScore?: number }) => Promise<void>;
  isSubmitting: boolean;
  enrolled: boolean;
}

export function ActivityPlayer({ activity, status, onSubmit, isSubmitting, enrolled }: PlayerProps) {
  const isDone = status === "completed";
  const isPending = status === "pending";
  const needsRevision = status === "needs_revision";

  const meta = ACTIVITY_TYPE_META[activity.type];
  const Icon = meta.icon;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{meta.ar}</p>
          <h3 className="font-bold text-base truncate">{activity.titleAr}</h3>
        </div>
        {isDone && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل
          </span>
        )}
        {isPending && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> بانتظار المراجعة
          </span>
        )}
        {needsRevision && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" /> يحتاج تعديل
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">
        {activity.instructionsAr && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{activity.instructionsAr}</p>
        )}
        <ActivityBody
          activity={activity}
          isDone={isDone}
          isPending={isPending}
          enrolled={enrolled}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

interface BodyProps {
  activity: Activity;
  isDone: boolean;
  isPending: boolean;
  enrolled: boolean;
  isSubmitting: boolean;
  onSubmit: (data: { payload?: Record<string, unknown>; mediaUrl?: string; autoScore?: number }) => Promise<void>;
}

function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50">
      {children}
    </button>
  );
}

function ActivityBody({ activity, isDone, isPending, enrolled, isSubmitting, onSubmit }: BodyProps) {
  if (!enrolled) {
    return <p className="text-sm text-muted-foreground italic">سجّل في الدورة لبدء هذا النشاط.</p>;
  }

  switch (activity.type) {
    case "video":            return <VideoActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "text":             return <TextActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "quiz":             return <QuizActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "reflection":       return <ReflectionActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "speech_builder":   return <SpeechBuilderActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "voice_recording":  return <VoiceActivity activity={activity} isDone={isDone} isPending={isPending} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "video_submission": return <VideoSubmitActivity activity={activity} isDone={isDone} isPending={isPending} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "drag_drop":        return <DragDropActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "scenario":         return <ScenarioActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "self_assessment":  return <SelfAssessmentActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "coach_feedback":   return <CoachFeedbackActivity activity={activity} isDone={isDone} isPending={isPending} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
    case "challenge":        return <ChallengeActivity activity={activity} isDone={isDone} isSubmitting={isSubmitting} onSubmit={onSubmit} />;
  }
}

// ── 1. Video ──────────────────────────────────────────────────────────
function VideoActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { videoUrl?: string; videoType?: string };
  const url = cfg.videoUrl || "";
  return (
    <div className="space-y-3">
      {url ? <VideoEmbed url={url} type={cfg.videoType} /> : (
        <div className="aspect-video bg-muted rounded-xl flex items-center justify-center text-muted-foreground text-sm">
          لا يوجد فيديو
        </div>
      )}
      {!isDone && (
        <PrimaryBtn onClick={() => onSubmit({})} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          تمت المشاهدة
        </PrimaryBtn>
      )}
    </div>
  );
}

// ── 2. Text ────────────────────────────────────────────────────────────
function TextActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { bodyAr?: string; bodyMd?: string };
  const body = cfg.bodyAr || cfg.bodyMd || "";
  return (
    <div className="space-y-3">
      <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground leading-relaxed">{body}</div>
      {!isDone && (
        <PrimaryBtn onClick={() => onSubmit({})} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          أنهيت القراءة
        </PrimaryBtn>
      )}
    </div>
  );
}

// ── 3. Quiz ────────────────────────────────────────────────────────────
type QuizQ = { q: string; choices: string[]; answer: number };
function QuizActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { questions?: QuizQ[]; passScore?: number };
  const qs = cfg.questions ?? [];
  const passScore = cfg.passScore ?? 60;
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const submit = async () => {
    if (qs.length === 0) { await onSubmit({ autoScore: 100 }); return; }
    let correct = 0;
    qs.forEach((q, i) => { if (picks[i] === q.answer) correct++; });
    const score = Math.round((correct / qs.length) * 100);
    const passed = score >= passScore;
    setResult({ score, passed });
    if (passed) await onSubmit({ payload: { picks }, autoScore: score });
  };

  if (qs.length === 0) {
    return <p className="text-sm text-muted-foreground italic">لم تُضَف أسئلة بعد.</p>;
  }

  return (
    <div className="space-y-4">
      {qs.map((q, i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-semibold">{i + 1}. {q.q}</p>
          <div className="space-y-1.5">
            {q.choices.map((c, ci) => {
              const selected = picks[i] === ci;
              const correct = result && q.answer === ci;
              const wrong = result && selected && q.answer !== ci;
              return (
                <button key={ci} onClick={() => !result && !isDone && setPicks({ ...picks, [i]: ci })}
                  disabled={!!result || isDone}
                  className={`w-full text-start px-3 py-2 rounded-lg border text-sm transition-colors ${
                    correct ? "border-green-500 bg-green-50" :
                    wrong ? "border-rose-500 bg-rose-50" :
                    selected ? "border-primary bg-primary/5" :
                    "border-border hover:bg-muted/40"
                  }`}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {result && (
        <div className={`p-3 rounded-lg text-sm font-semibold ${result.passed ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}>
          نتيجتك: {result.score}% — {result.passed ? "نجحت ✓" : `لم تتجاوز ${passScore}%، حاول مجدداً`}
        </div>
      )}
      {!isDone && (
        <div className="flex gap-2">
          {!result && (
            <PrimaryBtn onClick={submit} disabled={isSubmitting || Object.keys(picks).length < qs.length}>
              تأكيد الإجابات
            </PrimaryBtn>
          )}
          {result && !result.passed && (
            <PrimaryBtn onClick={() => { setResult(null); setPicks({}); }} disabled={isSubmitting}>
              المحاولة مجدداً
            </PrimaryBtn>
          )}
        </div>
      )}
    </div>
  );
}

// ── 4. Reflection ──────────────────────────────────────────────────────
function ReflectionActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { prompt?: string; minLength?: number };
  const min = cfg.minLength ?? 50;
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      {cfg.prompt && <p className="text-sm font-medium bg-violet-50 text-violet-900 p-3 rounded-lg">{cfg.prompt}</p>}
      <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={isDone}
        className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-sm"
        placeholder="اكتب تأملك هنا..." />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{text.length} / {min}</span>
        {!isDone && (
          <PrimaryBtn onClick={() => onSubmit({ payload: { text } })} disabled={isSubmitting || text.trim().length < min}>
            حفظ التأمل
          </PrimaryBtn>
        )}
      </div>
    </div>
  );
}

// ── 5. Speech Builder ──────────────────────────────────────────────────
function SpeechBuilderActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { steps?: { key: string; label: string; placeholder?: string }[] };
  const defaultSteps = [
    { key: "hook",    label: "الافتتاحية (Hook)",      placeholder: "كيف ستلفت الانتباه في أول 10 ثوانٍ؟" },
    { key: "idea",    label: "الفكرة الرئيسية",         placeholder: "ما الرسالة التي تريد إيصالها؟" },
    { key: "support", label: "الأدلة والقصص الداعمة",  placeholder: "ما الأدلة أو القصص التي تدعم فكرتك؟" },
    { key: "cta",     label: "الدعوة للتنفيذ",          placeholder: "ماذا تريد من جمهورك أن يفعل؟" },
  ];
  const steps = cfg.steps && cfg.steps.length > 0 ? cfg.steps : defaultSteps;
  const [vals, setVals] = useState<Record<string, string>>({});
  const allFilled = steps.every(s => (vals[s.key] ?? "").trim().length > 5);
  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <div key={s.key}>
          <label className="text-sm font-semibold mb-1 block">{s.label}</label>
          <textarea value={vals[s.key] ?? ""} onChange={(e) => setVals({ ...vals, [s.key]: e.target.value })}
            disabled={isDone}
            className="w-full min-h-[70px] p-2.5 rounded-lg border border-border bg-background text-sm"
            placeholder={s.placeholder} />
        </div>
      ))}
      {!isDone && (
        <PrimaryBtn onClick={() => onSubmit({ payload: { speech: vals } })} disabled={isSubmitting || !allFilled}>
          حفظ الخطاب
        </PrimaryBtn>
      )}
    </div>
  );
}

// ── 6. Voice recording ─────────────────────────────────────────────────
function VoiceActivity({ activity, isDone, isPending, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled">) {
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        blobRef.current = blob;
        setBlobUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      setRecording(true);
    } catch {
      setError("تعذّر الوصول للميكروفون. تأكد من إذن المتصفح.");
    }
  };
  const stop = () => { recRef.current?.stop(); setRecording(false); };

  const submit = async () => {
    if (!blobRef.current) return;
    // Encode as data URL (small recordings) or a stub URL — production would upload to storage.
    const reader = new FileReader();
    reader.readAsDataURL(blobRef.current);
    await new Promise<void>((res) => { reader.onloadend = () => res(); });
    const dataUrl = String(reader.result ?? "");
    // Truncate for safety: only mark as submitted, save URL hint.
    await onSubmit({ mediaUrl: dataUrl.length > 500_000 ? "audio:too_large" : dataUrl, payload: { duration: "n/a" } });
  };

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!isDone && !isPending && (
        <div className="flex flex-wrap items-center gap-3">
          {!recording ? (
            <button onClick={start} disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-pink-600 text-white text-sm font-semibold">
              <Mic className="w-4 h-4" /> ابدأ التسجيل
            </button>
          ) : (
            <button onClick={stop}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-700 text-white text-sm font-semibold animate-pulse">
              <Square className="w-4 h-4" /> إيقاف
            </button>
          )}
          {blobUrl && <audio src={blobUrl} controls className="h-9" />}
          {blobUrl && (
            <PrimaryBtn onClick={submit} disabled={isSubmitting}>
              تسليم للمدرّب
            </PrimaryBtn>
          )}
        </div>
      )}
      {isPending && <p className="text-sm text-amber-700">تم تسليم تسجيلك، سيراجعه المدرّب قريباً.</p>}
      {isDone && <p className="text-sm text-green-700">✓ اعتمد المدرّب تسجيلك.</p>}
    </div>
  );
}

// ── 7. Video submission ────────────────────────────────────────────────
function VideoSubmitActivity({ isDone, isPending, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "activity">) {
  const [url, setUrl] = useState("");
  if (isDone) return <p className="text-sm text-green-700">✓ اعتمد المدرّب فيديوك.</p>;
  if (isPending) return <p className="text-sm text-amber-700">تم تسليم فيديوك، بانتظار مراجعة المدرّب.</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">ارفع فيديوك على YouTube/Vimeo/Drive ثم ضع الرابط هنا.</p>
      <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
      <PrimaryBtn onClick={() => onSubmit({ mediaUrl: url, payload: { url } })} disabled={isSubmitting || !/^https?:\/\//.test(url)}>
        تسليم الفيديو
      </PrimaryBtn>
    </div>
  );
}

// ── 8. Drag & Drop ─────────────────────────────────────────────────────
type DDPair = { left: string; right: string };
function DragDropActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { pairs?: DDPair[] };
  const pairs = cfg.pairs ?? [];
  const [picks, setPicks] = useState<Record<number, number>>({}); // leftIdx -> rightIdx
  const [shuffledRight] = useState(() => pairs.map((_, i) => i).sort(() => Math.random() - 0.5));
  const [result, setResult] = useState<{ score: number } | null>(null);

  const submit = async () => {
    let correct = 0;
    pairs.forEach((_, i) => { if (picks[i] === i) correct++; });
    const score = pairs.length === 0 ? 100 : Math.round((correct / pairs.length) * 100);
    setResult({ score });
    if (score >= 60) await onSubmit({ payload: { picks }, autoScore: score });
  };

  if (pairs.length === 0) return <p className="text-sm text-muted-foreground italic">لم تُضَف أزواج بعد.</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">طابق كل عنصر على اليمين بالعنصر المناسب من القائمة.</p>
      <div className="space-y-2">
        {pairs.map((p, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/20">
            <span className="font-semibold text-sm flex-1 min-w-[120px]">{p.left}</span>
            <select value={picks[i] ?? ""} onChange={(e) => setPicks({ ...picks, [i]: Number(e.target.value) })}
              disabled={!!result || isDone}
              className="px-2 py-1.5 rounded border border-border text-sm bg-background min-w-[160px]">
              <option value="">اختر…</option>
              {shuffledRight.map((rIdx) => <option key={rIdx} value={rIdx}>{pairs[rIdx].right}</option>)}
            </select>
            {result && (picks[i] === i
              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
              : <AlertTriangle className="w-4 h-4 text-rose-600" />)}
          </div>
        ))}
      </div>
      {result && <p className="text-sm font-semibold">نتيجتك: {result.score}%</p>}
      {!isDone && !result && (
        <PrimaryBtn onClick={submit} disabled={isSubmitting || Object.keys(picks).length < pairs.length}>تأكيد</PrimaryBtn>
      )}
      {result && result.score < 60 && !isDone && (
        <PrimaryBtn onClick={() => { setResult(null); setPicks({}); }} disabled={isSubmitting}>محاولة ثانية</PrimaryBtn>
      )}
    </div>
  );
}

// ── 9. Scenario (branching) ────────────────────────────────────────────
type ScenarioStep = { id: string; text: string; choices: { label: string; nextId?: string; isEnd?: boolean }[] };
function ScenarioActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { steps?: ScenarioStep[]; startId?: string };
  const steps = cfg.steps ?? [];
  const startId = cfg.startId ?? steps[0]?.id ?? "";
  const [currentId, setCurrentId] = useState<string>(startId);
  const [path, setPath] = useState<string[]>([]);
  const [ended, setEnded] = useState(false);

  if (steps.length === 0) return <p className="text-sm text-muted-foreground italic">لم تُضَف خطوات السيناريو بعد.</p>;
  const current = steps.find(s => s.id === currentId);
  if (!current) return <p className="text-sm text-rose-600">خطأ في إعداد السيناريو.</p>;

  return (
    <div className="space-y-3">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm leading-relaxed">{current.text}</div>
      {!ended && (
        <div className="space-y-2">
          {current.choices.map((c, i) => (
            <button key={i} disabled={isDone}
              onClick={() => {
                setPath([...path, c.label]);
                if (c.isEnd || !c.nextId) setEnded(true);
                else setCurrentId(c.nextId);
              }}
              className="w-full text-start px-3 py-2 rounded-lg border border-border hover:bg-muted/40 text-sm">
              {c.label}
            </button>
          ))}
        </div>
      )}
      {ended && !isDone && (
        <PrimaryBtn onClick={() => onSubmit({ payload: { path } })} disabled={isSubmitting}>
          إنهاء السيناريو
        </PrimaryBtn>
      )}
    </div>
  );
}

// ── 10. Self-assessment ────────────────────────────────────────────────
function SelfAssessmentActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { items?: string[]; scale?: number };
  const items = cfg.items ?? ["وضوحي في طرح الفكرة", "ثقتي أمام الآخرين", "تحكمي في صوتي ولغة جسدي"];
  const scale = cfg.scale ?? 5;
  const [vals, setVals] = useState<Record<number, number>>({});
  const allDone = items.every((_, i) => vals[i] !== undefined);
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <p className="text-sm font-medium mb-1.5">{it}</p>
          <div className="flex gap-1.5">
            {Array.from({ length: scale }, (_, k) => k + 1).map((v) => {
              const sel = vals[i] === v;
              return (
                <button key={v} onClick={() => !isDone && setVals({ ...vals, [i]: v })}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold border ${sel ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/30"}`}>
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!isDone && (
        <PrimaryBtn onClick={() => {
          const avg = Object.values(vals).reduce((a, b) => a + b, 0) / Math.max(1, items.length);
          onSubmit({ payload: { vals }, autoScore: Math.round((avg / scale) * 100) });
        }} disabled={isSubmitting || !allDone}>
          حفظ التقييم
        </PrimaryBtn>
      )}
    </div>
  );
}

// ── 11. Coach feedback (request) ───────────────────────────────────────
function CoachFeedbackActivity({ isDone, isPending, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "activity">) {
  const [msg, setMsg] = useState("");
  if (isDone) return <p className="text-sm text-green-700">✓ تم استلام ملاحظات المدرّب.</p>;
  if (isPending) return <p className="text-sm text-amber-700">طلبك مرسَل، سيردّ عليك المدرّب قريباً.</p>;
  return (
    <div className="space-y-3">
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)}
        placeholder="اكتب طلب الملاحظات أو السؤال للمدرّب..."
        className="w-full min-h-[100px] p-3 rounded-lg border border-border text-sm" />
      <PrimaryBtn onClick={() => onSubmit({ payload: { request: msg } })} disabled={isSubmitting || msg.trim().length < 10}>
        أرسل للمدرّب
      </PrimaryBtn>
    </div>
  );
}

// ── 12. Challenge ──────────────────────────────────────────────────────
function ChallengeActivity({ activity, isDone, isSubmitting, onSubmit }: Omit<BodyProps, "enrolled" | "isPending">) {
  const cfg = activity.config as { goal?: string };
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="space-y-3">
      <div className="bg-fuchsia-50 border border-fuchsia-200 p-4 rounded-xl">
        <div className="flex items-center gap-2 text-fuchsia-700 font-bold mb-1">
          <Trophy className="w-5 h-5" /> التحدي
        </div>
        <p className="text-sm leading-relaxed">{cfg.goal || "نفّذ التحدي خلال 24 ساعة، ثم أكّد إنجازك أدناه."}</p>
      </div>
      {!isDone && (
        <>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)}
              className="mt-0.5" />
            أؤكّد أنني نفّذت التحدي.
          </label>
          <PrimaryBtn onClick={() => onSubmit({ payload: { confirmed: true } })} disabled={isSubmitting || !confirm}>
            إنجاز التحدي
          </PrimaryBtn>
        </>
      )}
    </div>
  );
}

export { ChevronLeft, ChevronRight };
