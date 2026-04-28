import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createLink, updateLink, toggleLink, deleteLink, moveLink } from "@/app/(dashboard)/dashboard/links/actions";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { makeChain, makeSupabaseClient } from "../helpers/mock-supabase";

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

// ─── createLink ───────────────────────────────────────────────────────────────

describe("createLink", () => {
  it("creates a link successfully for free user under limit", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "free" }, error: null },       // profiles query
        { data: null, count: 2, error: null },          // link count
        { data: { position: 1 }, error: null },         // last position
        { data: null, error: null },                    // insert
      ]) as never
    );

    const result = await createLink({}, fd({ title: "My Link", url: "https://example.com" }));
    expect(result).toEqual({});
  });

  it("returns error when free user is at 5-link limit", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "free" }, error: null },
        { data: null, count: 5, error: null },
      ]) as never
    );

    const result = await createLink({}, fd({ title: "Link 6", url: "https://x.com" }));
    expect(result.error).toMatch(/Free plan limit/);
  });

  it("allows pro user to exceed 5 links", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "pro" }, error: null },
        { data: null, count: 8, error: null },
        { data: { position: 7 }, error: null },
        { data: null, error: null },
      ]) as never
    );

    const result = await createLink({}, fd({ title: "Link 9", url: "https://x.com" }));
    expect(result).toEqual({});
  });

  it("returns error for missing title", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await createLink({}, fd({ title: "", url: "https://example.com" }));
    expect(result.error).toBeTruthy();
  });

  it("returns error for invalid URL", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await createLink({}, fd({ title: "Link", url: "not-a-url" }));
    expect(result.error).toMatch(/valid URL/);
  });

  it("returns error when DB insert fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "free" }, error: null },
        { data: null, count: 0, error: null },
        { data: null, error: null },
        { data: null, error: { message: "insert failed" } },
      ]) as never
    );

    const result = await createLink({}, fd({ title: "Link", url: "https://x.com" }));
    expect(result.error).toBe("insert failed");
  });

  it("starts position at 0 when no existing links", async () => {
    const insertChain = makeChain({ data: null, error: null });
    const mockSupa = {
      from: vi.fn()
        .mockReturnValueOnce(makeChain({ data: { plan: "pro" }, error: null }))
        .mockReturnValueOnce(makeChain({ data: null, count: 0, error: null }))
        .mockReturnValueOnce(makeChain({ data: null, error: null })) // no last position
        .mockReturnValueOnce(insertChain),
      auth: { resetPasswordForEmail: vi.fn() },
      rpc: vi.fn(),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupa as never);

    await createLink({}, fd({ title: "First Link", url: "https://example.com" }));
    expect(vi.mocked(insertChain.insert)).toHaveBeenCalledWith(
      expect.objectContaining({ position: 0 })
    );
  });
});

// ─── updateLink ───────────────────────────────────────────────────────────────

describe("updateLink", () => {
  // Zod v4 requires valid UUID variant bits (4th group must start with 8/9/a/b)
  const LINK_ID = "11111111-1111-4111-8111-111111111111";

  it("updates title and URL successfully", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "free" }, error: null },
        { data: null, error: null },
      ]) as never
    );

    const result = await updateLink(
      {},
      fd({ id: LINK_ID, title: "New Title", url: "https://new.com" })
    );
    expect(result).toEqual({});
  });

  it("returns error for invalid UUID id", async () => {
    vi.mocked(createClient).mockResolvedValue(makeSupabaseClient() as never);
    const result = await updateLink({}, fd({ id: "bad-id", title: "X", url: "https://x.com" }));
    expect(result.error).toBeTruthy();
  });

  it("blocks scheduling for free user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: { plan: "free" }, error: null }]) as never
    );

    const result = await updateLink(
      {},
      fd({
        id: LINK_ID,
        title: "Link",
        url: "https://x.com",
        scheduled_start: "2026-06-01T09:00:00.000Z",
        scheduled_end: "2026-06-30T09:00:00.000Z",
      })
    );
    expect(result.error).toMatch(/Pro feature/);
  });

  it("allows scheduling for pro user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([
        { data: { plan: "pro" }, error: null },
        { data: null, error: null },
      ]) as never
    );

    const result = await updateLink(
      {},
      fd({
        id: LINK_ID,
        title: "Link",
        url: "https://x.com",
        scheduled_start: "2026-06-01T09:00:00.000Z",
        scheduled_end: "2026-06-30T09:00:00.000Z",
      })
    );
    expect(result).toEqual({});
  });

  it("returns error when end time is before start time", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: { plan: "pro" }, error: null }]) as never
    );

    const result = await updateLink(
      {},
      fd({
        id: LINK_ID,
        title: "Link",
        url: "https://x.com",
        scheduled_start: "2026-06-30T09:00:00.000Z",
        scheduled_end: "2026-06-01T09:00:00.000Z", // end < start
      })
    );
    expect(result.error).toMatch(/End time must be after/);
  });
});

