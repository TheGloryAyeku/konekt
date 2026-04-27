/**
 * Paystack server-side client (scaffold stub).
 *
 * Paystack does not publish an official Node SDK; this wrapper talks to the
 * REST API directly. Flesh out the methods you need as you wire up billing.
 *
 * Reference: https://paystack.com/docs/api/
 */

const PAYSTACK_BASE_URL = "https://api.paystack.co";

type PaystackResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

function getSecret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
  }
  return key;
}

async function paystackFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecret()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  const body = (await res.json()) as PaystackResponse<T>;

  if (!res.ok || !body.status) {
    throw new Error(`Paystack error: ${body.message ?? res.statusText}`);
  }

  return body.data;
}

export type InitTransactionParams = {
  email: string;
  amount: number; // in kobo (₦1 = 100 kobo)
  plan?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
};

export async function initializeTransaction(params: InitTransactionParams) {
  return paystackFetch<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function verifyTransaction(reference: string) {
  return paystackFetch<{
    status: string;
    reference: string;
    amount: number;
    customer: { email: string; customer_code: string };
    metadata: Record<string, unknown> | null;
  }>(`/transaction/verify/${reference}`);
}

export async function createSubscription(params: {
  customer: string;
  plan: string;
}) {
  return paystackFetch<{ subscription_code: string }>("/subscription", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function disableSubscription(params: {
  code: string;
  token: string;
}) {
  return paystackFetch<unknown>("/subscription/disable", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Verify Paystack webhook signature.
 *
 * Paystack signs webhook payloads with HMAC-SHA512 using your secret key. The
 * signature arrives in the `x-paystack-signature` header.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false;
  const { createHmac } = await import("node:crypto");
  const hash = createHmac("sha512", getSecret()).update(rawBody).digest("hex");
  return hash === signature;
}

/**
 * NGN pricing, in kobo. Adjust when plans are finalised.
 */
export const PLANS = {
  pro_monthly: {
    code: "pro_monthly",
    name: "Pro (monthly)",
    amount_kobo: 2_500_00, // ₦2,500
  },
  pro_annual: {
    code: "pro_annual",
    name: "Pro (annual)",
    amount_kobo: 25_000_00, // ₦25,000
  },
} as const;

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}
