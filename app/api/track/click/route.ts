import { NextResponse, after } from "next/server";
import { z } from "zod";
import {
  isLikelyBot,
  parseDevice,
  parseReferrer,
  recordEvent,
} from "@/lib/analytics";
import { createServiceRoleClient } from "@/lib/supabase/server";

const clickSchema = z.object({
  profile_id: z.string().uuid(),
  link_id: z.string().uuid(),
  referrer: z.string().max(2048).nullable(),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = clickSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const body = parsed.data;
  const userAgent = request.headers.get("user-agent");

  // Respond immediately; keep the DB write on the background with `after`.
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
      link_id: body.link_id,
      event_type: "link_click",
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
      link_id: body.link_id,
      event_type: "link_click",
      referrer_host: host,
      referrer_platform: platform,
      device,
      country,
    });

    await supabase.rpc("increment_link_click_count", {
      link_id_input: body.link_id,
    });
  });

  return NextResponse.json({ ok: true });
}
