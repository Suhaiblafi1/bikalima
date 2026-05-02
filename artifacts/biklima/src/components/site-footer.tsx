import { useLocation } from "wouter";
import { MessageCircle, Mail, Linkedin, Instagram } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { T } from "@/translations";
import { programs, getLocalizedProgram } from "@/programsData";
import { PROGRAM_SLUGS, getBaseUrl } from "@/lib/site-config";

export function SiteFooter() {
  const { lang } = useLang();
  const t = T[lang];
  const [location, navigate] = useLocation();
  const baseUrl = getBaseUrl();
  const localizedPrograms = programs.map((p) => getLocalizedProgram(p, lang));

  const isHome = location === "/" || location === "";

  const goToSection = (id: string) => {
    if (isHome) {
      const el = document.getElementById(id);
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
      } else {
        window.location.hash = id;
      }
    } else {
      window.location.assign(`${baseUrl}/#${id}`);
    }
  };

  const goToProgram = (programId: string) => {
    const slug = PROGRAM_SLUGS[programId];
    if (slug) navigate(`/courses/${slug}`);
  };

  return (
    <footer className="bg-foreground text-background py-14">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-10 md:gap-12 mb-10 border-b border-background/10 pb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="logo-biklima text-4xl text-accent mb-4 leading-none">بكلمة</div>
            <p className="text-background/60 leading-relaxed text-sm max-w-sm">
              {t.footer.about}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-5">{t.footer.programsHeading}</h4>
            <ul className="space-y-3 text-background/70 text-sm">
              {localizedPrograms.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => goToProgram(p.id)}
                    className="hover:text-accent transition text-start"
                  >
                    {p.shortTitle}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-5">{t.footer.linksHeading}</h4>
            <ul className="space-y-3 text-background/70 text-sm">
              <li>
                <button onClick={() => goToSection("structure")} className="hover:text-accent transition text-start">
                  {t.footer.linkLabels.structure}
                </button>
              </li>
              <li>
                <button onClick={() => goToSection("wisdom")} className="hover:text-accent transition text-start">
                  {t.footer.linkLabels.wisdom}
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/workbooks")} className="hover:text-accent transition text-start">
                  {t.footer.linkLabels.workbooks}
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/gallery")} className="hover:text-accent transition text-start">
                  {t.nav.gallery}
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/verify")} className="hover:text-accent transition text-start" data-testid="footer-link-verify">
                  {lang === "ar" ? "تحقق من شهادة" : "Verify certificate"}
                </button>
              </li>
              <li>
                <button onClick={() => navigate("/graduates")} className="hover:text-accent transition text-start" data-testid="footer-link-graduates">
                  {lang === "ar" ? "سجل الخريجين" : "Graduates registry"}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-5">{t.footer.contactHeading}</h4>
            <ul className="space-y-3 text-background/70 text-sm">
              <li>
                <a
                  href="https://wa.me/97455377065"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-accent transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t.footer.whatsappLabel}
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@bikalima.com"
                  className="flex items-center gap-2 hover:text-accent transition"
                  dir="ltr"
                >
                  <Mail className="w-4 h-4" />
                  info@bikalima.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/suhaiblafi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-accent transition"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/suhaiblafi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-accent transition"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-background/50 text-xs gap-3">
          <p>{t.footer.copyright}</p>
          <div className="flex gap-6">
            <a
              href={`${baseUrl}/terms`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navigate("/terms");
              }}
              className="hover:text-white transition"
              data-testid="footer-link-terms"
            >
              {t.footer.terms}
            </a>
            <a
              href={`${baseUrl}/privacy`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                navigate("/privacy");
              }}
              className="hover:text-white transition"
              data-testid="footer-link-privacy"
            >
              {t.footer.privacy}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
