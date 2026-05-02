import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Layout as LayoutIcon, Save, Eye, EyeOff, ChevronUp, ChevronDown,
  CheckCircle, FileEdit, AlertCircle,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch, type HomeSectionRecord, HOME_SECTION_LABELS,
} from "./_shared";

type Editable = HomeSectionRecord & {
  contentArText: string;
  contentEnText: string;
  dirty: boolean;
  jsonError: string | null;
};

function toEditable(s: HomeSectionRecord): Editable {
  return {
    ...s,
    contentArText: s.contentAr ? JSON.stringify(s.contentAr, null, 2) : "",
    contentEnText: s.contentEn ? JSON.stringify(s.contentEn, null, 2) : "",
    dirty: false,
    jsonError: null,
  };
}

function tryParseJson(text: string): { ok: true; value: Record<string, unknown> | null } | { ok: false; err: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, value: null };
  try {
    const v = JSON.parse(trimmed);
    if (v !== null && typeof v !== "object") return { ok: false, err: "JSON must be an object" };
    return { ok: true, value: v };
  } catch (e) {
    return { ok: false, err: (e as Error).message };
  }
}

export default function AdminHomePage() {
  const apiFetch = useApiFetch();
  const [sections, setSections] = useState<Editable[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/home-sections");
      if (res.ok) {
        const data = await res.json();
        const list = (data.sections as HomeSectionRecord[]).map(toEditable);
        list.sort((a, b) => a.orderIndex - b.orderIndex);
        setSections(list);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const update = (key: string, patch: Partial<Editable>) => {
    setSections((prev) =>
      prev.map((s) => (s.sectionKey === key ? { ...s, ...patch, dirty: true } : s)),
    );
  };

  const moveOrder = (key: string, dir: -1 | 1) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.sectionKey === key);
      if (idx < 0) return prev;
      const swap = idx + dir;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(swap, 0, item);
      return next.map((s, i) => ({ ...s, orderIndex: i, dirty: s.dirty || s.orderIndex !== i }));
    });
  };

  const save = async (key: string) => {
    const sec = sections.find((s) => s.sectionKey === key);
    if (!sec) return;
    const ar = tryParseJson(sec.contentArText);
    const en = tryParseJson(sec.contentEnText);
    if (!ar.ok || !en.ok) {
      update(key, { jsonError: ar.ok ? (en as { ok: false; err: string }).err : (ar as { ok: false; err: string }).err });
      return;
    }
    setSavingKey(key);
    setSavedKey(null);
    try {
      const res = await apiFetch(`/admin/home-sections/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentAr: ar.value,
          contentEn: en.value,
          visible: sec.visible,
          orderIndex: sec.orderIndex,
          status: sec.status,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSections((prev) => prev.map((s) => (s.sectionKey === key ? toEditable(data.section) : s)));
        setSavedKey(key);
        setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2200);
      } else {
        const data = await res.json().catch(() => ({}));
        update(key, { jsonError: data.error || "تعذّر الحفظ" });
      }
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <AdminLayout activeKey="home-page">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold flex items-center gap-2 text-lg">
            <LayoutIcon className="w-5 h-5 text-primary" /> إدارة الصفحة الرئيسية
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            تحكّم في ترتيب وإظهار وحفظ المحتوى لكل قسم من أقسام الصفحة الرئيسية. القيم الفارغة تستخدم النص الافتراضي من ترجمات الموقع.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s, idx) => {
            const label = HOME_SECTION_LABELS[s.sectionKey] ?? s.sectionKey;
            const isFirst = idx === 0;
            const isLast = idx === sections.length - 1;
            return (
              <Card key={s.sectionKey}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon" variant="outline"
                        className="h-8 w-8"
                        disabled={isFirst}
                        onClick={() => moveOrder(s.sectionKey, -1)}
                        data-testid={`hp-move-up-${s.sectionKey}`}
                        aria-label="نقل للأعلى"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon" variant="outline"
                        className="h-8 w-8"
                        disabled={isLast}
                        onClick={() => moveOrder(s.sectionKey, 1)}
                        data-testid={`hp-move-down-${s.sectionKey}`}
                        aria-label="نقل للأسفل"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted text-muted-foreground">{s.sectionKey}</span>
                        {label}
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant={s.visible ? "default" : "outline"}
                      className={s.visible ? "bg-primary text-white" : ""}
                      onClick={() => update(s.sectionKey, { visible: !s.visible })}
                      data-testid={`hp-toggle-visible-${s.sectionKey}`}
                    >
                      {s.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span className="ms-1.5">{s.visible ? "ظاهر" : "مخفي"}</span>
                    </Button>
                    <select
                      className="border rounded-lg px-2 py-1.5 text-sm bg-background"
                      value={s.status}
                      onChange={(e) => update(s.sectionKey, { status: e.target.value as "draft" | "published" })}
                      data-testid={`hp-status-${s.sectionKey}`}
                    >
                      <option value="published">منشور</option>
                      <option value="draft">مسودة</option>
                    </select>
                    <Input
                      type="number"
                      className="w-20"
                      value={s.orderIndex}
                      onChange={(e) => update(s.sectionKey, { orderIndex: parseInt(e.target.value, 10) || 0 })}
                      aria-label="الترتيب"
                    />
                    <Button
                      onClick={() => save(s.sectionKey)}
                      disabled={!s.dirty || savingKey === s.sectionKey}
                      className="bg-primary text-white gap-1"
                      data-testid={`hp-save-${s.sectionKey}`}
                    >
                      {savingKey === s.sectionKey
                        ? <span className="animate-pulse">...</span>
                        : savedKey === s.sectionKey
                          ? <CheckCircle className="w-4 h-4" />
                          : <Save className="w-4 h-4" />}
                      <span>{savedKey === s.sectionKey ? "تم الحفظ" : "حفظ"}</span>
                    </Button>
                  </div>

                  {s.jsonError && (
                    <div className="flex items-center gap-1.5 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span dir="ltr" className="font-mono">{s.jsonError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">المحتوى (عربي) — JSON</label>
                      <textarea
                        className="w-full border rounded-lg p-2 text-xs font-mono resize-y bg-background min-h-[120px]"
                        value={s.contentArText}
                        onChange={(e) => update(s.sectionKey, { contentArText: e.target.value, jsonError: null })}
                        placeholder='{ "headline": "...", "subhead": "..." }'
                        dir="ltr"
                        data-testid={`hp-content-ar-${s.sectionKey}`}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Content (English) — JSON</label>
                      <textarea
                        className="w-full border rounded-lg p-2 text-xs font-mono resize-y bg-background min-h-[120px]"
                        value={s.contentEnText}
                        onChange={(e) => update(s.sectionKey, { contentEnText: e.target.value, jsonError: null })}
                        placeholder='{ "headline": "...", "subhead": "..." }'
                        dir="ltr"
                        data-testid={`hp-content-en-${s.sectionKey}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t pt-2">
                    {s.status === "draft"
                      ? <><FileEdit className="w-3 h-3" /> مسودة — لن تظهر للزوار حتى يتم النشر</>
                      : <><CheckCircle className="w-3 h-3 text-green-600" /> منشور</>}
                    {s.publishedAt && <span className="ms-auto">آخر نشر: {new Date(s.publishedAt).toLocaleString("ar-SA")}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
