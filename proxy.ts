import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 renamed `middleware.ts` → `proxy.ts` (and the exported function
 * from `middleware` → `proxy`). This runs at the network boundary, refreshes
 * the Supabase session cookies, and nudges unauthenticated users towards the
 * login page.
 *
 * IMPORTANT: This is NOT the auth boundary. The authoritative auth check
 * lives in `lib/supabase/require-user.ts`, which every protected layout/page
 * calls. Proxy is best-effort UX — defense in depth only.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image  (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public assets
     * - API routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
