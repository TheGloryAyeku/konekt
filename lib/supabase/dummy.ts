/**
 * Dummy Supabase client used when env vars are missing.
 *
 * This lets you boot the app and click through the UI without running a real
 * Supabase project. Every query resolves to hardcoded data so nothing crashes.
 *
 * To go live, fill in NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 * and the real clients in `./server.ts` and `./browser.ts` take over.
 */

const DUMMY_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "demo@konekt.ng",
  phone: "",
  created_at: "2026-04-01T00:00:00.000Z",
  updated_at: "2026-04-01T00:00:00.000Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
};

const DUMMY_PROFILE = {
  id: DUMMY_USER.id,
  username: "demo",
  display_name: "Demo Creator",
  bio: "Building cool stuff in Lagos.",
  avatar_url: null,
  theme: { background: "#fef3c7", foreground: "#1f2937" },
  plan: "free",
};

const DUMMY_LINKS = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    profile_id: DUMMY_USER.id,
    title: "My Portfolio",
    url: "https://example.com",
    thumbnail_url: null,
    is_enabled: true,
    position: 0,
    click_count: 42,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    profile_id: DUMMY_USER.id,
    title: "Twitter / X",
    url: "https://twitter.com/demo",
    thumbnail_url: null,
    is_enabled: true,
    position: 1,
    click_count: 18,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    profile_id: DUMMY_USER.id,
    title: "Instagram",
    url: "https://instagram.com/demo",
    thumbnail_url: null,
    is_enabled: true,
    position: 2,
    click_count: 27,
  },
];

type DummyResult<T> = { data: T; error: null };

class DummyBuilder {
  private operation: "select" | "insert" | "update" | "delete" | "upsert" =
    "select";

  constructor(private readonly table: string) {}

  select(_columns?: string) {
    this.operation = "select";
    return this;
  }
  insert(_values: unknown) {
    this.operation = "insert";
    return this;
  }
  update(_values: unknown) {
    this.operation = "update";
    return this;
  }
  upsert(_values: unknown) {
    this.operation = "upsert";
    return this;
  }
  delete() {
    this.operation = "delete";
    return this;
  }

  eq(_col: string, _val: unknown) {
    return this;
  }
  neq(_col: string, _val: unknown) {
    return this;
  }
  gt(_col: string, _val: unknown) {
    return this;
  }
  gte(_col: string, _val: unknown) {
    return this;
  }
  lt(_col: string, _val: unknown) {
    return this;
  }
  lte(_col: string, _val: unknown) {
    return this;
  }
  like(_col: string, _val: unknown) {
    return this;
  }
  ilike(_col: string, _val: unknown) {
    return this;
  }
  in(_col: string, _vals: unknown[]) {
    return this;
  }
  is(_col: string, _val: unknown) {
    return this;
  }
  match(_query: unknown) {
    return this;
  }
  order(_col: string, _opts?: unknown) {
    return this;
  }
  limit(_n: number) {
    return this;
  }
  range(_from: number, _to: number) {
    return this;
  }

  single(): Promise<DummyResult<unknown>> {
    return Promise.resolve({ data: this.resolveRow(), error: null });
  }
  maybeSingle(): Promise<DummyResult<unknown>> {
    return Promise.resolve({ data: this.resolveRow(), error: null });
  }

  private resolveRow(): unknown {
    switch (this.table) {
      case "profiles":
        return DUMMY_PROFILE;
      case "links":
        return DUMMY_LINKS[0] ?? null;
      case "subscriptions":
        return null;
      default:
        return null;
    }
  }

  private resolveList(): unknown[] {
    switch (this.table) {
      case "profiles":
        return [DUMMY_PROFILE];
      case "links":
        return DUMMY_LINKS;
      default:
        return [];
    }
  }

  // Builders are awaitable directly — e.g. `await supabase.from(..).select(..).eq(..).order(..)`
  then<TResult1 = DummyResult<unknown>, TResult2 = never>(
    onfulfilled?:
      | ((value: DummyResult<unknown>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): Promise<TResult1 | TResult2> {
    const data: unknown =
      this.operation === "select" ? this.resolveList() : null;
    return Promise.resolve<DummyResult<unknown>>({ data, error: null }).then(
      onfulfilled,
      onrejected,
    );
  }
}

const dummyAuth = {
  async getUser() {
    return { data: { user: DUMMY_USER }, error: null };
  },
  async getSession() {
    return {
      data: {
        session: {
          user: DUMMY_USER,
          access_token: "dummy",
          refresh_token: "dummy",
          expires_in: 3600,
          token_type: "bearer",
        },
      },
      error: null,
    };
  },
  async signInWithPassword() {
    return { data: { user: DUMMY_USER, session: null }, error: null };
  },
  async signUp() {
    return { data: { user: DUMMY_USER, session: null }, error: null };
  },
  async signInWithOAuth() {
    return { data: { url: null, provider: "email" }, error: null };
  },
  async signOut() {
    return { error: null };
  },
  async exchangeCodeForSession() {
    return {
      data: { user: DUMMY_USER, session: null },
      error: null,
    };
  },
  async resetPasswordForEmail() {
    return { data: {}, error: null };
  },
  async updateUser() {
    return { data: { user: DUMMY_USER }, error: null };
  },
  onAuthStateChange() {
    return {
      data: {
        subscription: {
          id: "dummy",
          callback: () => {},
          unsubscribe: () => {},
        },
      },
    };
  },
};

let warned = false;
function warnOnce() {
  if (warned) return;
  warned = true;
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] Running in DUMMY mode — set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to use a real project.",
  );
}

export function createDummyClient() {
  warnOnce();
  return {
    auth: dummyAuth,
    from: (table: string) => new DummyBuilder(table),
    rpc: async () => ({ data: null, error: null }),
  };
}

export function isDummyMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
