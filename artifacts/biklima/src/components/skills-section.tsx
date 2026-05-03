import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Heart, Loader2, Trophy, Sparkles, Shield, Mic, GraduationCap } from "lucide-react";

const SKILL_LABELS_AR: Record<string, string> = {
  idea: "الفكرة", structure: "البناء", voice: "الصوت", body: "لغة الجسد",
  improvisation: "الارتجال", impact: "التأثير", confidence: "الثقة", fear_management: "إدارة الخوف",
};

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles, Award, Shield, Mic, GraduationCap, Trophy,
};

type Badge = {
  id: string; key: string; titleAr: string; titleEn: string;
  descriptionAr: string | null; icon: string | null; owned: boolean;
  awardedAt: string | null;
};

type FearEntry = { id: string; level: number; note: string | null; createdAt: string };

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export function SkillsAndBadgesSection() {
  const apiBase = getApiBase();
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [badges, setBadges] = useState<Badge[]>([]);
  const [fearEntries, setFearEntries] = useState<FearEntry[]>([]);
  const [fearLevel, setFearLevel] = useState(50);
  const [fearNote, setFearNote] = useState("");
  const [savingFear, setSavingFear] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    Promise.all([
      fetch(`${apiBase}/me/skills`, { credentials: "include" }).then(r => r.ok ? r.json() : { skills: {} }),
      fetch(`${apiBase}/me/badges`, { credentials: "include" }).then(r => r.ok ? r.json() : { badges: [] }),
      fetch(`${apiBase}/me/fear-meter`, { credentials: "include" }).then(r => r.ok ? r.json() : { entries: [] }),
    ]).then(([sk, bg, fm]) => {
      setSkills(sk.skills ?? {});
      setBadges(bg.badges ?? []);
      setFearEntries(fm.entries ?? []);
    }).finally(() => setLoading(false));
  }, [apiBase]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveFear = async () => {
    setSavingFear(true);
    try {
      await fetch(`${apiBase}/me/fear-meter`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: fearLevel, note: fearNote }),
      });
      setFearNote("");
      refresh();
    } finally { setSavingFear(false); }
  };

  const skillKeys = Object.keys(SKILL_LABELS_AR);
  const maxScore = Math.max(50, ...Object.values(skills));
  const latestFear = fearEntries[0];

  if (loading) {
    return <div className="py-12 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Skills map */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> خريطة مهاراتك
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {skillKeys.map(k => {
              const v = skills[k] ?? 0;
              const pct = Math.min(100, Math.round((v / maxScore) * 100));
              return (
                <div key={k} className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold">{SKILL_LABELS_AR[k]}</span>
                    <span className="text-xs text-muted-foreground">{v}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fear meter */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" /> مقياس الخوف
          </h3>
          <p className="text-sm text-muted-foreground">سجّل مستوى توترك من المشاركة العلنية اليوم (0 = هادئ تماماً، 100 = قلق شديد).</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold w-14 text-center">{fearLevel}</span>
            <input type="range" min={0} max={100} value={fearLevel}
              onChange={(e) => setFearLevel(Number(e.target.value))}
              className="flex-1" />
          </div>
          <input type="text" value={fearNote} onChange={(e) => setFearNote(e.target.value)}
            placeholder="ملاحظة (اختياري)..."
            className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
          <Button onClick={saveFear} disabled={savingFear} size="sm">
            {savingFear && <Loader2 className="w-4 h-4 animate-spin me-2" />}
            تسجيل القراءة
          </Button>
          {latestFear && (
            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              آخر قراءة: <strong>{latestFear.level}</strong> — {new Date(latestFear.createdAt).toLocaleDateString("ar")}
              {fearEntries.length >= 2 && (() => {
                const trend = latestFear.level - fearEntries[fearEntries.length - 1].level;
                return (
                  <span className={`ms-2 ${trend < 0 ? "text-green-600" : trend > 0 ? "text-rose-600" : ""}`}>
                    {trend < 0 ? `↓ تحسّن ${Math.abs(trend)}` : trend > 0 ? `↑ ارتفاع ${trend}` : "ثابت"}
                  </span>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> شاراتك
          </h3>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد شارات بعد — ابدأ بإنجاز الأنشطة!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {badges.map(b => {
                const Icon = ICON_MAP[b.icon ?? "Award"] ?? Award;
                return (
                  <div key={b.id} className={`p-4 rounded-xl border text-center ${b.owned ? "border-amber-300 bg-amber-50" : "border-border bg-muted/20 opacity-60"}`}>
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${b.owned ? "text-amber-600" : "text-muted-foreground"}`} />
                    <p className="font-bold text-sm">{b.titleAr}</p>
                    {b.descriptionAr && <p className="text-xs text-muted-foreground mt-1 leading-snug">{b.descriptionAr}</p>}
                    {b.owned && b.awardedAt && (
                      <p className="text-[10px] text-amber-700 mt-2">{new Date(b.awardedAt).toLocaleDateString("ar")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
