import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/site-settings", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        siteNameAr: siteSettingsTable.siteNameAr,
        siteNameEn: siteSettingsTable.siteNameEn,
        logoUrl: siteSettingsTable.logoUrl,
        contactEmail: siteSettingsTable.contactEmail,
        contactPhone: siteSettingsTable.contactPhone,
        whatsappNumber: siteSettingsTable.whatsappNumber,
        facebookUrl: siteSettingsTable.facebookUrl,
        instagramUrl: siteSettingsTable.instagramUrl,
        youtubeUrl: siteSettingsTable.youtubeUrl,
        twitterUrl: siteSettingsTable.twitterUrl,
        privacyPolicyAr: siteSettingsTable.privacyPolicyAr,
        privacyPolicyEn: siteSettingsTable.privacyPolicyEn,
        termsAr: siteSettingsTable.termsAr,
        termsEn: siteSettingsTable.termsEn,
      })
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.id, "default"))
      .limit(1);

    res.set("Cache-Control", "public, max-age=60");
    res.json({ settings: rows[0] ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to load public site settings");
    res.status(500).json({ error: "Failed to load site settings" });
  }
});

export default router;
