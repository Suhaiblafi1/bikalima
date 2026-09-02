-- One lead per person, enforced by the database rather than by hope.
--
-- upsertLeadFromContact() selects by normalised phone/email and inserts when
-- it finds nothing. Its own docstring claimed it "never throws on dup-key —
-- falls back to select after a race", but nothing made that true: the columns
-- carried plain indexes, not unique ones, and there was no conflict handling.
-- Two near-simultaneous submissions for the same person (a double-clicked
-- enrolment form, or a workbook order landing at the same moment as a speech
-- evaluation) both missed the check and both inserted, leaving two permanent
-- CRM records with split activity history and follow-up state. This is the
-- highest-traffic write path in the app: every public form funnels through it.
--
-- Partial on purpose. A lead may legitimately have only a phone or only an
-- email, and NULLs are not comparable in a unique index anyway — making these
-- partial states the intent explicitly rather than relying on that.
--
-- NOTE FOR DEPLOYMENT: if the table already holds duplicate rows from a past
-- race, creating these indexes fails — cleanly, changing nothing. Merging two
-- CRM records is a business decision (which name and owner win, what happens
-- to each one's activity trail), so it is deliberately not automated here.
-- To check before deploying:
--   SELECT phone_normalized, count(*) FROM leads
--    WHERE phone_normalized IS NOT NULL GROUP BY 1 HAVING count(*) > 1;
--   SELECT email_lower, count(*) FROM leads
--    WHERE email_lower IS NOT NULL GROUP BY 1 HAVING count(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS "uq_leads_phone_normalized"
  ON "leads" USING btree ("phone_normalized")
  WHERE "phone_normalized" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_leads_email_lower"
  ON "leads" USING btree ("email_lower")
  WHERE "email_lower" IS NOT NULL;
