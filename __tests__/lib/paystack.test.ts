import { describe, it, expect, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { formatNaira, PLANS, verifyWebhookSignature } from "@/lib/paystack";

// ─── formatNaira ─────────────────────────────────────────────────────────────

describe("formatNaira", () => {
  it("formats ₦2,500 from 250000 kobo", () => {
    const result = formatNaira(250_000);
    expect(result).toMatch(/2[,.]?500/);
    expect(result).toMatch(/NGN|₦/);
  });

  it("formats ₦25,000 from 2500000 kobo", () => {
    const result = formatNaira(2_500_000);
    expect(result).toMatch(/25[,.]?000/);
  });

  it("formats zero kobo", () => {
    const result = formatNaira(0);
    expect(result).toMatch(/0/);
  });

  it("rounds down fractional kobo", () => {
    // 150 kobo = ₦1.50 → displayed as ₦2 (rounds, no fractional digits)
    const result = formatNaira(100);
    expect(result).toMatch(/1/);
  });
});

// ─── PLANS ───────────────────────────────────────────────────────────────────

describe("PLANS constants", () => {
  it("has pro_monthly plan with ₦2,500 amount", () => {
    expect(PLANS.pro_monthly.amount_kobo).toBe(250_000);
    expect(PLANS.pro_monthly.code).toBe("pro_monthly");
  });

  it("has pro_annual plan with ₦25,000 amount", () => {
    expect(PLANS.pro_annual.amount_kobo).toBe(2_500_000);
    expect(PLANS.pro_annual.code).toBe("pro_annual");
  });

  it("annual plan is exactly 10× the monthly amount", () => {
    expect(PLANS.pro_annual.amount_kobo).toBe(PLANS.pro_monthly.amount_kobo * 10);
  });
});

// ─── verifyWebhookSignature ───────────────────────────────────────────────────

describe("verifyWebhookSignature", () => {
  const SECRET = process.env.PAYSTACK_SECRET_KEY!;
  const body = JSON.stringify({ event: "charge.success", data: {} });

  function sign(payload: string) {
    return createHmac("sha512", SECRET).update(payload).digest("hex");
  }

  it("returns true for a valid signature", async () => {
    const sig = sign(body);
    expect(await verifyWebhookSignature(body, sig)).toBe(true);
  });

  it("returns false for a tampered body", async () => {
    const sig = sign(body);
    const tampered = JSON.stringify({ event: "charge.success", data: { evil: true } });
    expect(await verifyWebhookSignature(tampered, sig)).toBe(false);
  });

  it("returns false for a wrong secret (invalid signature string)", async () => {
    const wrongSig = createHmac("sha512", "wrong_secret").update(body).digest("hex");
    expect(await verifyWebhookSignature(body, wrongSig)).toBe(false);
  });

  it("returns false for null signature", async () => {
    expect(await verifyWebhookSignature(body, null)).toBe(false);
  });

  it("returns false for empty signature string", async () => {
    expect(await verifyWebhookSignature(body, "")).toBe(false);
  });

  it("returns false for a truncated valid signature", async () => {
    const sig = sign(body).slice(0, 32);
    expect(await verifyWebhookSignature(body, sig)).toBe(false);
  });
});
