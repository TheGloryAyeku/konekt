import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { FREE_PLAN_LINK_LIMIT } from "@/lib/constants";
import { AddLinkDialog } from "./add-link-dialog";

export const metadata: Metadata = { title: "Links" };

export default async function LinksPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const { data: links } = await supabase
    .from("links")
    .select("id, title, url, is_enabled, position, click_count")
    .eq("profile_id", user.id)
    .order("position", { ascending: true });

  const linkCount = links?.length ?? 0;
  const isFree = profile?.plan === "free";
  const atLimit = isFree && linkCount >= FREE_PLAN_LINK_LIMIT;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your links</h1>
          <p className="text-sm text-muted-foreground">
            {isFree
              ? `${linkCount} / ${FREE_PLAN_LINK_LIMIT} links on the free plan`
              : `${linkCount} links`}
          </p>
        </div>
        <AddLinkDialog disabled={atLimit} />
      </div>

      {/* TODO: swap for the interactive drag-and-drop list once reorder is wired. */}
      {linkCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No links yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first link so your audience has somewhere to land.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {links!.map((link) => (
            <Card key={link.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex flex-col">
                  <span className="font-medium">{link.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {link.url}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {link.click_count} clicks
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
