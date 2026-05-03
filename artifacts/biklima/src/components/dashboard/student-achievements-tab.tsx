import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  Lock,
  Mic,
  Play,
  ClipboardList,
  Star,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";
import { useMyBadges } from "@/hooks/use-dashboard-data";

type Lang = "ar" | "en";

type BadgeCard = {
  key: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  icon: string;
  colorClass: string;
  earnedAt?: string;
};

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "play-circle": Play,
  "mic": Mic,
  "clipboard-check": ClipboardList,
  "trending-up": Star,
  "graduation-cap": Award,
  "sparkles": Sparkles,
  "shield-check": ShieldCheck,
  "award": Award,
};

export default function StudentAchievementsTab({ lang }: { lang: Lang }) {
  const isAr = lang === "ar";
  const { user } = useAuth();
  const { data, isLoading } = useMyBadges(user?.id ?? null);

  const earned: BadgeCard[] = [];
  const locked: BadgeCard[] = [];
  for (const b of data?.badges ?? []) {
    const card: BadgeCard = {
      key: b.key, titleAr: b.titleAr, titleEn: b.titleEn,
      descriptionAr: b.descriptionAr, descriptionEn: b.descriptionEn,
      icon: b.icon, colorClass: b.colorClass,
      earnedAt: b.earnedAt ?? undefined,
    };
    if (b.earned) earned.push(card); else locked.push(card);
  }
  earned.sort((a, b) => {
    const ta = a.earnedAt ? new Date(a.earnedAt).getTime() : 0;
    const tb = b.earnedAt ? new Date(b.earnedAt).getTime() : 0;
    return tb - ta;
  });

  const renderCard = (b: BadgeCard, isEarned: boolean) => {
    const Icon = BADGE_ICONS[b.icon] ?? Award;
    return (
      <div
        key={b.key}
        className={`rounded-2xl p-5 border ${isEarned ? "border-border bg-card" : "border-dashed border-border/60 bg-muted/30 opacity-70"}`}
        data-testid={`badge-${b.key}-${isEarned ? "earned" : "locked"}`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEarned ? b.colorClass : "bg-muted text-muted-foreground"}`}>
            {isEarned ? <Icon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm">{isAr ? b.titleAr : b.titleEn}</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isAr ? (b.descriptionAr ?? "") : (b.descriptionEn ?? "")}
            </p>
            {isEarned && b.earnedAt && (
              <p className="text-[10px] text-muted-foreground mt-2">
                {isAr ? "حصلت عليها في " : "Earned on "}
                {(() => { try { return new Date(b.earnedAt!).toLocaleDateString(isAr ? "ar-EG" : "en-US"); } catch { return b.earnedAt; } })()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8 space-y-6">
        <div>
          <h3 className="font-bold text-xl flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {isAr ? "إنجازاتي" : "My Achievements"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr
              ? "اجمع شارات بكلمة كلما تقدّمت في رحلتك التعليمية."
              : "Collect Bikalima badges as you progress in your learning journey."}
          </p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {earned.length === 0 ? (
              <div className="text-center py-10 space-y-3" data-testid="badges-empty">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-10 h-10 text-primary/50" />
                </div>
                <p className="text-sm font-medium">
                  {isAr ? "لم تحصل على أي شارة بعد." : "You haven't earned any badges yet."}
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  {isAr
                    ? "أكمل أول درس أو ارفع أول خطاب لك للحصول على شارتك الأولى."
                    : "Complete your first lesson or upload your first speech to earn your first badge."}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                  {isAr ? `محصّلة (${earned.length})` : `Earned (${earned.length})`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {earned.map((b) => renderCard(b, true))}
                </div>
              </div>
            )}
            {locked.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                  {isAr ? `لم تُكتسب بعد (${locked.length})` : `Not earned yet (${locked.length})`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {locked.map((b) => renderCard(b, false))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
