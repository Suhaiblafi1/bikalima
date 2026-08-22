import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, MessageCircle } from "lucide-react";

type Lang = "ar" | "en";
type Destination = "live" | "assignments" | "messages";

type Session = {
  id: string;
  titleAr: string | null;
  lessonTitleAr: string | null;
  courseTitleAr: string | null;
  scheduledAt: string;
  status: string;
};

type Assignment = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  dueAt: string | null;
  submission: unknown | null;
};

type Thread = {
  id: string;
  subject: string;
  lastMessageAt: string;
  lastReadAt: string | null;
};

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export function StudentTodayOverview({ lang, onSelect }: { lang: Lang; onSelect: (destination: Destination) => void }) {
  const isAr = lang === "ar";
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const options = { credentials: "include" as const, signal: controller.signal };
    const apiBase = getApiBase();

    Promise.all([
      fetch(`${apiBase}/my/live-sessions`, options).then((response) => response.ok ? response.json() : { sessions: [] }),
      fetch(`${apiBase}/my/assignments`, options).then((response) => response.ok ? response.json() : { assignments: [] }),
      fetch(`${apiBase}/messages/threads`, options).then((response) => response.ok ? response.json() : { threads: [] }),
    ]).then(([sessionsData, assignmentsData, threadsData]) => {
      const now = Date.now();
      const sessions = ((sessionsData.sessions ?? []) as Session[])
        .filter((item) => item.status !== "cancelled" && new Date(item.scheduledAt).getTime() >= now - 2 * 60 * 60 * 1000)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      const assignments = ((assignmentsData.assignments ?? []) as Assignment[])
        .filter((item) => !item.submission)
        .sort((a, b) => {
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        });
      const threads = (threadsData.threads ?? []) as Thread[];

      setSession(sessions[0] ?? null);
      setAssignment(assignments[0] ?? null);
      setUnreadMessages(threads.filter((thread) => !thread.lastReadAt || new Date(thread.lastMessageAt) > new Date(thread.lastReadAt)).length);
      setLoading(false);
    }).catch((error) => {
      if ((error as Error).name !== "AbortError") setLoading(false);
    });

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <section className="mb-6" aria-label={isAr ? "ملخص اليوم" : "Today's summary"} aria-busy="true">
        <div className="mb-3 h-6 w-36 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-border bg-card" />)}
        </div>
      </section>
    );
  }

  const cards = [
    {
      key: "live" as const,
      icon: CalendarClock,
      title: isAr ? "جلستك القادمة" : "Your next session",
      value: session ? (session.titleAr || session.lessonTitleAr || (isAr ? "حصة مباشرة" : "Live session")) : (isAr ? "لا توجد جلسة قريبة" : "No upcoming session"),
      meta: session ? new Date(session.scheduledAt).toLocaleString(isAr ? "ar-JO" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : (isAr ? "سنخبرك فور إضافة موعد" : "We'll notify you when one is added"),
      active: !!session,
    },
    {
      key: "assignments" as const,
      icon: assignment ? ClipboardList : CheckCircle2,
      title: isAr ? "المهمة الأهم" : "Priority task",
      value: assignment ? (isAr ? assignment.titleAr : assignment.titleEn || assignment.titleAr) : (isAr ? "لا توجد مهمة عاجلة" : "No urgent task"),
      meta: assignment?.dueAt ? `${isAr ? "آخر موعد" : "Due"}: ${new Date(assignment.dueAt).toLocaleDateString(isAr ? "ar-JO" : "en-GB")}` : (isAr ? "أنت على المسار الصحيح" : "You're on track"),
      active: !!assignment,
    },
    {
      key: "messages" as const,
      icon: MessageCircle,
      title: isAr ? "الرسائل" : "Messages",
      value: unreadMessages > 0 ? `${unreadMessages} ${isAr ? "رسائل تحتاج قراءتك" : "unread messages"}` : (isAr ? "لا رسائل جديدة" : "No new messages"),
      meta: isAr ? "تواصل مع مدربك من داخل المنصة" : "Keep in touch with your trainer",
      active: unreadMessages > 0,
    },
  ];

  return (
    <section className="mb-6" aria-labelledby="student-today-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="student-today-heading" className="text-xl font-bold">{isAr ? "اليوم في بكلمة" : "Today at Bikalima"}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{isAr ? "ثلاثة أشياء تكفي لتعرف خطوتك التالية." : "Everything you need to know your next step."}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onSelect(card.key)}
              className="group min-h-28 rounded-2xl border border-border bg-card p-4 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-muted-foreground">{card.title}</span>
                  <span className="mt-1 block font-bold leading-snug text-foreground">{card.value}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{card.meta}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
