import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createDummyClient, isDummyMode } from "./dummy";
import type { Database } from "./types";

type ServerClient = ReturnType<typeof createServerClient<Database>>;

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Always create a fresh client per request — never share a single instance
 * across requests. Token refreshes are written back through the `setAll`
 * handler so cookie updates flow all the way to the browser.
 */
export async function createClient(): Promise<ServerClient> {
  if (isDummyMode()) {
    return createDummyClient() as unknown as ServerClient;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `set` can throw when called from a Server Component — that's fine
            // as long as a `proxy.ts` is also refreshing the session.
          }
        },
      },
    },
  );
}

/**
 * Service-role client for trusted server-side work (webhooks, cron jobs).
 *
 * NEVER expose this to the browser. Bypasses RLS — use sparingly and only for
 * operations that genuinely need elevated privileges.
 */
export function createServiceRoleClient(): ServerClient {
  if (isDummyMode()) {
    return createDummyClient() as unknown as ServerClient;
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
