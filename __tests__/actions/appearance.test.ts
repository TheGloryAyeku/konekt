import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { updateProfile } from "@/app/(dashboard)/dashboard/appearance/actions";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { makeSupabaseClient } from "../helpers/mock-supabase";

const USER = { id: "user-uuid-001", email: "glory@konekt.ng" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue(USER as never);
});

function fd(entries: Record<string, string>) {
  const form = new FormData();
  for (const [k, v] of Object.entries(entries)) form.set(k, v);
  return form;
}

const BASE = {
  display_name: "Glory",
  bio: "Building stuff",
  avatar_url: "",
  theme_background: "#fbfaf2",
  theme_foreground: "#1f2937",
};

describe("updateProfile (appearance)", () => {
  it("saves valid profile data and returns success", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: null }]) as never
    );
    const result = await updateProfile({}, fd(BASE));
    expect(result).toEqual({ success: true });
  });

  it("returns error for invalid theme_background hex", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateProfile({}, fd({ ...BASE, theme_background: "not-a-hex" }));
    expect(result.error).toMatch(/hex colour/);
  });

  it("returns error for invalid theme_foreground hex", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateProfile({}, fd({ ...BASE, theme_foreground: "#xyz" }));
    expect(result.error).toMatch(/hex colour/);
  });

  it("rejects 3-char shorthand hex (e.g. #fff)", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateProfile({}, fd({ ...BASE, theme_background: "#fff" }));
    expect(result.error).toMatch(/hex colour/);
  });

  it("accepts uppercase hex colours", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: null }]) as never
    );
    const result = await updateProfile({}, fd({ ...BASE, theme_background: "#FBFAF2" }));
    expect(result).toEqual({ success: true });
  });

  it("returns error for bio over 240 characters", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateProfile({}, fd({ ...BASE, bio: "a".repeat(241) }));
    expect(result.error).toMatch(/240 characters/);
  });

  it("returns error for display_name over 60 characters", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateProfile({}, fd({ ...BASE, display_name: "a".repeat(61) }));
    expect(result.error).toMatch(/60 characters/);
  });

  it("returns error for invalid avatar_url", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateProfile({}, fd({ ...BASE, avatar_url: "not-a-url" }));
    expect(result.error).toMatch(/valid URL/);
  });

  it("accepts empty avatar_url (no avatar)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: null }]) as never
    );
    const result = await updateProfile({}, fd({ ...BASE, avatar_url: "" }));
    expect(result).toEqual({ success: true });
  });

  it("returns error on DB update failure", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: { message: "update failed" } }]) as never
    );
    const result = await updateProfile({}, fd(BASE));
    expect(result.error).toBe("update failed");
  });

  it("stores theme as background and foreground JSON", async () => {
    const updateChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), then: vi.fn() };
    updateChain.then = (resolve: (v: { data: null; error: null }) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve);

    const mockSupa = {
      from: vi.fn().mockReturnValue(updateChain),
      auth: { resetPasswordForEmail: vi.fn() },
      rpc: vi.fn(),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupa as never);

    await updateProfile({}, fd(BASE));

    expect(vi.mocked(updateChain.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: { background: "#fbfaf2", foreground: "#1f2937" },
      })
    );
  });
});
