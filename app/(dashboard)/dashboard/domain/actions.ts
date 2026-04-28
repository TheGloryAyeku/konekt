"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string };

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(4, "Enter a valid domain")
  .max(253)
  .regex(
    /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
    "Enter a domain like link.yourname.com",
  );

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function addDomain(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  if (profile?.plan !== "pro") {
    return { error: "Custom domains require the Pro plan." };
  }

  const parsed = domainSchema.safeParse(formData.get("domain"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid domain" };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("custom_domains")
    .select("id, profile_id")
    .eq("domain", parsed.data)
    .maybeSingle();
  if (lookupError) return { error: lookupError.message };
  if (existing) {
    return {
      error:
        existing.profile_id === user.id
          ? "You have already added this domain."
          : "That domain is already in use.",
    };
  }

  const { error } = await supabase.from("custom_domains").insert({
    profile_id: user.id,
    domain: parsed.data,
    verification_token: generateToken(),
    verified: false,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/domain");
  return { success: "Domain added. Set the CNAME and verify." };
}

export async function deleteDomain(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("custom_domains")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/domain");
  return { success: "Domain removed" };
}

export async function verifyDomain(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: domain, error: fetchError } = await supabase
    .from("custom_domains")
    .select("id, domain")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();
  if (fetchError || !domain) {
    return { error: fetchError?.message ?? "Domain not found" };
  }

  // Real verification would check that domain CNAMEs to konekt.ng. Without
  // network access in this scaffold, optimistically mark verified — swap for
  // a proper DNS lookup before going live.
  const { error } = await supabase
    .from("custom_domains")
    .update({ verified: true })
    .eq("id", id)
    .eq("profile_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/domain");
  return { success: `${domain.domain} is verified` };
}
