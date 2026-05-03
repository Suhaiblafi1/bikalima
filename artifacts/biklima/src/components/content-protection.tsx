import { useEffect, useState, type ReactNode } from "react";
import { useMe } from "@/hooks/use-me";

interface Props {
  children: ReactNode;
}

export function ContentProtection({ children }: Props) {
  const { user } = useMe();
  const [hidden, setHidden] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const watermarkText =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") +
    (user?.email ? ` • ${user.email}` : "") +
    (user?.id ? ` • ${user.id.slice(0, 8)}` : "") || "محتوى محمي • بكلمة";

  useEffect(() => {
    const block = (e: Event) => { e.preventDefault(); return false; };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      // Block: PrintScreen, F12, Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+X, Ctrl+U,
      // Ctrl+Shift+I/J/C (devtools), Ctrl+Shift+S (Firefox screenshot).
      if (
        k === "printscreen" || k === "f12" ||
        (ctrl && ["s", "p", "c", "x", "u", "a"].includes(k)) ||
        (ctrl && e.shiftKey && ["i", "j", "c", "s"].includes(k))
      ) {
        e.preventDefault();
        e.stopPropagation();
        // Wipe clipboard if PrintScreen pressed.
        if (k === "printscreen" && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        return false;
      }
    };

    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(false);
    const onVisibility = () => setHidden(document.hidden);

    // Devtools heuristic: window outerWidth-innerWidth gap > 160 → open.
    const checkDevTools = () => {
      const w = window.outerWidth - window.innerWidth;
      const h = window.outerHeight - window.innerHeight;
      setDevToolsOpen(w > 200 || h > 200);
    };
    const devInterval = window.setInterval(checkDevTools, 1000);

    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(devInterval);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Build a tiled watermark via inline SVG → data URL (rotated, low opacity).
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='220'>
    <text x='50%' y='50%' fill='rgba(0,0,0,0.10)' font-size='16' font-family='sans-serif'
      text-anchor='middle' transform='rotate(-25 210 110)'>${escapeXml(watermarkText)}</text>
  </svg>`;
  const watermarkBg = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

  return (
    <div
      className="relative content-protected"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <style>{`
        .content-protected * {
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        .content-protected img, .content-protected video, .content-protected iframe {
          -webkit-user-drag: none;
          pointer-events: auto;
        }
        @media print {
          .content-protected { display: none !important; }
          body::after {
            content: "الطباعة غير مسموحة — محتوى محمي";
            display: block; padding: 40px; font-size: 24px; text-align: center;
          }
        }
      `}</style>

      {/* Tiled watermark overlay (pointer-events:none lets clicks through). */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40"
        style={{ backgroundImage: watermarkBg, backgroundRepeat: "repeat" }}
      />

      {/* Privacy shield when window loses focus or visibility hidden. */}
      {hidden && (
        <div className="fixed inset-0 z-[9998] bg-background/95 backdrop-blur-xl flex items-center justify-center text-center p-8">
          <div>
            <div className="text-2xl font-bold mb-2">المحتوى مخفي 🔒</div>
            <p className="text-muted-foreground text-sm">عُد إلى النافذة لمتابعة المشاهدة.</p>
          </div>
        </div>
      )}

      {/* Devtools open → block content. */}
      {devToolsOpen && (
        <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center text-center p-8">
          <div>
            <div className="text-2xl font-bold mb-2">⚠️ تم اكتشاف أدوات المطوّر</div>
            <p className="text-muted-foreground">يرجى إغلاقها لمتابعة المحتوى المحمي.</p>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );
}
