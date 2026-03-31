import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Trash2,
  Edit3,
  Save,
  X,
  Home,
  Shield,
  TrendingUp,
  UserPlus,
  Calendar,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type UserRecord = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt?: string;
};

type Stats = {
  totalUsers: number;
  todaySignups: number;
  weekSignups: number;
};

function getApiBase() {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function AdminPanel() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<"createdAt" | "email" | "name">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const apiBase = getApiBase();

  const checkAdmin = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/admin/check`, { credentials: "include" });
      const data = await res.json();
      setIsAdmin(data.isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }, [apiBase]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/admin/users`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  }, [apiBase]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/admin/stats`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  }, [apiBase]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      checkAdmin().then(() => {
        fetchUsers();
        fetchStats();
        setLoading(false);
      });
    } else if (!isLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isLoading, isAuthenticated, checkAdmin, fetchUsers, fetchStats]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`${apiBase}/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== id));
      fetchStats();
    }
  };

  const startEdit = (u: UserRecord) => {
    setEditingId(u.id);
    setEditForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`${apiBase}/admin/users/${editingId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(users.map(u => u.id === editingId ? { ...u, ...data.user } : u));
      setEditingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.firstName || "").toLowerCase().includes(q) ||
      (u.lastName || "").toLowerCase().includes(q)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let cmp = 0;
    if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    else if (sortField === "email") cmp = a.email.localeCompare(b.email);
    else cmp = ((a.firstName || "") + (a.lastName || "")).localeCompare((b.firstName || "") + (b.lastName || ""));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-6">Please log in to access the admin panel.</p>
            <Button onClick={() => navigate("/dashboard")} className="bg-primary hover:bg-primary/90 text-white">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">You don't have admin privileges.</p>
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <Home className="w-4 h-4" /> Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-serif text-xl font-bold">لوحة الإدارة — بكلمة</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-1 text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.todaySignups}</p>
                  <p className="text-sm text-muted-foreground">تسجيلات اليوم</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.weekSignups}</p>
                  <p className="text-sm text-muted-foreground">تسجيلات هذا الأسبوع</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                المستخدمون ({filteredUsers.length})
              </h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو البريد..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-start py-3 px-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                      الاسم <SortIcon field="name" />
                    </th>
                    <th className="text-start py-3 px-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("email")}>
                      البريد <SortIcon field="email" />
                    </th>
                    <th className="text-start py-3 px-3 font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort("createdAt")}>
                      تاريخ التسجيل <SortIcon field="createdAt" />
                    </th>
                    <th className="text-end py-3 px-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        {editingId === u.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editForm.firstName}
                              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                              placeholder="الاسم الأول"
                              className="h-8 text-xs w-24"
                            />
                            <Input
                              value={editForm.lastName}
                              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                              placeholder="اسم العائلة"
                              className="h-8 text-xs w-24"
                            />
                          </div>
                        ) : (
                          <span className="font-medium">
                            {u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {editingId === u.id ? (
                          <Input
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="h-8 text-xs w-48"
                          />
                        ) : (
                          <span className="text-muted-foreground">{u.email}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(u.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === u.id ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={saveEdit} className="h-7 w-7 p-0 text-green-600 hover:text-green-700">
                                <Save className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-7 w-7 p-0">
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => startEdit(u)} className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700">
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive/80">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground">
                        {search ? "لا توجد نتائج" : "لا يوجد مستخدمون بعد"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
