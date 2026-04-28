"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "./actions";

const PRESETS = [
  { name: "Cream", background: "#fbfaf2", foreground: "#16181c" },
  { name: "Ink", background: "#16181c", foreground: "#fbfaf2" },
  { name: "Sky", background: "#dbeafe", foreground: "#0c1c3a" },
  { name: "Mint", background: "#d1fae5", foreground: "#022c1f" },
  { name: "Rose", background: "#ffe4e6", foreground: "#3f1517" },
  { name: "Sunshine", background: "#fef3c7", foreground: "#3a2a02" },
];

type Profile = {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  theme_background: string;
  theme_foreground: string;
};

export function AppearanceForm({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [background, setBackground] = useState(profile.theme_background);
  const [foreground, setForeground] = useState(profile.theme_foreground);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfile({}, formData);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Page updated");
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
    >
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Photo, display name, and bio shown at the top of your page.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="display_name">Display name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name as shown to visitors"
                maxLength={60}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short line about you"
                maxLength={240}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length} / 240
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                name="avatar_url"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Paste a public image URL. Image upload is coming soon.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Pick a background and text colour, or start from a preset.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setBackground(preset.background);
                    setForeground(preset.foreground);
                  }}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:border-primary/40"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: preset.background }}
                  />
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="theme_background">Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background"
                    aria-label="Background colour"
                  />
                  <Input
                    id="theme_background"
                    name="theme_background"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    pattern="^#[0-9a-fA-F]{6}$"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="theme_foreground">Text</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background"
                    aria-label="Text colour"
                  />
                  <Input
                    id="theme_foreground"
                    name="theme_foreground"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    pattern="^#[0-9a-fA-F]{6}$"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>
              How your page looks to visitors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-col items-center gap-3 rounded-2xl px-4 py-8"
              style={{ backgroundColor: background, color: foreground }}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName || profile.username}
                  width={72}
                  height={72}
                  className="rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-2xl font-semibold"
                  style={{
                    backgroundColor: foreground,
                    color: background,
                  }}
                >
                  {(displayName || profile.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <p className="text-sm font-semibold">
                {displayName || `@${profile.username}`}
              </p>
              {bio ? (
                <p className="text-center text-xs opacity-80">{bio}</p>
              ) : null}
              <div className="mt-2 flex w-full max-w-[220px] flex-col gap-2">
                <PreviewLink label="Sample link 1" foreground={foreground} />
                <PreviewLink label="Sample link 2" foreground={foreground} />
                <PreviewLink label="Sample link 3" foreground={foreground} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function PreviewLink({
  label,
  foreground,
}: {
  label: string;
  foreground: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-center text-xs font-medium"
      style={{
        backgroundColor: `${foreground}14`,
        border: `1px solid ${foreground}33`,
      }}
    >
      {label}
    </div>
  );
}
