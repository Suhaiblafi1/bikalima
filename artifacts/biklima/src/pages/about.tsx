import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Layers3,
  MessageCircle,
  Presentation,
  School,
  ShieldCheck,
  Sparkles,
  Mic2,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";
import { T } from "@/translations";

export default function AboutPage() {
  const { lang } = useLang();
  const t = T[lang];
  const [, navigate] = useLocation();
  const isArabic = lang === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  usePageMeta({
    title: isArabic ? "من نحن" : "About Bikalima",
    description: isArabic
      ? "بكلمة منصة عربية تصنع رحلة تعلم عملية تساعد الإنسان على امتلاك كلمته وحضوره."
      : "Bikalima is an Arabic learning platform that helps people own their words and presence through practical learning journeys.",
    canonicalPath: "/about",
  });

  const offerings = isArabic
    ? [
        { icon: Presentation, title: "برامج للأفراد", body: "من الفكرة الأولى إلى خطاب واضح وحضور واثق." },
        { icon: Award, title: "تأهيل المدربين", body: "مسار مهني لمن يريد تعليم الخطابة بمنهج عملي." },
        { icon: School, title: "برامج للمعلمين", body: "أدوات تساعد المعلم وولي الأمر على تنمية التعبير والحضور." },
        { icon: Users, title: "برامج للناشئة", body: "تجارب مناسبة للأطفال واليافعين تحترم أعمارهم وشخصياتهم." },
        { icon: BookOpen, title: "كراسات وأدوات", body: "مواد قابلة للاستخدام تحول المعرفة إلى تدريب يومي." },
        { icon: Layers3, title: "تعلّم مرن", body: "دورات مسجّلة، أو عبر Zoom، أو مزيج بينهما بحسب البرنامج." },
        { icon: ShieldCheck, title: "شهادات قابلة للتحقق", body: "سجل واضح يتيح التحقق من الشهادة ومصدرها." },
      ]
    : [
        { icon: Presentation, title: "Individual programmes", body: "From the first idea to a clear speech and confident presence." },
        { icon: Award, title: "Trainer qualification", body: "A professional path for teaching public speaking with a practical method." },
        { icon: School, title: "Teacher programmes", body: "Tools for teachers and parents to develop expression and presence." },
        { icon: Users, title: "Youth programmes", body: "Age-appropriate experiences for children and young people." },
        { icon: BookOpen, title: "Workbooks and tools", body: "Usable materials that turn knowledge into everyday practice." },
        { icon: Layers3, title: "Flexible learning", body: "Recorded, Zoom-based, or blended courses depending on the programme." },
        { icon: ShieldCheck, title: "Verifiable certificates", body: "A clear registry for checking every certificate and its source." },
      ];

  const journey = isArabic
    ? [
        { title: "معرفة", body: "تفهم الفكرة ببساطة ومن دون حشو." },
        { title: "تطبيق", body: "تحول الفكرة إلى تمرين وموقف حقيقي." },
        { title: "تغذية راجعة", body: "تكتشف ما نجح وما يحتاج إلى صقل." },
        { title: "تدرّج", body: "تكرر التجربة على مستوى أصعب بثقة أكبر." },
      ]
    : [
        { title: "Learn", body: "Understand the idea clearly, without unnecessary filler." },
        { title: "Practise", body: "Turn the idea into an exercise and a real situation." },
        { title: "Reflect", body: "Discover what worked and what needs refinement." },
        { title: "Progress", body: "Repeat at a higher level with greater confidence." },
      ];

  const values = isArabic
    ? [
        ["الصدق", "نعد بما نستطيع تقديمه، ونقول ما نعرفه بوضوح."],
        ["الإتقان", "نهتم بالتفاصيل التي تجعل التجربة مفيدة ومريحة."],
        ["الأثر", "نقيس نجاحنا بما يتغير في حياة المتعلم، لا بعدد الصفحات."],
        ["الاحترام", "نحترم اختلاف الأعمار والخلفيات وسرعة التعلّم."],
        ["النمو المستمر", "نراجع برامجنا ونصغي للتجربة ونحسنها."],
        ["الوضوح", "نجعل الخطوة التالية مفهومة دائماً."],
      ]
    : [
        ["Honesty", "We promise what we can deliver and state what we know clearly."],
        ["Craft", "We care about the details that make learning useful and comfortable."],
        ["Impact", "We measure success by change in the learner, not by page count."],
        ["Respect", "We honour different ages, backgrounds, and learning speeds."],
        ["Continuous growth", "We review our programmes, listen, and improve."],
        ["Clarity", "We make the next step easy to understand."],
      ];

  const proofLinks = isArabic
    ? [
        { icon: GraduationCap, title: "خريجونا", body: "تعرّف إلى سجل الخريجين والشهادات المنشورة.", path: "/graduates", action: "استعرض السجل" },
        { icon: Sparkles, title: "أثرنا", body: "أرقام موثقة وقصص تصف ما تغير فعلياً.", path: "/impact", action: "شاهد الأثر" },
        { icon: ShieldCheck, title: "اعتماداتنا", body: "اعتمادات وشراكات منشورة وقابلة للتحقق.", path: "/accreditations", action: "عرض الاعتمادات" },
      ]
    : [
        { icon: GraduationCap, title: "Our graduates", body: "Explore the published graduate and certificate registry.", path: "/graduates", action: "View registry" },
        { icon: Sparkles, title: "Our impact", body: "Verified figures and stories of meaningful change.", path: "/impact", action: "See our impact" },
        { icon: ShieldCheck, title: "Accreditations", body: "Published, verifiable accreditations and partnerships.", path: "/accreditations", action: "View accreditations" },
      ];

  return (
    <AppShell
      breadcrumb={[{ label: isArabic ? "من نحن" : "About us" }]}
      containerClassName="p-0"
    >
      <header className="relative overflow-hidden py-12 md:py-24 border-b border-border bg-gradient-to-br from-primary/12 via-background to-accent/10">
        <div aria-hidden className="absolute -top-28 -end-24 w-80 h-80 rounded-full border-[56px] border-primary/5" />
        <div aria-hidden className="absolute -bottom-36 -start-28 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="container mx-auto px-6 relative max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-primary/20 text-primary text-sm font-bold mb-5 md:mb-7 shadow-sm">
            <Compass className="w-4 h-4" aria-hidden />
            {isArabic ? "رسالتنا: أن يمتلك كل إنسان كلمته" : "Our mission: help every person own their words"}
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.25] mb-4 md:mb-6">
            {isArabic
              ? "نصنع أثر الكلمة — من الفكرة الأولى إلى حضورٍ لا يُنسى."
              : "We shape the impact of words — from the first idea to an unforgettable presence."}
          </h1>
          <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-7 md:mb-9">
            {isArabic
              ? "بكلمة منصة عربية للتعلّم العملي؛ نبني برامج وتجارب وأدوات تساعد الإنسان على التعبير بوضوح، والتحدث بثقة، وتحويل معرفته إلى أثر يصل إلى الآخرين."
              : "Bikalima is an Arabic platform for practical learning. We build programmes, experiences, and tools that help people express themselves clearly, speak confidently, and turn knowledge into impact."}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button size="lg" className="rounded-full h-12 px-7" onClick={() => navigate("/#structure")}>
              {isArabic ? "استكشف البرامج" : "Explore programmes"}
              <DirectionArrow className="w-4 h-4 ms-2" aria-hidden />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-12 px-7 bg-background/70" onClick={() => navigate("/consultation")}>
              <MessageCircle className="w-4 h-4 me-2" aria-hidden />
              {isArabic ? "تحدث معنا" : "Talk to us"}
            </Button>
          </div>
        </div>
      </header>

      <section className="py-12 md:py-24 bg-background" aria-labelledby="about-offerings">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="max-w-2xl mb-7 md:mb-10">
            <p className="text-primary text-sm font-bold mb-3">{isArabic ? "ماذا نقدم؟" : "What we offer"}</p>
            <h2 id="about-offerings" className="text-3xl md:text-5xl font-bold mb-4">
              {isArabic ? "رحلات تعلم تناسب الإنسان، لا القالب" : "Learning journeys built for people, not templates"}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {isArabic
                ? "لكل فئة احتياج مختلف؛ لذلك نصمم الشكل والمحتوى والتطبيق بما يخدم هدفها الحقيقي."
                : "Each audience has different needs, so format, content, and practice are designed around the real goal."}
            </p>
          </div>
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
            {offerings.map(({ icon: Icon, title, body }, index) => (
              <article
                key={title}
                className={`min-w-[82vw] snap-center rounded-3xl border p-5 transition-all hover:-translate-y-1 hover:shadow-lg sm:min-w-0 sm:p-6 ${
                  index === offerings.length - 1
                    ? "sm:col-span-2 lg:col-span-1 bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border"
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${index === offerings.length - 1 ? "bg-white/15" : "bg-primary/10 text-primary"}`}>
                  <Icon className="w-6 h-6" aria-hidden />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className={`text-sm leading-relaxed ${index === offerings.length - 1 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 bg-foreground text-background overflow-hidden" aria-labelledby="about-method">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
            <p className="text-accent text-sm font-bold mb-3">{isArabic ? "منهجيتنا" : "Our method"}</p>
            <h2 id="about-method" className="text-3xl md:text-5xl font-bold mb-4">
              {isArabic ? "التعلّم رحلة، وليس جرعة معلومات" : "Learning is a journey, not a dose of information"}
            </h2>
            <p className="text-background/65 text-lg">
              {isArabic ? "نبني كل تجربة على دورة واضحة تتكرر حتى تصبح المهارة طبيعية." : "Every experience follows a clear cycle until the skill becomes natural."}
            </p>
          </div>
          <ol className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0 relative">
            {journey.map((step, index) => (
              <li key={step.title} className="relative min-w-[78vw] snap-center rounded-3xl border border-background/15 bg-background/5 p-5 backdrop-blur-sm sm:min-w-[55vw] md:min-w-0 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="w-11 h-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {index < journey.length - 1 && <DirectionArrow className="hidden md:block w-5 h-5 text-background/30" aria-hidden />}
                </div>
                <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-background/65 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-12 md:py-24 bg-secondary/20" aria-labelledby="about-values">
        <div className="container mx-auto px-6 max-w-6xl grid lg:grid-cols-[0.8fr_1.2fr] gap-7 lg:gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-accent/15 text-accent-foreground flex items-center justify-center mb-4 md:mb-5">
              <HeartHandshake className="w-7 h-7 text-accent" aria-hidden />
            </div>
            <p className="text-primary text-sm font-bold mb-3">{isArabic ? "قيمنا" : "Our values"}</p>
            <h2 id="about-values" className="text-3xl md:text-5xl font-bold mb-4">
              {isArabic ? "كيف نعمل عندما لا يرانا أحد" : "How we work when nobody is watching"}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {isArabic ? "هذه ليست كلمات معلقة على جدار؛ بل معايير نرجع إليها عند اتخاذ القرار." : "These are not words on a wall; they are standards we return to when making decisions."}
            </p>
          </div>
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
            {values.map(([title, body]) => (
              <article key={title} className="min-w-[78vw] snap-center bg-card border border-border rounded-2xl p-5 sm:min-w-0">
                <CheckCircle2 className="w-5 h-5 text-primary mb-4" aria-hidden />
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-24 bg-background" aria-labelledby="about-proof">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-7 md:mb-10">
            <p className="text-primary text-sm font-bold mb-3">{isArabic ? "أثر يمكن رؤيته" : "Visible proof"}</p>
            <h2 id="about-proof" className="text-3xl md:text-5xl font-bold">
              {isArabic ? "الثقة تبدأ من معلومات قابلة للتحقق" : "Trust starts with verifiable information"}
            </h2>
          </div>
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
            {proofLinks.map(({ icon: Icon, title, body, path, action }) => (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className="group min-w-[82vw] snap-center text-start bg-card border border-border rounded-3xl p-5 hover:border-primary/40 hover:shadow-lg transition-all sm:min-w-[60vw] md:min-w-0 md:p-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" aria-hidden />
                </div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{body}</p>
                <span className="inline-flex items-center text-sm font-bold text-primary">
                  {action}
                  <DirectionArrow className="w-4 h-4 ms-2 transition-transform group-hover:-translate-x-1 ltr:group-hover:translate-x-1" aria-hidden />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* ── AUTHOR'S MESSAGE ── */}
      <section className="py-12 md:py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <div className="text-4xl mb-4 md:text-5xl md:mb-6 opacity-30">✦</div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-7 md:mb-10 opacity-90">{t.author.sectionTitle}</h2>
          </motion.div>
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-3 md:mx-0 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0">
            {t.author.cards.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="min-w-[82vw] snap-center bg-primary-foreground/10 backdrop-blur-sm p-5 md:min-w-0 md:p-7 rounded-3xl border border-primary-foreground/20">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-4">
                  {i === 0 ? <GraduationCap className="w-6 h-6" /> : i === 1 ? <Mic2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">{msg.to}</div>
                <p className="font-serif text-base leading-relaxed opacity-90">{msg.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
