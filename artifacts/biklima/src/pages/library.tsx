import { BookOpen, Eye, MousePointerClick } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SpeechSuggestionBox } from "@/components/speech-suggestion-box";
import { VideoLibrarySection } from "@/components/video-library-section";
import { useLang } from "@/hooks/useLang";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function LibraryPage() {
  const { lang } = useLang();

  usePageMeta({
    title: lang === "ar" ? "المكتبة التعليمية" : "Learning Library",
    description:
      lang === "ar"
        ? "مكتبة بكلمة العامة لتعلّم الخطابة بالمشاهدة والتحليل والتطبيق."
        : "Bikalima's public library for learning public speaking through watching, analysis, and practice.",
    canonicalPath: "/library",
  });

  const steps = lang === "ar"
    ? [
        { icon: Eye, title: "شاهد", body: "راقب المثال كاملاً قبل أن تحكم على تفاصيله." },
        { icon: BookOpen, title: "حلّل", body: "اقرأ المهارة والشرح المرتبطين بكل نموذج." },
        { icon: MousePointerClick, title: "طبّق", body: "اختر تقنية واحدة وجرّبها في حديثك القادم." },
      ]
    : [
        { icon: Eye, title: "Watch", body: "See the full example before judging its individual details." },
        { icon: BookOpen, title: "Analyse", body: "Read the technique and explanation attached to every example." },
        { icon: MousePointerClick, title: "Apply", body: "Choose one technique and try it in your next talk." },
      ];

  return (
    <AppShell
      breadcrumb={[{ label: lang === "ar" ? "المكتبة التعليمية" : "Learning Library" }]}
      containerClassName="p-0"
    >
      <header className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-24">
        <div aria-hidden className="absolute -top-24 -start-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="container mx-auto px-6 relative text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary mb-6">
            <BookOpen className="w-4 h-4" aria-hidden />
            {lang === "ar" ? "مورد عام ومجاني" : "A free public resource"}
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-5">
            {lang === "ar" ? "تعلّم الخطابة بعينٍ جديدة" : "See public speaking with fresh eyes"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {lang === "ar"
              ? "ليست قائمة فيديوهات للمشاهدة العابرة؛ بل أمثلة منتقاة تساعدك على ملاحظة ما يصنع بداية قوية، وقصة مؤثرة، وصوتاً حاضراً، وختاماً يبقى."
              : "Not a playlist for passive viewing, but a curated set of examples that reveal what makes a strong opening, a moving story, a present voice, and a memorable close."}
          </p>
        </div>
      </header>

      <section className="bg-secondary/20 border-b border-border py-8">
        <div className="container mx-auto px-6 max-w-5xl grid sm:grid-cols-3 gap-4">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl bg-card border border-border p-4">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-bold mb-1">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <VideoLibrarySection className="py-16 md:py-20 bg-background" />

      <SpeechSuggestionBox />
    </AppShell>
  );
}
