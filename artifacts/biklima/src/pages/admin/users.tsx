import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Trash2, Edit3, Save, X } from "lucide-react";
import { AdminLayout } from "./_layout";
import { useApiFetch, ROLE_LABELS_AR, type UserRecord } from "./_shared";
import { useMe, type Role } from "@/hooks/use-me";

export default function AdminUsersPage() {
  const apiFetch = useApiFetch();
  const { user: me, refresh: refreshMe } = useMe();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });

  const fetchUsers = useCallback(async () => {
    const res = await apiFetch("/admin/users");
    if (res.ok) setUsers((await res.json()).users);
  }, [apiFetch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا المستخدم؟")) return;
    const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) setUsers((u) => u.filter((x) => x.id !== id));
  };

  const startEdit = (u: UserRecord) => {
    setEditingId(u.id);
    setEditForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await apiFetch(`/admin/users/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const d = await res.json();
      setUsers((u) => u.map((x) => (x.id === editingId ? { ...x, ...d.user } : x)));
      setEditingId(null);
    }
  };

  const updateRole = async (userId: string, newRole: Role) => {
    const res = await apiFetch(`/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "تعذّر تحديث الدور");
      return;
    }
    const data = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u)));
    if (me?.id === userId) refreshMe();
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.firstName || "").toLowerCase().includes(q) ||
      (u.lastName || "").toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout activeKey="users">
      <Card><CardContent className="p-5">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h2 className="font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> المستخدمون ({filtered.length})</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
              className="text-sm border rounded-lg p-2 bg-background"
              aria-label="تصفية حسب الدور"
            >
              <option value="all">كل الأدوار</option>
              {(Object.keys(ROLE_LABELS_AR) as Role[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS_AR[r]}</option>
              ))}
            </select>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-muted-foreground">
              <th className="text-start py-2 px-3 font-medium">الاسم</th>
              <th className="text-start py-2 px-3 font-medium">البريد</th>
              <th className="text-start py-2 px-3 font-medium">الدور</th>
              <th className="text-start py-2 px-3 font-medium">التسجيل</th>
              <th className="text-end py-2 px-3 font-medium">إجراءات</th>
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="py-2 px-3">{editingId === u.id ? (
                    <div className="flex gap-1">
                      <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="h-7 text-xs w-20" placeholder="الأول" />
                      <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="h-7 text-xs w-20" placeholder="العائلة" />
                    </div>
                  ) : <span className="font-medium">{u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "—"}</span>}</td>
                  <td className="py-2 px-3 text-muted-foreground">{editingId === u.id ? <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-7 text-xs w-40" /> : u.email}</td>
                  <td className="py-2 px-3">
                    {u.email.toLowerCase() === "info@bikalima.com" ? (
                      <span className="text-xs font-bold text-primary" title="حساب المدير العام — لا يمكن تغيير دوره">
                        {ROLE_LABELS_AR[u.role]} 🛡️
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value as Role)}
                        className="text-xs border rounded p-1 bg-background"
                        aria-label="الدور"
                      >
                        {(Object.keys(ROLE_LABELS_AR) as Role[]).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS_AR[r]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
                  <td className="py-2 px-3 text-end">
                    {editingId === u.id ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={saveEdit} className="h-7 w-7 p-0 text-green-600"><Save className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(u)} className="h-7 w-7 p-0 text-blue-600"><Edit3 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">لا يوجد مستخدمون مطابقون</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </AdminLayout>
  );
}
