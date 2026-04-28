import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { FREE_PLAN_LINK_LIMIT } from "@/lib/constants";
import { AddLinkDialog } from "./add-link-dialog";
import { LinkList, type LinkRow } from "./link-list";

export const metadata: Metadata = { title: "Links" };

export default async function LinksPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, username")
    .eq("id", user.id)
    .single();

  const { data: links } = await supabase
    .from("links")
    .select(
      "id, title, url, is_enabled, position, click_count, scheduled_start, scheduled_end",
    )
    .eq("profile_id", user.id)
    .order("position", { ascending: true });

  const linkCount = links?.length ?? 0;
  const isFree = profile?.plan === "free";
  const isPro = profile?.plan === "pro";
  const atLimit = isFree && linkCount >= FREE_PLAN_LINK_LIMIT;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your links</h1>
          <p className="text-sm text-muted-foreground">
            {isFree
              ? `${linkCount} of ${FREE_PLAN_LINK_LIMIT} links on the free plan`
              : `${linkCount} ${linkCount === 1 ? "link" : "links"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.username ? (
            <Link
              href={`/${profile.username}`}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Preview page
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          ) : null}
          <AddLinkDialog disabled={atLimit} />
        </div>
      </div>

      {atLimit ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 p-4 text-sm">
            <span>
              You have reached the {FREE_PLAN_LINK_LIMIT}-link limit on Free.
              Upgrade to Pro for unlimited links.
            </span>
            <Link
              href="/dashboard/billing"
              className={buttonVariants({ size: "sm" })}
            >
              Upgrade
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {linkCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">No links yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first link so your audience has somewhere to land. You
              can reorder, hide, or schedule them later.
            </p>
            <div className="mt-2">
              <AddLinkDialog disabled={atLimit} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <LinkList links={(links ?? []) as LinkRow[]} isPro={isPro} />
      )}
    </div>
  );
}
