# PRD: Linktree

**One-line description:** A customisable link-in-bio landing page builder with real-time analytics, built for Nigerian content creators.

---

## Problem Statement

Nigerian content creators — YouTubers, Instagram influencers, podcasters, and newsletter writers — need a single URL that routes their audience to their content, merch, brand deals, and monetisation channels. Existing solutions (Linktree, Beacons) are foreign products priced in USD, do not support Nigerian payment methods, and offer analytics that do not account for Nigerian traffic patterns or mobile-first usage. Creators end up either paying in dollars they cannot easily access, building janky Notion pages, or just dumping ten links in their bio with zero visibility into what is actually working.

---

## Target User Profile

**Primary:** Nigerian content creators with an existing social media following (1,000–500,000 followers) across Instagram, TikTok, X, or YouTube.

**Characteristics:**

- Ages 18–35, majority mobile-first (uses phone for everything including publishing)
- Earning from brand deals, Selar/Gumroad digital products, YouTube AdSense, or Substack
- Technically comfortable but not developers
- Pays in Naira; most do not have USD-denominated cards
- Operates in a context of unstable internet — expects fast page loads even on 3G

**Secondary:** Social media managers running pages for brands or small businesses in Nigeria.

---

## Core Features

### 1. Profile Page Builder

Creator gets a unique URL (`linktree.ng/username`). They can add a profile photo, display name, short bio, and a background colour or gradient. No design skills required.

### 2. Link Management

Add, reorder, enable/disable, and delete links. Each link has a title, URL, and optional thumbnail image. Supports unlimited links on paid plans; 5 links on free.

### 3. Analytics Dashboard

Per-link click tracking. Total page views. Top referrers (which social platform sent the traffic). Device breakdown (mobile vs desktop). Data retention: 30 days on free, 12 months on paid.

### 4. Naira-Based Billing

Paid plans priced and billed in NGN. Payment via Paystack (card, bank transfer, USSD). No USD pricing shown to Nigerian users. Auto-renewal with clear cancellation flow.

### 5. Custom Domain Support (Paid)

Connect a custom domain (e.g. `link.yourname.com`) via CNAME. Handled through a guided setup flow inside the dashboard.

### 6. Link Scheduling (Paid)

Set a start and end date/time for any link. Useful for limited-time offers, event announcements, or brand deal windows.

---

## User Stories

### Profile Page Builder

- As a creator, I want to set my username so that my link-in-bio URL reflects my brand.
- As a creator, I want to upload a profile photo and write a short bio so that visitors know who I am immediately.
- As a creator, I want to choose a background colour or gradient so that my page feels on-brand without needing a designer.

### Link Management

- As a creator, I want to add a link with a title and URL so that my audience can find my content.
- As a creator, I want to drag and reorder my links so that the most important ones appear first.
- As a creator, I want to toggle a link off without deleting it so that I can hide it temporarily (e.g. a closed waitlist).
- As a creator on the free plan, I want to know how many links I have left before hitting the limit so that I can plan around it.

### Analytics Dashboard

- As a creator, I want to see total page views over the last 7 or 30 days so that I can gauge overall traffic.
- As a creator, I want to see how many times each link was clicked so that I know what my audience cares about.
- As a creator, I want to see which platform (Instagram, TikTok, X) is sending the most traffic so that I can double down on what is working.
- As a creator, I want to see mobile vs desktop split so that I can design my content delivery accordingly.

### Naira-Based Billing

- As a creator, I want to see all prices in Naira so that I know exactly what I am paying without doing currency conversion.
- As a creator, I want to pay with my Nigerian debit card or via bank transfer so that I do not need a dollar card.
- As a creator, I want to cancel my subscription from inside the dashboard so that I am not locked in.

### Custom Domain Support

- As a paid creator, I want to connect my own domain to my page so that the link looks professional in my bio.
- As a paid creator, I want a step-by-step guide for setting the CNAME so that I can do it without contacting support.

### Link Scheduling

- As a paid creator, I want to schedule a link to go live at a specific date and time so that I do not have to be online to activate it.
- As a paid creator, I want to set an expiry date on a link so that it disappears automatically when my promo ends.

---

## Out of Scope

The following will not be built in v1:

- Embedded media players (audio, video) on the page
- Digital product sales or checkout (creators should use Selar/Gumroad; we link to those)
- Email list capture widgets
- A/B testing for links or page layouts
- Team accounts or multi-user management
- White-labelling for agencies
- Mobile app (web-first; the builder and the landing page are both responsive web)
- AI-generated content suggestions or copy
- Affiliate/referral programme
- Integrations with third-party analytics tools (Google Analytics, Mixpanel)
- Dark mode toggle for the creator's public page

---

## Tech Stack


| Layer                 | Choice                                           | Rationale                                                                                   |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Frontend              | Next.js (App Router)                             | SSR for fast public page loads; React for dashboard                                         |
| Styling               | Tailwind CSS                                     | Rapid UI development; consistent design system                                              |
| Backend               | Next.js API Routes + Node.js                     | Monorepo simplicity for v1                                                                  |
| Database              | PostgreSQL (via Supabase)                        | Relational data for users, links, analytics; Supabase gives auth and storage out of the box |
| Auth                  | Supabase Auth                                    | Email/password + Google OAuth                                                               |
| Payments              | Paystack                                         | NGN billing, card + bank transfer + USSD; strong Nigerian developer support                 |
| Analytics Storage     | ClickHouse (self-hosted or ClickHouse Cloud)     | High write throughput for click events; efficient time-series queries                       |
| CDN / Media           | Cloudflare R2 + Cloudflare CDN                   | Profile photo storage; fast delivery on African PoPs                                        |
| Hosting               | Vercel (frontend) + Railway (background workers) | Low-ops, fast deploys                                                                       |
| DNS / Custom Domains  | Cloudflare via API                               | Programmatic CNAME provisioning                                                             |
| Email (transactional) | Resend                                           | Billing receipts, account notifications                                                     |


---

## Definition of Done

A feature is done when all of the following are true:

**Functional**

- All user stories for the feature pass manual QA on Chrome mobile (Android) and Safari mobile (iOS)
- Edge cases (empty states, error states, loading states) are handled and designed, not left as raw spinners or blank screens
- Form validation provides clear, specific error messages in plain English (not "invalid input")

**Performance**

- Public link-in-bio page achieves a Lighthouse Performance score of ≥ 90 on mobile
- Public page fully loads in under 2 seconds on a simulated 3G connection (Chrome DevTools throttling)
- Dashboard pages load in under 3 seconds on a standard broadband connection

**Analytics Accuracy**

- Click events are recorded with < 1% loss under normal load
- Referrer attribution correctly distinguishes Instagram, TikTok, X, and direct traffic
- Bot/crawler traffic is filtered from reported numbers

**Billing**

- Paystack test mode passes all plan upgrade, downgrade, and cancellation flows
- User receives a receipt email within 2 minutes of a successful transaction
- Failed payments surface a clear error message with a retry option

**Security**

- No user can view or modify another user's links or analytics data
- All API routes require authentication except the public page endpoint
- Custom domain setup does not allow subdomain takeover

**Accessibility**

- Public page is navigable by keyboard
- All interactive elements have visible focus states
- Images have alt text

**Shipped**

- Feature is behind a feature flag until QA is signed off
- Flag is removed and feature is live in production
- Relevant metrics (e.g. link click volume, plan conversion rate) are being captured and visible in the internal dashboard

