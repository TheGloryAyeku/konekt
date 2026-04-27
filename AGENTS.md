# AGENTS.md

Guidance for any coding agent working in this repository.

## Read This First

- This is **not** the Next.js you remember. The app uses **Next.js 16.2.x** and React 19.
- Before changing framework-level behavior, read the relevant local docs in `node_modules/next/dist/docs/`.
- Start with:
  - `node_modules/next/dist/docs/01-app/index.md`
  - `node_modules/next/dist/docs/03-architecture/index.md`
- Heed deprecations and naming changes. In this repo, `proxy.ts` replaces `middleware.ts`.

## Product Context

- **Konekt** is a customisable link-in-bio product for Nigerian creators.
- Main surfaces:
  - public profile page at `/[username]`
  - authenticated dashboard at `/dashboard/*`
  - auth flows at `/login`, `/signup`, `/auth/callback`
  - analytics ingest at `/api/track/*`
  - Paystack webhook at `/api/webhooks/paystack`
- The full product spec lives in `linkinbio-prd.md`.
- `README.md` is the best quick reference for the current scaffold, setup, and known TODOs.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript with `strict: true`
- Tailwind CSS 4
- shadcn/ui (`base-nova`, neutral palette)
- Supabase Postgres + Auth
- Paystack
- Resend
- Cloudflare R2 / CDN
- Vercel

## Commands

- `pnpm dev` — local dev server
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — ESLint

Rules:

- Use `pnpm` for installs and scripts.
- `pnpm-lock.yaml` is the source of truth.
- No automated test framework is configured yet, so `pnpm lint` and `pnpm build` are the main verification steps.

## Repo Map

- `app/` — App Router routes and layouts
- `app/(auth)/` — login and signup
- `app/(dashboard)/` — authenticated dashboard shell and pages
- `app/[username]/` — public profile page and analytics beacons
- `app/api/track/` — click + pageview ingest
- `app/api/webhooks/paystack/` — billing webhook
- `components/ui/` — shared shadcn/ui primitives
- `lib/` — integrations, constants, analytics, zod schemas, utilities
- `lib/supabase/` — browser/server/service-role helpers and auth guardrails
- `supabase/migrations/` — schema and RLS policies
- `proxy.ts` — session refresh and soft auth redirect at the network boundary

## Core Conventions

- Prefer **Server Components** by default.
- Add `'use client'` only when interactivity, browser APIs, or client-only hooks are required.
- Keep mutations in **Server Actions** or Route Handlers, not in client-side fetch helpers.
- Validate incoming form data with the schemas in `lib/validations.ts`.
- After a successful mutation, revalidate the affected routes with `revalidatePath(...)`.
- Use the `@/` path alias from `tsconfig.json` for local imports.
- Reuse existing shadcn/ui primitives before introducing custom base components.

## Next.js 16 Rules For This Repo

- `proxy.ts` is **UX-only**, not the real auth boundary.
- The authoritative auth check is `requireUser()` in `lib/supabase/require-user.ts`.
- Every protected dashboard page or layout should continue to call `requireUser()`.
- `next.config.ts` intentionally leaves Cache Components disabled for now. Do not enable `cacheComponents` casually.
- Public route params already use the async pattern in this repo:

```ts
type Props = {
  params: Promise<{ username: string }>;
};
```

Follow the established pattern instead of older synchronous assumptions.

## Supabase Client Topology

Use the right client in the right place:

- `lib/supabase/browser.ts` — client components only
- `lib/supabase/server.ts::createClient()` — Server Components, Server Actions, Route Handlers
- `lib/supabase/server.ts::createServiceRoleClient()` — trusted server work that must bypass RLS

Important:

- Do not import the service-role client into components.
- Do not insert logic between `createServerClient()` and `supabase.auth.getUser()` inside `lib/supabase/middleware.ts`. That flow is responsible for refreshing and persisting auth cookies correctly.

## Auth Model

The intended auth flow is:

1. Auth forms talk to Supabase Auth.
2. The DB trigger creates a `profiles` row for new users.
3. `/auth/callback` exchanges the auth code for a session.
4. `proxy.ts` refreshes session cookies.
5. `requireUser()` enforces access on protected pages.

If you change auth behavior, keep both the network boundary and the server-side guard in mind.

## Data / RLS Notes

- RLS is enabled across the schema.
- `profiles` are publicly readable, owner writable.
- Public `links` visibility depends on enablement and schedule windows.
- `subscriptions`, `custom_domains`, and `link_click_events` are not public tables.
- Trusted writes for analytics or billing should go through the service-role path, not the regular user client.

After schema changes:

```bash
supabase gen types typescript --project-id <id> > lib/supabase/types.ts
```

Keep generated types in sync with the SQL migrations.

## Routing And Username Safety

- `app/[username]/page.tsx` is the public profile route.
- Any new top-level route segment that could collide with a username must also be added to `RESERVED_USERNAMES` in `lib/validations.ts`.
- Example: if you add `/pricing`, also reserve `pricing`.

## UI And Product Guidance

- The product is creator-facing, so dashboard UI should feel approachable and mobile-friendly.
- Avoid exposing raw JSON, internal data structures, or implementation details in end-user flows unless the page is explicitly developer/admin oriented.
- Prefer plain-language labels, previews, presets, and form controls over technical configuration surfaces.
- Preserve the brand direction in `README.md`: local, creator-friendly, and paid in Naira.

## Appearance / Public Page Notes

- Public profile styling currently comes from `profiles.theme`.
- The existing public page reads `background` and `foreground` values from that object.
- If you extend theme customisation, keep the dashboard editor, the public page renderer, and any DB shape changes aligned.

## Environment

`.env.example` lists the current integrations:

- Supabase
- Paystack
- Resend
- Cloudflare R2 / API
- optional ClickHouse

If a feature depends on one of these services, check `.env.example` before assuming the required keys already exist.

## Known Incomplete Areas

This repo is still a scaffold in a few places. Before building large features, read the TODOs in `README.md`. At the time of writing, notable unfinished areas include:

- richer link CRUD and reordering
- the appearance editor
- Paystack checkout flow
- custom domains
- ClickHouse-backed analytics
- legal pages

## Done Checklist

Before wrapping up:

- Run the narrowest useful verification command, usually `pnpm lint`.
- Run `pnpm build` for broader framework or routing changes when feasible.
- Call out any checks you could not run because of missing env vars or external services.
- If you update repo-wide guidance here, keep `CLAUDE.md` aligned because it references this file.
