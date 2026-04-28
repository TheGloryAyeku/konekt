import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { APP_NAME } from "@/lib/constants";
import { SignOutButton } from "./_components/signout-button";
import {
  DashboardMobileNav,
  DashboardSidebar,
} from "./_components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  const initial =
    profile?.display_name?.charAt(0) ??
    profile?.username?.charAt(0) ??
    user.email?.charAt(0) ??
    "?";

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-transparent">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight text-foreground"
          >
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-3">
            {profile?.username ? (
              <a
                href={`/${profile.username}`}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary sm:flex"
              >
                konekt.ng/{profile.username}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initial.toUpperCase()}</AvatarFallback>
            </Avatar>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-8 pb-24 md:pb-8">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <DashboardMobileNav />
    </div>
  );
}
