"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { linkSchema } from "@/lib/validations";
import { FREE_PLAN_LINK_LIMIT } from "@/lib/constants";

export type ActionState = { error?: string };

export async function createLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
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
  revalidatePath("/[username]", "page");
  return {};
}

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  url: z.string().url(),
  scheduled_start: z.string().nullable().optional(),
  scheduled_end: z.string().nullable().optional(),
});

export async function updateLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    url: formData.get("url"),
    scheduled_start: formData.get("scheduled_start") || null,
    scheduled_end: formData.get("scheduled_end") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const isPro = profile?.plan === "pro";
  const start = parsed.data.scheduled_start;
  const end = parsed.data.scheduled_end;

  if (!isPro && (start || end)) {
    return { error: "Link scheduling is a Pro feature. Upgrade in Billing." };
  }

  if (start && end && new Date(end) <= new Date(start)) {
    return { error: "End time must be after the start time." };
  }

  const { error } = await supabase
    .from("links")
    .update({
      title: parsed.data.title,
      url: parsed.data.url,
      scheduled_start: start ? new Date(start).toISOString() : null,
      scheduled_end: end ? new Date(end).toISOString() : null,
    })
    .eq("id", parsed.data.id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/links");
  revalidatePath("/[username]", "page");
  return {};
}

export async function toggleLink(id: string, isEnabled: boolean) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("links")
    .update({ is_enabled: isEnabled })
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/links");
  revalidatePath("/[username]", "page");
  return {};
}

export async function deleteLink(id: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/links");
  revalidatePath("/[username]", "page");
  return {};
}

export async function moveLink(id: string, direction: "up" | "down") {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: links, error: listError } = await supabase
    .from("links")
    .select("id, position")
    .eq("profile_id", user.id)
    .order("position", { ascending: true });
  if (listError) return { error: listError.message };
  if (!links) return { error: "No links to reorder" };

  const idx = links.findIndex((l) => l.id === id);
  if (idx === -1) return { error: "Link not found" };

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= links.length) return {};

  const a = links[idx];
  const b = links[swapWith];

  const { error: e1 } = await supabase
    .from("links")
    .update({ position: b.position })
    .eq("id", a.id)
    .eq("profile_id", user.id);
  if (e1) return { error: e1.message };

  const { error: e2 } = await supabase
    .from("links")
    .update({ position: a.position })
    .eq("id", b.id)
    .eq("profile_id", user.id);
  if (e2) return { error: e2.message };

  revalidatePath("/dashboard/links");
  revalidatePath("/[username]", "page");
  return {};
}
