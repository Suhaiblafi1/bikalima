import { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLang } from "@/hooks/useLang";

interface ExternalLinkDialogProps {
  href: string;
  children: ReactNode;
  partnerName?: string;
}

const TEXT = {
  ar: {
    title: "أنت على وشك مغادرة موقع بكلمة",
    body: "سيتم نقلك إلى شريك التسجيل والدفع لإكمال عملية الحجز. سيُفتح الرابط في تبويب جديد.",
    partnerLabel: "الشريك:",
    cancel: "إلغاء",
    continue: "متابعة",
  },
  en: {
    title: "You are about to leave the Bikalima site",
    body: "You will be redirected to our registration & payment partner to complete the booking. The link will open in a new tab.",
    partnerLabel: "Partner:",
    cancel: "Cancel",
    continue: "Continue",
  },
} as const;

function getDomain(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

/**
 * Wraps a clickable child (e.g. <Button>) in an external-link confirmation dialog.
 * Uses AlertDialogTrigger asChild so the user-provided element remains the real
 * focusable trigger (preserves keyboard focus + native button semantics).
 *
 * On Continue, opens `href` in a new tab with `noopener,noreferrer` to prevent
 * tabnabbing.
 */
export function ExternalLinkDialog({
  href,
  children,
  partnerName,
}: ExternalLinkDialogProps) {
  const { lang } = useLang();
  const t = TEXT[lang];
  const partner = partnerName || getDomain(href);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            {t.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            {t.body}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm rounded-lg bg-muted/50 border border-border p-3 my-2">
          <span className="font-bold text-foreground">{t.partnerLabel}</span>{" "}
          <span dir="ltr" className="text-muted-foreground break-all">
            {partner}
          </span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="external-link-cancel">
            {t.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              window.open(href, "_blank", "noopener,noreferrer")
            }
            data-testid="external-link-continue"
          >
            {t.continue}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
