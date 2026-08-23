import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Sparkles, X, Send, Loader2, Check, CheckCheck, Minus } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { PhoneInput } from "@/components/phone-input";
import { trackWhatsappClick } from "@/lib/analytics";

const STORAGE_KEY = "bikalima_chat_v1";
const TEASER_DISMISS_KEY = "bikalima_chat_teaser_dismissed_at";
const POLL_INTERVAL_MS = 5000;

// Public event other components can dispatch to programmatically open the
// chat (e.g. mobile sticky CTA's "WhatsApp" button).
export const OPEN_CHAT_EVENT = "bikalima:open-chat";
export const CHAT_STATE_EVENT = "bikalima:chat-state";

// The UI and conversation history are deliberately transport-agnostic.
// Today messages use the existing team inbox. A future server-side adapter
// can switch this to "ai" or "hybrid" without exposing provider keys in the
// browser or replacing the CRM thread model.
export type ChatTransport = "team" | "ai" | "hybrid";
export const ACTIVE_CHAT_TRANSPORT: ChatTransport = "team";

const TEXT = {
  ar: {
    bubble: "اسأل ومضة",
    teaser: "لست متأكدًا من أين تبدأ؟ اسأل ومضة.",
    headerTitle: "ومضة",
    headerSubtitle: "مساعد بكلمة",
    statusOnline: "متصل",
    statusReply: "يرد فريق بكلمة حاليًا",
    introTitle: "أهلًا، أنا ومضة",
    introBody:
      "أساعدك في فهم البرامج والدورات الوجاهية والكراسات والشهادات. اختر سؤالًا سريعًا أو اكتب ما تريد، وسيتابع معك فريق بكلمة حاليًا.",
    name: "كيف نناديك؟",
    namePh: "اسمك الأول",
    whatsapp: "واتساب للمتابعة (اختياري)",
    whatsappPh: "974XXXXXXXX",
    message: "ما الذي تريد معرفته؟",
    messagePh: "اكتب سؤالك هنا…",
    start: "أرسل سؤالي",
    starting: "جاري الإرسال…",
    sendPh: "اكتب ردًا…",
    send: "إرسال",
    privacy: "تُرسل رسالتك حاليًا إلى فريق بكلمة، وبإرسالها توافق على سياسة الخصوصية.",
    closed: "تم إغلاق هذه المحادثة. اضغط لبدء محادثة جديدة.",
    reset: "بدء محادثة جديدة",
    closeBtn: "إغلاق",
    minimize: "تصغير",
    helpPrompt: "اسأل ومضة",
    errorGeneric: "تعذّر الإرسال، حاول مرة أخرى.",
    errorRate: "أرسلت رسائل كثيرة. انتظر قليلًا.",
    errorClosed: "تم إغلاق المحادثة من قبل الفريق.",
    teamLabel: "فريق بكلمة",
    youLabel: "أنت",
    typingHint: "اضغط Enter للإرسال، Shift+Enter لسطر جديد",
    quickHeading: "كيف يمكنني مساعدتك؟",
    quickPrompts: [
      "اعرض لي البرامج المتاحة",
      "ما الفرق بين المسجّل وZoom؟",
      "ما مواعيد الدورات الحضورية؟",
      "أريد معرفة الكراسات والشهادات",
    ],
    humanHandoff: "تحتاج شخصًا من الفريق؟ رسالتك تصل إليهم مباشرة.",
  },
  en: {
    bubble: "Ask Wamda",
    teaser: "Not sure where to begin? Ask Wamda.",
    headerTitle: "Wamda",
    headerSubtitle: "Bikalima assistant",
    statusOnline: "Online",
    statusReply: "The Bikalima team replies for now",
    introTitle: "Hello, I'm Wamda",
    introBody:
      "I help you understand programmes, in-person courses, workbooks, and certificates. Pick a quick question or write your own; the Bikalima team will follow up for now.",
    name: "What should we call you?",
    namePh: "Your first name",
    whatsapp: "WhatsApp for follow-up (optional)",
    whatsappPh: "974XXXXXXXX",
    message: "What would you like to know?",
    messagePh: "Write your question here…",
    start: "Send my question",
    starting: "Sending…",
    sendPh: "Type a reply…",
    send: "Send",
    privacy: "Your message currently goes to the Bikalima team. By sending it, you agree to our privacy policy.",
    closed: "This conversation is closed. Tap to start a new one.",
    reset: "Start a new chat",
    closeBtn: "Close",
    minimize: "Minimize",
    helpPrompt: "Ask Wamda",
    errorGeneric: "Couldn't send. Please try again.",
    errorRate: "Too many messages — please wait a moment.",
    errorClosed: "Conversation was closed by the team.",
    teamLabel: "Bikalima team",
    youLabel: "You",
    typingHint: "Enter to send, Shift+Enter for new line",
    quickHeading: "How can I help?",
    quickPrompts: [
      "Show me the available programmes",
      "What's the difference between recorded and Zoom?",
      "What in-person courses are coming up?",
      "Tell me about workbooks and certificates",
    ],
    humanHandoff: "Need a person? Your message goes directly to our team.",
  },
} as const;

