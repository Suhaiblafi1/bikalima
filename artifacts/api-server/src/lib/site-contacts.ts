import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { toWaPhone } from "./phone.js";

/**
 * Where confirmation mail goes, and which WhatsApp number a buyer is sent to.
 *
 * Both were literals at the top of consultation.ts, enroll.ts and
 * workbook-order.ts, even though there is an admin-editable settings row for
 * them and chat.ts already reads its own configuration properly. An admin
 * changing the number under Settings and expecting it to take effect would
 * have gone on watching workbook and consultation confirmations point at the
 * old one, with nothing to say why.
 *
 * The fallbacks are the exact literals those files used, so a missing or
 * half-filled settings row behaves as before rather than sending mail nowhere.
 *
 * Read once per minute rather than per submission: these change about never,
 * and a form post should not owe a settings query.
 */

const FALLBACK_EMAIL = "info@bikalima.com";
const FALLBACK_WHATSAPP = "97455377065";
const TTL_MS = 60_000;

export type SiteContacts = {
  /** Address that receives the internal notification, and answers replies. */
  email: string;
  /** Digits only, ready to drop into a wa.me link. */
  whatsapp: string;
};

let cached: { at: number; value: SiteContacts } | null = null;

async function read(): Promise<SiteContacts> {
  const [row] = await db
    .select({
      contactEmail: siteSettingsTable.contactEmail,
      whatsappNumber: siteSettingsTable.whatsappNumber,
    })
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, "default"))
    .limit(1);

  const email = row?.contactEmail?.trim();
  // An admin types the number however they like; wa.me wants bare digits.
  const whatsapp = row?.whatsappNumber ? toWaPhone(row.whatsappNumber) : "";

  return {
    email: email || FALLBACK_EMAIL,
    whatsapp: whatsapp || FALLBACK_WHATSAPP,
  };
}

export async function getSiteContacts(): Promise<SiteContacts> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.value;
  try {
    const value = await read();
    cached = { at: now, value };
    return value;
  } catch {
    // A settings query that fails must not cost the visitor their submission.
    // Serve whatever was last read, and the literals if nothing ever was.
    return cached?.value ?? { email: FALLBACK_EMAIL, whatsapp: FALLBACK_WHATSAPP };
  }
}
