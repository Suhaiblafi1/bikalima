import { type ReactNode } from "react";
import { useMe } from "@/hooks/use-me";

interface Props {
  children: ReactNode;
}

export function ContentProtection({ children }: Props) {
  const { user } = useMe();

  const watermarkText =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") +
    (user?.email ? ` • ${user.email}` : "") +
    (user?.id ? ` • ${user.id.slice(0, 8)}` : "") || "محتوى محمي • بكلمة";

  // Build a tiled watermark via inline SVG → data URL (rotated, low opacity).
  //
  // font-family stays generic here, and deliberately: an SVG referenced from a
  // CSS url() is rendered in a restricted mode that cannot fetch external
  // resources, so a webfont named here would never load and the text would
  // fall back anyway. This is the one piece of Arabic on the site not set in
  // Avenir Arabic, because it cannot be.
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='220'>
    <text x='50%' y='50%' fill='rgba(0,0,0,0.10)' font-size='16' font-family='sans-serif'
      text-anchor='middle' transform='rotate(-25 210 110)'>${escapeXml(watermarkText)}</text>
  </svg>`;
  const watermarkBg = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

  return (
    <div className="relative content-protected">
      <style>{`
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

      {children}
    </div>
  );
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );
}