// ─── toggleLink ───────────────────────────────────────────────────────────────

describe("toggleLink", () => {
  const LINK_ID = "11111111-1111-4111-8111-111111111111";

  it("enables a link", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: null }]) as never
    );
    const result = await toggleLink(LINK_ID, true);
    expect(result).toEqual({});
  });

  it("disables a link", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: null }]) as never
    );
    const result = await toggleLink(LINK_ID, false);
    expect(result).toEqual({});
  });

  it("returns error on DB failure", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: { message: "DB error" } }]) as never
    );
    const result = await toggleLink(LINK_ID, true);
    expect(result?.error).toBe("DB error");
  });
});

// ─── deleteLink ───────────────────────────────────────────────────────────────

describe("deleteLink", () => {
  const LINK_ID = "11111111-1111-4111-8111-111111111111";

  it("deletes a link", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: null }]) as never
    );
    const result = await deleteLink(LINK_ID);
    expect(result).toEqual({});
  });

  it("returns error on DB failure", async () => {
    vi.mocked(createClient).mockResolvedValue(
      makeSupabaseClient([{ data: null, error: { message: "not found" } }]) as never
    );
    const result = await deleteLink(LINK_ID);
    expect(result?.error).toBe("not found");
  });
});

// ─── moveLink ─────────────────────────────────────────────────────────────────

describe("moveLink", () => {
  const links = [
    { id: "aaaa", position: 0 },
    { id: "bbbb", position: 1 },
    { id: "cccc", position: 2 },
  ];

  function setupMoveClient(extraErrors = false) {
    const listChain = makeChain({ data: links, error: null });
    const update1 = makeChain({ data: null, error: extraErrors ? { message: "err" } : null });
    const update2 = makeChain({ data: null, error: null });
    return {
      from: vi.fn()
        .mockReturnValueOnce(listChain)
        .mockReturnValueOnce(update1)
        .mockReturnValueOnce(update2),
      auth: { resetPasswordForEmail: vi.fn() },
      rpc: vi.fn(),
    };
  }

  it("moves bbbb up (swaps with aaaa)", async () => {
    vi.mocked(createClient).mockResolvedValue(setupMoveClient() as never);
    const result = await moveLink("bbbb", "up");
    expect(result).toEqual({});
  });

  it("moves bbbb down (swaps with cccc)", async () => {
    vi.mocked(createClient).mockResolvedValue(setupMoveClient() as never);
    const result = await moveLink("bbbb", "down");
    expect(result).toEqual({});
  });

  it("is a no-op when moving the first link up", async () => {
    vi.mocked(createClient).mockResolvedValue(setupMoveClient() as never);
    const result = await moveLink("aaaa", "up");
    expect(result).toEqual({});
  });

  it("is a no-op when moving the last link down", async () => {
    vi.mocked(createClient).mockResolvedValue(setupMoveClient() as never);
    const result = await moveLink("cccc", "down");
    expect(result).toEqual({});
  });

  it("returns error for unknown link id", async () => {
    vi.mocked(createClient).mockResolvedValue(setupMoveClient() as never);
    const result = await moveLink("nonexistent", "up");
    expect(result?.error).toMatch(/not found/);
  });

  it("returns error on first update failure", async () => {
    vi.mocked(createClient).mockResolvedValue(setupMoveClient(true) as never);
    const result = await moveLink("bbbb", "up");
    expect(result?.error).toBe("err");
  });
});
