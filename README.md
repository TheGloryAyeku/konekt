# Konekt

A customisable link-in-bio page builder with real-time analytics — built for Nigerian creators. Pay in Naira, loads fast on 3G, custom domain support.

## Stack

| Layer | Choice |
| ----- | ------ |
| Frontend + API | Next.js 16 (App Router, Turbopack) |
| UI | Tailwind CSS 4 + shadcn/ui (new-york) |
| Database + Auth | Supabase Postgres + Supabase Auth |
| Payments | Paystack (NGN — card / bank transfer / USSD) |
| Analytics | Supabase `link_click_events` table |
| Media | Cloudflare R2 + Cloudflare CDN |
| Transactional email | Resend |
| Hosting | Vercel |

## Features

- **Bio page** — avatar, display name, bio, and custom theme colour
- **Link manager** — add, reorder, toggle, and delete links; free plan limit enforced
- **Scheduling** — set a start / expiry date on any link (Pro)
- **Analytics** — per-link clicks, page views, top referrers, device breakdown
- **Custom domain** — CNAME your own domain to your Konekt page (Pro)
- **Billing** — Paystack monthly / annual plans with webhook-driven upgrades
- **Public profile** — `/[username]` with favicon-per-link, click tracking, and theme support

## Project layout

```
app/
  (auth)/                 → login, signup
  (dashboard)/dashboard/
    links/                → link manager (CRUD + reordering)
    analytics/            → stats + per-link breakdown
    appearance/           → profile + theme editor
    billing/              → Paystack plans
    domain/               → custom domain setup
    settings/             → account settings
  [username]/             → public link-in-bio page
  api/
    track/click/          → click event ingest
    track/view/           → pageview ingest
    billing/checkout/     → Paystack checkout session
    webhooks/paystack/    → Paystack billing webhook
  auth/callback/          → Supabase OAuth / magic-link callback
components/
  ui/                     → shadcn primitives + KonektMark SVG
  layout/                 → SiteHeader (fixed nav + mobile menu)
lib/
  supabase/               → browser, server, require-user helpers
  paystack.ts             → Paystack REST client + plan config
  analytics.ts            → UA/referrer parsing + event recording
  resend.ts               → transactional email helpers
  validations.ts          → Zod schemas
  constants.ts            → plan limits, app metadata
supabase/migrations/      → SQL schema + RLS policies
__tests__/                → Vitest unit tests (241 tests)
```

## Getting started

```bash
# 1. Clone and install
git clone https://github.com/TheGloryAyeku/konekt.git
cd konekt
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in the values — see service notes below

# 3. Start the dev server
npm run dev
```

### Required services

**Supabase** — [supabase.com](https://supabase.com)
- Create a project and copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from Project Settings → API.
- Apply the schema: paste `supabase/migrations/0001_initial_schema.sql` into the SQL editor, or run `supabase db push`.
- Enable Email auth: Authentication → Providers → Email.

**Paystack** — [paystack.com](https://paystack.com)
- Use test keys while developing. Add `PAYSTACK_SECRET_KEY` to `.env.local`.
- Point the webhook at `https://<your-domain>/api/webhooks/paystack`.

**Resend** — [resend.com](https://resend.com)
- Add `RESEND_API_KEY` and verify your sending domain.

**Cloudflare R2** — [dash.cloudflare.com](https://dash.cloudflare.com)
- Create an R2 bucket and API token, fill in the `CLOUDFLARE_*` vars.

### Running tests

```bash
npm test                  # run all tests
npm run test:coverage     # with coverage report
```

### Deploying to Vercel

```bash
vercel link
vercel env pull .env.local --yes
vercel deploy --prod
```

No custom root directory needed — the app lives at the repo root.

## Auth model

`proxy.ts` runs on every non-asset request, refreshes Supabase session cookies, and redirects unauthenticated users away from `/dashboard`. `lib/supabase/require-user.ts` is the authoritative server-side auth check called from every dashboard layout and page.

## Analytics model

Click and pageview beacons fire from the public page via `navigator.sendBeacon`. API routes filter bots, parse the referrer into a platform (instagram / tiktok / x / …) and UA into a device class, then write to `link_click_events` via `after()` so the beacon response is instant.
