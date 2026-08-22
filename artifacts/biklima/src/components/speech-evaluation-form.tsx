import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/phone-input";
import { Mic2, CheckCircle2, Send, Clock, Loader2 } from "lucide-react";
import type { Lang } from "../translations";

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

type SpeechFormText = {
  badge: string;
  heading: string;
  sub: string;
  modeVideo: string;
  videoPlaceholder: string;
  videoHint: string;
  nameLabel: string;
  emailLabel: string;
  whatsappLabel: string;
  whatsappHint: string;
  submit: string;
  submitting: string;
  privacy: string;
  consentLabel: string;
  successHeading: string;
  successBody: string;
  successCta: string;
  errorMissing: string;
  errorContent: string;
  errorEmail: string;
  errorWhatsapp: string;
  errorVideoUrl: string;
  errorConsent: string;
  errorGeneric: string;
};

const TEXT: Record<Lang, SpeechFormText> = {
  ar: {
    badge: "تقييم مجاني",
    heading: "أرسل رابط خطابك لنقيّم مهاراتك",
    sub: "أرسل رابط فيديو لخطابك، وسيطّلع عليه فريق بكلمة ويرسل لك تقييماً أولياً خلال ٤٨ ساعة.",
    modeVideo: "أرسل رابط فيديو",
    videoPlaceholder: "https://youtu.be/... أو https://drive.google.com/...",
    videoHint: "ضع رابطاً مباشراً (يوتيوب، Drive، Vimeo، إلخ).",
    nameLabel: "الاسم الكامل",
    emailLabel: "البريد الإلكتروني",
    whatsappLabel: "رقم واتساب",
    whatsappHint: "اكتب الرقم مع رمز الدولة، مثال: 962790000000",
    submit: "أرسل للتقييم",
    submitting: "جارٍ الإرسال...",
    privacy: "بياناتك تُستخدم فقط للتواصل معك حول هذا التقييم.",
    consentLabel: "أوافق على أن يشاهد فريق بكلمة رابط الفيديو لغرض التقييم البشري، وعلى الاحتفاظ بالطلب لمدة لا تتجاوز 90 يوماً.",
    successHeading: "وصلنا طلبك",
    successBody: "سيصلك تقييم أوّلي من فريق بكلمة خلال ٤٨ ساعة على بريدك أو رقم واتساب.",
    successCta: "أرسل طلباً آخر",
    errorMissing: "الرجاء تعبئة الاسم والبريد ورقم واتساب.",
    errorContent: "أرفق رابط الفيديو لإكمال الطلب.",
    errorEmail: "البريد الإلكتروني غير صالح.",
    errorWhatsapp: "رقم واتساب قصير جداً.",
    errorVideoUrl: "رابط الفيديو غير صالح.",
    errorConsent: "يلزم الموافقة على مشاهدة الفيديو وسياسة الاحتفاظ قبل الإرسال.",
    errorGeneric: "تعذّر إرسال الطلب، حاول مرة أخرى.",
  },
  en: {
    badge: "Free evaluation",
    heading: "Send your speech video for a skills review",
    sub: "Send a video link of your speech. The Bikalima team will review it and send you an initial evaluation within 48 hours.",
    modeVideo: "Send a video link",
    videoPlaceholder: "https://youtu.be/... or https://drive.google.com/...",
    videoHint: "Use a direct link (YouTube, Drive, Vimeo, etc).",
    nameLabel: "Full name",
    emailLabel: "Email",
    whatsappLabel: "WhatsApp number",
    whatsappHint: "Include country code, e.g. 962790000000",
    submit: "Send for evaluation",
    submitting: "Sending...",
    privacy: "Your information is only used to contact you about this evaluation.",
    consentLabel: "I allow the Bikalima team to view this video for a human review and retain the request for no more than 90 days.",
    successHeading: "We received your request",
    successBody: "Our Bikalima team will send you an initial evaluation within 48 hours via email or WhatsApp.",
    successCta: "Send another request",
    errorMissing: "Please fill in your name, email, and WhatsApp number.",
    errorContent: "Attach a video link to complete your request.",
    errorEmail: "Email address is invalid.",
    errorWhatsapp: "WhatsApp number is too short.",
    errorVideoUrl: "Video URL is invalid.",
    errorConsent: "Please agree to the video review and retention policy before submitting.",
    errorGeneric: "Could not submit your request — please try again.",
  },
};

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SpeechEvaluationForm({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setFullName("");
    setEmail("");
    setWhatsapp("");
    setVideoUrl("");
    setPrivacyConsent(false);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    const mail = email.trim();
    const wa = whatsapp.trim();
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
    if (!vid) {
      setError(t.errorContent);
      return;
    }
    if (!privacyConsent) {
      setError(t.errorConsent);
      return;
    }
    try {
      const u = new URL(vid);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("scheme");
    } catch {
      setError(t.errorVideoUrl);
      return;
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
          videoUrl: vid,
          privacyConsent,
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
      className="py-12 md:py-16 bg-gradient-to-b from-background via-secondary/30 to-background border-y border-border"
    >
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium mb-3 text-xs">
            <Mic2 className="w-3.5 h-3.5" />
            {t.badge}
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">{t.heading}</h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">{t.sub}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
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
                className="p-4 md:p-6 space-y-3.5"
              >
                <div className="space-y-1">
                  <Input
                    id="speech-video"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={t.videoPlaceholder}
                    className="rounded-xl text-sm"
                    inputMode="url"
                    aria-label={t.modeVideo}
                    aria-required="true"
                    required
                    data-testid="speech-eval-video-url"
                  />
                  <p className="text-[11px] text-muted-foreground">{t.videoHint}</p>
                </div>

                {/* Contact fields — 3 columns on desktop for compactness */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    id="speech-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.slice(0, 120))}
                    placeholder={t.nameLabel}
                    className="rounded-xl text-sm"
                    autoComplete="name"
                    type="text"
                    aria-label={t.nameLabel}
                    aria-required="true"
                    required
                    data-testid="speech-eval-name"
                  />
                  <Input
                    id="speech-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.slice(0, 200))}
                    placeholder={t.emailLabel}
                    className="rounded-xl text-sm"
                    autoComplete="email"
                    inputMode="email"
                    dir="ltr"
                    aria-label={t.emailLabel}
                    aria-required="true"
                    required
                    data-testid="speech-eval-email"
                  />
                </div>

                <div>
                  <PhoneInput
                    id="speech-whatsapp"
                    lang={lang}
                    value={whatsapp}
                    onChange={setWhatsapp}
                    ariaLabel={t.whatsappLabel}
                    required
                    testId="speech-eval-whatsapp"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2" data-testid="speech-eval-error">
                    {error}
                  </div>
                )}

                <label className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} required className="mt-0.5" />
                  <span>{t.consentLabel}</span>
                </label>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-muted-foreground line-clamp-2 flex-1">{t.privacy}</p>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-5 h-10 text-sm disabled:opacity-60 shrink-0"
                    data-testid="button-speech-eval-submit"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 me-1.5" />
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
