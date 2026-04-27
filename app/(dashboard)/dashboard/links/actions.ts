"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { linkSchema } from "@/lib/validations";
import { FREE_PLAN_LINK_LIMIT } from "@/lib/constants";

export type CreateLinkState = { error?: string };

export async function createLink(
  _prev: CreateLinkState,
  formData: FormData,
): Promise<CreateLinkState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = linkSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    is_enabled: true,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  if (profileError) return { error: profileError.message };

  const { count, error: countError } = await supabase
    .from("links")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id);
  if (countError) return { error: countError.message };

  if (profile.plan === "free" && (count ?? 0) >= FREE_PLAN_LINK_LIMIT) {
    return { error: "Free plan limit reached. Upgrade to add more links." };
  }

  const { data: last } = await supabase
    .from("links")
    .select("position")
    .eq("profile_id", user.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextPosition = (last?.position ?? -1) + 1;

  const { error: insertError } = await supabase.from("links").insert({
    profile_id: user.id,
    title: parsed.data.title,
    url: parsed.data.url,
    position: nextPosition,
    is_enabled: parsed.data.is_enabled,
  });
  if (insertError) return { error: insertError.message };

  revalidatePath("/dashboard/links");
  return {};
}
