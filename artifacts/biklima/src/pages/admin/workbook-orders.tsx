import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, ShoppingCart } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, StatusBadge, ORDER_STATUS_OPTIONS, type OrderRecord } from "./_shared";

export default function AdminWorkbookOrdersPage() {
  const apiFetch = useApiFetch();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    const res = await apiFetch("/admin/workbook-orders");
    if (res.ok) setOrders((await res.json()).orders);
  }, [apiFetch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/admin/workbook-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const filtered = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = !normalizedSearch || [order.buyerName, order.buyerEmail, order.workbookId]
      .some((value) => value?.toLocaleLowerCase("ar").includes(normalizedSearch));
    return matchesStatus && matchesSearch;
  });

  const exportCsv = () => {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["المشتري", "البريد", "الكراسة", "الصيغة", "الكمية", "المجموع", "الحالة", "التاريخ"],
      ...filtered.map((order) => [
        order.buyerName,
        order.buyerEmail,
        order.workbookId,
        order.format === "pdf" ? "رقمية" : "مطبوعة",
        order.quantity,
        order.totalPrice,
        order.status,
        new Date(order.createdAt).toLocaleDateString("ar-JO"),
      ]),
    ];
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map(escape).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bikalima-workbook-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout activeKey="workbook-orders">
      <Card><CardContent className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> طلبات الكراسات ({filtered.length})
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-56">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <label htmlFor="workbook-orders-search" className="sr-only">البحث في طلبات الكراسات</label>
              <Input id="workbook-orders-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو البريد أو الكراسة" className="pe-9" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" /> تصدير CSV
            </Button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              الكل
            </button>
            {ORDER_STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === s.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {s.labelAr}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-muted-foreground">
              <th className="text-start py-2 px-3 font-medium">المشتري</th>
              <th className="text-start py-2 px-3 font-medium">الكراسة</th>
              <th className="text-start py-2 px-3 font-medium">الصيغة</th>
              <th className="text-start py-2 px-3 font-medium">الكمية</th>
              <th className="text-start py-2 px-3 font-medium">المجموع</th>
              <th className="text-start py-2 px-3 font-medium">الحالة</th>
              <th className="text-start py-2 px-3 font-medium">التاريخ</th>
              <th className="text-end py-2 px-3 font-medium">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="py-2 px-3 font-medium">{o.buyerName}</td>
                  <td className="py-2 px-3">{o.workbookId}</td>
                  <td className="py-2 px-3">{o.format === "pdf" ? "رقمية" : "مطبوعة"}</td>
                  <td className="py-2 px-3">{o.quantity}</td>
                  <td className="py-2 px-3 font-bold">{o.totalPrice} JOD</td>
                  <td className="py-2 px-3"><StatusBadge status={o.status} /></td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</td>
                  <td className="py-2 px-3 text-end">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="text-xs border rounded p-1 bg-background"
                    >
                      {ORDER_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.labelAr}</option>)}
                      {!ORDER_STATUS_OPTIONS.some((s) => s.value === o.status) && (
                        <option value={o.status}>{o.status}</option>
                      )}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">لا توجد طلبات</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </AdminLayout>
  );
}
