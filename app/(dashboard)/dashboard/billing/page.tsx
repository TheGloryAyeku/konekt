import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS, formatNaira } from "@/lib/paystack";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, plan")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          All prices in Naira. Pay with your debit card, bank transfer, or
          USSD via Paystack.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current plan
            <Badge variant={profile?.plan === "pro" ? "default" : "secondary"}>
              {profile?.plan?.toUpperCase() ?? "FREE"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {subscription?.current_period_end
              ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString("en-NG")}`
              : "You are on the free plan."}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.values(PLANS).map((plan) => (
          <Card key={plan.code}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-semibold text-foreground">
                  {formatNaira(plan.amount_kobo)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                {/* TODO: wire to /api/billing/checkout */}
                Upgrade (coming soon)
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
