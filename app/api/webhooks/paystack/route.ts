import { NextResponse, after } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendPaymentFailedEmail, sendReceiptEmail } from "@/lib/resend";

/**
 * Paystack webhook handler.
 *
 * Paystack POSTs events signed with HMAC-SHA512 in the `x-paystack-signature`
 * header. Verify the signature against the raw body before doing anything.
 *
 * Events we care about:
 *   - charge.success               → mark subscription active, email receipt
 *   - subscription.create          → record paystack_subscription_code
 *   - subscription.disable         → mark subscription cancelled
 *   - invoice.payment_failed       → notify user
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  type PaystackEvent = {
    event: string;
    data: {
      reference?: string;
      amount?: number;
      customer?: { email: string; customer_code: string };
      plan?: { plan_code: string };
      subscription_code?: string;
      metadata?: { profile_id?: string; plan_code?: string };
    };
  };

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  after(async () => {
    const supabase = createServiceRoleClient();

    switch (event.event) {
      case "charge.success": {
        const profileId = event.data.metadata?.profile_id;
        const planCode = event.data.metadata?.plan_code ?? "pro_monthly";
        if (!profileId) return;

        await supabase
          .from("profiles")
          .update({ plan: "pro" })
          .eq("id", profileId);

        await supabase.from("subscriptions").insert({
          profile_id: profileId,
          plan: "pro",
          status: "active",
          paystack_customer_code: event.data.customer?.customer_code ?? null,
        });

        if (event.data.customer?.email && event.data.amount) {
          await sendReceiptEmail({
            to: event.data.customer.email,
            plan: planCode,
            amountNaira: event.data.amount / 100,
            reference: event.data.reference ?? "",
          });
        }
        break;
      }

      case "subscription.disable": {
        if (!event.data.subscription_code) return;
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("paystack_subscription_code", event.data.subscription_code);
        break;
      }

      case "invoice.payment_failed": {
        if (event.data.customer?.email) {
          await sendPaymentFailedEmail({
            to: event.data.customer.email,
            reason: "Your card was declined.",
          });
        }
        break;
      }
    }
  });

  return NextResponse.json({ ok: true });
}
