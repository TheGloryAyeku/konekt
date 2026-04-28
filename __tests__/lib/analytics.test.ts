import { describe, it, expect } from "vitest";
import { parseReferrer, parseDevice, isLikelyBot } from "@/lib/analytics";

// ─── parseReferrer ────────────────────────────────────────────────────────────

describe("parseReferrer", () => {
  it("returns direct when referrer is null", () => {
    expect(parseReferrer(null)).toEqual({ host: null, platform: "direct" });
  });

  it("returns direct when referrer is undefined", () => {
    expect(parseReferrer(undefined)).toEqual({ host: null, platform: "direct" });
  });

  it("returns direct when referrer is empty string", () => {
    expect(parseReferrer("")).toEqual({ host: null, platform: "direct" });
  });

  it("returns direct for malformed URLs", () => {
    expect(parseReferrer("not-a-url")).toEqual({ host: null, platform: "direct" });
  });

  it("maps instagram.com", () => {
    const r = parseReferrer("https://instagram.com/stories/something");
    expect(r).toEqual({ host: "instagram.com", platform: "instagram" });
  });

  it("maps l.instagram.com (link in bio redirect)", () => {
    const r = parseReferrer("https://l.instagram.com/?u=https%3A%2F%2Fkonekt.ng");
    expect(r).toEqual({ host: "l.instagram.com", platform: "instagram" });
  });

  it("maps tiktok.com", () => {
    const r = parseReferrer("https://www.tiktok.com/@user");
    expect(r).toEqual({ host: "www.tiktok.com", platform: "tiktok" });
  });

  it("maps x.com", () => {
    const r = parseReferrer("https://x.com/home");
    expect(r).toEqual({ host: "x.com", platform: "x" });
  });

  it("maps twitter.com (legacy)", () => {
    const r = parseReferrer("https://twitter.com/intent/tweet");
    expect(r).toEqual({ host: "twitter.com", platform: "x" });
  });

  it("maps t.co (Twitter short link)", () => {
    const r = parseReferrer("https://t.co/abc123");
    expect(r).toEqual({ host: "t.co", platform: "x" });
  });

  it("maps youtube.com", () => {
    const r = parseReferrer("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(r).toEqual({ host: "www.youtube.com", platform: "youtube" });
  });

  it("maps m.youtube.com (mobile)", () => {
    const r = parseReferrer("https://m.youtube.com/watch?v=abc");
    expect(r).toEqual({ host: "m.youtube.com", platform: "youtube" });
  });

  it("maps facebook.com", () => {
    const r = parseReferrer("https://www.facebook.com/share");
    expect(r).toEqual({ host: "www.facebook.com", platform: "facebook" });
  });

  it("maps l.facebook.com (external link redirect)", () => {
    const r = parseReferrer("https://l.facebook.com/l.php?u=https%3A%2F%2Fkonekt.ng");
    expect(r).toEqual({ host: "l.facebook.com", platform: "facebook" });
  });

  it("maps api.whatsapp.com", () => {
    const r = parseReferrer("https://api.whatsapp.com/send?text=check+this");
    expect(r).toEqual({ host: "api.whatsapp.com", platform: "whatsapp" });
  });

  it("maps linkedin.com", () => {
    const r = parseReferrer("https://www.linkedin.com/feed");
    expect(r).toEqual({ host: "www.linkedin.com", platform: "linkedin" });
  });

  it("returns other for unknown referrers", () => {
    const r = parseReferrer("https://somerandomblog.com/post");
    expect(r).toEqual({ host: "somerandomblog.com", platform: "other" });
  });

  it("normalises hostname to lowercase", () => {
    const r = parseReferrer("https://INSTAGRAM.COM/user");
    expect(r.platform).toBe("instagram");
  });
});

// ─── parseDevice ─────────────────────────────────────────────────────────────

describe("parseDevice", () => {
  it("returns unknown for null user-agent", () => {
    expect(parseDevice(null)).toBe("unknown");
  });

  it("returns unknown for empty user-agent", () => {
    expect(parseDevice("")).toBe("unknown");
  });

  it("detects mobile from iPhone UA", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
    expect(parseDevice(ua)).toBe("mobile");
  });

  it("detects mobile from Android UA", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
    expect(parseDevice(ua)).toBe("mobile");
  });

  it("detects tablet from iPad UA", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
    expect(parseDevice(ua)).toBe("tablet");
  });

  it("returns desktop for Chrome on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(parseDevice(ua)).toBe("desktop");
  });

  it("returns desktop for macOS Safari", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15";
    expect(parseDevice(ua)).toBe("desktop");
  });
});

// ─── isLikelyBot ─────────────────────────────────────────────────────────────

describe("isLikelyBot", () => {
  it("returns true for null user-agent", () => {
    expect(isLikelyBot(null)).toBe(true);
  });

  it("returns true for empty user-agent", () => {
    expect(isLikelyBot("")).toBe(true);
  });

  it("detects Googlebot", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
  });

  it("detects Bingbot", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
  });

  it("detects Twitterbot (link preview)", () => {
    expect(isLikelyBot("Twitterbot/1.0")).toBe(true);
  });

  it("detects WhatsApp link preview", () => {
    expect(isLikelyBot("WhatsApp/2.23.1 A")).toBe(true);
  });

  it("detects facebookexternalhit", () => {
    expect(isLikelyBot("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
  });

  it("detects generic spider", () => {
    expect(isLikelyBot("AhrefsBot/7.0; +http://ahrefs.com/robot/")).toBe(true);
  });

  it("detects crawler in user-agent", () => {
    expect(isLikelyBot("Some Web Crawler 1.0")).toBe(true);
  });

  it("returns false for real iPhone browser", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
    expect(isLikelyBot(ua)).toBe(false);
  });

  it("returns false for Chrome desktop", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(isLikelyBot(ua)).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isLikelyBot("GOOGLEBOT/2.1")).toBe(true);
  });
});
