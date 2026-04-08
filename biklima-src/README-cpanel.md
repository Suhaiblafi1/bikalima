# بكلمة — Bikalima | cPanel Node.js Deployment Guide

A step-by-step guide for hosting this application on a cPanel server using the **Node.js App** feature.

---

## Prerequisites

| Requirement | Detail |
|---|---|
| Node.js | 18 or newer (set in cPanel) |
| PostgreSQL | Any host: cPanel PostgreSQL, Neon.tech, Supabase, etc. |
| SMTP | Gmail App Password or any SMTP relay |

---

## Step 1 — Upload & Extract

1. Upload `biklima-cpanel.tar.gz` to your home directory via File Manager or FTP.
2. In File Manager, select the file → **Extract**.
3. Note the path of the extracted folder (e.g. `/home/youruser/biklima`).

---

## Step 2 — Create the Node.js App in cPanel

1. In cPanel → **Software** → **Node.js App** → **Create Application**.
2. Set:
   - **Node.js version**: 18.x or later
   - **Application mode**: Production
   - **Application root**: `biklima` (the folder name you extracted)
   - **Application URL**: your domain or subdomain
   - **Application startup file**: `server.js`
3. Click **Create**.

---

## Step 3 — Set Environment Variables

Still inside the Node.js App manager, scroll to **Environment Variables** and add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | *(cPanel sets this automatically — leave blank)* |
| `SESSION_SECRET` | A long random string (32+ chars) |
| `DATABASE_URL` | Your full PostgreSQL connection string |
| `SMTP_HOST` | `smtp.gmail.com` (or your mail server) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | Your Gmail App Password (16 chars, no spaces) |
| `SMTP_FROM` | `"بكلمة" <info@bikalima.com>` |
| `ZOOM_MEETING_URL` | Your Zoom scheduler or meeting link |

> **Gmail App Password**: Go to myaccount.google.com → Security → 2-Step Verification → App Passwords.

---

## Step 4 — Create the Database Tables

Run the SQL in `setup-db.sql` once on your PostgreSQL database.

**Option A — pgAdmin / Neon.tech / Supabase console**
Paste the contents of `setup-db.sql` into the SQL editor and execute.

**Option B — via Node.js**
After setting `DATABASE_URL` in your environment, open a terminal (SSH or cPanel Terminal) in the app folder and run:
```bash
node migrate.js
```

---

## Step 5 — Install Dependencies & Start

1. In the Node.js App manager, click **Run NPM Install**.
   (This runs `npm install` inside your application directory.)
2. Click **Start App** (or **Restart** if it was already running).
3. Visit your domain — the site should load.

---

## Step 6 — Verify

| Check | How |
|---|---|
| Site loads | Visit your domain in a browser |
| API healthy | Visit `/api/healthz` — should return `{"status":"ok"}` |
| Enrollment emails | Submit the enrollment form and check `info@bikalima.com` |

---

## Directory Structure

```
biklima/
├── server.js          ← Entry point  (node server.js)
├── app.js             ← Express setup + static files + SPA fallback
├── package.json       ← Dependencies (npm install reads this)
├── .env.example       ← Template — copy to .env for local dev
├── db.js              ← Database connection (Drizzle ORM)
├── schema.js          ← Database table definitions
├── migrate.js         ← One-time DB setup script
├── setup-db.sql       ← Raw SQL for manual DB setup
├── routes/
│   ├── index.js       ← Combines all routers
│   ├── auth.js        ← Register / Login / Logout
│   ├── enroll.js      ← Enrollment form submission
│   ├── workbook-order.js ← Workbook purchase form
│   ├── consultation.js   ← Booking form + calendar invite
│   ├── admin.js       ← Admin panel API (protected)
│   └── health.js      ← /api/healthz
├── lib/
│   ├── auth.js        ← Session & password helpers
│   ├── logger.js      ← Pino logger
│   └── phone.js       ← WhatsApp phone formatter
├── middlewares/
│   └── auth.js        ← Session middleware
└── public/            ← Built React frontend (SPA)
    ├── index.html
    └── assets/
```

---

## Troubleshooting

**"Cannot GET /"** — Check that `public/index.html` exists and the app started correctly.

**Database connection error** — Verify `DATABASE_URL` is correct and the PostgreSQL host allows external connections.

**Emails not sending** — Verify SMTP credentials. For Gmail, use an App Password (not your account password).

**Port conflict** — cPanel injects `PORT` automatically. Do not hard-code a port.

---

## Local Development (optional)

```bash
cp .env.example .env
# Fill in .env values
npm install
npm run dev
```

The server auto-reloads on file changes (`--watch` flag).

---

*© بكلمة — Bikalima | info@bikalima.com*
