import { describe, it, expect, vi, beforeEach } from "vitest";

const afterTracker = { promise: Promise.resolve() as Promise<void> };

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        status: (init as { status?: number })?.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
  },
  after: vi.fn((fn: () => Promise<void>) => { afterTracker.promise = fn(); }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(),
}));

import { POST } from "@/app/api/track/view/route";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { makeChain } from "../helpers/mock-supabase";

const PROFILE_ID = "00000000-0000-4000-8000-000000000001";

function makeRequest(body: unknown, ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", headers: Record<string, string> = {}) {
  return new Request("https://konekt.ng/api/track/view", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", "user-agent": ua, ...headers },
  });
}

function setupSupabase() {
  const chain = makeChain({ data: null, error: null });
  const mockClient = { from: vi.fn().mockReturnValue(chain) };
  vi.mocked(createServiceRoleClient).mockReturnValue(mockClient as never);
  return mockClient;
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/track/view", () => {
  it("returns 200 ok for a valid page view", async () => {
    setupSupabase();
    const res = await POST(makeRequest({ profile_id: PROFILE_ID, referrer: null }));
    await afterTracker.promise;
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 400 for missing profile_id", async () => {
    const res = await POST(makeRequest({ referrer: null }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-UUID profile_id", async () => {
    const res = await POST(makeRequest({ profile_id: "bad-id", referrer: null }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for referrer over 2048 chars", async () => {
    const res = await POST(makeRequest({
      profile_id: PROFILE_ID,
      referrer: "https://x.com/" + "a".repeat(2048),
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON", async () => {
    const req = new Request("https://konekt.ng/api/track/view", {
      method: "POST",
      body: "{bad json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("skips DB write for bot traffic", async () => {
    const mockClient = setupSupabase();
    await POST(makeRequest(
      { profile_id: PROFILE_ID, referrer: null },
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
    ));
    await afterTracker.promise;
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("inserts page_view event for real user", async () => {
    const mockClient = setupSupabase();
    await POST(makeRequest({ profile_id: PROFILE_ID, referrer: "https://tiktok.com" }));
    await afterTracker.promise;
    expect(mockClient.from).toHaveBeenCalledWith("link_click_events");
  });

  it("records correct referrer_platform from TikTok URL", async () => {
    const chain = makeChain({ data: null, error: null });
    const mockClient = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createServiceRoleClient).mockReturnValue(mockClient as never);

    await POST(makeRequest(
      { profile_id: PROFILE_ID, referrer: "https://tiktok.com/user/vid" },
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
    ));
    await afterTracker.promise;

    expect(vi.mocked(chain.insert)).toHaveBeenCalledWith(
      expect.objectContaining({ referrer_platform: "tiktok" })
    );
  });

  it("reads cf-ipcountry header as fallback country", async () => {
    const chain = makeChain({ data: null, error: null });
    const mockClient = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createServiceRoleClient).mockReturnValue(mockClient as never);

    await POST(makeRequest(
      { profile_id: PROFILE_ID, referrer: null },
      "Mozilla/5.0 (Windows NT 10.0)",
      { "cf-ipcountry": "US" }
    ));
    await afterTracker.promise;

    expect(vi.mocked(chain.insert)).toHaveBeenCalledWith(
      expect.objectContaining({ country: "US" })
    );
  });
});
