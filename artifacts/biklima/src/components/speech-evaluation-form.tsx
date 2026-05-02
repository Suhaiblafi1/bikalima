import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic2, Video, FileText, CheckCircle2, Send, Clock, Loader2 } from "lucide-react";
import type { Lang } from "../translations";

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

type Mode = "text" | "video";

type SpeechFormText = {
  badge: string;
  heading: string;
  sub: string;
  modeText: string;
  modeVideo: string;
  textPlaceholder: string;
  textHint: string;
  videoPlaceholder: string;
  videoHint: string;
  nameLabel: string;
  emailLabel: string;
  whatsappLabel: string;
  whatsappHint: string;
  submit: string;
  submitting: string;
  privacy: string;
  successHeading: string;
  successBody: string;
  successCta: string;
  errorMissing: string;
  errorContent: string;
  errorEmail: string;
  errorWhatsapp: string;
  errorVideoUrl: string;
  errorGeneric: string;
};

const TEXT: Record<Lang, SpeechFormText> = {
  ar: {
    badge: "تقييم مجاني",
    heading: "قيّم خطابك خلال ٦٠ ثانية",
    sub: "أرسل نصاً قصيراً أو رابط فيديو لخطابك، وسيصلك تقييم أوّلي من فريق بكلمة خلال ٤٨ ساعة.",
    modeText: "اكتب نص الخطاب",
    modeVideo: "أرسل رابط فيديو",
    textPlaceholder: "اكتب هنا الفقرة الأولى من خطابك أو فكرة عرضك (مثال: مقدمة، نقاط رئيسية، خاتمة)...",
    textHint: "حتى ٥٠٠٠ حرف.",
    videoPlaceholder: "https://youtu.be/... أو https://drive.google.com/...",
    videoHint: "ضع رابطاً مباشراً (يوتيوب، Drive، Vimeo، إلخ).",
    nameLabel: "الاسم الكامل",
    emailLabel: "البريد الإلكتروني",
    whatsappLabel: "رقم واتساب",
    whatsappHint: "اكتب الرقم مع رمز الدولة، مثال: 962790000000",
    submit: "أرسل للتقييم",
    submitting: "جارٍ الإرسال...",
    privacy: "بياناتك تُستخدم فقط للتواصل معك حول هذا التقييم.",
    successHeading: "وصلنا طلبك",
    successBody: "سيصلك تقييم أوّلي من فريق بكلمة خلال ٤٨ ساعة على بريدك أو رقم واتساب.",
    successCta: "أرسل طلباً آخر",
    errorMissing: "الرجاء تعبئة الاسم والبريد ورقم واتساب.",
    errorContent: "أرفق نص الخطاب أو رابط الفيديو لإكمال الطلب.",
    errorEmail: "البريد الإلكتروني غير صالح.",
    errorWhatsapp: "رقم واتساب قصير جداً.",
    errorVideoUrl: "رابط الفيديو غير صالح.",
    errorGeneric: "تعذّر إرسال الطلب، حاول مرة أخرى.",
  },
  en: {
    badge: "Free evaluation",
    heading: "Get your speech evaluated in 60 seconds",
    sub: "Send a short text or a video link of your speech and our team at Bikalima will send you an initial evaluation within 48 hours.",
    modeText: "Type your speech",
    modeVideo: "Send a video link",
    textPlaceholder: "Paste the first paragraph of your speech or your talk idea (e.g. opening, key points, conclusion)...",
    textHint: "Up to 5000 characters.",
    videoPlaceholder: "https://youtu.be/... or https://drive.google.com/...",
    videoHint: "Use a direct link (YouTube, Drive, Vimeo, etc).",
    nameLabel: "Full name",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp number",
    whatsappHint: "Include country code, e.g. 962790000000",
    submit: "Send for evaluation",
    submitting: "Sending...",
    privacy: "Your information is only used to contact you about this evaluation.",
    successHeading: "We received your request",
    successBody: "Our Bikalima team will send you an initial evaluation within 48 hours via email or WhatsApp.",
    successCta: "Send another request",
    errorMissing: "Please fill in your name, email, and WhatsApp number.",
    errorContent: "Attach a speech text or a video link to complete your request.",
    errorEmail: "Email address is invalid.",
    errorWhatsapp: "WhatsApp number is too short.",
    errorVideoUrl: "Video URL is invalid.",
    errorGeneric: "Could not submit your request — please try again.",
  },
};

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SpeechEvaluationForm({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [mode, setMode] = useState<Mode>("text");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [speechText, setSpeechText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setFullName("");
    setEmail("");
    setWhatsapp("");
    setSpeechText("");
    setVideoUrl("");
    setMode("text");
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    const mail = email.trim();
    const wa = whatsapp.trim();
    const txt = speechText.trim();
    const vid = videoUrl.trim();

    if (!name || !mail || !wa) {
      setError(t.errorMissing);
      return;
    }
    if (!EMAIL_RX.test(mail)) {
      setError(t.errorEmail);
      return;
    }
    if (wa.replace(/[^0-9]/g, "").length < 6) {
      setError(t.errorWhatsapp);
      return;
    }
    if (mode === "text" && !txt) {
      setError(t.errorContent);
      return;
    }
    if (mode === "video") {
      if (!vid) {
        setError(t.errorContent);
        return;
      }
      try {
        const u = new URL(vid);
        if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("scheme");
      } catch {
        setError(t.errorVideoUrl);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/speech-evaluation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          email: mail,
          whatsapp: wa,
          speechText: mode === "text" ? txt : "",
          videoUrl: mode === "video" ? vid : "",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? t.errorGeneric);
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="speech-evaluation"
      className="py-20 md:py-24 bg-gradient-to-b from-background via-secondary/30 to-background border-y border-border"
    >
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-4 text-sm">
            <Mic2 className="w-4 h-4" />
            {t.badge}
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">{t.heading}</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">{t.sub}</p>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4 }}
                className="p-8 md:p-12 flex flex-col items-center text-center gap-5"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="speech-eval-success-heading">
                    {t.successHeading}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">{t.successBody}</p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  {lang === "ar" ? "خلال 48 ساعة" : "Within 48 hours"}
                </div>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="rounded-full mt-2"
                  data-testid="button-speech-eval-reset"
                >
                  {t.successCta}
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="p-6 md:p-10 space-y-5"
              >
                {/* Mode tabs */}
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setMode("text")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      mode === "text"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="speech-eval-mode-text"
                  >
                    <FileText className="w-4 h-4" />
                    {t.modeText}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("video")}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      mode === "video"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="speech-eval-mode-video"
                  >
                    <Video className="w-4 h-4" />
                    {t.modeVideo}
                  </button>
                </div>

                {/* Content input */}
                {mode === "text" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="speech-text" className="text-sm font-medium">
                      {t.modeText}
                    </Label>
                    <Textarea
                      id="speech-text"
                      value={speechText}
                      onChange={(e) => setSpeechText(e.target.value.slice(0, 5000))}
                      placeholder={t.textPlaceholder}
                      rows={6}
                      className="resize-y rounded-xl"
                      data-testid="speech-eval-text"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t.textHint}</span>
                      <span>{speechText.length} / 5000</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="speech-video" className="text-sm font-medium">
                      {t.modeVideo}
                    </Label>
                    <Input
                      id="speech-video"
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={t.videoPlaceholder}
                      className="rounded-xl"
                      data-testid="speech-eval-video-url"
                    />
                    <p className="text-xs text-muted-foreground">{t.videoHint}</p>
                  </div>
                )}

                {/* Contact fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="speech-name" className="text-sm font-medium">{t.nameLabel}</Label>
                    <Input
                      id="speech-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value.slice(0, 120))}
                      className="rounded-xl"
                      autoComplete="name"
                      data-testid="speech-eval-name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="speech-email" className="text-sm font-medium">{t.emailLabel}</Label>
                    <Input
                      id="speech-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.slice(0, 200))}
                      className="rounded-xl"
                      autoComplete="email"
                      dir="ltr"
                      data-testid="speech-eval-email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="speech-whatsapp" className="text-sm font-medium">{t.whatsappLabel}</Label>
                  <Input
                    id="speech-whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.slice(0, 40))}
                    placeholder="962790000000"
                    className="rounded-xl"
                    autoComplete="tel"
                    dir="ltr"
                    data-testid="speech-eval-whatsapp"
                  />
                  <p className="text-xs text-muted-foreground">{t.whatsappHint}</p>
                </div>

                {error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3" data-testid="speech-eval-error">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-muted-foreground max-w-xs">{t.privacy}</p>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-8 disabled:opacity-60"
                    data-testid="button-speech-eval-submit"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 me-2 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 me-2" />
                        {t.submit}
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
