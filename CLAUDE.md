# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `pnpm dev` — Next.js dev server (Turbopack).
- `pnpm build` — Production build.
- `pnpm start` — Serve the production build.
- `pnpm lint` — ESLint (`eslint-config-next`).

Use `pnpm` for all installs — `pnpm-lock.yaml` is the source of truth. No test framework is configured yet.

### Database

Schema lives in `supabase/migrations/`. Apply with `supabase db push` or paste SQL into the Supabase SQL editor. After schema changes, regenerate typed clients and pass the `Database` generic to every `createServerClient` call:

```
supabase gen types typescript --project-id <id> > lib/supabase/types.ts
```

## Architecture

This is a scaffold for a link-in-bio product. Many features (link CRUD, theme editor, Paystack checkout, ClickHouse analytics) are stubbed — see the "Known TODOs" in `README.md` and the full spec in `../linkinbio-prd.md` before adding features.

### Next.js 16 conventions

- `**proxy.ts`, not `middleware.ts`.** Next 16 renamed the file and the exported function. `proxy.ts` at the project root wires `updateSession` from `lib/supabase/middleware.ts`.
- `**proxy.ts` is UX-only, NOT the auth boundary.** It refreshes Supabase session cookies and soft-redirects unauthenticated users. The authoritative check is `requireUser()` in `lib/supabase/require-user.ts`, which every protected layout/page must call.
- **Cache Components are intentionally disabled** (see TODO in `next.config.ts`). Before flipping `cacheComponents: true`, wrap per-user reads in `<Suspense>` and rewrite the public `[username]` pages with `'use cache'` + `cacheTag`.
- When unsure about a Next.js API, read the local docs in `node_modules/next/dist/docs/` — APIs have shifted in 16.x.

### Supabase client topology

Three clients, each with a single permitted use site:

- `lib/supabase/browser.ts` — client components only.
- `lib/supabase/server.ts::createClient()` — Server Components, Server Actions, Route Handlers. Fresh client per request; cookies flow back through `setAll`.
- `lib/supabase/server.ts::createServiceRoleClient()` — **bypasses RLS.** Only for trusted server work: `/api/webhooks/paystack`, `/api/track/*`, future cron jobs. Never import from a component.

In `lib/supabase/middleware.ts::updateSession`, **do not insert any logic between `createServerClient()` and `supabase.auth.getUser()`**. That `getUser()` call is what triggers the token refresh and writes new cookies through `setAll` — adding code in between can cause random logouts.

### Auth flow

1. Signup/login forms post to Supabase Auth.
2. The `handle_new_user()` DB trigger (in the initial migration) auto-creates a `profiles` row with a derived username.
3. Magic-link / OAuth redirects hit `/auth/callback` to exchange the code for a session.
4. Every dashboard request: `proxy.ts` refreshes the session → `requireUser()` in the dashboard layout enforces the gate.

### Analytics ingest

The public `[username]` page sends click/pageview beacons via `navigator.sendBeacon` to `/api/track/click` and `/api/track/view`. Those handlers:

1. Return `{ ok: true }` immediately.
2. Defer the work with `after(...)` from `next/server`.
3. Filter bots with `isLikelyBot` and parse device/referrer via `lib/analytics.ts`.
4. Call `recordEvent` (currently a stub — this is the ClickHouse hook) **and** insert a row into Supabase `link_click_events` via the service-role client as a fallback.
5. For click events, bump `links.click_count` via the `increment_link_click_count` RPC.

When ClickHouse is wired up, replace the Supabase fallback — don't double-write.

### RLS model

RLS is ON for every table. Key policies:

- `profiles` — publicly readable; owner-write only.
- `links` — enabled links in their scheduled window are publicly readable; owners see all their own links.
- `custom_domains`, `subscriptions`, `link_click_events` — owner-read only. Writes to `subscriptions` and `link_click_events` must go through the service-role client.

### Reserved usernames

`lib/validations.ts` holds a `RESERVED_USERNAMES` set that must stay in sync with top-level route segments under `app/`. If you add a new top-level route (e.g. `/pricing`, `/blog`), add the segment to the reserved list so it can't collide with `app/[username]`.

### Path alias

`@/`* resolves to the project root (`tsconfig.json`). Import from `@/lib/...`, `@/components/ui/...`, etc.

### shadcn/ui

Style `base-nova`, `baseColor: neutral`, alias `@/components/ui` (see `components.json`). Primitives live in `components/ui/`.