import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/require-user";
import { initializeTransaction, PLANS } from "@/lib/paystack";
import { PUBLIC_URL } from "@/lib/constants";

const VALID_PLAN_CODES = new Set(Object.keys(PLANS));

export async function POST(request: Request) {
  const user = await requireUser();

  let body: { plan_code?: string };
  try {
    body = (await request.json()) as { plan_code?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const planCode = body.plan_code ?? "pro_monthly";
  if (!VALID_PLAN_CODES.has(planCode)) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }
  const plan = PLANS[planCode as keyof typeof PLANS];

  if (!user.email) {
    return NextResponse.json(
      { error: "Add an email to your account before upgrading." },
      { status: 400 },
    );
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      {
        error:
          "Billing is not configured yet. Set PAYSTACK_SECRET_KEY in the environment.",
      },
      { status: 503 },
    );
  }

  try {
    const data = await initializeTransaction({
      email: user.email,
      amount: plan.amount_kobo,
      callback_url: `${PUBLIC_URL}/dashboard/billing?status=verifying`,
      metadata: { profile_id: user.id, plan_code: plan.code },
    });
    return NextResponse.json({ authorization_url: data.authorization_url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 502 },
    );
  }
}
