import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrackedLink } from "./tracked-link";
import { TrackPageView } from "./track-page-view";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { title: "Not found" };

  return {
    title: profile.display_name ?? username,
    description: profile.bio ?? `${username} on Konekt`,
    openGraph: {
      title: profile.display_name ?? username,
      description: profile.bio ?? undefined,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, theme")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: links } = await supabase
    .from("links")
    .select("id, title, url, thumbnail_url, position")
    .eq("profile_id", profile.id)
    .eq("is_enabled", true)
    .order("position", { ascending: true });

  const theme = (profile.theme as { background?: string; foreground?: string } | null) ?? {};

  return (
    <main
      className="flex min-h-screen flex-col items-center px-4 py-12"
      style={{
        backgroundColor: theme.background ?? "#fbfaf2",
        color: theme.foreground ?? "#16181c",
      }}
    >
      <TrackPageView profileId={profile.id} />

      <div className="flex w-full max-w-md flex-col items-center gap-4">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name ?? profile.username}
            width={96}
            height={96}
            className="rounded-full"
            priority
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-2xl font-semibold text-foreground">
            {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-semibold">
          {profile.display_name ?? `@${profile.username}`}
        </h1>
        {profile.bio ? (
          <p className="text-center text-sm opacity-80">{profile.bio}</p>
        ) : null}

        <ul className="mt-4 flex w-full flex-col gap-3">
          {(links ?? []).map((link) => (
            <li key={link.id}>
              <TrackedLink
                profileId={profile.id}
                linkId={link.id}
                href={link.url}
                className="block rounded-xl border border-border bg-card px-4 py-4 text-center font-medium text-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary"
              >
                {link.title}
              </TrackedLink>
            </li>
          ))}
        </ul>

        {(!links || links.length === 0) && (
          <p className="mt-6 text-sm opacity-70">No links yet.</p>
        )}

        <footer className="mt-10 text-xs opacity-60">
          Built with{" "}
          <Link href="/" className="underline">
            Konekt
          </Link>
        </footer>
      </div>
    </main>
  );
}
