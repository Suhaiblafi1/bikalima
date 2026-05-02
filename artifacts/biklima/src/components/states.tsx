import type { ReactNode } from "react";
import { Inbox, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Lang = "ar" | "en";

export function LoadingState({
  lang = "ar",
  message,
  className = "",
}: {
  lang?: Lang;
  message?: string;
  className?: string;
}) {
  const isRtl = lang === "ar";
  const fallback = isRtl ? "جارٍ التحميل..." : "Loading...";
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{message ?? fallback}</p>
    </div>
  );
}

export function EmptyState({
  lang = "ar",
  title,
  description,
  icon,
  action,
  className = "",
}: {
  lang?: Lang;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const isRtl = lang === "ar";
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground/70 mb-4">
        {icon ?? <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

export function ErrorState({
  lang = "ar",
  title,
  description,
  onRetry,
  className = "",
}: {
  lang?: Lang;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const isRtl = lang === "ar";
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="font-bold text-lg text-foreground mb-2">
        {title ?? (isRtl ? "حدث خطأ" : "Something went wrong")}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-2 rounded-full">
          <RefreshCw className="w-4 h-4" />
          {isRtl ? "إعادة المحاولة" : "Try again"}
        </Button>
      )}
    </div>
  );
}
