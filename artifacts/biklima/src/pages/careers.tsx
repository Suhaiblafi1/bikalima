import {
  ArrowUpLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Mail,
  Palette,
  Presentation,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function CareersPage() {
  const { lang } = useLang();
  const isArabic = lang === "ar";
  const DirectionArrow = isArabic ? ArrowUpLeft : ArrowUpRight;

  usePageMeta({
    title: isArabic ? "انضم إلى فريق بكلمة" : "Join Bikalima",
    description: isArabic
      ? "تعرّف إلى فرص الانضمام إلى فريق بكلمة الإداري وشبكة المدربين."
      : "Explore opportunities to join Bikalima's operations team and trainer network.",
    canonicalPath: "/careers",
  });

  const tracks = isArabic
    ? [
        {
          icon: BriefcaseBusiness,
          eyebrow: "الفريق الإداري والإبداعي",
          title: "ابنِ التجربة من خلف الكواليس",
          body: "نبحث عن أشخاص يحبون تحويل الأفكار إلى تجربة تعليمية واضحة، جميلة، ومنظمة.",
          roles: ["التسويق والمحتوى", "إدارة البرامج والعمليات", "خدمة المتعلمين", "التصميم وتجربة المستخدم", "التقنية والمنتج", "الشراكات"],
          subject: "طلب انضمام إلى فريق بكلمة الإداري",
        },
        {
          icon: Presentation,
          eyebrow: "شبكة المدربين",
          title: "ساعد الآخرين على امتلاك كلمتهم",
          body: "نرحب بالمدربين الذين يجمعون بين الخبرة، الحضور الإنساني، واحترام رحلة المتعلم.",
          roles: ["الخطابة والإلقاء", "الصوت والأداء", "السرد وصناعة القصة", "كتابة المحتوى", "تدريب الأطفال والناشئة", "تيسير المجموعات"],
          subject: "طلب انضمام إلى شبكة مدربي بكلمة",
        },
      ]
    : [
        {
          icon: BriefcaseBusiness,
          eyebrow: "Operations and creative team",
          title: "Build the experience behind the scenes",
          body: "We look for people who enjoy turning ideas into learning experiences that are clear, beautiful, and organised.",
          roles: ["Marketing and content", "Programme operations", "Learner support", "Design and UX", "Technology and product", "Partnerships"],
          subject: "Application to Bikalima's operations team",
        },
        {
          icon: Presentation,
          eyebrow: "Trainer network",
          title: "Help others own their words",
          body: "We welcome trainers who combine expertise, human presence, and respect for every learner's journey.",
          roles: ["Public speaking", "Voice and performance", "Storytelling", "Content writing", "Children and youth training", "Group facilitation"],
          subject: "Application to Bikalima's trainer network",
        },
      ];

  const principles = isArabic
    ? [
        { icon: Users, title: "الإنسان أولاً", body: "نصمم ونعمل ونتواصل باحترام ووضوح." },
        { icon: Sparkles, title: "جودة لها معنى", body: "نهتم بالجمال عندما يخدم الفهم والراحة." },
        { icon: Settings2, title: "مسؤولية ومرونة", body: "نلتزم بالنتيجة ونبقى مرنين في الطريق إليها." },
        { icon: GraduationCap, title: "نتعلّم دائماً", body: "نتعامل مع المراجعة والتحسين كجزء من العمل." },
      ]
    : [
        { icon: Users, title: "People first", body: "We design, work, and communicate with respect and clarity." },
        { icon: Sparkles, title: "Meaningful quality", body: "We value beauty when it improves understanding and comfort." },
        { icon: Settings2, title: "Ownership and flexibility", body: "We commit to the result and stay flexible on the way there." },
        { icon: GraduationCap, title: "Always learning", body: "Review and improvement are part of the work." },
      ];

  return (
    <AppShell
      breadcrumb={[{ label: isArabic ? "انضم للفريق" : "Join the team" }]}
      containerClassName="p-0"
    >
      <header className="relative overflow-hidden py-20 md:py-28 border-b border-border bg-foreground text-background">
        <div aria-hidden className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)),transparent_42%),radial-gradient(circle_at_80%_75%,hsl(var(--accent)),transparent_34%)]" />
        <div className="container mx-auto px-6 max-w-5xl relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-background/15 bg-background/5 text-accent text-sm font-bold mb-7">
            <Palette className="w-4 h-4" aria-hidden />
            {isArabic ? "اعمل على شيء يستحق أن يُقال" : "Work on something worth saying"}
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
            {isArabic ? "انضم إلى فريق يصنع أثراً بالكلمة" : "Join a team creating impact through words"}
          </h1>
          <p className="text-lg md:text-xl text-background/65 max-w-3xl mx-auto leading-relaxed">
            {isArabic
              ? "نحن نبني تعلماً عربياً يوازن بين الفائدة والمتعة، وبين التقنية واللمسة الإنسانية. إن كنت تؤمن بهذه الرحلة، يسعدنا أن نتعرف إليك."
              : "We are building Arabic learning that balances usefulness with joy, and technology with a human touch. If you believe in that journey, we would love to meet you."}
          </p>
        </div>
      </header>

      <section className="py-16 md:py-24 bg-background" aria-labelledby="career-paths">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-primary text-sm font-bold mb-3">{isArabic ? "مساران للانضمام" : "Two ways to join"}</p>
            <h2 id="career-paths" className="text-3xl md:text-5xl font-bold">
              {isArabic ? "اختر المساحة الأقرب إلى خبرتك" : "Choose the path closest to your experience"}
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {tracks.map(({ icon: Icon, eyebrow, title, body, roles, subject }, index) => (
              <article key={title} className={`rounded-[2rem] border p-6 sm:p-8 ${index === 1 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${index === 1 ? "bg-white/15" : "bg-primary/10 text-primary"}`}>
                  <Icon className="w-7 h-7" aria-hidden />
                </div>
                <p className={`text-sm font-bold mb-2 ${index === 1 ? "text-accent" : "text-primary"}`}>{eyebrow}</p>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">{title}</h3>
                <p className={`leading-relaxed mb-6 ${index === 1 ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{body}</p>
                <ul className="grid sm:grid-cols-2 gap-3 mb-8">
                  {roles.map((role) => (
                    <li key={role} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${index === 1 ? "text-accent" : "text-primary"}`} aria-hidden />
                      <span>{role}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  variant={index === 1 ? "secondary" : "default"}
                  className="rounded-full"
                >
                  <a href={`mailto:info@bikalima.com?subject=${encodeURIComponent(subject)}`}>
                    <Mail className="w-4 h-4 me-2" aria-hidden />
                    {isArabic ? "عرّفنا بنفسك" : "Introduce yourself"}
                    <DirectionArrow className="w-4 h-4 ms-2" aria-hidden />
                  </a>
                </Button>
              </article>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
            {isArabic
              ? "هذه صفحة تعريفية وليست إعلاناً عن شاغر محدد. أرسل نبذة مختصرة ورابط أعمالك، وسنتواصل عندما تتوفر فرصة مناسبة."
              : "This is an expression-of-interest page, not a listing for a specific vacancy. Send a short introduction and portfolio link; we will get in touch when a suitable opportunity appears."}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-secondary/25 border-y border-border" aria-labelledby="work-principles">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="max-w-2xl mb-9">
            <p className="text-primary text-sm font-bold mb-3">{isArabic ? "ما يهمنا في العمل" : "What matters at work"}</p>
            <h2 id="work-principles" className="text-3xl md:text-4xl font-bold">
              {isArabic ? "المهارة مهمة، وطريقة العمل أهم" : "Skill matters; how we work matters more"}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {principles.map(({ icon: Icon, title, body }) => (
              <article key={title} className="bg-card border border-border rounded-2xl p-5">
                <Icon className="w-6 h-6 text-primary mb-4" aria-hidden />
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
