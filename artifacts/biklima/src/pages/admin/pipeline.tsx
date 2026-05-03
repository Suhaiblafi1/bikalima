import { useEffect, useState, useCallback, type DragEvent } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { KanbanSquare, Phone, Mail } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, LEAD_STATUS_OPTIONS, leadStatusColor, INTEREST_SCORE_OPTIONS } from "./_shared";

type Lead = {
  id: string; fullName: string; phone: string | null; email: string | null;
  source: string; status: string; interestScore: "hot" | "warm" | "cold" | null;
  interestProgramTitle: string | null; lastContactAt: string | null; createdAt: string;
};

export default function AdminPipelinePage() {
  const apiFetch = useApiFetch();
  const [, navigate] = useLocation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const r = await apiFetch("/admin/leads?limit=500");
    if (r.ok) { const d = await r.json(); setLeads(d.leads ?? []); }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const onDragStart = (id: string) => (e: DragEvent) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (status: string) => (e: DragEvent) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverCol(status);
  };
  const onDrop = (status: string) => async (e: DragEvent) => {
    e.preventDefault();
    setOverCol(null);
    if (!draggingId) return;
    const cur = leads.find((l) => l.id === draggingId);
    if (!cur || cur.status === status) { setDraggingId(null); return; }
    setLeads((prev) => prev.map((l) => (l.id === draggingId ? { ...l, status } : l)));
    setDraggingId(null);
    await apiFetch(`/admin/leads/${cur.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  return (
    <AdminLayout activeKey="pipeline">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><KanbanSquare className="w-5 h-5 text-primary" /> خط الإنتاج (Pipeline)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">اسحب البطاقات بين الأعمدة لتحديث حالة العميل</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : (
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3 min-w-max">
            {LEAD_STATUS_OPTIONS.map((col) => {
              const colLeads = leads.filter((l) => l.status === col.value);
              return (
                <div key={col.value}
                  onDragOver={onDragOver(col.value)} onDrop={onDrop(col.value)}
                  onDragLeave={() => setOverCol(null)}
                  className={`w-72 shrink-0 rounded-2xl border-2 transition ${overCol === col.value ? "border-primary bg-primary/5" : "border-border/50 bg-muted/20"}`}>
                  <div className={`px-3 py-2 rounded-t-2xl text-xs font-bold flex items-center justify-between ${col.color}`}>
                    <span>{col.labelAr}</span>
                    <span className="bg-white/70 text-foreground px-1.5 py-0.5 rounded-full text-[10px]">{colLeads.length}</span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[200px] max-h-[70vh] overflow-y-auto">
                    {colLeads.map((l) => {
                      const score = INTEREST_SCORE_OPTIONS.find((s) => s.value === l.interestScore);
                      return (
                        <Card key={l.id} draggable onDragStart={onDragStart(l.id)}
                          onClick={() => navigate(`/admin/leads/${l.id}`)}
                          className={`cursor-grab active:cursor-grabbing hover:shadow-md transition ${draggingId === l.id ? "opacity-50" : ""}`}>
                          <CardContent className="p-2.5 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-xs truncate flex-1">{l.fullName}</p>
                              {score && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${score.color}`}>{score.labelAr}</span>}
                            </div>
                            {l.interestProgramTitle && <p className="text-[10px] text-muted-foreground truncate">{l.interestProgramTitle}</p>}
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground" dir="ltr">
                              {l.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{l.phone.slice(-7)}</span>}
                              {l.email && <Mail className="w-2.5 h-2.5" />}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {colLeads.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-6">— فارغ —</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`fixed bottom-3 ${leadStatusColor("new").startsWith("hidden") ? "" : ""}`} />
    </AdminLayout>
  );
}
