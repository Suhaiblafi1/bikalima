import { db, notificationsTable, type NewNotification } from "@workspace/db";
import { logger } from "./logger";

export type NotificationPayload = {
  userId: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr?: string | null;
  bodyEn?: string | null;
  link?: string | null;
};

export async function createNotification(payload: NotificationPayload): Promise<void> {
  try {
    const row: NewNotification = {
      userId: payload.userId,
      type: payload.type,
      titleAr: payload.titleAr,
      titleEn: payload.titleEn,
      bodyAr: payload.bodyAr ?? null,
      bodyEn: payload.bodyEn ?? null,
      link: payload.link ?? null,
    };
    await db.insert(notificationsTable).values(row);
  } catch (err) {
    logger.error({ err, payload }, "failed to create notification");
  }
}
