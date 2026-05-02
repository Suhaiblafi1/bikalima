import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mic2, ExternalLink, ChevronDown, ChevronUp, Mail, Phone, Calendar } from "lucide-react";
import { AdminLayout } from "./_layout";
import {
  useApiFetch,
  StatusBadge,
  SPEECH_EVAL_STATUS_OPTIONS,
  type SpeechEvaluationRecord,
} from "./_shared";

export default function AdminSpeechEvaluationsPage() {
  const apiFetch = useApiFetch();
  const [items, setItems] = useState<SpeechEvaluationRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch("/admin/speech-evaluations");
    if (res.ok) {
      const data = (await res.json()) as { evaluations: SpeechEvaluationRecord[] };
      setItems(data.evaluations);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateStatus = async (id: string, status: SpeechEvaluationRecord["status"]) => {
    const res = await apiFetch(`/admin/speech-evaluations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const filtered = useMemo(
    () => (statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter)),
    [items, statusFilter],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: items.length };
    SPEECH_EVAL_STATUS_OPTIONS.forEach((o) => (m[o.value] = 0));
    items.forEach((i) => { m[i.status] = (m[i.status] ?? 0) + 1; });
    return m;
  }, [items]);

  return (
    <AdminLayout activeKey="speech-evaluations">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-bold flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-primary" />
              طلبات تقييم الخطاب ({filtered.length})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                }`}
                data-testid="filter-status-all"
              >
                الكل ({counts.all})
              </button>
              {SPEECH_EVAL_STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === s.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                  data-testid={`filter-status-${s.value}`}
                >
                  {s.labelAr} ({counts[s.value] ?? 0})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="w-8" />
                  <th className="text-start py-2 px-3 font-medium">الاسم</th>
                  <th className="text-start py-2 px-3 font-medium">التواصل</th>
                  <th className="text-start py-2 px-3 font-medium">المحتوى</th>
                  <th className="text-start py-2 px-3 font-medium">الحالة</th>
                  <th className="text-start py-2 px-3 font-medium">التاريخ</th>
                  <th className="text-end py-2 px-3 font-medium">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>
                )}
                {!loading && filtered.map((i) => {
                  const isOpen = expandedId === i.id;
                  const waPhone = i.phone.replace(/[^0-9]/g, "");
                  return (
                    <>
                      <tr key={i.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="py-2 px-2 align-top">
                          <button
                            onClick={() => setExpandedId(isOpen ? null : i.id)}
                            className="text-muted-foreground hover:text-primary"
                            aria-label={isOpen ? "إغلاق" : "عرض التفاصيل"}
                            data-testid={`toggle-${i.id}`}
                          >
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-2 px-3 font-medium align-top">{i.fullName}</td>
                        <td className="py-2 px-3 align-top">
                          <div className="flex flex-col gap-1 text-xs">
                            <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1 text-foreground hover:text-primary">
                              <Mail className="w-3 h-3" />{i.email}
                            </a>
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-green-700 hover:text-green-800"
                            >
                              <Phone className="w-3 h-3" />{i.phone}
                            </a>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-xs text-muted-foreground align-top">
                          <div className="flex flex-col gap-1">
                            {i.videoUrl && (
                              <a href={i.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                                <ExternalLink className="w-3 h-3" />فيديو
                              </a>
                            )}
                            {i.transcriptText && (
                              <span className="inline-flex items-center gap-1">
                                نص ({i.transcriptText.length} حرف)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top"><StatusBadge status={i.status} /></td>
                        <td className="py-2 px-3 text-xs text-muted-foreground align-top whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(i.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-end align-top">
                          <select
                            value={i.status}
                            onChange={(e) => updateStatus(i.id, e.target.value as SpeechEvaluationRecord["status"])}
                            className="text-xs border rounded p-1 bg-background"
                            data-testid={`status-select-${i.id}`}
                          >
                            {SPEECH_EVAL_STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.labelAr}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${i.id}-detail`} className="border-b border-border/30 bg-muted/10">
                          <td />
                          <td colSpan={6} className="py-3 px-3">
                            <div className="grid md:grid-cols-2 gap-4 text-xs">
                              {i.transcriptText && (
                                <div className="md:col-span-2">
                                  <div className="font-bold text-muted-foreground mb-1">نص الخطاب</div>
                                  <div className="bg-background border border-border rounded-lg p-3 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                                    {i.transcriptText}
                                  </div>
                                </div>
                              )}
                              {i.videoUrl && (
                                <div>
                                  <div className="font-bold text-muted-foreground mb-1">رابط الفيديو</div>
                                  <a href={i.videoUrl} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
                                    {i.videoUrl}
                                  </a>
                                </div>
                              )}
                              {i.notes && !i.transcriptText && (
                                <div className="md:col-span-2">
                                  <div className="font-bold text-muted-foreground mb-1">ملاحظات</div>
                                  <div className="bg-background border border-border rounded-lg p-3 whitespace-pre-wrap">
                                    {i.notes}
                                  </div>
                                </div>
                              )}
                              {i.leadSource && (
                                <div>
                                  <div className="font-bold text-muted-foreground mb-1">المصدر</div>
                                  <div>{i.leadSource}</div>
                                </div>
                              )}
                              {i.trainerFeedback && (
                                <div className="md:col-span-2">
                                  <div className="font-bold text-muted-foreground mb-1">تقييم المدرّب</div>
                                  <div className="bg-background border border-border rounded-lg p-3 whitespace-pre-wrap">{i.trainerFeedback}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
