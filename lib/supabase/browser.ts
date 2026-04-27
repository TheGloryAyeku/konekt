import { createBrowserClient } from "@supabase/ssr";
import { createDummyClient, isDummyMode } from "./dummy";
import type { Database } from "./types";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

export function createClient(): BrowserClient {
  if (isDummyMode()) {
    return createDummyClient() as unknown as BrowserClient;
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
