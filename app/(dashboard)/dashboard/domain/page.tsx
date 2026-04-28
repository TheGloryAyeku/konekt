import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { DomainManager } from "./domain-manager";

export const metadata: Metadata = { title: "Custom domain" };

export default async function DomainPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const isPro = profile?.plan === "pro";

  const { data: domains } = isPro
    ? await supabase
        .from("custom_domains")
        .select("id, domain, verified, verification_token, created_at")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Custom domain
        </h1>
        <p className="text-sm text-muted-foreground">
          Point your own domain at your page so the link in your bio matches
          your brand.
        </p>
      </div>

      {!isPro ? (
        <Alert>
          <AlertTitle>Pro plan required</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Custom domains are part of Pro. Upgrade to connect your own
              domain.
            </span>
            <Link
              href="/dashboard/billing"
              className={buttonVariants({ size: "sm" })}
            >
              Upgrade to Pro
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <DomainManager domains={domains ?? []} />
      )}
    </div>
  );
}
