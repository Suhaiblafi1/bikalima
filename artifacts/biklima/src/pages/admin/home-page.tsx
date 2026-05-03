import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Layout as LayoutIcon, Save, Eye, EyeOff, ChevronUp, ChevronDown,
  CheckCircle, FileEdit,
} from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch, type HomeSectionRecord, HOME_SECTION_LABELS,
} from "./_shared";
import {
  HOME_SECTION_KEYS, SECTION_FIELDS, type SectionKey, type FieldDef,
} from "@/cms/sections-schema";

type Lang = "ar" | "en";

type Editable = HomeSectionRecord & {
  arValues: Record<string, string>;
  enValues: Record<string, string>;
  dirty: boolean;
};

function bagToValues(bag: Record<string, unknown> | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!bag) return out;
  for (const [k, v] of Object.entries(bag)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

function toEditable(s: HomeSectionRecord): Editable {
  return {
    ...s,
    arValues: bagToValues(s.contentAr),
    enValues: bagToValues(s.contentEn),
    dirty: false,
  };
}

function fieldsFor(key: string): FieldDef[] {
  return (SECTION_FIELDS as Record<string, FieldDef[]>)[key] ?? [];
}

export default function AdminHomePage() {
  const apiFetch = useApiFetch();
  const [sections, setSections] = useState<Editable[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<{ key: string; msg: string } | null>(null);

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/home-sections");
      if (res.ok) {
        const data = await res.json();
        const list = (data.sections as HomeSectionRecord[]).map(toEditable);
        list.sort((a, b) => a.orderIndex - b.orderIndex);
        // Always render the canonical 11 keys in their declared order on
        // first paint; existing rows keep their saved order_index.
        const byKey = new Map(list.map((s) => [s.sectionKey, s] as const));
        const canonical = HOME_SECTION_KEYS
          .map((k) => byKey.get(k))
          .filter((x): x is Editable => Boolean(x));
        // Append any unexpected keys at the end (defensive).
        for (const s of list) {
          if (!HOME_SECTION_KEYS.includes(s.sectionKey as SectionKey)) {
            canonical.push(s);
          }
        }
        setSections(canonical);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const updateMeta = (key: string, patch: Partial<Editable>) => {
    setSections((prev) =>
      prev.map((s) => (s.sectionKey === key ? { ...s, ...patch, dirty: true } : s)),
    );
  };

  const updateField = (key: string, lang: Lang, fieldKey: string, value: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.sectionKey !== key) return s;
        const bag = lang === "ar" ? { ...s.arValues, [fieldKey]: value } : s.arValues;
        const enBag = lang === "en" ? { ...s.enValues, [fieldKey]: value } : s.enValues;
        return { ...s, arValues: bag, enValues: enBag, dirty: true };
      }),
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
      // Reassign orderIndex by position; mark moved rows dirty so the admin
      // can save the new order with the regular Save button.
      return next.map((s, i) => {
        const newIdx = i;
        return s.orderIndex === newIdx ? s : { ...s, orderIndex: newIdx, dirty: true };
      });
    });
  };

  const save = async (key: string) => {
    const sec = sections.find((s) => s.sectionKey === key);
    if (!sec) return;
    setSavingKey(key);
    setSavedKey(null);
    setErrorKey(null);
    try {
      const res = await apiFetch(`/admin/home-sections/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentAr: sec.arValues,
          contentEn: sec.enValues,
          visible: sec.visible,
          orderIndex: sec.orderIndex,
          status: sec.status,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSections((prev) =>
          prev.map((s) => (s.sectionKey === key ? toEditable(data.section) : s)),
        );
        setSavedKey(key);
        setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 2200);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorKey({ key, msg: data.error || "تعذّر الحفظ" });
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
            عدّل نصوص كل قسم بالعربية والإنجليزية، أو أعد ترتيب الأقسام، أو أخفِها مؤقتاً. التغييرات تُحفظ لكل قسم على حدة وتظهر في الموقع فور الحفظ.
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
            const fields = fieldsFor(s.sectionKey);
            return (
              <Card key={s.sectionKey}>
                <CardContent className="p-4 space-y-4">
                  {/* Header strip — order arrows, label, visibility, status, save */}
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
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-muted text-muted-foreground">
                          {s.sectionKey}
                        </span>
                        {label}
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant={s.visible ? "default" : "outline"}
                      className={s.visible ? "bg-primary text-white" : ""}
                      onClick={() => updateMeta(s.sectionKey, { visible: !s.visible })}
                      data-testid={`hp-toggle-visible-${s.sectionKey}`}
                    >
                      {s.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span className="ms-1.5">{s.visible ? "ظاهر" : "مخفي"}</span>
                    </Button>
                    <select
                      className="border rounded-lg px-2 py-1.5 text-sm bg-background"
                      value={s.status}
                      onChange={(e) =>
                        updateMeta(s.sectionKey, { status: e.target.value as "draft" | "published" })
                      }
                      data-testid={`hp-status-${s.sectionKey}`}
                    >
                      <option value="published">منشور</option>
                      <option value="draft">مسودة</option>
                    </select>
                    <Input
                      type="number"
                      className="w-20"
                      value={s.orderIndex}
                      onChange={(e) =>
                        updateMeta(s.sectionKey, { orderIndex: parseInt(e.target.value, 10) || 0 })
                      }
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

                  {errorKey && errorKey.key === s.sectionKey && (
                    <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      {errorKey.msg}
                    </div>
                  )}

                  {/* Field editor — friendly inputs (no JSON). AR on the
                      right column, EN on the left so admins see the public
                      site's primary language first. */}
                  {fields.length === 0 ? (
                    <div className="text-[12px] text-muted-foreground italic">
                      لا توجد حقول قابلة للتحرير لهذا القسم.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fields.map((f) => {
                        const arVal = s.arValues[f.key] ?? "";
                        const enVal = s.enValues[f.key] ?? "";
                        return (
                          <div key={f.key} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                                {f.labelAr} <span className="opacity-60">(عربي)</span>
                              </label>
                              {f.type === "textarea" ? (
                                <Textarea
                                  value={arVal}
                                  onChange={(e) => updateField(s.sectionKey, "ar", f.key, e.target.value)}
                                  className="min-h-[90px]"
                                  dir="rtl"
                                  data-testid={`hp-field-ar-${s.sectionKey}-${f.key}`}
                                />
                              ) : (
                                <Input
                                  value={arVal}
                                  onChange={(e) => updateField(s.sectionKey, "ar", f.key, e.target.value)}
                                  dir="rtl"
                                  data-testid={`hp-field-ar-${s.sectionKey}-${f.key}`}
                                />
                              )}
                            </div>
                            <div>
                              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                                {f.labelEn} <span className="opacity-60">(English)</span>
                              </label>
                              {f.type === "textarea" ? (
                                <Textarea
                                  value={enVal}
                                  onChange={(e) => updateField(s.sectionKey, "en", f.key, e.target.value)}
                                  className="min-h-[90px]"
                                  dir="ltr"
                                  data-testid={`hp-field-en-${s.sectionKey}-${f.key}`}
                                />
                              ) : (
                                <Input
                                  value={enVal}
                                  onChange={(e) => updateField(s.sectionKey, "en", f.key, e.target.value)}
                                  dir="ltr"
                                  data-testid={`hp-field-en-${s.sectionKey}-${f.key}`}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t pt-2">
                    {s.status === "draft"
                      ? <><FileEdit className="w-3 h-3" /> مسودة — لن تظهر للزوار حتى يتم النشر</>
                      : <><CheckCircle className="w-3 h-3 text-green-600" /> منشور</>}
                    {s.publishedAt && (
                      <span className="ms-auto">
                        آخر نشر: {new Date(s.publishedAt).toLocaleString("ar-SA")}
                      </span>
                    )}
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
