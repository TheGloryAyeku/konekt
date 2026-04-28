import { describe, it, expect } from "vitest";
import {
  usernameSchema,
  linkSchema,
  profileSchema,
  signupSchema,
  loginSchema,
} from "@/lib/validations";

// ─── usernameSchema ───────────────────────────────────────────────────────────

describe("usernameSchema", () => {
  const valid = (v: string) => usernameSchema.safeParse(v).success;
  const err = (v: string) => {
    const r = usernameSchema.safeParse(v);
    return r.success ? null : r.error.issues[0]?.message;
  };

  it("accepts lowercase alphanumeric", () => {
    expect(valid("glory123")).toBe(true);
  });

  it("accepts underscores", () => {
    expect(valid("the_glory")).toBe(true);
  });

  it("accepts exactly 3 characters", () => {
    expect(valid("abc")).toBe(true);
  });

  it("accepts exactly 30 characters", () => {
    expect(valid("a".repeat(30))).toBe(true);
  });

  it("rejects fewer than 3 characters", () => {
    expect(valid("ab")).toBe(false);
    expect(err("ab")).toMatch(/3 characters/);
  });

  it("rejects more than 30 characters", () => {
    expect(valid("a".repeat(31))).toBe(false);
    expect(err("a".repeat(31))).toMatch(/30 characters/);
  });

  it("rejects uppercase letters", () => {
    expect(valid("Glory")).toBe(false);
    expect(err("Glory")).toMatch(/lowercase/);
  });

  it("rejects hyphens", () => {
    expect(valid("my-name")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(valid("my name")).toBe(false);
  });

  it("rejects dots", () => {
    expect(valid("name.here")).toBe(false);
  });

  const reserved = [
    "admin", "api", "app", "auth", "blog", "dashboard",
    "login", "signup", "signout", "logout", "settings",
    "billing", "pricing", "privacy", "terms", "support",
    "help", "about", "contact", "_next", "public", "static",
    "www", "mail", "ftp",
  ];

  for (const name of reserved) {
    it(`rejects reserved username "${name}"`, () => {
      expect(valid(name)).toBe(false);
      expect(err(name)).toMatch(/reserved/);
    });
  }
});

// ─── linkSchema ──────────────────────────────────────────────────────────────

describe("linkSchema", () => {
  const base = { title: "My Link", url: "https://example.com", is_enabled: true };

  it("accepts a minimal valid link", () => {
    expect(linkSchema.safeParse(base).success).toBe(true);
  });

  it("rejects empty title", () => {
    const r = linkSchema.safeParse({ ...base, title: "" });
    expect(r.success).toBe(false);
  });

  it("rejects title over 80 characters", () => {
    const r = linkSchema.safeParse({ ...base, title: "a".repeat(81) });
    expect(r.success).toBe(false);
  });

  it("rejects invalid URL", () => {
    const r = linkSchema.safeParse({ ...base, url: "not-a-url" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/valid URL/);
    }
  });

  it("accepts https URL", () => {
    expect(linkSchema.safeParse({ ...base, url: "https://konekt.ng" }).success).toBe(true);
  });

  it("accepts http URL", () => {
    expect(linkSchema.safeParse({ ...base, url: "http://example.com" }).success).toBe(true);
  });

  it("accepts optional thumbnail_url as null", () => {
    const r = linkSchema.safeParse({ ...base, thumbnail_url: null });
    expect(r.success).toBe(true);
  });

  it("rejects invalid thumbnail_url string", () => {
    const r = linkSchema.safeParse({ ...base, thumbnail_url: "not-a-url" });
    expect(r.success).toBe(false);
  });

  it("accepts valid scheduled_start ISO datetime", () => {
    const r = linkSchema.safeParse({
      ...base,
      scheduled_start: "2026-06-01T09:00:00.000Z",
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-ISO scheduled_start", () => {
    const r = linkSchema.safeParse({ ...base, scheduled_start: "June 1 2026" });
    expect(r.success).toBe(false);
  });

  it("defaults is_enabled to true when omitted", () => {
    const r = linkSchema.safeParse({ title: "X", url: "https://x.com" });
    if (r.success) expect(r.data.is_enabled).toBe(true);
  });
});

// ─── profileSchema ────────────────────────────────────────────────────────────

describe("profileSchema", () => {
  const base = { username: "glory", display_name: "Glory", bio: null };

  it("accepts a valid profile", () => {
    expect(profileSchema.safeParse(base).success).toBe(true);
  });

  it("accepts null display_name", () => {
    expect(profileSchema.safeParse({ ...base, display_name: null }).success).toBe(true);
  });

  it("accepts null bio", () => {
    expect(profileSchema.safeParse({ ...base, bio: null }).success).toBe(true);
  });

  it("rejects bio over 240 characters", () => {
    const r = profileSchema.safeParse({ ...base, bio: "a".repeat(241) });
    expect(r.success).toBe(false);
  });

  it("rejects display_name over 60 characters", () => {
    const r = profileSchema.safeParse({ ...base, display_name: "a".repeat(61) });
    expect(r.success).toBe(false);
  });
});

// ─── signupSchema ─────────────────────────────────────────────────────────────

describe("signupSchema", () => {
  const base = { email: "test@example.com", password: "password123", username: "testuser" };

  it("accepts valid signup data", () => {
    expect(signupSchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = signupSchema.safeParse({ ...base, email: "not-an-email" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/valid email/);
  });

  it("rejects password under 8 characters", () => {
    const r = signupSchema.safeParse({ ...base, password: "short" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/8 characters/);
  });

  it("accepts password exactly 8 characters", () => {
    expect(signupSchema.safeParse({ ...base, password: "exactly8" }).success).toBe(true);
  });

  it("rejects reserved username at signup", () => {
    const r = signupSchema.safeParse({ ...base, username: "admin" });
    expect(r.success).toBe(false);
  });
});

// ─── loginSchema ─────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "pw" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    const r = loginSchema.safeParse({ email: "bad", password: "pw" });
    expect(r.success).toBe(false);
  });

  it("rejects empty password", () => {
    const r = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toMatch(/required/i);
  });
});
