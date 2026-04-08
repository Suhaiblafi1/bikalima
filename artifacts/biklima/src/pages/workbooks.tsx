import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BookOpen, Lightbulb, Mic2, Heart, Users, Star,
  Feather, Sparkles, Globe, ShoppingCart, FileText, Download, Printer,
  Package, Minus, Plus, X, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { T, type Lang } from "../translations";
import { useLang } from "../hooks/useLang";
import { programs, getLocalizedProgram, WORKBOOK_PRICES } from "../programsData";

type WisdomArticle = { source: string; category: string; icon: React.ReactNode; quote: string; body: string };

const wisdomArticles: Record<Lang, WisdomArticle[]> = {
  ar: [
    { source: "كراسة المتدرب", category: "النطاق الذهني", icon: <Lightbulb className="w-5 h-5" />, quote: "الثقة لا تُعطى، تُبنى.", body: "وبناؤها يبدأ من أعمق نقطة في الداخل — من صورتك عن نفسك لحظة الكلام. كثيرون يبحثون عن تقنيات الإلقاء وينسون أن المشكلة الحقيقية ليست في اللسان بل في العقل. قبل أن تُصلح ما يسمعه الجمهور، أصلح ما تسمعه أنت من نفسك." },
    { source: "كراسة المتدرب", category: "النطاق اللفظي", icon: <Mic2 className="w-5 h-5" />, quote: "رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي، وَاحْلُلْ عُقْدَةً مِن لِّسَانِي يَفْقَهُوا قَوْلِي.", body: "حتى الأنبياء دعوا الله أن يُيسّر لهم البيان. اللسان الفصيح دعوة قبل أن يكون مهارة — طلبها موسى عليه السلام حين أُرسل. فإن كان أكلم البشر وأعظمهم رسالةً قد طلب من ربه أن يُحلّ عقدة لسانه، فلا عيب في أن تطلب أنت أيضاً أن يُيسّر الله لك الكلمة." },
    { source: "برنامج المعلمين وأولياء الأمور", category: "الفجوة بين الأجيال", icon: <Heart className="w-5 h-5" />, quote: "٧٠٪ من الناس يعانون من رهاب التحدث.", body: "والسبب الأول ليس الجمهور، بل البيئة التي نشأوا فيها. كل طفل خجول كان يوماً طفلاً لم يُتَح له أن يُسمع بشكل صحيح. الخوف من الكلام لا يُولد مع الإنسان — بل يُزرع." },
    { source: "برنامج المعلمين وأولياء الأمور", category: "دور المربّي", icon: <Users className="w-5 h-5" />, quote: "الكلمة التي تقولها لطفل في لحظة الحاجة قد تُشكّل صوته طوال حياته — أو تُصمته.", body: "لا يحتاج الطفل مدرباً فصيحاً فقط، بل بيئة تؤمن بأن صوته يستحق أن يُسمع. المربّي الواعي لا يصحح فقط، بل يفتح مساحة للتعبير دون خوف." },
    { source: "كراسة الخطيب الصغير", category: "فلسفة التعليم", icon: <Star className="w-5 h-5" />, quote: "الطفل الذي يتعلم الكلام بثقة اليوم هو القائد الذي يُغيّر غرفته غداً.", body: "الخطابة للأطفال ليست نشاطاً إضافياً، هي استثمار في شخصية كاملة. الطفل الذي يتعلم أن يُعبّر عن فكرة بوضوح يكتسب أكثر من مهارة — يكتسب شجاعة اجتماعية وثقة داخلية." },
    { source: "برنامج المدرب المعتمد", category: "رسالة المدرب", icon: <Feather className="w-5 h-5" />, quote: "المدرب الحقيقي لا يُعلّم الناس كيف يتكلمون — بل يُعيد إليهم الإيمان بأن ما يقولونه يستحق أن يُسمع.", body: "حين تصبح مدرباً، تتضاعف مسؤوليتك: أنت تصنع أثراً ثم توكّله لآخرين ليصنعوا أثراً من بعدك." },
    { source: "كراسة المتدرب", category: "الخوف وقوة الكلام", icon: <Sparkles className="w-5 h-5" />, quote: "الخوف من الكلام ليس عدوك — إنه إشارة إلى أن ما تقوله مهم.", body: "التوتر قبل الخطاب ليس ضعفاً — بل إشعال. الجسم يُعبّئ طاقة لأن اللحظة مهمة. المتحدثون المحترفون لا يتخلصون من الخوف بل يُحوّلونه." },
    { source: "برنامج المدرب المعتمد", category: "الصوت والهوية", icon: <Globe className="w-5 h-5" />, quote: "صوتك هو أكثر من أداة — إنه توقيعك في كل غرفة تدخلها.", body: "لا يوجد صوتان متطابقان في العالم. صوتك يحمل تاريخك، وثقافتك، ورؤيتك للعالم. لذلك التدريب على الخطابة ليس عن تقليد الآخرين — بل عن اكتشاف نسختك الأقوى." },
  ],
  en: [
    { source: "The Trainee's Workbook", category: "The Mental Domain", icon: <Lightbulb className="w-5 h-5" />, quote: "Confidence is not given — it is built.", body: "And it begins from the deepest point inside — from the image you hold of yourself in the moment of speaking. Many search for delivery techniques and forget that the real problem is not in the tongue but in the mind." },
    { source: "The Trainee's Workbook", category: "The Verbal Domain", icon: <Mic2 className="w-5 h-5" />, quote: "Even the greatest of prophets sought ease of articulation.", body: "Public speaking is a calling before it is a skill — a gift worth asking for from above. An eloquent tongue is not merely a rhetorical tool — it is a bridge between the heart and the world." },
    { source: "Educators & Parents Program", category: "The Generational Gap", icon: <Heart className="w-5 h-5" />, quote: "70% of people suffer from the fear of public speaking.", body: "And the primary cause is not the audience — it is the environment they grew up in. Every shy child was once a child who was never properly heard." },
    { source: "Educators & Parents Program", category: "The Educator's Role", icon: <Users className="w-5 h-5" />, quote: "The word you say to a child in their moment of need may shape their voice for life — or silence it.", body: "A child doesn't need just an eloquent trainer — they need an environment that believes their voice deserves to be heard." },
    { source: "The Young Speaker's Workbook", category: "Philosophy of Education", icon: <Star className="w-5 h-5" />, quote: "The child who learns to speak with confidence today is the leader who changes the room tomorrow.", body: "Public speaking for children is not an extra-curricular activity — it is an investment in a complete personality." },
    { source: "The Certified Trainer Program", category: "The Trainer's Mission", icon: <Feather className="w-5 h-5" />, quote: "The real trainer doesn't teach people how to speak — they restore their belief that what they say deserves to be heard.", body: "When you become a trainer, your responsibility multiplies: you create impact and then entrust it to others to create impact after you." },
    { source: "The Trainee's Workbook", category: "Fear and the Power of Words", icon: <Sparkles className="w-5 h-5" />, quote: "Fear of speaking is not your enemy — it is a signal that what you have to say matters.", body: "Nervousness before a speech is not weakness — it is ignition. The body mobilizes energy because the moment is important. Professional speakers don't eliminate fear — they transform it." },
    { source: "The Certified Trainer Program", category: "Voice and Identity", icon: <Globe className="w-5 h-5" />, quote: "Your voice is more than a tool — it is your signature in every room you enter.", body: "No two voices in the world are identical. Your voice carries your history, your culture, and your worldview. That is why public speaking training is not about imitating others — it's about discovering your strongest version." },
  ],
  fr: [
    { source: "Le Cahier du Stagiaire", category: "Le Domaine Mental", icon: <Lightbulb className="w-5 h-5" />, quote: "La confiance ne se donne pas — elle se construit.", body: "Et cela commence du point le plus profond à l'intérieur — de l'image que vous avez de vous-même au moment de parler. Beaucoup cherchent des techniques d'élocution et oublient que le vrai problème n'est pas dans la langue mais dans l'esprit." },
    { source: "Le Cahier du Stagiaire", category: "Le Domaine Verbal", icon: <Mic2 className="w-5 h-5" />, quote: "Même les plus grands prophètes ont demandé la facilité d'expression.", body: "Parler en public est un appel avant d'être une compétence — un don qui mérite d'être sollicité. Une langue éloquente n'est pas seulement un outil rhétorique — c'est un pont entre le cœur et le monde." },
    { source: "Programme Enseignants & Parents", category: "Le Fossé Générationnel", icon: <Heart className="w-5 h-5" />, quote: "70% des gens souffrent de la peur de parler en public.", body: "La cause principale n'est pas le public — c'est l'environnement dans lequel ils ont grandi. Chaque enfant timide était autrefois un enfant qui n'avait jamais été correctement entendu." },
    { source: "Programme Enseignants & Parents", category: "Le Rôle de l'Éducateur", icon: <Users className="w-5 h-5" />, quote: "Le mot que vous dites à un enfant dans son moment de besoin peut façonner sa voix pour la vie — ou la faire taire.", body: "Un enfant n'a pas seulement besoin d'un formateur éloquent — il a besoin d'un environnement qui croit que sa voix mérite d'être entendue." },
    { source: "Le Cahier du Jeune Orateur", category: "Philosophie de l'Éducation", icon: <Star className="w-5 h-5" />, quote: "L'enfant qui apprend à parler avec confiance aujourd'hui est le leader qui change la salle demain.", body: "La prise de parole pour les enfants n'est pas une activité extrascolaire — c'est un investissement dans une personnalité complète." },
    { source: "Programme Formateur Certifié", category: "La Mission du Formateur", icon: <Feather className="w-5 h-5" />, quote: "Le vrai formateur n'apprend pas aux gens à parler — il restaure leur croyance que ce qu'ils disent mérite d'être entendu.", body: "Quand vous devenez formateur, votre responsabilité se multiplie : vous créez un impact et le confiez ensuite à d'autres pour créer un impact après vous." },
    { source: "Le Cahier du Stagiaire", category: "La Peur et le Pouvoir des Mots", icon: <Sparkles className="w-5 h-5" />, quote: "La peur de parler n'est pas votre ennemi — c'est un signal que ce que vous avez à dire est important.", body: "Le trac avant un discours n'est pas une faiblesse — c'est une allumette. Le corps mobilise de l'énergie parce que le moment est important. Les orateurs professionnels n'éliminent pas la peur — ils la transforment." },
    { source: "Programme Formateur Certifié", category: "La Voix et l'Identité", icon: <Globe className="w-5 h-5" />, quote: "Votre voix est plus qu'un outil — c'est votre signature dans chaque salle où vous entrez.", body: "Aucune voix au monde n'est identique. Votre voix porte votre histoire, votre culture et votre vision du monde. C'est pourquoi la formation à la prise de parole ne consiste pas à imiter les autres — mais à découvrir votre version la plus forte." },
  ],
};

