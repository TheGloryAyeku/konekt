import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { updateAccount, sendPasswordReset } from "@/app/(dashboard)/dashboard/settings/actions";
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

// ─── updateAccount ────────────────────────────────────────────────────────────

describe("updateAccount", () => {
  it("updates username and display_name successfully", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { username: "oldname" }, error: null },   // current profile
        { data: null, error: null },                       // uniqueness check → not found
        { data: null, error: null },                       // update
      ]) as never
    );

    const result = await updateAccount({}, fd({ username: "newname", display_name: "New Display" }));
    expect(result).toEqual({ success: "Account updated" });
  });

  it("allows keeping the same username without uniqueness check", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { username: "glory" }, error: null },
        { data: null, error: null },
      ]) as never
    );

    const result = await updateAccount({}, fd({ username: "glory", display_name: "Glory" }));
    expect(result).toEqual({ success: "Account updated" });
  });

  it("returns error when username is already taken", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { username: "oldname" }, error: null },
        { data: { id: "other-user" }, error: null },  // username taken
      ]) as never
    );

    const result = await updateAccount({}, fd({ username: "takenname", display_name: "" }));
    expect(result.error).toMatch(/already taken/);
  });

  it("returns error for reserved username", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateAccount({}, fd({ username: "admin", display_name: "" }));
    expect(result.error).toMatch(/reserved/);
  });

  it("normalises capital letters in username before validation (no error)", async () => {
    // The action lowercases the input, so "MyName" → "myname" which is valid.
    // This documents that the UI should show the normalised form to the user.
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { username: "oldname" }, error: null },
        { data: null, error: null }, // uniqueness: not taken
        { data: null, error: null }, // update
      ]) as never
    );
    const result = await updateAccount({}, fd({ username: "MyName", display_name: "" }));
    expect(result).toEqual({ success: "Account updated" });
  });

  it("returns error for username with spaces", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateAccount({}, fd({ username: "my name", display_name: "" }));
    expect(result.error).toBeTruthy();
  });

  it("returns error for username under 3 chars", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateAccount({}, fd({ username: "ab", display_name: "" }));
    expect(result.error).toMatch(/3 characters/);
  });

  it("normalises username to lowercase before checking", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { username: "glory" }, error: null },
        { data: null, error: null },
      ]) as never
    );

    // "GLORY" → lowercased to "glory" (same as current → skips uniqueness check)
    const result = await updateAccount({}, fd({ username: "GLORY", display_name: "Glory" }));
    expect(result).toEqual({ success: "Account updated" });
  });

  it("returns error on DB update failure", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { username: "oldname" }, error: null },
        { data: null, error: null },
        { data: null, error: { message: "db failure" } },
      ]) as never
    );

    const result = await updateAccount({}, fd({ username: "newname", display_name: "" }));
    expect(result.error).toBe("db failure");
  });
});

// ─── sendPasswordReset ────────────────────────────────────────────────────────

describe("sendPasswordReset", () => {
  it("sends reset email for a user with email", async () => {
    const mockAuth = { resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }) };
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(),
      auth: mockAuth,
      rpc: vi.fn(),
    } as never);

    const result = await sendPasswordReset({}, new FormData());
    expect(result).toEqual({ success: "Password reset email sent" });
    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith("glory@konekt.ng");
  });

  it("returns error when user has no email", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1", email: undefined } as never);
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(),
      auth: { resetPasswordForEmail: vi.fn() },
      rpc: vi.fn(),
    } as never);

    const result = await sendPasswordReset({}, new FormData());
    expect(result.error).toMatch(/No email/);
  });

  it("returns error when Supabase auth fails", async () => {
    const mockAuth = {
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "rate limited" },
      }),
    };
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(),
      auth: mockAuth,
      rpc: vi.fn(),
    } as never);

    const result = await sendPasswordReset({}, new FormData());
    expect(result.error).toBe("rate limited");
  });
});
