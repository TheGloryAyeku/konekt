/**
 * Tests for the pure analytics computation logic that lives inside the
 * analytics page. The functions are duplicated here (not imported) because
 * they are not exported from the server component file. If these calculations
 * are ever extracted into a shared utility, update these tests to import
 * directly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── formatRelative (mirrors app/.../analytics/page.tsx) ─────────────────────

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

describe("formatRelative", () => {
  const now = new Date("2026-04-28T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => vi.useRealTimers());

  it("returns 'just now' for timestamps under 1 minute ago", () => {
    const ts = new Date(now.getTime() - 30_000).toISOString();
    expect(formatRelative(ts)).toBe("just now");
  });

  it("returns '1m ago' for 1 minute ago", () => {
    const ts = new Date(now.getTime() - 60_000).toISOString();
    expect(formatRelative(ts)).toBe("1m ago");
  });

  it("returns '45m ago' for 45 minutes ago", () => {
    const ts = new Date(now.getTime() - 45 * 60_000).toISOString();
    expect(formatRelative(ts)).toBe("45m ago");
  });

  it("returns '1h ago' for 60 minutes ago", () => {
    const ts = new Date(now.getTime() - 60 * 60_000).toISOString();
    expect(formatRelative(ts)).toBe("1h ago");
  });

  it("returns '3h ago' for 3 hours ago", () => {
    const ts = new Date(now.getTime() - 3 * 60 * 60_000).toISOString();
    expect(formatRelative(ts)).toBe("3h ago");
  });

  it("returns '1d ago' for 24 hours ago", () => {
    const ts = new Date(now.getTime() - 24 * 60 * 60_000).toISOString();
    expect(formatRelative(ts)).toBe("1d ago");
  });

  it("returns '7d ago' for 7 days ago", () => {
    const ts = new Date(now.getTime() - 7 * 24 * 60 * 60_000).toISOString();
    expect(formatRelative(ts)).toBe("7d ago");
  });
});

// ─── CTR calculation ──────────────────────────────────────────────────────────

function computeCtr(views: number, clicks: number): number {
  return views > 0 ? Math.round((clicks / views) * 100) : 0;
}

describe("CTR computation", () => {
  it("computes 50% CTR for 1 click out of 2 views", () => {
    expect(computeCtr(2, 1)).toBe(50);
  });

  it("computes 100% CTR when every view results in a click", () => {
    expect(computeCtr(10, 10)).toBe(100);
  });

  it("returns 0 when there are no views", () => {
    expect(computeCtr(0, 0)).toBe(0);
  });

  it("returns 0 when there are no clicks", () => {
    expect(computeCtr(100, 0)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    // 1/3 = 33.33% → 33
    expect(computeCtr(3, 1)).toBe(33);
    // 2/3 = 66.67% → 67
    expect(computeCtr(3, 2)).toBe(67);
  });
});

// ─── Platform counting ────────────────────────────────────────────────────────

type Event = { referrer_platform: string | null };

function buildPlatformCounts(events: Event[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of events) {
    const key = e.referrer_platform ?? "direct";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

describe("platform counting", () => {
  it("counts instagram events correctly", () => {
    const events: Event[] = [
      { referrer_platform: "instagram" },
      { referrer_platform: "instagram" },
      { referrer_platform: "tiktok" },
    ];
    const counts = buildPlatformCounts(events);
    expect(counts.get("instagram")).toBe(2);
    expect(counts.get("tiktok")).toBe(1);
  });

  it("maps null referrer_platform to direct", () => {
    const events: Event[] = [
      { referrer_platform: null },
      { referrer_platform: null },
    ];
    const counts = buildPlatformCounts(events);
    expect(counts.get("direct")).toBe(2);
  });

  it("identifies top referrer correctly", () => {
    const events: Event[] = [
      { referrer_platform: "instagram" },
      { referrer_platform: "instagram" },
      { referrer_platform: "x" },
      { referrer_platform: "tiktok" },
    ];
    const counts = buildPlatformCounts(events);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    expect(top![0]).toBe("instagram");
    expect(top![1]).toBe(2);
  });

  it("returns empty map for no events", () => {
    expect(buildPlatformCounts([])).toEqual(new Map());
  });
});

// ─── Device split ─────────────────────────────────────────────────────────────

type DeviceEvent = { device: string | null };

function computeDeviceSplit(events: DeviceEvent[]) {
  const total = events.length;
  if (!total) return { mobileShare: 0, desktopShare: 0 };
  const counts = new Map<string, number>();
  for (const e of events) {
    const key = e.device ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const mobileShare = Math.round(((counts.get("mobile") ?? 0) / total) * 100);
  const desktopShare = Math.round(((counts.get("desktop") ?? 0) / total) * 100);
  return { mobileShare, desktopShare };
}

describe("device split", () => {
  it("computes 100% mobile when all events are mobile", () => {
    const events: DeviceEvent[] = Array(5).fill({ device: "mobile" });
    const { mobileShare, desktopShare } = computeDeviceSplit(events);
    expect(mobileShare).toBe(100);
    expect(desktopShare).toBe(0);
  });

  it("computes 50/50 split", () => {
    const events: DeviceEvent[] = [
      ...Array(3).fill({ device: "mobile" }),
      ...Array(3).fill({ device: "desktop" }),
    ];
    const { mobileShare, desktopShare } = computeDeviceSplit(events);
    expect(mobileShare).toBe(50);
    expect(desktopShare).toBe(50);
  });

  it("returns 0 for empty event list", () => {
    const { mobileShare, desktopShare } = computeDeviceSplit([]);
    expect(mobileShare).toBe(0);
    expect(desktopShare).toBe(0);
  });

  it("treats null device as unknown (not counted in mobile/desktop)", () => {
    const events: DeviceEvent[] = [
      { device: "mobile" },
      { device: null },
      { device: null },
    ];
    const { mobileShare } = computeDeviceSplit(events);
    // 1 mobile out of 3 total = 33%
    expect(mobileShare).toBe(33);
  });
});

// ─── Per-link click breakdown ─────────────────────────────────────────────────

type ClickEvent = { event_type: string; link_id: string | null };
type Link = { id: string; title: string; click_count: number };

function buildLinkBreakdown(events: ClickEvent[], links: Link[]) {
  const clickByLink = new Map<string, number>();
  for (const e of events) {
    if (e.event_type !== "link_click" || !e.link_id) continue;
    clickByLink.set(e.link_id, (clickByLink.get(e.link_id) ?? 0) + 1);
  }
  return links
    .map((l) => ({ ...l, windowed: clickByLink.get(l.id) ?? 0 }))
    .sort((a, b) => b.windowed - a.windowed);
}

describe("per-link click breakdown", () => {
  const links: Link[] = [
    { id: "aaa", title: "Portfolio", click_count: 42 },
    { id: "bbb", title: "Twitter", click_count: 18 },
    { id: "ccc", title: "Instagram", click_count: 5 },
  ];

  it("counts windowed clicks per link and sorts descending", () => {
    const events: ClickEvent[] = [
      { event_type: "link_click", link_id: "bbb" },
      { event_type: "link_click", link_id: "bbb" },
      { event_type: "link_click", link_id: "aaa" },
      { event_type: "page_view", link_id: null },
    ];
    const breakdown = buildLinkBreakdown(events, links);
    expect(breakdown[0]!.id).toBe("bbb");
    expect(breakdown[0]!.windowed).toBe(2);
    expect(breakdown[1]!.id).toBe("aaa");
    expect(breakdown[1]!.windowed).toBe(1);
  });

  it("excludes page_view events from per-link counts", () => {
    const events: ClickEvent[] = [
      { event_type: "page_view", link_id: null },
      { event_type: "page_view", link_id: null },
    ];
    const breakdown = buildLinkBreakdown(events, links);
    expect(breakdown.every((l) => l.windowed === 0)).toBe(true);
  });

  it("preserves all-time click_count from the links table", () => {
    const events: ClickEvent[] = [{ event_type: "link_click", link_id: "aaa" }];
    const breakdown = buildLinkBreakdown(events, links);
    const aaa = breakdown.find((l) => l.id === "aaa")!;
    expect(aaa.click_count).toBe(42);
    expect(aaa.windowed).toBe(1);
  });

  it("returns windowed 0 for links with no events in the window", () => {
    const breakdown = buildLinkBreakdown([], links);
    expect(breakdown.every((l) => l.windowed === 0)).toBe(true);
  });
});
