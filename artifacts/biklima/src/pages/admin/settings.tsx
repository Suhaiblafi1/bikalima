import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Save, Globe, Phone, Share2, FileText } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, type SiteSettingsRecord } from "./_shared";

type Field = keyof Omit<SiteSettingsRecord, "id" | "updatedAt">;

const SECTIONS: {
  title: string;
  icon: React.ReactNode;
  fields: { key: Field; label: string; placeholder?: string; dir?: "ltr" | "rtl"; type?: "text" | "textarea" | "select"; options?: { value: string; label: string }[] }[];
}[] = [
  {
    title: "الهوية واللغة",
    icon: <Globe className="w-4 h-4 text-primary" />,
    fields: [
      { key: "siteNameAr", label: "اسم الموقع (عربي)", placeholder: "بكلمة" },
      { key: "siteNameEn", label: "اسم الموقع (إنجليزي)", placeholder: "Bikalima", dir: "ltr" },
      { key: "logoUrl", label: "رابط الشعار", placeholder: "https://...", dir: "ltr" },
      { key: "defaultLang", label: "اللغة الافتراضية", type: "select", options: [
        { value: "ar", label: "العربية" }, { value: "en", label: "English" },
      ] },
      { key: "defaultCurrency", label: "العملة الافتراضية", placeholder: "USD / JOD", dir: "ltr" },
    ],
  },
  {
    title: "بيانات التواصل",
    icon: <Phone className="w-4 h-4 text-primary" />,
    fields: [
      { key: "contactEmail", label: "البريد الإلكتروني", placeholder: "info@bikalima.com", dir: "ltr" },
      { key: "contactPhone", label: "رقم الهاتف", placeholder: "+962...", dir: "ltr" },
      { key: "whatsappNumber", label: "رقم واتساب", placeholder: "+962...", dir: "ltr" },
    ],
  },
  {
    title: "روابط التواصل الاجتماعي",
    icon: <Share2 className="w-4 h-4 text-primary" />,
    fields: [
      { key: "facebookUrl", label: "Facebook URL", placeholder: "https://facebook.com/...", dir: "ltr" },
      { key: "instagramUrl", label: "Instagram URL", placeholder: "https://instagram.com/...", dir: "ltr" },
      { key: "youtubeUrl", label: "YouTube URL", placeholder: "https://youtube.com/...", dir: "ltr" },
      { key: "twitterUrl", label: "Twitter / X URL", placeholder: "https://x.com/...", dir: "ltr" },
    ],
  },
  {
    title: "السياسات والشروط",
    icon: <FileText className="w-4 h-4 text-primary" />,
    fields: [
      { key: "privacyPolicyAr", label: "سياسة الخصوصية (عربي)", type: "textarea", placeholder: "نص سياسة الخصوصية..." },
      { key: "privacyPolicyEn", label: "Privacy Policy (English)", type: "textarea", placeholder: "Privacy policy text...", dir: "ltr" },
      { key: "termsAr", label: "شروط الاستخدام (عربي)", type: "textarea", placeholder: "نص الشروط..." },
      { key: "termsEn", label: "Terms of Service (English)", type: "textarea", placeholder: "Terms text...", dir: "ltr" },
    ],
  },
];

export default function AdminSettingsPage() {
  const apiFetch = useApiFetch();
  const [settings, setSettings] = useState<SiteSettingsRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        const next: Record<string, string> = {};
        SECTIONS.forEach((s) => s.fields.forEach((f) => {
          const v = data.settings?.[f.key];
          next[f.key] = v == null ? "" : String(v);
        }));
        setForm(next);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setSavedAt(new Date().toLocaleTimeString("ar-SA"));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "تعذّر الحفظ");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout activeKey="settings">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-bold flex items-center gap-2 text-lg">
            <SettingsIcon className="w-5 h-5 text-primary" /> إعدادات الموقع
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            هذه الإعدادات تُستخدم لعرض بيانات الموقع وروابط التواصل والنصوص القانونية.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="text-xs text-green-700">
              تم الحفظ — {savedAt}
            </span>
          )}
          {settings?.updatedAt && (
            <span className="text-xs text-muted-foreground">
              آخر تعديل: {new Date(settings.updatedAt).toLocaleDateString("ar-SA")}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-primary text-white gap-1"
          >
            <Save className="w-4 h-4" /> {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        SECTIONS.map((section) => (
          <Card key={section.title}><CardContent className="p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-sm border-b pb-2">
              {section.icon} {section.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.fields.map((f) => {
                const value = form[f.key] ?? "";
                const isFullWidth = f.type === "textarea";
                return (
                  <div key={f.key} className={isFullWidth ? "sm:col-span-2" : ""}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {f.label}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        className="w-full border rounded-lg p-2 text-sm resize-y bg-background min-h-[120px]"
                        value={value}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        dir={f.dir}
                      />
                    ) : f.type === "select" && f.options ? (
                      <select
                        value={value}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm bg-background"
                      >
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        dir={f.dir}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent></Card>
        ))
      )}
    </AdminLayout>
  );
}
