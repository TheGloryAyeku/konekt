import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { AppearanceForm } from "./appearance-form";

export const metadata: Metadata = { title: "Appearance" };

export default async function AppearancePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, theme")
    .eq("id", user.id)
    .single();

  const theme = (profile?.theme as {
    background?: string;
    foreground?: string;
  } | null) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="text-sm text-muted-foreground">
          Customise how your public page looks. Changes save when you click
          Save.
        </p>
      </div>

      <AppearanceForm
        profile={{
          username: profile?.username ?? "",
          display_name: profile?.display_name ?? null,
          bio: profile?.bio ?? null,
          avatar_url: profile?.avatar_url ?? null,
          theme_background: theme?.background ?? "#fbfaf2",
          theme_foreground: theme?.foreground ?? "#16181c",
        }}
      />
    </div>
  );
}
