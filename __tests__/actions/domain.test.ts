import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { addDomain, deleteDomain, verifyDomain } from "@/app/(dashboard)/dashboard/domain/actions";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { makeSupabaseClient, makeChain } from "../helpers/mock-supabase";

const USER      = { id: "00000000-0000-4000-8000-000000000001", email: "glory@konekt.ng" };
const DOMAIN_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue(USER as never);
});

function fd(entries: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) form.set(k, v);
  return form;
}

// ─── addDomain ────────────────────────────────────────────────────────────────

describe("addDomain", () => {
  it("returns error for free plan users", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: { plan: "free" }, error: null }]) as never
    );
    const result = await addDomain({}, fd({ domain: "link.mysite.com" }));
    expect(result.error).toMatch(/Pro plan/);
  });

  it("adds domain for pro users", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "pro" }, error: null },
        { data: null, error: null },     // no existing domain
        { data: null, error: null },     // insert
      ]) as never
    );
    const result = await addDomain({}, fd({ domain: "link.mysite.com" }));
    expect(result.success).toBeTruthy();
  });

  it("returns error for invalid domain format", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: { plan: "pro" }, error: null }]) as never
    );
    const result = await addDomain({}, fd({ domain: "not a domain" }));
    expect(result.error).toBeTruthy();
  });

  it("returns error for domain without TLD", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: { plan: "pro" }, error: null }]) as never
    );
    const result = await addDomain({}, fd({ domain: "nodot" }));
    expect(result.error).toBeTruthy();
  });

  it("accepts valid subdomain format", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "pro" }, error: null },
        { data: null, error: null },
        { data: null, error: null },
      ]) as never
    );
    const result = await addDomain({}, fd({ domain: "links.example.co.ng" }));
    expect(result.success).toBeTruthy();
  });

  it("returns error when domain is already claimed by this user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "pro" }, error: null },
        { data: { id: DOMAIN_ID, profile_id: USER.id }, error: null }, // same user
      ]) as never
    );
    const result = await addDomain({}, fd({ domain: "link.mysite.com" }));
    expect(result.error).toMatch(/already added/);
  });

  it("returns error when domain is claimed by another user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "pro" }, error: null },
        { data: { id: DOMAIN_ID, profile_id: "other-user" }, error: null },
      ]) as never
    );
    const result = await addDomain({}, fd({ domain: "link.mysite.com" }));
    expect(result.error).toMatch(/already in use/);
  });

  it("generates a 48-character hex verification token", async () => {
    const insertChain = makeChain({ data: null, error: null });
    const mockSupa = {
      from: vi.fn()
        .mockReturnValueOnce(makeChain({ data: { plan: "pro" }, error: null }))
        .mockReturnValueOnce(makeChain({ data: null, error: null }))
        .mockReturnValueOnce(insertChain),
      auth: { resetPasswordForEmail: vi.fn() },
      rpc: vi.fn(),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupa as never);

    await addDomain({}, fd({ domain: "link.mysite.com" }));

    expect(vi.mocked(insertChain.insert)).toHaveBeenCalledWith(
      expect.objectContaining({
        verification_token: expect.stringMatching(/^[0-9a-f]{48}$/),
      })
    );
  });
});

// ─── deleteDomain ─────────────────────────────────────────────────────────────

describe("deleteDomain", () => {
  it("deletes domain and returns success", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: null }]) as never
    );
    const result = await deleteDomain(DOMAIN_ID);
    expect(result.success).toBeTruthy();
  });

  it("returns error on DB failure", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: { message: "delete failed" } }]) as never
    );
    const result = await deleteDomain(DOMAIN_ID);
    expect(result.error).toBe("delete failed");
  });
});

// ─── verifyDomain ─────────────────────────────────────────────────────────────

describe("verifyDomain", () => {
  it("marks domain as verified and returns success", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { id: DOMAIN_ID, domain: "link.mysite.com" }, error: null }, // fetch
        { data: null, error: null }, // update
      ]) as never
    );
    const result = await verifyDomain(DOMAIN_ID);
    expect(result.success).toMatch(/link\.mysite\.com/);
  });

  it("returns error when domain is not found", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: null, error: { message: "Domain not found" } },
      ]) as never
    );
    const result = await verifyDomain(DOMAIN_ID);
    expect(result.error).toBeTruthy();
  });

  it("returns error on update failure", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { id: DOMAIN_ID, domain: "link.mysite.com" }, error: null },
        { data: null, error: { message: "update failed" } },
      ]) as never
    );
    const result = await verifyDomain(DOMAIN_ID);
    expect(result.error).toBe("update failed");
  });
});
