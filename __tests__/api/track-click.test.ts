import { describe, it, expect, vi, beforeEach } from "vitest";

// Track the promise returned by the after() callback so tests can await it.
const afterTracker = { promise: Promise.resolve() as Promise<void> };

// Mock next/server before importing the route
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

import { POST } from "@/app/api/track/click/route";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { makeChain } from "../helpers/mock-supabase";

// Zod v4 requires valid UUID variant bits (4th group must start with 8/9/a/b)
const PROFILE_ID = "00000000-0000-4000-8000-000000000001";
const LINK_ID    = "11111111-1111-4111-8111-111111111111";

function makeRequest(body: unknown, ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)", headers: Record<string, string> = {}) {
  return new Request("https://konekt.ng/api/track/click", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "user-agent": ua,
      ...headers,
    },
  });
}

function setupSupabase() {
  const insertChain = makeChain({ data: null, error: null });
  const mockClient = {
    from: vi.fn().mockReturnValue(insertChain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  vi.mocked(createServiceRoleClient).mockReturnValue(mockClient as never);
  return mockClient;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/track/click", () => {
  it("returns 200 ok for a valid click event", async () => {
    setupSupabase();
    const res = await POST(makeRequest({ profile_id: PROFILE_ID, link_id: LINK_ID, referrer: null }));
    await afterTracker.promise;
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 400 for missing profile_id", async () => {
    const res = await POST(makeRequest({ link_id: LINK_ID, referrer: null }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-UUID profile_id", async () => {
    const res = await POST(makeRequest({ profile_id: "not-a-uuid", link_id: LINK_ID, referrer: null }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing link_id", async () => {
    const res = await POST(makeRequest({ profile_id: PROFILE_ID, referrer: null }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    const req = new Request("https://konekt.ng/api/track/click", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for referrer exceeding 2048 characters", async () => {
    const res = await POST(makeRequest({
      profile_id: PROFILE_ID,
      link_id: LINK_ID,
      referrer: "https://example.com/" + "a".repeat(2048),
    }));
    expect(res.status).toBe(400);
  });

  it("skips DB write for bot user-agents", async () => {
    const mockClient = setupSupabase();
    await POST(makeRequest(
      { profile_id: PROFILE_ID, link_id: LINK_ID, referrer: null },
      "Googlebot/2.1 (+http://www.google.com/bot.html)"
    ));
    await afterTracker.promise;
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("writes event to link_click_events for real user", async () => {
    const mockClient = setupSupabase();
    await POST(makeRequest(
      { profile_id: PROFILE_ID, link_id: LINK_ID, referrer: "https://instagram.com" },
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
    ));
    await afterTracker.promise;
    expect(mockClient.from).toHaveBeenCalledWith("link_click_events");
  });

  it("calls increment_link_click_count RPC", async () => {
    const mockClient = setupSupabase();
    await POST(makeRequest(
      { profile_id: PROFILE_ID, link_id: LINK_ID, referrer: null },
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    ));
    await afterTracker.promise;
    expect(mockClient.rpc).toHaveBeenCalledWith("increment_link_click_count", {
      link_id_input: LINK_ID,
    });
  });

  it("reads country from x-vercel-ip-country header", async () => {
    const mockClient = setupSupabase();
    const insertChain = makeChain({ data: null, error: null });
    mockClient.from.mockReturnValue(insertChain);

    await POST(makeRequest(
      { profile_id: PROFILE_ID, link_id: LINK_ID, referrer: null },
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      { "x-vercel-ip-country": "NG" }
    ));
    await afterTracker.promise;

    const insertCall = vi.mocked(insertChain.insert);
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({ country: "NG" })
    );
  });
});
