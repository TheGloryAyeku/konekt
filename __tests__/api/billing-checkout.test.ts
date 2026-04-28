import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        status: (init as { status?: number })?.status ?? 200,
        headers: { "Content-Type": "application/json" },
      }),
  },
}));

vi.mock("@/lib/supabase/require-user", () => ({
  requireUser: vi.fn(),
}));

vi.mock("@/lib/paystack", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/paystack")>();
  return {
    ...actual,
    initializeTransaction: vi.fn(),
  };
});

import { POST } from "@/app/api/billing/checkout/route";
import { requireUser } from "@/lib/supabase/require-user";
import { initializeTransaction } from "@/lib/paystack";

const MOCK_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "test@konekt.ng",
};

function makeRequest(body: unknown = {}) {
  return new Request("https://konekt.ng/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue(MOCK_USER as never);
  process.env.PAYSTACK_SECRET_KEY = "test_paystack_secret_key_for_testing_only";
});

describe("POST /api/billing/checkout", () => {
  it("returns authorization_url for valid pro_monthly plan", async () => {
    vi.mocked(initializeTransaction).mockResolvedValue({
      authorization_url: "https://checkout.paystack.com/xyz",
      access_code: "abc",
      reference: "ref_123",
    });

    const res = await POST(makeRequest({ plan_code: "pro_monthly" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authorization_url).toBe("https://checkout.paystack.com/xyz");
  });

  it("defaults to pro_monthly when plan_code is omitted", async () => {
    vi.mocked(initializeTransaction).mockResolvedValue({
      authorization_url: "https://checkout.paystack.com/abc",
      access_code: "abc",
      reference: "ref_456",
    });

    const res = await POST(makeRequest({}));
    expect(res.status).toBe(200);
    expect(vi.mocked(initializeTransaction)).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250_000 })
    );
  });

  it("returns 400 for unknown plan_code", async () => {
    const res = await POST(makeRequest({ plan_code: "free_plan" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Unknown plan/);
  });

  it("returns 400 for malformed JSON body", async () => {
    const req = new Request("https://konekt.ng/api/billing/checkout", {
      method: "POST",
      body: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when user has no email", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1", email: undefined } as never);
    const res = await POST(makeRequest({ plan_code: "pro_monthly" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/email/i);
  });

  it("returns 503 when PAYSTACK_SECRET_KEY is missing", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const res = await POST(makeRequest({ plan_code: "pro_monthly" }));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toMatch(/PAYSTACK_SECRET_KEY/);
  });

  it("returns 502 when Paystack API throws", async () => {
    vi.mocked(initializeTransaction).mockRejectedValue(new Error("Network error"));
    const res = await POST(makeRequest({ plan_code: "pro_monthly" }));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/Network error/);
  });

  it("passes correct amount_kobo for pro_monthly (₦2,500)", async () => {
    vi.mocked(initializeTransaction).mockResolvedValue({
      authorization_url: "https://checkout.paystack.com/def",
      access_code: "def",
      reference: "ref_789",
    });

    await POST(makeRequest({ plan_code: "pro_monthly" }));
    expect(vi.mocked(initializeTransaction)).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250_000 })
    );
  });

  it("passes correct amount_kobo for pro_annual (₦25,000)", async () => {
    vi.mocked(initializeTransaction).mockResolvedValue({
      authorization_url: "https://checkout.paystack.com/ghi",
      access_code: "ghi",
      reference: "ref_abc",
    });

    await POST(makeRequest({ plan_code: "pro_annual" }));
    expect(vi.mocked(initializeTransaction)).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 2_500_000 })
    );
  });

  it("includes profile_id in Paystack metadata", async () => {
    vi.mocked(initializeTransaction).mockResolvedValue({
      authorization_url: "https://checkout.paystack.com/jkl",
      access_code: "jkl",
      reference: "ref_def",
    });

    await POST(makeRequest({ plan_code: "pro_monthly" }));
    expect(vi.mocked(initializeTransaction)).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ profile_id: MOCK_USER.id }),
      })
    );
  });
});
