import { Router, type IRouter, type Request, type Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db, messageTemplatesTable } from "@workspace/db";
import { requireRole } from "../lib/admin.js";

const router: IRouter = Router();

function gate(req: Request, res: Response): boolean {
  return requireRole(req, res, "sales");
}

const DEFAULT_TEMPLATES = [
  {
    key: "first_contact",
    titleAr: "أول تواصل بعد تسجيل الاهتمام",
    bodyAr:
      "أهلاً {name} 👋\n\nأنا من فريق *بكلمة*. وصلنا اهتمامك ببرنامج *{programTitle}* — سعيدون جداً بك!\n\nمتى يناسبك مكالمة قصيرة لشرح الخطوات والإجابة على أي استفسار؟ 🎙️",
    placeholders: ["name", "programTitle"],
  },
  {
    key: "consultation_confirm",
    titleAr: "تأكيد جلسة الاستشارة",
    bodyAr:
      "أهلاً {name} ✨\n\nتم تأكيد جلستك المجانية يوم *{date}* الساعة *{time}*.\n\nرابط الاتصال: {zoomLink}\n\nبانتظارك! — فريق بكلمة",
    placeholders: ["name", "date", "time", "zoomLink"],
  },
  {
    key: "payment_link",
    titleAr: "إرسال رابط الدفع",
    bodyAr:
      "أهلاً {name} 💳\n\nيسعدنا تأكيد مكانك في برنامج *{programTitle}*. هذا رابط الدفع الآمن:\n\n{paymentLink}\n\nبعد إتمام الدفع، سنرسل لك تفاصيل الانضمام مباشرة. 🚀",
    placeholders: ["name", "programTitle", "paymentLink"],
  },
  {
    key: "speech_eval_followup",
    titleAr: "متابعة بعد تقييم الخطاب",
    bodyAr:
      "أهلاً {name} 🎙️\n\nاطّلع فريقنا على خطابك وعندنا ملاحظات قيّمة جداً نحب نشاركها معك.\n\nهل يناسبك مكالمة سريعة هذا الأسبوع لمراجعتها سوياً؟",
    placeholders: ["name"],
  },
  {
    key: "stale_revival",
    titleAr: "إعادة تنشيط عميل خامل",
    bodyAr:
      "أهلاً {name} 🌿\n\nمر وقت من آخر تواصل بيننا — هل ما زال اهتمامك ببرنامج *{programTitle}* قائماً؟\n\nنحن هنا متى احتجت أي معلومة. ✨",
    placeholders: ["name", "programTitle"],
  },
];

let seeded = false;
async function seedDefaults() {
  if (seeded) return;
  for (const t of DEFAULT_TEMPLATES) {
    const exists = await db
      .select({ id: messageTemplatesTable.id })
      .from(messageTemplatesTable)
      .where(eq(messageTemplatesTable.key, t.key))
      .limit(1);
    if (exists.length > 0) continue;
    await db.insert(messageTemplatesTable).values({
      key: t.key,
      titleAr: t.titleAr,
      bodyAr: t.bodyAr,
      placeholders: t.placeholders,
      channel: "whatsapp",
      isActive: true,
    });
  }
  seeded = true;
}

router.get("/admin/message-templates", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    await seedDefaults();
    const rows = await db
      .select()
      .from(messageTemplatesTable)
      .orderBy(desc(messageTemplatesTable.isActive), desc(messageTemplatesTable.createdAt));
    res.set("Cache-Control", "no-store");
    res.json({ templates: rows });
  } catch (err) {
    req.log.error({ err }, "[templates] list failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.post("/admin/message-templates", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const body = req.body ?? {};
    const key = String(body.key ?? "").trim() || `tpl_${Date.now()}`;
    const titleAr = String(body.titleAr ?? "").trim();
    const bodyAr = String(body.bodyAr ?? "").trim();
    if (!titleAr || !bodyAr) return res.status(400).json({ error: "title_body_required" });
    const placeholders = Array.from(new Set(Array.from(bodyAr.matchAll(/\{(\w+)\}/g)).map((m) => m[1])));
    const [created] = await db
      .insert(messageTemplatesTable)
      .values({
        key,
        titleAr,
        bodyAr,
        titleEn: body.titleEn ?? null,
        bodyEn: body.bodyEn ?? null,
        placeholders,
        channel: body.channel ?? "whatsapp",
        isActive: body.isActive !== false,
      })
      .returning();
    res.json({ template: created });
  } catch (err) {
    req.log.error({ err }, "[templates] create failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.patch("/admin/message-templates/:id", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    const id = req.params.id;
    const body = req.body ?? {};
    const patch: Partial<typeof messageTemplatesTable.$inferInsert> = {};
    if (typeof body.titleAr === "string") patch.titleAr = body.titleAr;
    if (typeof body.bodyAr === "string") {
      patch.bodyAr = body.bodyAr;
      patch.placeholders = Array.from(new Set(Array.from(body.bodyAr.matchAll(/\{(\w+)\}/g)).map((m: RegExpMatchArray) => m[1])));
    }
    if (typeof body.titleEn === "string") patch.titleEn = body.titleEn;
    if (typeof body.bodyEn === "string") patch.bodyEn = body.bodyEn;
    if (typeof body.channel === "string") patch.channel = body.channel as never;
    if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
    const [updated] = await db
      .update(messageTemplatesTable)
      .set(patch)
      .where(eq(messageTemplatesTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "not_found" });
    res.json({ template: updated });
  } catch (err) {
    req.log.error({ err }, "[templates] update failed");
    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/admin/message-templates/:id", async (req: Request, res: Response) => {
  if (!gate(req, res)) return;
  try {
    await db.delete(messageTemplatesTable).where(eq(messageTemplatesTable.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "[templates] delete failed");
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
