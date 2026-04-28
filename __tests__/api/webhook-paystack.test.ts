import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";

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

vi.mock("@/lib/resend", () => ({
  sendReceiptEmail: vi.fn().mockResolvedValue(undefined),
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/webhooks/paystack/route";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendReceiptEmail, sendPaymentFailedEmail } from "@/lib/resend";
import { makeChain } from "../helpers/mock-supabase";

const SECRET = process.env.PAYSTACK_SECRET_KEY!;

function sign(body: string) {
  return createHmac("sha512", SECRET).update(body).digest("hex");
}

function makeRequest(event: object, extraHeaders: Record<string, string> = {}) {
  const body = JSON.stringify(event);
  return new Request("https://konekt.ng/api/webhooks/paystack", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": sign(body),
      ...extraHeaders,
    },
  });
}

function setupSupabase() {
  const chain = makeChain({ data: null, error: null });
  const mockClient = {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  vi.mocked(createServiceRoleClient).mockReturnValue(mockClient as never);
  return { mockClient, chain };
}

beforeEach(() => vi.clearAllMocks());

// ─── Signature verification ───────────────────────────────────────────────────

describe("Paystack webhook signature verification", () => {
  it("returns 401 for missing signature", async () => {
    setupSupabase();
    const body = JSON.stringify({ event: "charge.success", data: {} });
    const req = new Request("https://konekt.ng/api/webhooks/paystack", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 for wrong signature", async () => {
    setupSupabase();
    const body = JSON.stringify({ event: "charge.success", data: {} });
    const req = new Request("https://konekt.ng/api/webhooks/paystack", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": "badsignature",
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 for a valid signature", async () => {
    setupSupabase();
    const res = await POST(makeRequest({ event: "ping", data: {} }));
    await afterTracker.promise;
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid JSON body (even with valid signature)", async () => {
    // Signature is valid but body isn't valid JSON after being parsed
    setupSupabase();
    const body = "not-json";
    const req = new Request("https://konekt.ng/api/webhooks/paystack", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        "x-paystack-signature": sign(body),
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ─── charge.success ───────────────────────────────────────────────────────────

describe("charge.success event", () => {
  const PROFILE_ID = "00000000-0000-0000-0000-000000000001";

  const chargeSuccessEvent = {
    event: "charge.success",
    data: {
      reference: "ref_abc123",
      amount: 250_000,
      customer: { email: "buyer@test.com", customer_code: "CUS_xyz" },
      metadata: { profile_id: PROFILE_ID, plan_code: "pro_monthly" },
    },
  };

  it("updates profile plan to pro", async () => {
    const { mockClient } = setupSupabase();
    await POST(makeRequest(chargeSuccessEvent));
    await afterTracker.promise;
    expect(mockClient.from).toHaveBeenCalledWith("profiles");
  });

  it("inserts a subscription record", async () => {
    const { mockClient } = setupSupabase();
    await POST(makeRequest(chargeSuccessEvent));
    await afterTracker.promise;
    // from() is called with "profiles" then "subscriptions"
    const calls = vi.mocked(mockClient.from).mock.calls.map(([t]) => t);
    expect(calls).toContain("subscriptions");
  });

  it("sends a receipt email", async () => {
    setupSupabase();
    await POST(makeRequest(chargeSuccessEvent));
    await afterTracker.promise;
    expect(vi.mocked(sendReceiptEmail)).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "buyer@test.com",
        plan: "pro_monthly",
        amountNaira: 2500,
        reference: "ref_abc123",
      })
    );
  });

  it("skips processing when profile_id is missing from metadata", async () => {
    const { mockClient } = setupSupabase();
    const event = {
      event: "charge.success",
      data: {
        reference: "ref_no_profile",
        amount: 250_000,
        customer: { email: "buyer@test.com", customer_code: "CUS_xyz" },
        metadata: {},
      },
    };
    await POST(makeRequest(event));
    await afterTracker.promise;
    // profiles should NOT be updated — no profile_id to target
    expect(mockClient.from).not.toHaveBeenCalledWith("profiles");
  });
});

// ─── subscription.disable ────────────────────────────────────────────────────

describe("subscription.disable event", () => {
  it("marks subscription as cancelled", async () => {
    const { mockClient } = setupSupabase();
    const event = {
      event: "subscription.disable",
      data: { subscription_code: "SUB_xyz" },
    };
    await POST(makeRequest(event));
    await afterTracker.promise;
    expect(mockClient.from).toHaveBeenCalledWith("subscriptions");
  });

  it("skips when subscription_code is missing", async () => {
    const { mockClient } = setupSupabase();
    const event = { event: "subscription.disable", data: {} };
    await POST(makeRequest(event));
    await afterTracker.promise;
    expect(mockClient.from).not.toHaveBeenCalled();
  });
});

// ─── invoice.payment_failed ──────────────────────────────────────────────────

describe("invoice.payment_failed event", () => {
  it("sends a payment failed email", async () => {
    setupSupabase();
    const event = {
      event: "invoice.payment_failed",
      data: { customer: { email: "subscriber@test.com", customer_code: "CUS_abc" } },
    };
    await POST(makeRequest(event));
    await afterTracker.promise;
    expect(vi.mocked(sendPaymentFailedEmail)).toHaveBeenCalledWith(
      expect.objectContaining({ to: "subscriber@test.com" })
    );
  });

  it("skips email when customer email is missing", async () => {
    setupSupabase();
    const event = {
      event: "invoice.payment_failed",
      data: { customer: { customer_code: "CUS_abc" } },
    };
    await POST(makeRequest(event));
    await afterTracker.promise;
    expect(vi.mocked(sendPaymentFailedEmail)).not.toHaveBeenCalled();
  });
});

// ─── unknown event ────────────────────────────────────────────────────────────

describe("unknown events", () => {
  it("returns 200 without doing any DB work for unhandled events", async () => {
    const { mockClient } = setupSupabase();
    const res = await POST(makeRequest({ event: "refund.processed", data: {} }));
    await afterTracker.promise;
    expect(res.status).toBe(200);
    expect(mockClient.from).not.toHaveBeenCalled();
  });
});
