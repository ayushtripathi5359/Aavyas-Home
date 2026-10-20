# Aavya’s Home — website & admin panel

A Next.js 16 (App Router) + TypeScript + Tailwind 4 + Prisma + PostgreSQL application: a public homestay website and a secure admin panel in one codebase, sharing one database.

* Public site: home, the space, rooms, gallery (filters + lightbox), amenities, **pricing with live quotes**, location, contact, **booking enquiries**.
* Admin panel (`/admin`): dashboard, enquiries (search/filter/sort/CSV), **pricing (weekly / daily manual / date overrides)**, gallery uploads, rooms & spaces, amenities, testimonials, website CMS (draft → preview → publish), location & contact settings, users, audit logs.

> **Enquiries are not reservations.** There is no availability/reservation calendar. A price never implies availability, and “Confirmed” on an enquiry only records the manager’s decision.

## 1. Requirements

Node.js 20+ (developed on 24), npm, PostgreSQL 14+.

## 2. Install

```bash
npm install --legacy-peer-deps
cp .env.example .env        # then edit values (see §3)
```

(`--legacy-peer-deps` is used because some UI libraries declare conflicting optional peers; `package-lock.json` pins exact versions.)

## 3. Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Public URL (canonical links, sitemap, emails) |
| `AUTH_SECRET` | ≥16 random chars; keys session-token hashing. `openssl rand -base64 32` |
| `STORAGE_DRIVER` | `local` (dev only) or `s3` |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | S3-compatible storage (AWS S3, Cloudflare R2, MinIO, Backblaze) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email via Resend (optional) |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | Used **once** by `npm run admin:create` |

Never commit `.env`.

## 4. PostgreSQL

Option A — Docker:

```bash
docker run -d --name aavya-pg -e POSTGRES_USER=aavya -e POSTGRES_PASSWORD=aavya -e POSTGRES_DB=aavyas_home -p 5432:5432 postgres:16
```

Option B — any managed Postgres (Neon, Supabase, RDS, …): put its URL in `DATABASE_URL`.

Option C — no Docker (development only): `npm run db:dev` starts a throwaway local PostgreSQL on port **54329** using the `embedded-postgres` dev dependency (`DATABASE_URL=postgresql://aavya:aavya@localhost:54329/aavyas_home`).

## 5. Migrate, seed, first admin

```bash
npm run db:deploy                 # applies prisma/migrations (never auto-syncs/drops)
npm run db:seed                   # settings rows (with the owner-supplied map pin, Instagram, phone, email), the owner-confirmed amenity list, 5 spaces + the supplied photos
INITIAL_ADMIN_EMAIL=you@example.com INITIAL_ADMIN_PASSWORD='a-long-passw0rd' npm run admin:create
```

The seed contains **no prices, address text, contact details or testimonials**. The only location data is the Google Maps pin the owner supplied (coordinates + link). The first Super Admin is created from env vars, never from source, and the script refuses to run if a Super Admin already exists. There is no public registration page; further users are added by a Super Admin under **Admin → Users**.

Property photos: originals are in `source-photos/`, web-optimised JPEGs in `public/photos/` (regenerate with `node scripts/convert-photos.mjs`). Uploads made later through the admin go to configured storage.

## 6. Run

```bash
npm run dev            # http://localhost:3000
npm run lint           # TypeScript check
npm test               # unit tests (pricing engine, dates, money)
npm run test:e2e       # Playwright (needs a LOCAL database with the seed applied)
npm run build && npm start
```

E2E tests refuse to run against a non-local database. They reset pricing/enquiry data and create two test admins.

## 7. Pricing model

