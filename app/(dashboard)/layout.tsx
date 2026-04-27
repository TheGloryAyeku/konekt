import Link from "next/link";
import {
  BarChart3,
  CreditCard,
  Globe,
  Link as LinkIcon,
  Palette,
  Settings,
} from "lucide-react";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { APP_NAME } from "@/lib/constants";
import { SignOutButton } from "./_components/signout-button";

const nav = [
  { href: "/dashboard/links", label: "Links", icon: LinkIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/appearance", label: "Appearance", icon: Palette },
  { href: "/dashboard/domain", label: "Domain", icon: Globe },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

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
          <Link href="/dashboard" className="font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-3">
            {profile?.username ? (
              <a
                href={`/${profile.username}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                konekt.ng/{profile.username}
              </a>
            ) : null}
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initial.toUpperCase()}</AvatarFallback>
            </Avatar>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-8">
        <aside className="hidden w-48 shrink-0 md:block">
          <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/15 hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
