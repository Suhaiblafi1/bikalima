import { Fragment, useCallback, useEffect, useState, type FormEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ScrollText, RotateCw } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch } from "./_shared";

type AuditEntry = {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  beforeJson: unknown;
  afterJson: unknown;
  createdAt: string;
};

type AuditResponse = {
  entries: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
};

const PAGE_SIZE = 50;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function AdminAuditLogPage() {
  const apiFetch = useApiFetch();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [actor, setActor] = useState("");
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const load = useCallback(async (nextOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(nextOffset),
      });
      if (actor.trim()) params.set("actor", actor.trim());
      if (entityType.trim()) params.set("entityType", entityType.trim());
      if (action.trim()) params.set("action", action.trim());
      const r = await apiFetch(`/admin/audit-log?${params.toString()}`);
      if (!r.ok) {
        setError("تعذّر تحميل السجل");
        setEntries([]);
        setTotal(0);
        return;
      }
      const d = (await r.json()) as AuditResponse;
      setEntries(d.entries ?? []);
      setTotal(d.total ?? 0);
      setOffset(d.offset ?? nextOffset);
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, actor, entityType, action]);

  useEffect(() => { load(0); }, [load]);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    load(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <AdminLayout activeKey="audit-log">
      <Card className="rounded-2xl">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-lg">سجل العمليات</h1>
            <span className="text-xs text-muted-foreground ms-2">
              {total.toLocaleString("ar-EG")} سجل
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ms-auto h-8"
              onClick={() => load(offset)}
              data-testid="audit-log-refresh"
            >
              <RotateCw className="w-3.5 h-3.5 me-1" /> تحديث
            </Button>
          </div>

          <form onSubmit={onSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <Input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="بريد المنفّذ (جزء)"
              className="text-sm h-9"
              data-testid="audit-log-filter-actor"
            />
            <Input
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="نوع العنصر (مثال: certificate)"
              className="text-sm h-9"
              dir="ltr"
              data-testid="audit-log-filter-entity"
            />
            <Input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="الإجراء (مثال: feature_flag.update)"
              className="text-sm h-9"
              dir="ltr"
              data-testid="audit-log-filter-action"
            />
            <Button type="submit" className="h-9 bg-primary text-white" data-testid="audit-log-apply">
              تطبيق
            </Button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs">
                <tr>
                  <th className="p-2 w-6"></th>
                  <th className="p-2 text-start">الوقت</th>
                  <th className="p-2 text-start">المنفّذ</th>
                  <th className="p-2 text-start">الإجراء</th>
                  <th className="p-2 text-start">العنصر</th>
                  <th className="p-2 text-start">الوصف</th>
                </tr>
              </thead>
              <tbody>
                {loading && entries.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">جاري التحميل…</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">لا توجد سجلات</td></tr>
                ) : entries.map((e) => {
                  const isOpen = expanded.has(e.id);
                  const hasDiff = e.beforeJson != null || e.afterJson != null;
                  return (
                    <Fragment key={e.id}>
                      <tr
                        className="border-t border-border hover:bg-muted/20 cursor-pointer"
                        onClick={() => hasDiff && toggle(e.id)}
                        data-testid={`audit-log-row-${e.id}`}
                      >
                        <td className="p-2 align-top">
                          {hasDiff ? (
                            isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                          ) : null}
                        </td>
                        <td className="p-2 align-top text-xs whitespace-nowrap" dir="ltr">{formatDate(e.createdAt)}</td>
                        <td className="p-2 align-top text-xs" dir="ltr">{e.actorEmail ?? "—"}</td>
                        <td className="p-2 align-top text-xs font-mono" dir="ltr">{e.action}</td>
                        <td className="p-2 align-top text-xs font-mono" dir="ltr">
                          {e.entityType}{e.entityId ? `:${e.entityId.slice(0, 8)}` : ""}
                        </td>
                        <td className="p-2 align-top text-xs">{e.description ?? "—"}</td>
                      </tr>
                      {isOpen && hasDiff && (
                        <tr className="bg-muted/10">
                          <td colSpan={6} className="p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-[11px] font-bold text-muted-foreground mb-1">قبل</p>
                                <pre className="text-[11px] bg-background border border-border rounded-lg p-2 overflow-x-auto max-h-64" dir="ltr">
{JSON.stringify(e.beforeJson ?? null, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-muted-foreground mb-1">بعد</p>
                                <pre className="text-[11px] bg-background border border-border rounded-lg p-2 overflow-x-auto max-h-64" dir="ltr">
{JSON.stringify(e.afterJson ?? null, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <p className="text-xs text-muted-foreground">
              صفحة {currentPage.toLocaleString("ar-EG")} من {totalPages.toLocaleString("ar-EG")}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={offset <= 0 || loading}
                onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
                data-testid="audit-log-prev"
              >
                السابق
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={offset + PAGE_SIZE >= total || loading}
                onClick={() => load(offset + PAGE_SIZE)}
                data-testid="audit-log-next"
              >
                التالي
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
