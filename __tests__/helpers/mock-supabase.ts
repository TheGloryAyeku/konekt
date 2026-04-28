import { vi } from "vitest";

export type MockResult = {
  data?: unknown;
  count?: number | null;
  error?: { message: string } | null;
};

/** Returns a chainable Supabase query builder mock. */
export function makeChain(result: MockResult = {}) {
  const resolved = {
    data: result.data ?? null,
    count: result.count ?? null,
    error: result.error ?? null,
  };

  const chain: Record<string, unknown> = {};

  const chaining = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gte",
    "lte",
    "gt",
    "lt",
    "order",
    "limit",
    "range",
    "match",
    "is",
    "in",
    "not",
    "or",
    "filter",
  ];

  for (const m of chaining) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  chain.single = vi.fn().mockResolvedValue(resolved);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolved);

  // Make the chain itself awaitable (covers direct `await supabase.from(...).insert(...)`)
  chain.then = (
    onfulfilled: (v: typeof resolved) => unknown,
    onrejected?: (r: unknown) => unknown,
  ) => Promise.resolve(resolved).then(onfulfilled, onrejected);

  return chain;
}

/**
 * Build a mock Supabase client where each call to `from()` consumes the next
 * chain from `sequence`. Pass an array of MockResult values in call order.
 */
export function makeSupabaseClient(sequence: MockResult[] = []) {
  let idx = 0;

  const mockFrom = vi.fn(() => {
    const result = sequence[idx++] ?? {};
    return makeChain(result);
  });

  return {
    from: mockFrom,
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}