type CurrencyConfig = { code: string; symbol: string; name: string; nameEn: string; rate: number };
const CURRENCIES: Record<string, CurrencyConfig> = {
  DEFAULT: { code: "USD", symbol: "$",   name: "دولار أمريكي", nameEn: "USD $", rate: 1.41 },
  JO:      { code: "JOD", symbol: "د.أ", name: "دينار أردني",  nameEn: "JOD د.أ", rate: 1 },
  SA:      { code: "SAR", symbol: "ر.س", name: "ريال سعودي",  nameEn: "SAR ر.س", rate: 7.92 },
  AE:      { code: "AED", symbol: "د.إ", name: "درهم إماراتي", nameEn: "AED د.إ", rate: 7.77 },
  KW:      { code: "KWD", symbol: "د.ك", name: "دينار كويتي", nameEn: "KWD د.ك", rate: 0.69 },
  QA:      { code: "QAR", symbol: "ر.ق", name: "ريال قطري",  nameEn: "QAR ر.ق", rate: 7.73 },
  EG:      { code: "EGP", symbol: "ج.م", name: "جنيه مصري",  nameEn: "EGP ج.م", rate: 47.0 },
  MA:      { code: "MAD", symbol: "د.م", name: "درهم مغربي",  nameEn: "MAD د.م", rate: 10.2 },
};
const CURRENCY_ORDER = ["DEFAULT","JO","SA","AE","KW","QA","EG","MA"];

