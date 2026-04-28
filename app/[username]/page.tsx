import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { KonektMark } from "@/components/ui/konekt-mark";
import { TrackedLink } from "./tracked-link";
import { TrackPageView } from "./track-page-view";
import { FaviconImage } from "./favicon-image";

type Props = {
  params: Promise<{ username: string }>;
};

/** Parse a hex colour to an rgba() string, used for theme-adaptive card surfaces. */
function rgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
    .select("id, title, url, position")
    .eq("profile_id", profile.id)
    .eq("is_enabled", true)
    .order("position", { ascending: true });

  const theme = (profile.theme as { background?: string; foreground?: string } | null) ?? {};
  const bg = theme.background ?? "#fbfaf2";
  const fg = theme.foreground ?? "#16181c";

  const cardBg = rgba(fg, 0.05);
  const cardBorder = rgba(fg, 0.09);
  const cardHoverBg = rgba(fg, 0.09);
  const faviconBg = rgba(fg, 0.07);
  const domainColor = rgba(fg, 0.45);
  const arrowColor = rgba(fg, 0.28);

  return (
    <main
      className="flex min-h-screen flex-col items-center px-5 pb-20 pt-16"
      style={{ backgroundColor: bg, color: fg }}
    >
      <TrackPageView profileId={profile.id} />

      <div className="flex w-full max-w-sm flex-col items-center">

        {/* Avatar */}
        {profile.avatar_url ? (
          // Plain <img> — avatar URLs can come from any domain (Supabase, external),
          // so next/image's hostname allowlist can't be exhaustive here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.display_name ?? profile.username}
            width={88}
            height={88}
            className="rounded-full shadow-sm ring-4 ring-black/10"
          />
        ) : (
          <div
            className="flex h-[88px] w-[88px] items-center justify-center rounded-full text-2xl font-bold shadow-sm"
            style={{ backgroundColor: rgba(fg, 0.08) }}
          >
            {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
          </div>
        )}

        {/* Identity */}
        <h1 className="mt-5 text-2xl font-bold tracking-tight" style={{ color: fg }}>
          {profile.display_name ?? `@${profile.username}`}
        </h1>
        <p className="mt-0.5 text-sm font-medium" style={{ color: rgba(fg, 0.45) }}>
          @{profile.username}
        </p>
        {profile.bio ? (
          <p
            className="mt-3 max-w-xs text-center text-sm leading-relaxed"
            style={{ color: rgba(fg, 0.65) }}
          >
            {profile.bio}
          </p>
        ) : null}

        {/* Links */}
        <ul className="mt-8 flex w-full flex-col gap-2.5">
          {(links ?? []).map((link) => {
            let domain = link.url;
            try {
              domain = new URL(link.url).hostname.replace(/^www\./, "");
            } catch {
              // malformed url — show as-is
            }

            return (
              <li key={link.id}>
                <TrackedLink
                  profileId={profile.id}
                  linkId={link.id}
                  href={link.url}
                  className="group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-150 hover:-translate-y-px hover:shadow-md active:scale-[0.99]"
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    // hover is JS-only here; override via CSS var trick isn't possible
                    // so we use the group-hover Tailwind class on children instead
                  }}
                >
                  {/* Favicon container */}
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: faviconBg }}
                  >
                    <FaviconImage domain={domain} />
                  </span>

                  {/* Title + domain */}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span
                      className="truncate text-sm font-semibold leading-snug"
                      style={{ color: fg }}
                    >
                      {link.title}
                    </span>
                    <span
                      className="truncate text-xs"
                      style={{ color: domainColor }}
                    >
                      {domain}
                    </span>
                  </span>

                  {/* Clickable arrow */}
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 transition-opacity duration-150 group-hover:opacity-70"
                    style={{ color: arrowColor }}
                  />
                </TrackedLink>
              </li>
            );
          })}
        </ul>

        {(!links || links.length === 0) && (
          <p className="mt-10 text-sm" style={{ color: rgba(fg, 0.4) }}>
            No links added yet.
          </p>
        )}

        {/* Footer */}
        <footer className="mt-14 flex items-center gap-1.5" style={{ opacity: 0.35 }}>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
            style={{ color: fg }}
          >
            <KonektMark size={16} />
            <span className="font-medium tracking-tight">Konekt</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
