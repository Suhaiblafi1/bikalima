import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Copy, CheckCheck, Loader2, Plus } from "lucide-react";

interface Invite {
  id: string;
  inviteCode: string;
  status: "pending" | "active" | "revoked";
  parentUserId: string | null;
  relationshipAr: string | null;
  createdAt: string;
  activatedAt: string | null;
}

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

export default function StudentFamilyTab({ lang }: { lang: "ar" | "en" }) {
  const isRtl = lang === "ar";
  const apiBase = getApiBase();
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [relationship, setRelationship] = useState("");

  const load = useCallback(() => {
    fetch(`${apiBase}/parent/my-invites`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setInvites(d.invites ?? []))
      .catch(() => setInvites([]));
  }, [apiBase]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setCreating(true);
    try {
      const r = await fetch(`${apiBase}/parent/invites`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationshipAr: relationship.trim() || null }),
      });
      if (r.ok) { setRelationship(""); load(); }
    } finally { setCreating(false); }
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 md:p-8">
        <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          {isRtl ? "أهلي وأولياء أمري" : "My Family / Parents"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {isRtl
            ? "أنشئ رمز دعوة وأرسله لوالدك أو والدتك ليتمكنا من متابعة تقدّمك."
            : "Generate an invite code and share it with your parent so they can follow your progress."}
        </p>

        <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6">
          <label className="block text-sm font-medium mb-2">
            {isRtl ? "صلة القرابة (اختياري)" : "Relationship (optional)"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder={isRtl ? "أب / أم / ولي أمر" : "Father / Mother / Guardian"}
              className="flex-1 p-2 rounded-lg border border-border text-sm"
            />
            <button
              onClick={create}
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isRtl ? "إنشاء رمز جديد" : "Generate code"}
            </button>
          </div>
        </div>

        {invites === null && (
          <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
        )}
        {invites && invites.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isRtl ? "لم تنشئ أي رمز دعوة بعد" : "No invite codes yet"}
          </p>
        )}
        {invites && invites.length > 0 && (
          <ul className="space-y-2">
            {invites.map(inv => (
              <li key={inv.id} className="border border-border rounded-xl p-3 flex items-center gap-3">
                <code className="px-3 py-1.5 rounded-lg bg-muted font-mono text-base font-bold">{inv.inviteCode}</code>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{inv.relationshipAr ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleDateString(isRtl ? "ar-SA" : undefined)}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  inv.status === "active" ? "bg-emerald-100 text-emerald-700"
                  : inv.status === "revoked" ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
                }`}>
                  {inv.status === "active" ? (isRtl ? "مُفعّل" : "active")
                    : inv.status === "revoked" ? (isRtl ? "مُلغى" : "revoked")
                    : (isRtl ? "بانتظار التفعيل" : "pending")}
                </span>
                {inv.status === "pending" && (
                  <button
                    onClick={() => copy(inv.inviteCode)}
                    className="px-2 py-1 rounded-lg border border-border text-xs inline-flex items-center gap-1"
                  >
                    {copied === inv.inviteCode ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {isRtl ? "نسخ" : "copy"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