function detectCurrencyKey(): string {
  try {
    const stored = localStorage.getItem("biklima-currency");
    if (stored && CURRENCIES[stored]) return stored;
  } catch {}
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const tzMap: Record<string, string> = {
    "Asia/Amman": "JO", "Asia/Riyadh": "SA", "Asia/Dubai": "AE",
    "Asia/Kuwait": "KW", "Asia/Qatar": "QA", "Africa/Cairo": "EG",
    "Africa/Casablanca": "MA",
  };
  return tzMap[tz] || "DEFAULT";
}

function useCurrency() {
  const [currencyKey, setCurrencyKeyState] = useState<string>(detectCurrencyKey);
  const currency = CURRENCIES[currencyKey] ?? CURRENCIES.DEFAULT;
  const setCurrencyKey = useCallback((key: string) => {
    setCurrencyKeyState(key);
    try { localStorage.setItem("biklima-currency", key); } catch {}
  }, []);
  const format = useCallback(
    (jodPrice: number) => {
      const converted = Math.round(jodPrice * currency.rate);
      return `${converted} ${currency.symbol}`;
    },
    [currency],
  );
  return { currency, currencyKey, setCurrencyKey, format };
}

export default function WorkbooksPage() {
  const { toast } = useToast();
  const { lang, switchLang, dir } = useLang();
  const t = T[lang];
  const { format: formatPrice, currency, currencyKey, setCurrencyKey } = useCurrency();

  const [wisdomIndex, setWisdomIndex] = useState(0);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [selectedWorkbook, setSelectedWorkbook] = useState<ReturnType<typeof getLocalizedProgram> | null>(null);
  const [wbQuantity, setWbQuantity] = useState(1);
  const [wbFormat, setWbFormat] = useState<"pdf" | "print">("pdf");
  const [wbDeliveryAddress, setWbDeliveryAddress] = useState("");
  const [wbBuyerName, setWbBuyerName] = useState("");
  const [wbBuyerPhone, setWbBuyerPhone] = useState("");
  const [wbBuyerEmail, setWbBuyerEmail] = useState("");
  const [wbSubmitting, setWbSubmitting] = useState(false);
  const [wbOrderSuccess, setWbOrderSuccess] = useState<{ name: string; title: string; format: string; qty: number; total: string } | null>(null);

  const articles = wisdomArticles[lang] ?? wisdomArticles.ar;

  const langButtons: { key: Lang; label: string }[] = [
    { key: "ar", label: "ع" },
    { key: "en", label: "EN" },
  ];

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  useEffect(() => {
    const iv = setInterval(() => setWisdomIndex(i => (i + 1) % articles.length), 7000);
    return () => clearInterval(iv);
  }, [articles.length]);

  const handleWorkbookOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setWbSubmitting(true);
    try {
      const base = import.meta.env.BASE_URL || "/";
      const apiBase = base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
      const res = await fetch(`${apiBase}/workbook-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbookId: selectedWorkbook?.id,
          workbookTitle: selectedWorkbook?.workbook.title,
          quantity: wbQuantity,
          format: wbFormat,
          deliveryAddress: wbFormat === "print" ? wbDeliveryAddress : "",
          buyerName: wbBuyerName,
          buyerPhone: wbBuyerPhone,
          buyerEmail: wbBuyerEmail,
          unitPrice: WORKBOOK_PRICES[selectedWorkbook?.id as keyof typeof WORKBOOK_PRICES],
          lang,
          currencyCode: currency.code,
          displayUnitPrice: formatPrice(WORKBOOK_PRICES[selectedWorkbook?.id as keyof typeof WORKBOOK_PRICES] ?? 0),
          displayTotal: formatPrice((WORKBOOK_PRICES[selectedWorkbook?.id as keyof typeof WORKBOOK_PRICES] ?? 0) * wbQuantity),
        }),
      });
      if (!res.ok) throw new Error("server_error");
      const wb = selectedWorkbook;
      const up = WORKBOOK_PRICES[wb?.id as keyof typeof WORKBOOK_PRICES] ?? 0;
      setWbOrderSuccess({
        name: wbBuyerName,
        title: wb?.workbook.title ?? "",
        format: wbFormat,
        qty: wbQuantity,
        total: formatPrice(up * wbQuantity),
      });
    } catch {
      toast({ title: lang === "ar" ? "حدث خطأ" : "Something went wrong", description: lang === "ar" ? "يرجى المحاولة مرة أخرى" : "Please try again later", variant: "destructive" });
    } finally {
      setWbSubmitting(false);
    }
  };

  const base = import.meta.env.BASE_URL || "/";
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden" dir={dir}>
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border py-3 shadow-sm">
        <div className="container mx-auto px-6 flex items-center justify-between gap-4">
          {/* Back button + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(base)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
            >
              {dir === "rtl"
                ? <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                : <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />}
              {lang === "ar" ? "الرئيسية" : "Home"}
            </button>
            <span className="text-border">|</span>
            <span className="logo-biklima text-3xl text-primary tracking-tight leading-none">بكلمة</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-px border border-border rounded-full overflow-hidden">
              {langButtons.map(({ key, label }) => (
                <button key={key} onClick={() => switchLang(key)} className={`px-3 py-1.5 text-xs font-bold transition-colors ${lang === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
            <div className="relative">
              <button onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-bold hover:bg-secondary/40 transition-colors">
                <span>{currency.symbol}</span>
                <span className="text-muted-foreground">{currency.code}</span>
              </button>
              {currencyMenuOpen && (
                <div className="absolute top-full mt-1 end-0 bg-card border border-border rounded-xl shadow-xl z-50 min-w-[130px] py-1 overflow-hidden">
                  {CURRENCY_ORDER.map(key => (
                    <button key={key} onClick={() => { setCurrencyKey(key); setCurrencyMenuOpen(false); }} className={`w-full px-4 py-2 text-xs text-start hover:bg-secondary/50 flex items-center justify-between gap-2 ${key === currencyKey ? "font-bold text-primary bg-primary/5" : ""}`}>
                      <span>{CURRENCIES[key].symbol}</span>
                      <span>{CURRENCIES[key].code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── WISDOM CAROUSEL ── */}
      <section className="py-16 bg-secondary/10 border-y border-border overflow-hidden">
        <div className="container mx-auto px-6 mb-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-6 text-sm">
              <BookOpen className="w-4 h-4" />{t.wisdom.badge}
            </div>
            <h2 className="font-serif text-4xl font-bold mb-6">{t.wisdom.heading}</h2>
            <p className="text-xl text-muted-foreground">{t.wisdom.sub}</p>
          </div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={wisdomIndex}
              initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border/60 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 start-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {articles[wisdomIndex]?.icon}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">{articles[wisdomIndex]?.source}</div>
                    <div className="text-sm font-bold text-primary">{articles[wisdomIndex]?.category}</div>
                  </div>
                </div>
                <blockquote className="font-serif text-xl md:text-2xl font-bold text-foreground mb-6 leading-relaxed border-s-4 border-primary ps-5">
                  {articles[wisdomIndex]?.quote}
                </blockquote>
                <p className="text-muted-foreground leading-relaxed">{articles[wisdomIndex]?.body}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setWisdomIndex(i => (i - 1 + articles.length) % articles.length)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
              {dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <div className="flex gap-1.5">
              {articles.map((_, i) => (
                <button key={i} onClick={() => setWisdomIndex(i)} className={`rounded-full transition-all duration-300 ${i === wisdomIndex ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-primary/40"}`} />
              ))}
            </div>
            <button onClick={() => setWisdomIndex(i => (i + 1) % articles.length)} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
              {dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* ── WORKBOOKS STORE ── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="font-serif text-4xl font-bold mb-6">{t.workbooks.heading}</h2>
            <p className="text-xl text-muted-foreground">{t.workbooks.sub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((prog, i) => {
              const lp = getLocalizedProgram(prog, lang);
              const price = WORKBOOK_PRICES[prog.id as keyof typeof WORKBOOK_PRICES];
              const hasWorkbook = !!prog.workbook;
              if (!hasWorkbook) return null;
              return (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`bg-card border rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-border`}
                >
                  <div className={`relative aspect-[16/7] overflow-hidden`}>
                    <img src={lp.image} alt={lp.workbook.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${lp.accentColor} opacity-60 mix-blend-multiply`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 start-4 end-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold mb-2">
                        <FileText className="w-3 h-3" />{lp.role}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white">{lp.workbook.title}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{lp.workbook.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {lp.modules.slice(0, 4).map((mod, mi) => (
                        <span key={mi} className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground border border-border">
                          {mod}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div>
                        <div className="text-xs text-muted-foreground">{t.workbooks.priceLabel}</div>
                        <div className="text-2xl font-bold text-primary">{formatPrice(price ?? 0)}</div>
                      </div>
                      <Button
                        onClick={() => { setSelectedWorkbook(lp); setWbQuantity(1); setWbFormat("pdf"); setWbDeliveryAddress(""); setWbBuyerName(""); setWbBuyerPhone(""); setWbBuyerEmail(""); setWbOrderSuccess(null); }}
                        className="rounded-full px-6 gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />{t.workbooks.orderBtn}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-foreground text-background py-10 text-center">
        <div className="container mx-auto px-6">
          <div className="logo-biklima text-4xl text-primary mb-2">بكلمة</div>
          <p className="text-background/50 text-sm">{t.footer.copyright}</p>
          <a href={base} className="inline-flex items-center gap-2 mt-4 text-sm text-background/60 hover:text-background transition-colors">
            {dir === "rtl" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
          </a>
        </div>
      </footer>

      {/* ── WORKBOOK ORDER MODAL ── */}
      <AnimatePresence>
        {selectedWorkbook && (() => {
          const wb = selectedWorkbook;
          const unitPrice = WORKBOOK_PRICES[wb.id as keyof typeof WORKBOOK_PRICES];
          const totalPrice = (unitPrice ?? 0) * wbQuantity;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setSelectedWorkbook(null); setWbOrderSuccess(null); }} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative z-10 border border-border">
                <button aria-label="Close" onClick={() => { setSelectedWorkbook(null); setWbOrderSuccess(null); }} className="absolute top-6 end-6 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-white transition-colors z-20 shadow-sm"><X className="w-5 h-5" /></button>

                <div className="relative aspect-[21/6] overflow-hidden rounded-t-[2rem]">
                  <img src={wb.image} alt={wb.workbook.title} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${wb.accentColor} opacity-75 mix-blend-multiply`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3"><FileText className="w-3.5 h-3.5" />{wb.role}</div>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-2">{wb.workbook.title}</h2>
                    <p className="text-white/80 text-sm max-w-xl">{wb.workbook.description}</p>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <AnimatePresence mode="wait">
                    {wbOrderSuccess ? (
                      <motion.div key="wb-success" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.45, ease: "easeOut" }} className="flex flex-col items-center justify-center text-center py-6 gap-7 min-h-[420px]">
                        <div className="relative">
                          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }} className="relative w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-xl animate-pulse" />
                            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl"><span className="text-5xl">📚</span></div>
                          </motion.div>
                          {["-top-3 -start-3", "-top-2 end-0", "bottom-0 -start-4", "-bottom-2 end-2"].map((pos, i) => (
                            <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 260 }} className={`absolute ${pos} w-5 h-5 rounded-full bg-accent/70 flex items-center justify-center text-[10px]`}>✨</motion.div>
                          ))}
                        </div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                          <h3 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{lang === "ar" ? `أهلاً ${wbOrderSuccess.name}! 🎉` : `Thank you, ${wbOrderSuccess.name}! 🎉`}</h3>
                          <p className="text-xl font-semibold text-primary">{lang === "ar" ? "طلبك في طريقه إليك ✨" : "Your order is on its way ✨"}</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-primary/5 border border-primary/20 rounded-2xl px-7 py-5 text-sm w-full max-w-md">
                          <p className="font-bold text-foreground mb-3 text-base flex items-center gap-2 justify-center"><span>🧾</span>{lang === "ar" ? "ملخص الطلب" : "Order Summary"}</p>
                          <div className="space-y-2 text-muted-foreground text-start">
                            <div className="flex justify-between"><span>{lang === "ar" ? "الكراسة" : "Workbook"}</span><span className="font-semibold text-foreground truncate max-w-[55%] text-end">{wbOrderSuccess.title}</span></div>
                            <div className="flex justify-between"><span>{lang === "ar" ? "الصيغة" : "Format"}</span><span className="font-semibold text-foreground">{wbOrderSuccess.format === "pdf" ? (lang === "ar" ? "PDF رقمي" : "Digital PDF") : (lang === "ar" ? "مطبوعة" : "Printed")}</span></div>
                            <div className="flex justify-between"><span>{lang === "ar" ? "الكمية" : "Qty"}</span><span className="font-semibold text-foreground">{wbOrderSuccess.qty}</span></div>
                            <div className="flex justify-between border-t border-primary/20 pt-2 mt-2"><span className="font-bold text-primary">{lang === "ar" ? "المجموع" : "Total"}</span><span className="font-bold text-primary text-lg">{wbOrderSuccess.total}</span></div>
                          </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="max-w-sm">
                          <p className="text-muted-foreground leading-relaxed text-sm italic">{lang === "ar" ? "\"الكلمة الصادقة تصل أبعد من ألف خطاب مزخرف.\" — سنتواصل معك قريباً على بريدك الإلكتروني." : "\"An honest word travels farther than a thousand polished speeches.\" — We'll be in touch soon."}</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="flex flex-col sm:flex-row gap-3">
                          <a href={`https://wa.me/97455377065?text=${encodeURIComponent(lang === "ar" ? `السلام عليكم، أنا ${wbOrderSuccess.name} وأودّ الاستفسار عن طلب كراسة بكلمة.` : `Hello, I'm ${wbOrderSuccess.name} and I'd like to ask about my Bikalima workbook order.`)}`} target="_blank" className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold px-7 py-3 rounded-full text-sm transition-colors shadow-lg">
                            <span>💬</span>{lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
                          </a>
                          <button onClick={() => { setSelectedWorkbook(null); setWbOrderSuccess(null); }} className="inline-flex items-center justify-center gap-2 border border-border rounded-full px-7 py-3 text-sm font-medium hover:bg-secondary/40 transition-colors">{lang === "ar" ? "إغلاق" : "Close"}</button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div key="wb-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                        <div className="bg-gradient-to-br from-primary/5 to-secondary/20 rounded-2xl border border-border p-6 md:p-8 mb-8 flex flex-col sm:flex-row items-center gap-6">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${wb.accentColor} text-white flex items-center justify-center shadow-lg shrink-0`}><Download className="w-7 h-7" /></div>
                          <div className="flex-1 text-center sm:text-start">
                            <h3 className="font-bold text-lg mb-1">{t.workbooks.samplePdfBtn}</h3>
                            <p className="text-sm text-muted-foreground">{t.workbooks.samplePdfNote}</p>
                          </div>
                          <Button className={`rounded-full px-8 text-white shadow-md ${wb.samplePdf ? `bg-gradient-to-r ${wb.accentColor} hover:opacity-90` : "bg-muted-foreground/40 cursor-not-allowed"}`} disabled={!wb.samplePdf} onClick={() => { if (wb.samplePdf) window.open(wb.samplePdf, "_blank"); }}>
                            <Download className="w-4 h-4 me-2" />{wb.samplePdf ? t.workbooks.samplePdfBtn : (lang === "ar" ? "قريباً" : "Coming Soon")}
                          </Button>
                        </div>
                        <div className="bg-secondary/20 rounded-2xl border border-border p-6 md:p-8">
                          <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" />{t.workbooks.orderTitle}</h3>
                          <form onSubmit={handleWorkbookOrder} className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">{t.workbooks.nameLabel}</label>
                                <Input value={wbBuyerName} onChange={(e) => setWbBuyerName(e.target.value)} placeholder={t.workbooks.namePlaceholder} required className="rounded-xl" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">{t.workbooks.phoneLabel}</label>
                                <Input type="tel" value={wbBuyerPhone} onChange={(e) => setWbBuyerPhone(e.target.value)} placeholder="+962..." required className="rounded-xl" />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-2">{t.workbooks.emailLabel}</label>
                                <Input type="email" value={wbBuyerEmail} onChange={(e) => setWbBuyerEmail(e.target.value)} placeholder="email@example.com" required className="rounded-xl" />
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium mb-3">{t.workbooks.formatLabel}</label>
                                <div className="grid grid-cols-2 gap-3">
                                  <button type="button" onClick={() => setWbFormat("pdf")} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${wbFormat === "pdf" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}><FileText className="w-6 h-6" /><span className="text-sm font-medium">{t.workbooks.formatPdf}</span></button>
                                  <button type="button" onClick={() => setWbFormat("print")} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${wbFormat === "print" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}><Printer className="w-6 h-6" /><span className="text-sm font-medium">{t.workbooks.formatPrint}</span></button>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-3">{t.workbooks.quantityLabel}</label>
                                <div className="flex items-center gap-3">
                                  <button type="button" onClick={() => setWbQuantity(Math.max(1, wbQuantity - 1))} className="w-10 h-10 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center transition-colors"><Minus className="w-4 h-4" /></button>
                                  <span className="text-2xl font-bold w-12 text-center">{wbQuantity}</span>
                                  <button type="button" onClick={() => setWbQuantity(wbQuantity + 1)} className="w-10 h-10 rounded-full border border-border bg-background hover:bg-secondary flex items-center justify-center transition-colors"><Plus className="w-4 h-4" /></button>
                                </div>
                              </div>
                            </div>
                            {wbFormat === "print" && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Package className="w-4 h-4" />{t.workbooks.deliveryLabel}</label>
                                <Textarea value={wbDeliveryAddress} onChange={(e) => setWbDeliveryAddress(e.target.value)} placeholder={t.workbooks.deliveryPlaceholder} required className="rounded-xl" rows={2} />
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{t.workbooks.deliveryNote}</p>
                              </motion.div>
                            )}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                              <div className="text-center sm:text-start">
                                <div className="text-sm text-muted-foreground">{t.workbooks.totalLabel}</div>
                                <div className="text-3xl font-bold text-primary">{formatPrice(totalPrice)}</div>
                                {wbFormat === "print" && <p className="text-xs text-muted-foreground mt-1">+ {t.workbooks.deliveryNote.split("—")[0]}</p>}
                              </div>
                              <Button type="submit" size="lg" disabled={wbSubmitting} className="rounded-full h-14 px-10 text-lg font-bold shadow-lg bg-primary text-white hover:bg-primary/90">
                                {wbSubmitting ? t.workbooks.submittingOrder : t.workbooks.submitOrder}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
