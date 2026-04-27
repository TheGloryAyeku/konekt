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

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearancePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url, theme")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="text-sm text-muted-foreground">
          Customise how your public page looks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Photo, display name, and bio shown at the top of your page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: profile form — upload to Cloudflare R2, persist via server action */}
          <pre className="rounded-md bg-muted p-4 text-xs text-muted-foreground">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Background colour or gradient.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Colour + gradient picker coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
