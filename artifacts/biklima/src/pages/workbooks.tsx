import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Lightbulb, Mic2, Heart, Users, Star,
  Feather, Sparkles, Globe, ShoppingCart, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { T, type Lang } from "../translations";
import { useLang } from "../hooks/useLang";
import { programs, getLocalizedProgram, WORKBOOK_PRICES, testimonials as testimonialsData } from "../programsData";
import { useCurrency } from "@/lib/site-config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumb } from "@/components/breadcrumb";
import { WorkbookOrderModal } from "@/components/workbook-order-modal";

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

export default function WorkbooksPage() {
  const { lang, dir } = useLang();
  const t = T[lang];
  const { format: formatPrice } = useCurrency();

  const [wisdomIndex, setWisdomIndex] = useState(0);
  const [selectedWorkbook, setSelectedWorkbook] = useState<ReturnType<typeof getLocalizedProgram> | null>(null);

  const articles = wisdomArticles[lang] ?? wisdomArticles.ar;

  useEffect(() => {
    const iv = setInterval(() => setWisdomIndex(i => (i + 1) % articles.length), 7000);
    return () => clearInterval(iv);
  }, [articles.length]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden" dir={dir}>
      <SiteHeader />
      <div aria-hidden className="h-16 md:h-20 shrink-0" />
      <Breadcrumb items={[{ label: lang === "ar" ? "الكراسات" : "Workbooks" }]} />

      {/* ── WORKBOOKS STORE (products first on mobile) ── */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3 md:mb-6">{t.workbooks.heading}</h2>
            <p className="text-base md:text-xl text-muted-foreground">{t.workbooks.sub}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
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
                  <div className="p-5 md:p-6">
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{lp.workbook.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {lp.modules.slice(0, 4).map((mod, mi) => (
                        <span key={mi} className="text-xs px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground border border-border">
                          {mod}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                      <div>
                        <div className="text-xs text-muted-foreground">{t.workbooks.priceLabel}</div>
                        <div className="text-2xl font-bold text-primary">{formatPrice(price ?? 0)}</div>
                      </div>
                      <Button
                        onClick={() => setSelectedWorkbook(lp)}
                        className="rounded-full px-4 sm:px-6 h-12 gap-2 shrink-0"
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

      {/* ── WISDOM CAROUSEL (educational context, after products) ── */}
      <section className="py-12 md:py-16 bg-secondary/10 border-y border-border overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 mb-8 md:mb-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium mb-4 md:mb-6 text-sm">
              <BookOpen className="w-4 h-4" />{t.wisdom.badge}
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3 md:mb-6">{t.wisdom.heading}</h2>
            <p className="text-base md:text-xl text-muted-foreground">{t.wisdom.sub}</p>
          </div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={wisdomIndex}
              initial={{ opacity: 0, x: dir === "rtl" ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir === "rtl" ? 40 : -40 }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 md:p-12 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 start-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5 md:mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {articles[wisdomIndex]?.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground font-medium truncate">{articles[wisdomIndex]?.source}</div>
                    <div className="text-sm font-bold text-primary truncate">{articles[wisdomIndex]?.category}</div>
                  </div>
                </div>
                <blockquote className="font-serif text-lg md:text-2xl font-bold text-foreground mb-5 md:mb-6 leading-relaxed border-s-4 border-primary ps-4 md:ps-5">
                  {articles[wisdomIndex]?.quote}
                </blockquote>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{articles[wisdomIndex]?.body}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => setWisdomIndex(i => (i - 1 + articles.length) % articles.length)} className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors" aria-label={lang === "ar" ? "السابق" : "Previous"}>
              {dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <div className="flex gap-1.5">
              {articles.map((_, i) => (
                <button key={i} onClick={() => setWisdomIndex(i)} className={`rounded-full transition-all duration-300 ${i === wisdomIndex ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-primary/40"}`} aria-label={`${i + 1}`} />
              ))}
            </div>
            <button onClick={() => setWisdomIndex(i => (i + 1) % articles.length)} className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors" aria-label={lang === "ar" ? "التالي" : "Next"}>
              {dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14 bg-secondary/20 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3"
            >
              {lang === "ar" ? "آراء عملائنا" : "Client Reviews"}
            </motion.h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {lang === "ar" ? "تجارب حقيقية من متدربين ومتدربات في بكلمة" : "Real experiences from Bikalima trainees"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {testimonialsData[lang === "en" ? "en" : "ar"].map((rev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-background rounded-2xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-5 font-medium">"{rev.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {rev.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{rev.name}</div>
                    <div className="text-xs text-muted-foreground">{rev.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* ── WORKBOOK ORDER MODAL ── */}
      <AnimatePresence>
        {selectedWorkbook && (
          <WorkbookOrderModal workbook={selectedWorkbook} onClose={() => setSelectedWorkbook(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
