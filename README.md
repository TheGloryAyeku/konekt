# Konekt

A customisable link-in-bio landing page builder with real-time analytics, built for Nigerian content creators. See `../linkinbio-prd.md` for the full product spec.

## Stack

| Layer | Choice |
| ----- | ------ |
| Frontend + API | Next.js 16 (App Router, Turbopack) |
| UI | Tailwind CSS 4 + shadcn/ui (new-york) |
| Database + Auth | Supabase Postgres + Supabase Auth |
| Payments | Paystack (NGN, card/bank transfer/USSD) |
| Analytics | Supabase `link_click_events` table (swap for ClickHouse later) |
| Media | Cloudflare R2 + Cloudflare CDN |
| Transactional email | Resend |
| Hosting | Vercel |

## Project layout

```
app/
  (auth)/                 → login, signup (route group)
  (dashboard)/
    _components/          → dashboard-only client components
    dashboard/
      links/              → link manager
      analytics/          → stats + per-link breakdown
      appearance/         → profile + theme editor
      billing/            → Paystack plans
      domain/             → custom domain setup
      settings/           → account settings
  [username]/             → public link-in-bio page
    tracked-link.tsx      → click beacon
    track-page-view.tsx   → pageview beacon
  api/
    track/click/          → click event ingest
    track/view/           → pageview ingest
    webhooks/paystack/    → Paystack billing webhook
  auth/callback/          → Supabase email/OAuth callback
lib/
  supabase/               → browser, server, proxy helpers, require-user
  paystack.ts             → Paystack REST client + plans
  analytics.ts            → UA/referrer parsing + recordEvent stub
  resend.ts               → receipt + failed-payment emails
  validations.ts          → zod schemas for forms
  constants.ts            → plan limits, app metadata
components/ui/            → shadcn primitives (button, card, dialog, …)
supabase/migrations/      → SQL schema + RLS policies
proxy.ts                  → Next 16 proxy (session refresh + auth redirect)
```

## First-time setup

Run these from the project root:

```bash
# 1. Copy the env template and fill it in
cp .env.example .env.local

# 2. Install deps (if you haven't already)
pnpm install

# 3. Start the dev server
pnpm dev
```

### Required services

1. **Supabase** — create a project at https://supabase.com, then:
   - Paste `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` into `.env.local`.
   - Apply the initial schema: paste `supabase/migrations/0001_initial_schema.sql` into the SQL editor, or run `supabase db push` with the CLI.
   - Enable Email auth (Dashboard → Authentication → Providers).
   - Generate typed DB types when ready: `supabase gen types typescript --project-id <id> > lib/supabase/types.ts`.

2. **Paystack** — https://paystack.com
   - Use test keys while developing. Add `PAYSTACK_SECRET_KEY` to `.env.local`.
   - Point the webhook at `https://<your-domain>/api/webhooks/paystack`.

3. **Resend** — https://resend.com
   - Add `RESEND_API_KEY` and verify your sending domain.

4. **Cloudflare R2** — https://dash.cloudflare.com
   - Create an R2 bucket + API token, fill in the `CLOUDFLARE_*` vars.
   - Used for avatar/thumbnail uploads and (later) programmatic custom domains.

5. **ClickHouse** *(optional)* — the PRD calls for a ClickHouse cluster for analytics throughput, but v1 lands on Supabase. Wire up `lib/analytics.ts` → `recordEvent` when you're ready.

### Deploying to Vercel

```bash
# Link this repo to a Vercel project
vercel link

# Add env vars from .env.local to Vercel (or set them in the dashboard)
vercel env pull .env.local --yes      # refresh local values later
```

Because this app already lives at the repo root, you do not need to set a custom **Root Directory** in Vercel.

## Auth model

- `proxy.ts` runs on every non-asset request, refreshes Supabase session cookies, and soft-redirects unauthenticated users away from `/dashboard`. It is **not** the auth boundary.
- `lib/supabase/require-user.ts` is the authoritative check. Every dashboard layout/page calls `requireUser()`, which reads the session from the server client and redirects to `/login` if missing.
- The `/auth/callback` route exchanges Supabase magic-link / OAuth codes for a session.

## Analytics model

Click and pageview beacons are sent from the public page via `navigator.sendBeacon`. The API routes:

1. Filter obvious bots via UA heuristics (pair with Vercel BotID in production).
2. Parse the referrer into a platform (instagram / tiktok / x / …) and the UA into a device class.
3. `after(...)` schedules the DB write so the beacon response is instant.
4. Writes land in `link_click_events`. When you want real volume, swap `lib/analytics.ts → recordEvent` for a ClickHouse HTTP insert.

## Known TODOs for v1

- Link CRUD server actions (create, reorder, toggle, delete) and the drag-and-drop list UI.
- Profile + theme form with Cloudflare R2 upload.
- Paystack checkout flow (`/api/billing/checkout`) and plan gating.
- Custom domain provisioning via Cloudflare API.
- ClickHouse wiring + analytics charts.
- Vercel BotID + rate limiting on beacon endpoints.
- Email confirmation copy and branded templates in Resend.
- Legal pages: `/privacy`, `/terms`.
- Feature flags for the Definition-of-Done checklist in the PRD.
