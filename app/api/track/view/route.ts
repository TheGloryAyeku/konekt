import { NextResponse, after } from "next/server";
import { z } from "zod";
import {
  isLikelyBot,
  parseDevice,
  parseReferrer,
  recordEvent,
} from "@/lib/analytics";
import { createServiceRoleClient } from "@/lib/supabase/server";

const viewSchema = z.object({
  profile_id: z.string().uuid(),
  referrer: z.string().max(2048).nullable(),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = viewSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const body = parsed.data;
  const userAgent = request.headers.get("user-agent");

  after(async () => {
    if (isLikelyBot(userAgent)) return;

    const { host, platform } = parseReferrer(body.referrer);
    const device = parseDevice(userAgent);
    const country =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null;

    await recordEvent({
      profile_id: body.profile_id,
      event_type: "page_view",
      referrer_host: host,
      referrer_platform: platform,
      device,
      country,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    });

    const supabase = createServiceRoleClient();
    await supabase.from("link_click_events").insert({
      profile_id: body.profile_id,
      event_type: "page_view",
      referrer_host: host,
      referrer_platform: platform,
      device,
      country,
    });
  });

  return NextResponse.json({ ok: true });
}
