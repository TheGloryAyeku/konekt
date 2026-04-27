import { NextResponse, after } from "next/server";
import {
  isLikelyBot,
  parseDevice,
  parseReferrer,
  recordEvent,
} from "@/lib/analytics";
import { createServiceRoleClient } from "@/lib/supabase/server";

type Body = {
  profile_id: string;
  referrer: string | null;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body.profile_id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

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
