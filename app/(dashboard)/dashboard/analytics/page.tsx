import type { Metadata } from "next";
import { MousePointerClick, Eye, Smartphone, Monitor } from "lucide-react";
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
import { RangeTabs } from "./range-tabs";

export const metadata: Metadata = { title: "Analytics" };

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X (Twitter)",
  youtube: "YouTube",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  direct: "Direct",
  other: "Other",
};

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const RANGE_LABEL: Record<string, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
};

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Props = {
  searchParams: Promise<{ range?: string }>;
};

export default async function AnalyticsPage({ searchParams }: Props) {
  const { range: rangeParam } = await searchParams;
  const range =
    rangeParam && RANGE_DAYS[rangeParam] ? rangeParam : "7d";
  const days = RANGE_DAYS[range];
  const rangeLabel = RANGE_LABEL[range];

  const user = await requireUser();
  const supabase = await createClient();

  const since = daysAgoIso(days);

  const { data: events } = await supabase
    .from("link_click_events")
    .select("event_type, referrer_platform, device, link_id, created_at")
    .eq("profile_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  const { data: recent } = await supabase
    .from("link_click_events")
    .select("event_type, referrer_platform, device, link_id, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: links } = await supabase
    .from("links")
    .select("id, title, click_count")
    .eq("profile_id", user.id)
    .order("click_count", { ascending: false });

  const linkTitle = new Map<string, string>();
  for (const l of links ?? []) linkTitle.set(l.id, l.title);

  const safe = events ?? [];

  const views = safe.filter((e) => e.event_type === "page_view").length;
  const clicks = safe.filter((e) => e.event_type === "link_click").length;
  const ctr = views > 0 ? Math.round((clicks / views) * 100) : 0;

  const platformCounts = new Map<string, number>();
  for (const e of safe) {
    const key = e.referrer_platform ?? "direct";
    platformCounts.set(key, (platformCounts.get(key) ?? 0) + 1);
  }
  const topReferrer = [...platformCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];

  const deviceCounts = new Map<string, number>();
  for (const e of safe) {
    const key = e.device ?? "unknown";
    deviceCounts.set(key, (deviceCounts.get(key) ?? 0) + 1);
  }
  const total = safe.length;
  const mobileShare = total
    ? Math.round(((deviceCounts.get("mobile") ?? 0) / total) * 100)
    : 0;
  const desktopShare = total
    ? Math.round(((deviceCounts.get("desktop") ?? 0) / total) * 100)
    : 0;

  const stats = [
    {
      icon: Eye,
      label: `Page views (${rangeLabel})`,
      value: views.toLocaleString(),
    },
    {
      icon: MousePointerClick,
      label: `Link clicks (${rangeLabel})`,
      value: clicks.toLocaleString(),
      sub: views > 0 ? `${ctr}% click-through` : undefined,
    },
    {
      icon: Smartphone,
      label: "Top referrer",
      value: topReferrer
        ? PLATFORM_LABELS[topReferrer[0]] ?? topReferrer[0]
        : "No data",
    },
    {
      icon: Monitor,
      label: "Device split",
      value: total ? `${mobileShare}% mobile` : "No data",
      sub: total ? `${desktopShare}% desktop` : undefined,
    },
  ];

  const clickByLink = new Map<string, number>();
  for (const e of safe) {
    if (e.event_type !== "link_click" || !e.link_id) continue;
    clickByLink.set(e.link_id, (clickByLink.get(e.link_id) ?? 0) + 1);
  }
  const linkBreakdown = (links ?? [])
    .map((l) => ({
      id: l.id,
      title: l.title,
      total: l.click_count,
      windowed: clickByLink.get(l.id) ?? 0,
    }))
    .sort((a, b) => b.windowed - a.windowed);

  const totalPlatform = [...platformCounts.values()].reduce(
    (a, b) => a + b,
    0,
  );
  const platformRows = [...platformCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxLinkWindow = Math.max(1, ...linkBreakdown.map((l) => l.windowed));
  const updatedAt = new Date().toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Updated at {updatedAt}. Bot traffic is filtered out.
          </p>
        </div>
      </div>

      <RangeTabs active={range} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <stat.icon className="h-3.5 w-3.5" />
                {stat.label}
              </CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
              {stat.sub ? (
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              ) : null}
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Per-link clicks</CardTitle>
            <CardDescription>
              Last {days} days, sorted by activity in this range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {linkBreakdown.length === 0 ? (
              <EmptyAnalytics
                title="No links yet"
                body="Add a link to start collecting clicks."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {linkBreakdown.map((link) => {
                  const pct = (link.windowed / maxLinkWindow) * 100;
                  return (
                    <li key={link.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium">
                          {link.title}
                        </span>
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {link.windowed} in {rangeLabel} · {link.total} all
                          time
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
            <CardDescription>Last {days} days.</CardDescription>
          </CardHeader>
          <CardContent>
            {platformRows.length === 0 ? (
              <EmptyAnalytics
                title="No traffic yet"
                body="Share your konekt.ng link on Instagram, TikTok, or X to start seeing referrers here."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {platformRows.map(([platform, count]) => {
                  const pct = totalPlatform
                    ? Math.round((count / totalPlatform) * 100)
                    : 0;
                  return (
                    <li key={platform} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {PLATFORM_LABELS[platform] ?? platform}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            The last events from your page. Live data, no aggregation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recent || recent.length === 0 ? (
            <EmptyAnalytics
              title="No events yet"
              body="As soon as someone visits your page or taps a link, you will see it here."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recent.map((e, i) => (
                <li
                  key={`${e.created_at}-${i}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {e.event_type === "page_view" ? (
                      <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <MousePointerClick className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span className="truncate">
                      {e.event_type === "page_view"
                        ? "Page view"
                        : e.link_id
                          ? linkTitle.get(e.link_id) ?? "Click"
                          : "Click"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {e.referrer_platform ? (
                      <Badge variant="outline" className="text-xs">
                        {PLATFORM_LABELS[e.referrer_platform] ??
                          e.referrer_platform}
                      </Badge>
                    ) : null}
                    {e.device ? (
                      <span className="hidden sm:inline">{e.device}</span>
                    ) : null}
                    <span className="whitespace-nowrap">
                      {formatRelative(e.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyAnalytics({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
        {body}
      </p>
    </div>
  );
}
