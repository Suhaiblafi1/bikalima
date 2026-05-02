/**
 * WhatsApp Cloud API helper.
 *
 * This is intentionally a thin wrapper that no-ops gracefully when the
 * required environment variables are missing. Wire credentials later by
 * setting:
 *
 *   WHATSAPP_PHONE_NUMBER_ID  (e.g. "1234567890")
 *   WHATSAPP_ACCESS_TOKEN     (Meta Cloud API access token)
 *   WHATSAPP_TEAM_NUMBER      (E.164 phone number that should receive
 *                              "new visitor message" pings, e.g. "97455377065")
 *
 * Once set, both visitor messages will optionally ping the team's WhatsApp,
 * and admin replies will be delivered to the visitor's WhatsApp number
 * (subject to the 24h customer service window — proactive messages outside
 * that window require an approved template, which is not implemented here).
 */

import { logger } from "./logger";

type WhatsAppCreds = {
  phoneNumberId: string;
  accessToken: string;
  teamNumber: string | null;
};

function readCreds(): WhatsAppCreds | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return null;
  return {
    phoneNumberId,
    accessToken,
    teamNumber: process.env.WHATSAPP_TEAM_NUMBER ?? null,
  };
}

export function isWhatsAppConfigured(): boolean {
  return readCreds() !== null;
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return digits;
}

export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const creds = readCreds();
  const recipient = normalizePhone(to);
  if (!creds) {
    logger.warn(
      { to: recipient },
      "[whatsapp] credentials not configured — message not sent",
    );
    return { ok: false, error: "not_configured" };
  }
  if (!recipient) {
    return { ok: false, error: "invalid_phone" };
  }
  try {
    const url = `https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: body.slice(0, 4000) },
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      messages?: { id: string }[];
      error?: { message?: string };
    };
    if (!res.ok) {
      const msg = data?.error?.message ?? `HTTP ${res.status}`;
      logger.error({ to: recipient, error: msg }, "[whatsapp] send failed");
      return { ok: false, error: msg };
    }
    return { ok: true, messageId: data?.messages?.[0]?.id };
  } catch (err) {
    logger.error({ err, to: recipient }, "[whatsapp] send threw");
    return { ok: false, error: "exception" };
  }
}

export function getTeamWhatsAppNumber(): string | null {
  const creds = readCreds();
  return creds?.teamNumber ?? null;
}
