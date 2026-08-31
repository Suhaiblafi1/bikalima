import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { CheckCircle2, Loader2, Send, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-fetch";
import { useLang } from "@/hooks/useLang";

/**
 * "Suggest a speech you liked, and tell me what you thought of it."
 *
 * The link is required and the opinion is not. Someone who has just watched
 * something good will paste a link in five seconds; asking them to write a
 * paragraph first is how you get no links at all. The placeholder shows what a
 * useful opinion looks like rather than describing it, because an example is
 * shorter than an instruction and people copy its shape.
 *
 * Signing in is required, and the box says so before it is filled in rather
 * than after: nothing is worse than typing an opinion and then being told to
 * make an account.
 */
export function SpeechSuggestionBox() {
  const { lang } = useLang();
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const isRtl = lang === "ar";

  const [videoUrl, setVideoUrl] = useState("");
  const [opinion, setOpinion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !videoUrl.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch("/speech-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: videoUrl.trim(), opinion: opinion.trim() || undefined }),
      });
      if (res.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent("/library")}`);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || (isRtl ? "تعذّر الإرسال. حاول مرة أخرى." : "Could not send. Please try again."));
        return;
      }
      setDone(true);
      setVideoUrl("");
      setOpinion("");
    } catch {
      setError(isRtl ? "تعذّر الاتصال. حاول مرة أخرى." : "Connection failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-t border-border bg-secondary/20 py-14 md:py-20" data-testid="speech-suggestion">
      <div className="container mx-auto max-w-2xl px-6">
        <div className="mb-6 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
            <Youtube className="h-4 w-4" aria-hidden />
            {isRtl ? "شاركنا" : "Share with us"}
          </span>
          <h2 className="font-serif text-2xl font-bold md:text-3xl">
            {isRtl ? "اقترح خطاباً أعجبك، وأخبرنا برأيك فيه" : "Suggest a speech you liked, and tell us why"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {isRtl
              ? "إن صادفت خطاباً على يوتيوب علّق في ذهنك، ضع رابطه هنا. وإن أردت أن تكتب ما الذي أعجبك فيه فذلك يفيد غيرك أكثر — وقد نُضيفه إلى المكتبة."
              : "If a talk on YouTube stayed with you, drop the link here. If you add what struck you about it, that helps the next reader more — and it may join the library."}
          </p>
        </div>

        {done ? (
          <div
            className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success-muted p-5"
            data-testid="speech-suggestion-done"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="font-bold text-success">{isRtl ? "وصلنا اقتراحك" : "We have your suggestion"}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                {isRtl
                  ? "سنشاهده. وإن كان فيه ما يستحقّ الدراسة أضفناه إلى المكتبة مع تحليله."
                  : "We will watch it. If there is something worth studying in it, it will join the library with an analysis."}
              </p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="mt-3 text-sm font-bold text-success underline underline-offset-2"
                data-testid="speech-suggestion-again"
              >
                {isRtl ? "اقترح خطاباً آخر" : "Suggest another"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div>
              <label htmlFor="suggestion-url" className="mb-1.5 block text-sm font-bold">
                {isRtl ? "رابط الخطاب" : "Link to the speech"}
              </label>
              <Input
                id="suggestion-url"
                dir="ltr"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="text-start"
                data-testid="speech-suggestion-url"
              />
            </div>

            <div>
              <label htmlFor="suggestion-opinion" className="mb-1.5 block text-sm font-bold">
                {isRtl ? "رأيك فيه" : "What you thought of it"}
                <span className="ms-2 text-xs font-medium text-muted-foreground">
                  {isRtl ? "اختياري" : "optional"}
                </span>
              </label>
              <textarea
                id="suggestion-opinion"
                rows={3}
                value={opinion}
                onChange={(e) => setOpinion(e.target.value.slice(0, 4000))}
                placeholder={
                  isRtl
                    ? "مثال: افتتاحيته سؤال بقي معي بعد انتهاء الخطاب، ووقف صامتاً ثانيتين قبل أن يجيب عنه."
                    : "For example: he opened with a question that stayed with me, then stood silent for two seconds before answering it."
                }
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary"
                data-testid="speech-suggestion-opinion"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive" data-testid="speech-suggestion-error">
                {error}
              </p>
            )}

            {!isLoading && !isAuthenticated ? (
              <div className="rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                {isRtl ? "الاقتراح باسمك، فسجّل الدخول أولاً." : "Suggestions carry your name, so sign in first."}{" "}
                <button
                  type="button"
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent("/library")}`)}
                  className="font-bold text-primary underline underline-offset-2"
                  data-testid="speech-suggestion-login"
                >
                  {isRtl ? "تسجيل الدخول" : "Sign in"}
                </button>
              </div>
            ) : (
              <Button
                type="submit"
                disabled={busy || !videoUrl.trim()}
                className="w-full gap-2 rounded-xl py-5 font-bold"
                data-testid="speech-suggestion-submit"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                {busy ? (isRtl ? "جارٍ الإرسال…" : "Sending…") : isRtl ? "أرسل اقتراحك" : "Send suggestion"}
              </Button>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