* **Mode**: exactly one of `WEEKLY` or `DAILY` is active (Admin → Pricing). Switching needs confirmation, is one transaction, is audit-logged, and never deletes the other mode’s data.
* **Weekly**: a rate per weekday (Monday-first). Optional **date overrides** `[start, end)` — start inclusive, end exclusive — beat the weekday rate; active overrides cannot overlap (checked in the app *and* by a PostgreSQL exclusion constraint).
* **Daily manual**: every date needs its own price. Missing dates stay missing (no fallback to weekly rates). Dates can be explicitly marked unavailable-for-pricing. Overwriting existing prices needs confirmation.
* **Nights**: check-in is the first charged night, check-out is excluded (Fri→Mon = Fri, Sat, Sun).
* **Money**: `decimal.js` in the engine, `NUMERIC(12,2)` in PostgreSQL. All quotes are computed on the server (`lib/pricing/engine.ts` is the single implementation).
* **Unquotable stays** (any night without a price) produce *no* total — the guest is invited to enquire.
* **Snapshots**: each enquiry stores an immutable JSON quote snapshot; later rate edits never rewrite it.
* Dates are plain `YYYY-MM-DD` property-local dates (`@db.Date`); no time-zone arithmetic.

## 8. Security notes

Passwords: bcrypt (cost 12). Sessions: random 256-bit token in an `httpOnly`, `sameSite=lax`, `secure` (prod) cookie; only an HMAC hash is stored; validated against the database on every request; revoked on logout, deactivation, role/password change. Every server action/route handler authenticates, authorises (role per area), validates (Zod) and returns structured errors. Rate limits (PostgreSQL-backed) on login, enquiries, quotes, uploads and password reset. Honeypot on the enquiry form. Upload route requires same-origin, checks type, size and magic bytes. CSV export neutralises formula injection. Secure headers are set in `next.config.ts`. Server actions use Next’s built-in Origin check.

Roles: **Super Admin** (everything) and **Property Manager** (operations; no Users, Audit logs, Settings).

## 9. Image storage

* Development: `STORAGE_DRIVER=local` stores files in `.uploads/` and serves them from `/uploads/…`. Not suitable for serverless hosts.
* Production: `STORAGE_DRIVER=s3` + the `S3_*` variables. Make the bucket publicly readable (or front it with a CDN) and set `S3_PUBLIC_BASE_URL`. Only URLs and metadata are stored in PostgreSQL. Add the bucket host to `images.remotePatterns` in `next.config.ts` if it is not one of the pre-listed hosts (Cloudinary, `*.amazonaws.com`, `*.r2.dev`, `*.r2.cloudflarestorage.com`).
* **Untested against a real bucket** — verify with your own credentials (upload, publish, delete) before launch.

## 10. Email

Set `RESEND_API_KEY` and `EMAIL_FROM` (a verified sender). With email enabled, the notification address (Admin → Contact settings) receives each new enquiry and the guest gets a confirmation; password reset by email is enabled. Without it, enquiries are still saved and the admin settings page shows “not configured”. **Untested against Resend** — send a test enquiry after configuring.

## 11. Deploy

1. Provision PostgreSQL and object storage; set all env vars on the host (Vercel, Fly, Railway, a VPS…).
2. Build command: `npm run build` (runs `prisma generate`). Release step: `npm run db:deploy`.
3. Run `npm run db:seed` once and `npm run admin:create` once (locally pointed at the production `DATABASE_URL`, or via the host’s shell), then **remove** `INITIAL_ADMIN_PASSWORD`.
4. Sign in at `/admin/login`, then fill in Contact settings, Location (address), pricing, FAQs and enable only confirmed amenities.

Public pages render per request (`force-dynamic`) so published changes appear immediately; admin writes also call `revalidatePath`.

## 12. Backup & restore

```bash
pg_dump --format=custom --no-owner "$DATABASE_URL" > aavyas_home_$(date +%F).dump
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" aavyas_home_2030-01-01.dump
```

Also back up the object-storage bucket. Test restores on a scratch database periodically.

## 13. Content you must supply (nothing is invented)

Address, phone / WhatsApp / email, prices, fees & taxes, policies, FAQs, nearby places and distances, bed/occupancy details, which amenities are really available, and real guest testimonials. Until entered, the site shows neutral fallbacks or hides the section. Privacy Policy and Terms are generic templates — have them reviewed.
