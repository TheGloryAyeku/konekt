"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: boolean };

const HEX = /^#[0-9a-fA-F]{6}$/;

const profileSchema = z.object({
  display_name: z
    .string()
    .max(60, "Display name must be 60 characters or fewer")
    .optional(),
  bio: z.string().max(240, "Bio must be 240 characters or fewer").optional(),
  avatar_url: z
    .string()
    .url("Avatar URL must be a valid URL")
    .or(z.literal(""))
    .optional(),
  theme_background: z.string().regex(HEX, "Background must be a hex colour"),
  theme_foreground: z.string().regex(HEX, "Text colour must be a hex colour"),
});

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = profileSchema.safeParse({
    display_name: (formData.get("display_name") as string) ?? "",
    bio: (formData.get("bio") as string) ?? "",
    avatar_url: (formData.get("avatar_url") as string) ?? "",
    theme_background: formData.get("theme_background"),
    theme_foreground: formData.get("theme_foreground"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name?.trim() || null,
      bio: parsed.data.bio?.trim() || null,
      avatar_url: parsed.data.avatar_url?.trim() || null,
      theme: {
        background: parsed.data.theme_background,
        foreground: parsed.data.theme_foreground,
      },
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/appearance");
  revalidatePath("/[username]", "page");
  return { success: true };
}
