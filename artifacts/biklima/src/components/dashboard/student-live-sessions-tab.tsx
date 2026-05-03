import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Clock, ExternalLink, Loader2 } from "lucide-react";

interface LiveSession {
  id: string;
  lessonId: string;
  zoomJoinUrl: string;
  titleAr: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  recordingUrl: string | null;
  lessonTitleAr: string | null;
  courseTitleAr: string | null;
  courseSlug: string | null;
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function StudentLiveSessionsTab({ lang }: { lang: "ar" | "en" }) {
  const isRtl = lang === "ar";
  const [sessions, setSessions] = useState<LiveSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBase = getApiBase();
    fetch(`${apiBase}/my/live-sessions`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setSessions(d.sessions ?? []))
      .catch(() => setError(isRtl ? "تعذّر تحميل الحصص" : "Failed to load sessions"));
  }, [isRtl]);

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          {isRtl ? "الحصص المباشرة" : "Live Sessions"}
        </h3>
        {sessions === null && !error && (
          <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {sessions && sessions.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Video className="w-10 h-10 text-primary/50" />
            </div>
            <p className="text-muted-foreground">{isRtl ? "لا توجد حصص مباشرة قادمة" : "No upcoming live sessions"}</p>
          </div>
        )}
        {sessions && sessions.length > 0 && (
          <ul className="space-y-3">
            {sessions.map(s => {
              const when = new Date(s.scheduledAt);
              const ms = when.getTime() - Date.now();
              const isLive = s.status === "live" || (ms < 0 && ms > -s.durationMinutes * 60 * 1000);
              return (
                <li key={s.id} className="border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isLive ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary"}`}>
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{s.titleAr || s.lessonTitleAr || (isRtl ? "حصة مباشرة" : "Live session")}</p>
                    <p className="text-xs text-muted-foreground">{s.courseTitleAr ?? "—"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {when.toLocaleString(isRtl ? "ar-SA" : undefined)} • {s.durationMinutes} {isRtl ? "د" : "min"}
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 shrink-0">
                    {isLive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {isRtl ? "مباشر الآن" : "LIVE NOW"}
                      </span>
                    )}
                    {s.status !== "ended" && s.status !== "cancelled" && (
                      <a
                        href={s.zoomJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-bold inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {isRtl ? "انضم عبر Zoom" : "Join on Zoom"}
                      </a>
                    )}
                    {s.recordingUrl && (
                      <a
                        href={s.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground inline-flex items-center gap-1.5"
                      >
                        {isRtl ? "مشاهدة التسجيل" : "Watch recording"}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
