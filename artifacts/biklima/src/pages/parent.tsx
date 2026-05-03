import { useEffect, useState, useCallback } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Trophy, GraduationCap, Loader2, KeyRound } from "lucide-react";

interface ChildSummary {
  linkId: string;
  relationshipAr: string | null;
  student: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  enrolledCourses: number;
  completedLessons: number;
  completedActivities: number;
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function ParentPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const apiBase = getApiBase();
  const [children, setChildren] = useState<ChildSummary[] | null>(null);
  const [code, setCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(() => {
    fetch(`${apiBase}/parent/children`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setChildren(d.children ?? []))
      .catch(() => setChildren([]));
  }, [apiBase]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const r = await fetch(`${apiBase}/parent/redeem`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });
      if (r.ok) {
        setRedeemMsg({ type: "ok", text: "تمّ ربط حسابك بحساب الطالب بنجاح." });
        setCode("");
        load();
      } else {
        const d = await r.json().catch(() => ({}));
        setRedeemMsg({ type: "err", text: d?.error === "Invite not found" ? "الرمز غير صحيح" : d?.error === "Already redeemed" ? "تمّ استخدام هذا الرمز سابقاً" : "تعذّر التفعيل" });
      }
    } catch {
      setRedeemMsg({ type: "err", text: "تعذّر الاتصال بالخادم" });
    } finally {
      setRedeeming(false);
    }
  };

  if (authLoading) {
    return (
      <AppShell containerClassName="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </AppShell>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login?redirect=%2Fparent" replace />;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir="rtl">
        <header>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            لوحة ولي الأمر
          </h1>
          <p className="text-muted-foreground mt-1">تابع تقدّم أبنائك في منصة المتحدث الصغير.</p>
        </header>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              ربط حساب طفل جديد
            </h2>
            <form onSubmit={redeem} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="أدخل رمز الدعوة"
                className="flex-1 p-3 rounded-lg border border-border font-mono tracking-widest text-center"
                maxLength={16}
              />
              <button
                type="submit"
                disabled={redeeming || code.trim().length < 4}
                className="px-6 py-3 rounded-lg bg-primary text-white font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {redeeming && <Loader2 className="w-4 h-4 animate-spin" />}
                تفعيل الربط
              </button>
            </form>
            {redeemMsg && (
              <p className={`mt-2 text-sm ${redeemMsg.type === "ok" ? "text-emerald-600" : "text-rose-600"}`}>
                {redeemMsg.text}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              يمكن لطفلك إنشاء رمز الدعوة من تبويب "أهلي وأولياء أمري" في لوحة التحكم الخاصة به.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <h2 className="font-bold text-lg mb-4">أبنائي المربوطون</h2>
            {children === null ? (
              <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
            ) : children.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                لم يتم ربط أي حساب طفل بعد. اطلب من طفلك رمز الدعوة من حسابه.
              </p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-3">
                {children.map(c => {
                  const fullName = [c.student.firstName, c.student.lastName].filter(Boolean).join(" ") || c.student.email;
                  return (
                    <li key={c.linkId} className="border border-border rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {c.student.profileImageUrl ? (
                          <img src={c.student.profileImageUrl} alt={fullName} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold truncate">{fullName}</p>
                          {c.relationshipAr && <p className="text-xs text-muted-foreground">{c.relationshipAr}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/40 rounded-lg p-2">
                          <BookOpen className="w-4 h-4 mx-auto text-primary" />
                          <p className="text-lg font-bold mt-1">{c.enrolledCourses}</p>
                          <p className="text-[10px] text-muted-foreground">دورات</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2">
                          <GraduationCap className="w-4 h-4 mx-auto text-emerald-600" />
                          <p className="text-lg font-bold mt-1">{c.completedLessons}</p>
                          <p className="text-[10px] text-muted-foreground">دروس مكتملة</p>
                        </div>
                        <div className="bg-muted/40 rounded-lg p-2">
                          <Trophy className="w-4 h-4 mx-auto text-amber-600" />
                          <p className="text-lg font-bold mt-1">{c.completedActivities}</p>
                          <p className="text-[10px] text-muted-foreground">أنشطة</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