type Sender = "visitor" | "team" | "system";
type Message = {
  id: string;
  sender: Sender;
  body: string;
  channel: "web" | "whatsapp" | "email";
  createdAt: string;
};
type StoredSession = {
  threadId: string;
  token: string;
  visitorName: string;
};

function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.threadId || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(s: StoredSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function shouldShowTeaser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const dismissed = window.localStorage.getItem(TEASER_DISMISS_KEY);
    if (!dismissed) return true;
    const ms = Number(dismissed);
    if (!Number.isFinite(ms)) return true;
    return Date.now() - ms > 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

function dismissTeaserStorage(): void {
  try {
    window.localStorage.setItem(TEASER_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

function formatTime(iso: string, lang: "ar" | "en"): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function WamdaAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "w-16 h-16" : size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const messageSize = size === "lg" ? "w-8 h-8" : size === "sm" ? "w-4.5 h-4.5" : "w-5 h-5";
  const sparkleSize = size === "lg" ? "w-6 h-6 -top-1 -end-1" : "w-4 h-4 -top-0.5 -end-0.5";

  return (
    <span
      className={`relative ${dimensions} rounded-[35%] bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center ring-1 ring-white/25`}
      aria-hidden
    >
      <MessageCircle className={messageSize} strokeWidth={2.2} />
      <span className={`absolute ${sparkleSize} rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-sm ring-2 ring-background`}>
        <Sparkles className={size === "lg" ? "w-3.5 h-3.5" : "w-2.5 h-2.5"} strokeWidth={2.5} />
      </span>
    </span>
  );
}

export function LiveChatWidget() {
  const { lang } = useLang();
  const t = TEXT[lang];
  const apiBase = useMemo(() => getApiBase(), []);

  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(() => loadSession());
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadStatus, setThreadStatus] = useState<"open" | "closed">("open");
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // intro form state
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [intro, setIntro] = useState("");
  const [starting, setStarting] = useState(false);

  // reply state
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const lastSeenRef = useRef<string | null>(null);

  // ── Teaser bubble (only when no session exists) ────────────────────
  useEffect(() => {
    if (session) return;
    if (!shouldShowTeaser()) return;
    const tm = window.setTimeout(() => setShowTeaser(true), 5000);
    return () => window.clearTimeout(tm);
  }, [session]);

  // ── Allow other components to open chat programmatically ───────────
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setShowTeaser(false);
      dismissTeaserStorage();
    };
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, []);

  // Keep mobile conversion controls from competing with the assistant sheet.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(CHAT_STATE_EVENT, { detail: { open } }));
    return () => {
      window.dispatchEvent(new CustomEvent(CHAT_STATE_EVENT, { detail: { open: false } }));
    };
  }, [open]);

  // ── Auto-scroll to bottom on new messages ──────────────────────────
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // ── Polling for new messages ───────────────────────────────────────
  const fetchMessages = useCallback(
    async (full: boolean) => {
      if (!session) return;
      const url = new URL(`${apiBase}/chat/threads/${session.threadId}`, window.location.origin);
      if (!full && lastSeenRef.current) {
        url.searchParams.set("since", lastSeenRef.current);
      }
      try {
        const res = await fetch(url.toString().replace(window.location.origin, ""), {
          headers: { "X-Chat-Token": session.token },
          credentials: "include",
        });
        if (res.status === 401 || res.status === 404) {
          clearSession();
          setSession(null);
          setMessages([]);
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as {
          thread: { status: "open" | "closed"; lastMessageAt: string };
          messages: Message[];
        };
        setThreadStatus(data.thread.status);
        if (full) {
          setMessages(data.messages);
        } else if (data.messages.length > 0) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = data.messages.filter((m) => !seen.has(m.id));
            return [...prev, ...fresh];
          });
          if (!open) {
            const newTeam = data.messages.filter((m) => m.sender === "team").length;
            if (newTeam > 0) setUnread((u) => u + newTeam);
          }
        }
        const last = data.messages[data.messages.length - 1];
        if (last) lastSeenRef.current = last.createdAt;
      } catch {
        /* network blip — ignore */
      }
    },
    [apiBase, session, open],
  );

  // First load when a session is available
  useEffect(() => {
    if (!session) return;
    lastSeenRef.current = null;
    fetchMessages(true);
  }, [session, fetchMessages]);

  // Poll while session exists, but pause when the tab is hidden so we don't
  // burn API quota on background tabs. We also extend the interval when the
  // panel is closed (only need to refresh the unread badge occasionally).
  // After 15 minutes of no user activity (no mouse / key / touch / message
  // send) we stop polling entirely; any user gesture or tab refocus resumes
  // it. This caps long-tab cost on idle marketing pages.
  useEffect(() => {
    if (!session) return;
    const INACTIVITY_MS = 15 * 60_000;
    let interval: number | null = null;
    let lastActivity = Date.now();
    const stop = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };
    const start = () => {
      if (interval !== null) return;
      if (Date.now() - lastActivity > INACTIVITY_MS) return;
      const ms = open ? POLL_INTERVAL_MS : POLL_INTERVAL_MS * 4;
      interval = window.setInterval(() => {
        if (Date.now() - lastActivity > INACTIVITY_MS) {
          stop();
          return;
        }
        fetchMessages(false);
      }, ms);
    };
    const bumpActivity = () => {
      const wasIdle = Date.now() - lastActivity > INACTIVITY_MS;
      lastActivity = Date.now();
      if (wasIdle && !document.hidden) {
        start();
        fetchMessages(false);
      }
    };
    const onVis = () => {
      if (document.hidden) stop();
      else {
        bumpActivity();
        start();
        fetchMessages(false);
      }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("mousemove", bumpActivity, { passive: true });
    window.addEventListener("keydown", bumpActivity);
    window.addEventListener("touchstart", bumpActivity, { passive: true });
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("mousemove", bumpActivity);
      window.removeEventListener("keydown", bumpActivity);
      window.removeEventListener("touchstart", bumpActivity);
    };
  }, [session, open, fetchMessages]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // ── Start a new conversation ───────────────────────────────────────
  const startConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedMsg = intro.trim();
    if (trimmedName.length < 2) {
      setError(t.errorGeneric);
      return;
    }
    if (trimmedMsg.length < 1) {
      setError(t.errorGeneric);
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`${apiBase}/chat/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          whatsapp: whatsapp.trim() || null,
          message: trimmedMsg,
          lang,
          pageUrl: window.location.href,
        }),
      });
      if (res.status === 429) {
        setError(t.errorRate);
        setStarting(false);
        return;
      }
      if (!res.ok) {
        setError(t.errorGeneric);
        setStarting(false);
        return;
      }
      const data = (await res.json()) as { threadId: string; token: string };
      const next: StoredSession = {
        threadId: data.threadId,
        token: data.token,
        visitorName: trimmedName,
      };
      saveSession(next);
      setSession(next);
      setName("");
      setWhatsapp("");
      setIntro("");
      // Track once a real message goes out
      trackWhatsappClick("live_chat_start");
    } catch {
      setError(t.errorGeneric);
    } finally {
      setStarting(false);
    }
  };

  // ── Send a follow-up message ───────────────────────────────────────
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session) return;
    const body = draft.trim();
    if (body.length < 1) return;
    setError(null);
    setSending(true);

    // optimistic append
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender: "visitor",
      body,
      channel: "web",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      const res = await fetch(`${apiBase}/chat/threads/${session.threadId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Chat-Token": session.token,
        },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      if (res.status === 429) {
        setError(t.errorRate);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setSending(false);
        return;
      }
      if (res.status === 409) {
        setError(t.errorClosed);
        setThreadStatus("closed");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setSending(false);
        return;
      }
      if (!res.ok) {
        setError(t.errorGeneric);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setSending(false);
        return;
      }
      const data = (await res.json()) as { message: Message };
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m)),
      );
      lastSeenRef.current = data.message.createdAt;
    } catch {
      setError(t.errorGeneric);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleResetSession = () => {
    clearSession();
    setSession(null);
    setMessages([]);
    setThreadStatus("open");
    setError(null);
  };

  const onBubbleClick = () => {
    setOpen((v) => !v);
    setShowTeaser(false);
    dismissTeaserStorage();
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div
      className="fixed bottom-5 end-5 z-[60] flex flex-col items-end gap-2 print:hidden"
      style={{
        // raise on mobile so the sticky CTA bar doesn't overlap the bubble
        bottom:
          "max(calc(env(safe-area-inset-bottom) + 5.25rem), 5.25rem)",
      }}
      data-testid="live-chat-widget"
    >
      {/* Teaser */}
      <AnimatePresence>
        {showTeaser && !open && !session && (
          <motion.div
            key="teaser"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="relative bg-card border border-primary/15 shadow-xl rounded-2xl px-4 py-3 max-w-[260px]"
          >
            <button
              type="button"
              onClick={() => {
                setShowTeaser(false);
                dismissTeaserStorage();
              }}
              aria-label={t.closeBtn}
              className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground"
              data-testid="live-chat-teaser-dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-xs text-foreground leading-relaxed font-medium pe-2">
              {t.teaser}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            dir={dir}
            className="w-[min(390px,calc(100vw-1.5rem))] h-[min(610px,calc(100dvh-8rem))] bg-background border border-primary/15 rounded-[1.75rem] shadow-2xl overflow-hidden flex flex-col max-sm:h-[min(680px,calc(100dvh-7.25rem))]"
            data-testid="live-chat-panel"
            data-chat-transport={ACTIVE_CHAT_TRANSPORT}
            role="dialog"
            aria-label={t.headerTitle}
          >
            {/* Header */}
            <div className="bg-foreground text-background px-4 py-3.5 flex items-center justify-between border-b border-background/10">
              <div className="flex items-center gap-2.5">
                <WamdaAvatar size="sm" />
                <div className="leading-tight">
                  <p className="font-bold text-sm flex items-center gap-1.5">
                    {t.headerTitle}
                    <span className="font-normal text-background/50">·</span>
                    <span className="font-normal text-background/70">{t.headerSubtitle}</span>
                  </p>
                  <p className="text-[11px] text-background/65 flex items-center gap-1 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" />
                    {t.statusReply}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t.minimize}
                  className="p-1.5 rounded-md hover:bg-white/15"
                  data-testid="live-chat-minimize"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!session ? (
              <form
                onSubmit={startConversation}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                data-testid="live-chat-intro-form"
              >
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 px-4 py-4 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex items-start gap-3">
                    <WamdaAvatar size="sm" />
                    <div>
                      <p className="font-bold text-foreground mb-1 text-sm">{t.introTitle}</p>
                      <p>{t.introBody}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-foreground mb-2">{t.quickHeading}</p>
                  <div className="flex flex-wrap gap-2">
                    {t.quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setIntro(prompt)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] leading-snug transition-colors text-start ${
                          intro === prompt
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground/80 hover:border-primary/35 hover:bg-primary/5"
                        }`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {t.name} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    aria-required="true"
                    autoComplete="name"
                    placeholder={t.namePh}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    data-testid="live-chat-name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {t.whatsapp}
                  </label>
                  <PhoneInput
                    lang={lang}
                    value={whatsapp}
                    onChange={setWhatsapp}
                    testId="live-chat-whatsapp"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {t.message} <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    required
                    aria-required="true"
                    rows={3}
                    placeholder={t.messagePh}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    data-testid="live-chat-intro-message"
                  />
                </div>

                {error && (
                  <p className="text-xs text-destructive font-medium" data-testid="live-chat-error">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={starting}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                  data-testid="live-chat-start"
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.starting}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {t.start}
                    </>
                  )}
                </button>

                <p className="text-[10px] text-muted-foreground leading-relaxed text-center px-2">
                  {t.privacy}
                </p>
                <p className="text-[10px] text-primary font-medium text-center">{t.humanHandoff}</p>
              </form>
            ) : (
              <>
                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-muted/20"
                  data-testid="live-chat-messages"
                >
                  {messages.map((m) => (
                    <ChatBubble key={m.id} msg={m} lang={lang} t={t} />
                  ))}
                </div>

                {error && (
                  <p
                    className="px-3 py-1.5 text-xs text-destructive bg-destructive/10 font-medium text-center"
                    data-testid="live-chat-error"
                  >
                    {error}
                  </p>
                )}

                {threadStatus === "closed" ? (
                  <div className="border-t border-border p-3 bg-background">
                    <p className="text-xs text-muted-foreground mb-2 text-center">
                      {t.closed}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetSession}
                      className="w-full bg-primary text-primary-foreground rounded-xl py-2 text-sm font-bold"
                      data-testid="live-chat-reset"
                    >
                      {t.reset}
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={sendMessage}
                    className="border-t border-border p-2 bg-background flex items-end gap-2"
                  >
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={1}
                      placeholder={t.sendPh}
                      aria-label={t.sendPh}
                      className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-24"
                      data-testid="live-chat-input"
                    />
                    <button
                      type="submit"
                      disabled={sending || draft.trim().length < 1}
                      aria-label={t.send}
                      className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl p-2.5 transition-colors"
                      data-testid="live-chat-send"
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wamda: a brand-native speech spark rather than an animal mascot. */}
      {!open && (
        <motion.button
            type="button"
            onClick={onBubbleClick}
            aria-label={t.bubble}
            title={t.bubble}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
            className="relative flex flex-col items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
            data-testid="live-chat-bubble"
          >
            <span
              className="px-3.5 py-2 rounded-full bg-card text-foreground text-xs font-bold shadow-lg border border-primary/15 whitespace-nowrap relative"
              data-testid="live-chat-help-prompt"
            >
              {t.helpPrompt}
              <span
                className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-background border-b border-e border-border"
                aria-hidden
              />
            </span>
            <WamdaAvatar size="lg" />
            {unread > 0 && (
              <span
                className="absolute top-7 -end-1 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold flex items-center justify-center border-2 border-background"
                data-testid="live-chat-unread"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
        </motion.button>
      )}
    </div>
  );
}

function ChatBubble({
  msg,
  lang,
  t,
}: {
  msg: Message;
  lang: "ar" | "en";
  t: (typeof TEXT)[keyof typeof TEXT];
}) {
  if (msg.sender === "system") {
    return (
      <div className="text-center text-[11px] text-muted-foreground py-1">
        {msg.body}
      </div>
    );
  }
  const fromMe = msg.sender === "visitor";
  return (
    <div
      className={`flex ${fromMe ? "justify-end" : "justify-start"}`}
      data-testid={`chat-msg-${msg.sender}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
          fromMe
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border text-foreground rounded-bl-sm"
        }`}
      >
        {!fromMe && (
          <p className="text-[10px] font-bold text-primary mb-0.5">
            {t.teamLabel}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
        <p className="text-[10px] opacity-60 mt-1 flex items-center gap-1 justify-end">
          {formatTime(msg.createdAt, lang)}
          {fromMe && (
            msg.id.startsWith("tmp-") ? <Check className="w-3 h-3" /> : <CheckCheck className="w-3 h-3" />
          )}
        </p>
      </div>
    </div>
  );
}
