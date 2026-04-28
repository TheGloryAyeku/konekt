"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { usernameSchema } from "@/lib/validations";

export type ActionState = { error?: string; success?: string };

const accountSchema = z.object({
  username: usernameSchema,
  display_name: z
    .string()
    .max(60, "Display name must be 60 characters or fewer")
    .optional(),
});

export async function updateAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = accountSchema.safeParse({
    username: ((formData.get("username") as string) ?? "").toLowerCase(),
    display_name: (formData.get("display_name") as string) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Check uniqueness only if the username actually changed.
  const { data: current } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (current && current.username !== parsed.data.username) {
    const { data: existing, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", parsed.data.username)
      .maybeSingle();
    if (lookupError) return { error: lookupError.message };
    if (existing && existing.id !== user.id) {
      return { error: "That username is already taken." };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      display_name: parsed.data.display_name?.trim() || null,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: "Account updated" };
}

export async function sendPasswordReset(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!user.email) return { error: "No email on file" };

  const { error } = await supabase.auth.resetPasswordForEmail(user.email);
  if (error) return { error: error.message };

  return { success: "Password reset email sent" };
}
