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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Custom domain</h1>
        <p className="text-sm text-muted-foreground">
          Point your own domain at your page via a CNAME.
        </p>
      </div>

      {!isPro ? (
        <Alert>
          <AlertTitle>Pro plan required</AlertTitle>
          <AlertDescription>
            Custom domains are available on the Pro plan. Upgrade from the
            billing page to unlock it.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connect a domain</CardTitle>
            <CardDescription>
              We&apos;ll provision the Cloudflare config once you verify the
              CNAME.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {/* TODO: domain add form + verification status */}
              Domain setup UI coming soon.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
