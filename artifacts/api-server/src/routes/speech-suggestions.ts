import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, speechSuggestionsTable } from "@workspace/db";
import { applyAdHocLimit } from "../middlewares/security.js";

const router: IRouter = Router();

/**
 * Someone suggesting a speech worth watching, and what they thought of it.
 *
 * Sign-in is required rather than optional. The value here is a named
 * person's judgement of a talk; an open form on a public page collects link
 * spam instead, and there would be nobody to ask a follow-up question.
 *
 * The opinion is not required. A link with nothing said about it is still a
 * useful pointer, and demanding a paragraph loses most of the submissions
 * that would have come.
 */
const SuggestionSchema = z.object({
  videoUrl: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(8).max(2000)),
  opinion: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(4000))
    .optional(),
});

/**
 * Hosts a speech link may point at.
 *
 * The box asks for YouTube and that is what nearly everyone will paste, but
 * refusing a Vimeo or TED link on a page about studying speeches would be
 * pedantry — those are the same thing to a reader. Anything else is refused,
 * because an open URL field on a public page is an invitation to post
 * somewhere else's advertising.
 */
const ALLOWED_HOSTS = [
  "youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com",
  "vimeo.com", "www.vimeo.com", "player.vimeo.com",
  "ted.com", "www.ted.com",
];

function videoHostProblem(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "الرابط غير صالح. انسخه كاملاً من شريط العنوان.";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "الرابط يجب أن يبدأ بـ http أو https.";
  }
  if (!ALLOWED_HOSTS.includes(url.hostname.toLowerCase())) {
    return "نقبل روابط يوتيوب (وكذلك Vimeo وTED). الصق رابط الفيديو مباشرةً.";
  }
  return null;
}

router.post("/speech-suggestions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "سجّل الدخول لإرسال اقتراحك." });
    return;
  }
  const userId = req.user.id;

  const parsed = SuggestionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "تحقّق من الرابط ثم أعد المحاولة.", issues: parsed.error.issues });
    return;
  }

  const problem = videoHostProblem(parsed.data.videoUrl);
  if (problem) {
    res.status(400).json({ error: problem });
    return;
  }

  // Counted after validation, so a mistyped link does not spend the budget of
  // someone who is genuinely trying. What the limit protects is rows written,
  // and a refused request writes none; malformed floods are cheap to reject
  // and are an IP-level concern, not this person's quota.
  if (!applyAdHocLimit(res, `speech-suggestion:${userId}`, 30, 60 * 60 * 1000)) return;

  const videoUrl = new URL(parsed.data.videoUrl).toString();
  const opinion = parsed.data.opinion?.length ? parsed.data.opinion : null;

  try {
    // The same person sending the same link twice is a double-click or a
    // second thought, not two suggestions. Update rather than pile up.
    const [existing] = await db
      .select({ id: speechSuggestionsTable.id })
      .from(speechSuggestionsTable)
      .where(and(eq(speechSuggestionsTable.userId, userId), eq(speechSuggestionsTable.videoUrl, videoUrl)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(speechSuggestionsTable)
        .set({ opinion, updatedAt: new Date() })
        .where(eq(speechSuggestionsTable.id, existing.id))
        .returning();
      res.status(200).json({ suggestion: updated, updated: true });
      return;
    }

    const [created] = await db
      .insert(speechSuggestionsTable)
      .values({ userId, videoUrl, opinion })
      .returning();
    res.status(201).json({ suggestion: created, updated: false });
  } catch (err) {
    req.log.error({ err }, "POST /speech-suggestions failed");
    req.log?.error({ err }, "speech suggestion failed");
    res.status(500).json({ error: "تعذّر حفظ اقتراحك. حاول مرة أخرى." });
  }
});

/** What this person has already suggested, so the page can say so. */
router.get("/speech-suggestions/mine", async (req: Request, res: Response) => {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const rows = await db
    .select()
    .from(speechSuggestionsTable)
    .where(eq(speechSuggestionsTable.userId, req.user.id))
    .orderBy(desc(speechSuggestionsTable.createdAt))
    .limit(20);
  res.json({ suggestions: rows });
});

export default router;
