import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Loader2, ChevronLeft, Plus } from "lucide-react";

interface Contact { id: string; firstName: string | null; lastName: string | null; email: string; role: string | null }

interface Thread {
  id: string;
  subject: string;
  courseId: string | null;
  isBroadcast: boolean;
  lastMessageAt: string;
  lastReadAt: string | null;
}
interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}
interface Participant {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function StudentMessagesTab({ lang, currentUserId }: { lang: "ar" | "en"; currentUserId: string | null }) {
  const isRtl = lang === "ar";
  const apiBase = getApiBase();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [creating, setCreating] = useState(false);

  const openCompose = async () => {
    setShowCompose(true);
    if (contacts.length === 0) {
      const r = await fetch(`${apiBase}/messages/contacts`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); setContacts(d.contacts ?? []); }
    }
  };

  const createThread = async () => {
    if (!composeTo || !composeBody.trim()) return;
    setCreating(true);
    try {
      const r = await fetch(`${apiBase}/messages/threads`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUserId: composeTo,
          subject: composeSubject.trim() || (isRtl ? "رسالة جديدة" : "New message"),
          body: composeBody.trim(),
        }),
      });
      if (r.ok) {
        const d = await r.json();
        setShowCompose(false);
        setComposeTo(""); setComposeSubject(""); setComposeBody("");
        loadThreads();
        const newId = d.thread?.id ?? d.threadId;
        if (newId) openThread(newId);
      } else {
        const d = await r.json().catch(() => ({}));
        alert(d.error ?? (isRtl ? "تعذّر إنشاء المحادثة" : "Could not create conversation"));
      }
    } finally { setCreating(false); }
  };

  const loadThreads = useCallback(() => {
    fetch(`${apiBase}/messages/threads`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setThreads(d.threads ?? []))
      .catch(() => setThreads([]));
  }, [apiBase]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = async (id: string) => {
    setOpenId(id);
    setLoadingThread(true);
    try {
      const r = await fetch(`${apiBase}/messages/threads/${id}`, { credentials: "include" });
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages ?? []);
        setParticipants(d.participants ?? []);
      }
    } finally {
      setLoadingThread(false);
    }
  };

  const send = async () => {
    if (!openId || !draft.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`${apiBase}/messages/threads/${openId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      if (r.ok) {
        const d = await r.json();
        setMessages(prev => [...prev, d.message]);
        setDraft("");
        loadThreads();
      }
    } finally {
      setSending(false);
    }
  };

  const partName = (uid: string) => {
    const p = participants.find(x => x.userId === uid);
    if (!p) return isRtl ? "مستخدم" : "User";
    return [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email;
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {isRtl ? "الرسائل" : "Messages"}
          </h3>
          {!openId && !showCompose && (
            <button onClick={openCompose} className="text-sm font-bold inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white">
              <Plus className="w-4 h-4" />
              {isRtl ? "محادثة جديدة" : "New conversation"}
            </button>
          )}
        </div>

        {showCompose && !openId && (
          <div className="space-y-3 border border-border rounded-xl p-4 bg-muted/20 mb-4">
            <p className="font-bold text-sm">{isRtl ? "محادثة جديدة" : "New conversation"}</p>
            <select value={composeTo} onChange={(e) => setComposeTo(e.target.value)}
              className="w-full p-2 rounded-lg border border-border text-sm bg-card">
              <option value="">{isRtl ? "اختر المستلم..." : "Choose recipient..."}</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {[c.firstName, c.lastName].filter(Boolean).join(" ") || c.email} {c.role ? `(${c.role})` : ""}
                </option>
              ))}
            </select>
            <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)}
              placeholder={isRtl ? "الموضوع (اختياري)" : "Subject (optional)"}
              className="w-full p-2 rounded-lg border border-border text-sm" />
            <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)}
              placeholder={isRtl ? "اكتب رسالتك..." : "Write your message..."}
              className="w-full min-h-[80px] p-2 rounded-lg border border-border text-sm" />
            <div className="flex gap-2">
              <button onClick={createThread} disabled={creating || !composeTo || !composeBody.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isRtl ? "إرسال" : "Send"}
              </button>
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 rounded-lg border border-border text-sm">
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
            </div>
            {contacts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {isRtl ? "لا يوجد جهات اتصال متاحة. سجّل في دورة لمراسلة المدرّب." : "No contacts available. Enroll in a course to message a trainer."}
              </p>
            )}
          </div>
        )}

        {!openId && !showCompose && (
          <>
            {threads === null ? (
              <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : threads.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-10 h-10 text-primary/50" />
                </div>
                <p className="text-muted-foreground">{isRtl ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {threads.map(t => {
                  const unread = !t.lastReadAt || new Date(t.lastReadAt).getTime() < new Date(t.lastMessageAt).getTime();
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => openThread(t.id)}
                        className={`w-full text-start p-4 rounded-xl border ${unread ? "bg-primary/5 border-primary/30" : "border-border"} hover:bg-muted/30 transition-colors`}
                      >
                        <div className="flex items-center gap-2">
                          {unread && <span className="w-2 h-2 rounded-full bg-primary" />}
                          <p className="font-bold text-sm flex-1">{t.subject}</p>
                          {t.isBroadcast && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">
                              {isRtl ? "إعلان" : "broadcast"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(t.lastMessageAt).toLocaleString(isRtl ? "ar-SA" : undefined)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {openId && (
          <div className="space-y-3">
            <button onClick={() => setOpenId(null)} className="text-sm text-muted-foreground inline-flex items-center gap-1">
              <ChevronLeft className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
              {isRtl ? "العودة للمحادثات" : "Back to conversations"}
            </button>
            <div className="border border-border rounded-xl p-3 max-h-[400px] overflow-y-auto bg-muted/20 space-y-2">
              {loadingThread && <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>}
              {messages.map(m => {
                const mine = m.senderId === currentUserId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl ${mine ? "bg-primary text-white" : "bg-card border border-border"}`}>
                      {!mine && <p className="text-[10px] font-bold text-muted-foreground mb-1">{partName(m.senderId)}</p>}
                      <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                      <p className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                        {new Date(m.createdAt).toLocaleString(isRtl ? "ar-SA" : undefined)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {!loadingThread && messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">{isRtl ? "لا توجد رسائل" : "No messages yet"}</p>
              )}
            </div>
            <div className="flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={isRtl ? "اكتب رسالة..." : "Type a message..."}
                className="flex-1 min-h-[60px] p-2 rounded-lg border border-border text-sm"
              />
              <button
                onClick={send}
                disabled={sending || !draft.trim()}
                className="self-end px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isRtl ? "إرسال" : "Send"}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
