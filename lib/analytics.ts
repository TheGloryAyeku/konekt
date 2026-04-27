/**
 * Click & pageview analytics.
 *
 * The PRD calls for ClickHouse as the analytics store for high-write
 * throughput. For scaffolding we keep the interface narrow and stub the write
 * path — swap `recordEvent` for a ClickHouse HTTP insert (or a queue) when
 * you wire it up.
 */

import { UAParser } from "ua-parser-js";

export type ClickEvent = {
  profile_id: string;
  link_id?: string;
  event_type: "page_view" | "link_click";
  referrer_host: string | null;
  referrer_platform: Referrer;
  device: "mobile" | "tablet" | "desktop" | "unknown";
  country: string | null;
  user_agent: string | null;
  created_at: string; // ISO
};

export type Referrer =
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube"
  | "facebook"
  | "whatsapp"
  | "linkedin"
  | "direct"
  | "other";

const REFERRER_MAP: Record<string, Referrer> = {
  "instagram.com": "instagram",
  "l.instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "www.tiktok.com": "tiktok",
  "x.com": "x",
  "twitter.com": "x",
  "t.co": "x",
  "youtube.com": "youtube",
  "www.youtube.com": "youtube",
  "m.youtube.com": "youtube",
  "facebook.com": "facebook",
  "www.facebook.com": "facebook",
  "l.facebook.com": "facebook",
  "whatsapp.com": "whatsapp",
  "api.whatsapp.com": "whatsapp",
  "linkedin.com": "linkedin",
  "www.linkedin.com": "linkedin",
};

export function parseReferrer(
  referrer: string | null | undefined,
): { host: string | null; platform: Referrer } {
  if (!referrer) return { host: null, platform: "direct" };

  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    const platform = REFERRER_MAP[host] ?? "other";
    return { host, platform };
  } catch {
    return { host: null, platform: "direct" };
  }
}

export function parseDevice(userAgent: string | null): ClickEvent["device"] {
  if (!userAgent) return "unknown";
  const ua = new UAParser(userAgent).getResult();
  const type = ua.device.type;
  if (type === "mobile") return "mobile";
  if (type === "tablet") return "tablet";
  return "desktop";
}

/**
 * Cheap bot filter. Pairs well with Vercel BotID in production — this just
 * catches the obvious crawlers so free-tier analytics stay honest.
 */
export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|embedly|pinterest|linkedinbot/i.test(
    userAgent,
  );
}

/**
 * TODO: swap for a real ClickHouse insert once the cluster is provisioned.
 *
 * For now this writes to the Supabase `link_click_events` table (defined in
 * the initial migration) so the rest of the app can be built end-to-end.
 * Move to ClickHouse when you need the write throughput.
 */
export async function recordEvent(event: ClickEvent): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("[analytics] recordEvent", event);
  }
  // Intentionally not implemented yet — left as a scaffold hook.
}
