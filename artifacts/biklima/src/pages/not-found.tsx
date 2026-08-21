import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLang } from "@/hooks/useLang";

export default function NotFound() {
  const { lang, dir } = useLang();
  const [, navigate] = useLocation();
  const isAr = lang === "ar";
  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir={dir}>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-xl text-center">
          <p className="font-serif text-8xl md:text-9xl font-bold text-primary/15" aria-hidden="true">404</p>
          <div className="-mt-6 md:-mt-8 relative">
            <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4">
              {isAr ? "عذراً، لم نجد هذه الصفحة" : "Sorry, we couldn't find this page"}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mx-auto mb-8">
              {isAr
                ? "قد يكون الرابط غير صحيح أو أن الصفحة نُقلت إلى مكان آخر. يمكنك العودة أو بدء رحلتك من الصفحة الرئيسية."
                : "The link may be incorrect or the page may have moved. You can go back or start again from the home page."}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button className="rounded-full" onClick={() => navigate("/")}>
                <Home className="w-4 h-4 me-2" />
                {isAr ? "الصفحة الرئيسية" : "Home page"}
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => window.history.back()}>
                <BackIcon className="w-4 h-4 me-2" />
                {isAr ? "العودة للخلف" : "Go back"}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
