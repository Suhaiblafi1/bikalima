import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";

type ThreadListItem = {
  id: string;
  visitorName: string;
  visitorWhatsapp: string | null;
  visitorEmail: string | null;
  lang: "ar" | "en";
  status: "open" | "closed";
  unreadForAdmin: number;
  pageUrl: string | null;
  lastMessageAt: string;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  sender: "visitor" | "team" | "system";
  body: string;
  channel: "web" | "whatsapp" | "email";
  createdAt: string;
};

type ThreadDetail = {
  id: string;
  visitorName: string;
  visitorWhatsapp: string | null;
  visitorEmail: string | null;
  lang: "ar" | "en";
  status: "open" | "closed";
  pageUrl: string | null;
  userAgent: string | null;
  lastMessageAt: string;
  createdAt: string;
};

const POLL_LIST_MS = 8000;
const POLL_THREAD_MS = 5000;

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return "";
  }
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "الآن";
    if (m < 60) return `قبل ${m} د`;
    const h = Math.floor(m / 60);
    if (h < 24) return `قبل ${h} س`;
    const d = Math.floor(h / 24);
    return `قبل ${d} يوم`;
  } catch {
    return "";
  }
}

export default function AdminChatPage() {
  const apiFetch = useApiFetch();

  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("open");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // ── Fetch list ──────────────────────────────────────────────────────
  const fetchThreads = useCallback(async () => {
    const qs = statusFilter === "all" ? "" : `?status=${statusFilter}`;
    const res = await apiFetch(`/admin/chat/threads${qs}`);
    if (!res.ok) {
      setLoadingList(false);
      return;
    }
    const data = (await res.json()) as {
      threads: ThreadListItem[];
      whatsappConfigured: boolean;
    };
    setThreads(data.threads);
    setWhatsappConfigured(!!data.whatsappConfigured);
    setLoadingList(false);
  }, [apiFetch, statusFilter]);

  useEffect(() => {
    setLoadingList(true);
    fetchThreads();
    const i = window.setInterval(fetchThreads, POLL_LIST_MS);
    return () => window.clearInterval(i);
  }, [fetchThreads]);

  // ── Fetch active thread ─────────────────────────────────────────────
  const fetchThread = useCallback(
    async (id: string, silent = false) => {
      if (!silent) setLoadingThread(true);
      const res = await apiFetch(`/admin/chat/threads/${id}`);
      if (!res.ok) {
        if (!silent) setLoadingThread(false);
        return;
      }
      const data = (await res.json()) as {
        thread: ThreadDetail;
        messages: ChatMessage[];
      };
      setActiveThread(data.thread);
      setMessages(data.messages);
      if (!silent) setLoadingThread(false);
      // optimistic: mark as read locally
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, unreadForAdmin: 0 } : t)),
      );
    },
    [apiFetch],
  );

  useEffect(() => {
    if (!activeId) {
      setActiveThread(null);
      setMessages([]);
      return;
    }
    fetchThread(activeId);
    const i = window.setInterval(() => fetchThread(activeId, true), POLL_THREAD_MS);
    return () => window.clearInterval(i);
  }, [activeId, fetchThread]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ── Send reply ──────────────────────────────────────────────────────
  const sendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeId) return;
    const body = draft.trim();
    if (body.length < 1) return;
    setSending(true);
    const res = await apiFetch(`/admin/chat/threads/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      const data = (await res.json()) as { message: ChatMessage };
      setMessages((prev) => [...prev, data.message]);
      setDraft("");
    }
    setSending(false);
  };

  // ── Status update ───────────────────────────────────────────────────
  const setThreadStatus = async (id: string, status: "open" | "closed") => {
    const res = await apiFetch(`/admin/chat/threads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      setActiveThread((cur) => (cur && cur.id === id ? { ...cur, status } : cur));
    }
  };

  const counts = useMemo(() => {
    const o = threads.filter((t) => t.status === "open").length;
    const c = threads.filter((t) => t.status === "closed").length;
    return { all: threads.length, open: o, closed: c };
  }, [threads]);

  return (
    <AdminLayout activeKey="chat">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row min-h-[70vh]">
            {/* ── Threads list ── */}
            <aside className="lg:w-80 lg:border-e border-border flex flex-col">
              <div className="p-3 border-b border-border flex items-center justify-between gap-2">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  الشات المباشر
                </h2>
                <button
                  type="button"
                  onClick={() => fetchThreads()}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                  title="تحديث"
                  data-testid="admin-chat-refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-3 py-2 border-b border-border flex items-center gap-1 text-xs">
                {(["open", "all", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-full font-medium border transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`admin-chat-filter-${s}`}
                  >
                    {s === "open" && `مفتوحة (${counts.open})`}
                    {s === "all" && `الكل (${counts.all})`}
                    {s === "closed" && `مغلقة (${counts.closed})`}
                  </button>
                ))}
              </div>

              {!whatsappConfigured && (
                <div className="px-3 py-2 text-[11px] bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-b border-amber-200/60">
                  لربط الردود بواتساب الفريق، أضف بيانات WhatsApp Cloud API لاحقًا.
                </div>
              )}

              <div className="flex-1 overflow-y-auto" data-testid="admin-chat-threads">
                {loadingList ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </div>
                ) : threads.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    لا توجد محادثات بعد.
                  </div>
                ) : (
                  threads.map((t) => {
                    const isActive = t.id === activeId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveId(t.id)}
                        className={`w-full text-start px-3 py-3 border-b border-border/60 hover:bg-muted/60 transition-colors ${
                          isActive ? "bg-muted" : ""
                        }`}
                        data-testid={`admin-chat-thread-${t.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-semibold text-sm truncate">{t.visitorName}</p>
                          {t.unreadForAdmin > 0 && (
                            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                              {t.unreadForAdmin}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate">
                            {t.visitorWhatsapp || t.visitorEmail || "—"}
                          </span>
                          <span className="shrink-0">{relativeTime(t.lastMessageAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full ${
                              t.status === "open" ? "bg-emerald-500" : "bg-muted-foreground"
                            }`}
                          />
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {t.status === "open" ? "مفتوح" : "مغلق"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ── Conversation panel ── */}
            <section className="flex-1 flex flex-col min-h-[70vh]">
              {!activeThread ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-6 text-center">
                  اختر محادثة من القائمة لبدء الرد.
                </div>
              ) : loadingThread ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Conversation header */}
                  <div className="border-b border-border px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{activeThread.visitorName}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                        {activeThread.visitorWhatsapp && (
                          <a
                            href={`https://wa.me/${activeThread.visitorWhatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-emerald-600"
                            data-testid="admin-chat-wa-link"
                          >
                            <Phone className="w-3 h-3" /> {activeThread.visitorWhatsapp}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {activeThread.visitorEmail && (
                          <a
                            href={`mailto:${activeThread.visitorEmail}`}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <Mail className="w-3 h-3" /> {activeThread.visitorEmail}
                          </a>
                        )}
                        {activeThread.pageUrl && (
                          <span className="flex items-center gap-1 truncate max-w-[260px]" title={activeThread.pageUrl}>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span className="truncate">{activeThread.pageUrl}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activeThread.status === "open" ? (
                        <button
                          type="button"
                          onClick={() => setThreadStatus(activeThread.id, "closed")}
                          className="text-[11px] px-2 py-1 rounded-md border border-border hover:bg-muted flex items-center gap-1"
                          data-testid="admin-chat-close"
                        >
                          <XCircle className="w-3.5 h-3.5" /> إغلاق
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setThreadStatus(activeThread.id, "open")}
                          className="text-[11px] px-2 py-1 rounded-md border border-border hover:bg-muted flex items-center gap-1 text-emerald-700"
                          data-testid="admin-chat-reopen"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> فتح
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-3 py-3 bg-muted/20 space-y-2"
                    data-testid="admin-chat-messages"
                  >
                    {messages.map((m) => {
                      const fromTeam = m.sender === "team";
                      const isSystem = m.sender === "system";
                      if (isSystem) {
                        return (
                          <div key={m.id} className="text-center text-[11px] text-muted-foreground py-1">
                            {m.body}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={m.id}
                          className={`flex ${fromTeam ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                              fromTeam
                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-foreground rounded-br-sm"
                                : "bg-background border border-border text-foreground rounded-bl-sm"
                            }`}
                          >
                            {!fromTeam && (
                              <p className="text-[10px] font-bold text-primary mb-0.5">
                                {activeThread.visitorName}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className="text-[10px] opacity-60 mt-1 text-end">
                              {formatTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Composer */}
                  {activeThread.status === "closed" ? (
                    <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
                      هذه المحادثة مغلقة. أعد فتحها للرد.
                    </div>
                  ) : (
                    <form
                      onSubmit={sendReply}
                      className="border-t border-border p-2 flex items-end gap-2 bg-background"
                    >
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                        rows={2}
                        placeholder="اكتب ردًا… (Enter للإرسال)"
                        aria-label="نص الرد"
                        className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
                        data-testid="admin-chat-input"
                      />
                      <button
                        type="submit"
                        disabled={sending || draft.trim().length < 1}
                        aria-label="إرسال"
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg p-2.5 transition-colors"
                        data-testid="admin-chat-send"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </section>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
