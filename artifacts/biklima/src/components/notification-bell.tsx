import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useLang } from "@/hooks/useLang";

type Notification = {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string | null;
  bodyEn: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

function timeAgo(iso: string, isAr: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return isAr ? "الآن" : "now";
  if (m < 60) return isAr ? `قبل ${m} د` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return isAr ? `قبل ${h} س` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return isAr ? `قبل ${d} ي` : `${d}d ago`;
  return new Date(iso).toLocaleDateString(isAr ? "ar" : "en");
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const apiBase = getApiBase();
  const ref = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const r = await fetch(`${apiBase}/my/notifications/unread-count`, { credentials: "include", cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setUnread(d.count ?? 0);
    } catch {}
  }, [apiBase, isAuthenticated]);

  const fetchList = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const r = await fetch(`${apiBase}/my/notifications?limit=15`, { credentials: "include", cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setItems(d.notifications ?? []);
      }
    } catch {}
    setLoading(false);
  }, [apiBase, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { setUnread(0); setItems([]); return; }
    fetchCount();
    const t = setInterval(fetchCount, 30000);
    return () => clearInterval(t);
  }, [isAuthenticated, fetchCount]);

  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  const markRead = async (id: string) => {
    setItems(list => list.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    setUnread(u => Math.max(0, u - 1));
    try {
      await fetch(`${apiBase}/my/notifications/${id}/read`, { method: "POST", credentials: "include" });
    } catch {}
  };

  const markAllRead = async () => {
    setItems(list => list.map(n => n.readAt ? n : { ...n, readAt: new Date().toISOString() }));
    setUnread(0);
    try {
      await fetch(`${apiBase}/my/notifications/read-all`, { method: "POST", credentials: "include" });
    } catch {}
  };

  const onClick = (n: Notification) => {
    if (!n.readAt) markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-full hover:bg-secondary/50 transition-colors flex items-center justify-center"
        aria-label={isAr ? "الإشعارات" : "Notifications"}
        data-testid="notification-bell"
      >
        <Bell className="w-5 h-5 text-foreground/80" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background"
            data-testid="notification-badge"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className={`absolute top-full mt-1.5 w-[340px] max-w-[92vw] bg-background border border-border rounded-2xl shadow-xl overflow-hidden z-40 ${isAr ? "start-0" : "end-0"}`}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                {isAr ? "الإشعارات" : "Notifications"}
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  data-testid="notification-mark-all-read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {isAr ? "قراءة الكل" : "Mark all read"}
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="py-10 flex justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Inbox className="w-8 h-8 opacity-40" />
                  {isAr ? "لا توجد إشعارات بعد" : "No notifications yet"}
                </div>
              ) : (
                items.map(n => {
                  const title = isAr ? n.titleAr : n.titleEn;
                  const body = isAr ? n.bodyAr : n.bodyEn;
                  const isUnread = !n.readAt;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onClick(n)}
                      className={`w-full text-start px-4 py-3 border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors ${isUnread ? "bg-primary/5" : ""}`}
                      data-testid={`notification-item-${n.id}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {isUnread && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-tight ${isUnread ? "font-bold text-foreground" : "font-medium text-foreground/85"}`}>{title}</p>
                          {body && <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{body}</p>}
                          <p className="text-[10px] text-muted-foreground/70 mt-1.5">{timeAgo(n.createdAt, isAr)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
