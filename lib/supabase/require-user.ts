import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Enforce auth in Server Components / Layouts. This is the authoritative check
 * — `proxy.ts` only adds a redirect for UX, it is NOT a security boundary.
 *
 * See https://vercel.com/docs/routing-middleware — middleware/proxy should
 * never be the sole auth layer.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
