-- What the payment processor was actually asked for.
--
-- Every price is stored in JOD, and the Stripe account in use is
-- US-registered: Stripe refuses JOD from it outright ("Stripe accounts in US
-- do not support jod"), and Stripe does not support Jordan as a country at
-- all, so a JOD-capable account is not obtainable. The charge is therefore
-- converted before it is sent, and these two columns record what was sent.
--
-- They exist because the webhook and the success page both verify Stripe's
-- reported total against the order before granting access — a tamper check
-- worth keeping. Comparing a USD total against a JOD price would reject every
-- legitimate payment, so the comparison needs the charged figure, exactly.
-- Minor units in an integer, not a major-unit decimal: 98.7 USD is 9870 and
-- stays 9870, with no float to round.
--
-- Both are nullable on purpose. An order charged in the price's own currency
-- leaves them null, and so does every order that already exists — the
-- verification falls back to the JOD comparison it has always used.

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "charge_amount_minor" integer;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "charge_currency" varchar(3);
