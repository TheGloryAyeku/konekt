import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PLANS, formatNaira } from "@/lib/paystack";
import { UpgradeButton } from "./upgrade-button";

export const metadata: Metadata = { title: "Billing" };

const PLAN_FEATURES: Record<string, string[]> = {
  pro_monthly: [
    "Unlimited links",
    "12-month analytics history",
    "Custom domain support",
    "Link scheduling",
    "Priority support",
  ],
  pro_annual: [
    "Everything in monthly",
    "Two months free vs monthly",
    "Annual billing in NGN",
    "Lock in this year's price",
  ],
};

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function BillingPage({ searchParams }: Props) {
  const { status } = await searchParams;
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

  const isPro = profile?.plan === "pro";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          All prices in Naira. Pay with your debit card, bank transfer, or
          USSD via Paystack.
        </p>
      </div>

      {status === "verifying" ? (
        <Alert>
          <AlertTitle>Verifying your payment</AlertTitle>
          <AlertDescription>
            Your plan will activate as soon as Paystack confirms the charge.
            This usually takes a few seconds.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current plan
            <Badge variant={isPro ? "default" : "secondary"}>
              {profile?.plan?.toUpperCase() ?? "FREE"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {subscription?.current_period_end
              ? `Renews ${new Date(
                  subscription.current_period_end,
                ).toLocaleDateString("en-NG")}`
              : isPro
                ? "Your Pro plan is active."
                : "You are on the free plan."}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.values(PLANS).map((plan) => {
          const features = PLAN_FEATURES[plan.code] ?? [];
          return (
            <Card key={plan.code}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-semibold text-foreground">
                    {formatNaira(plan.amount_kobo)}
                  </span>
                  <span className="ml-1 text-sm text-muted-foreground">
                    {plan.code === "pro_annual" ? "/ year" : "/ month"}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="flex flex-col gap-2 text-sm">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {isPro ? (
                  <p className="text-center text-xs text-muted-foreground">
                    You are on this plan or higher.
                  </p>
                ) : (
                  <UpgradeButton
                    planCode={plan.code}
                    label={`Upgrade for ${formatNaira(plan.amount_kobo)}`}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are processed by Paystack. You can cancel anytime from this
        page once you upgrade.
      </p>
    </div>
  );
}
