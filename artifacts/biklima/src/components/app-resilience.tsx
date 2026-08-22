import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import { AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error("Unhandled application error", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen grid place-items-center bg-background px-4" dir="rtl">
        <section className="max-w-lg rounded-3xl border bg-card p-8 text-center shadow-sm" role="alert">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
          <h1 className="mb-3 text-2xl font-bold">تعذّر عرض الصفحة</h1>
          <p className="mb-6 text-muted-foreground">حدث خطأ غير متوقع. لم نفقد بياناتك؛ أعد تحميل الصفحة للمحاولة مجدداً.</p>
          <Button onClick={() => window.location.reload()}>إعادة تحميل الصفحة</Button>
        </section>
      </main>
    );
  }
}

export function OfflineBanner() {
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[250] flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white" role="status" aria-live="polite">
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      أنت غير متصل بالإنترنت. ستعمل بعض الصفحات عند عودة الاتصال.
    </div>
  );
}
