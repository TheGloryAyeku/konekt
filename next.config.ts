import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: opt into Cache Components (`cacheComponents: true`) once all
  // dashboard pages wrap their per-user reads in Suspense, and the public
  // profile pages are rewritten with `'use cache'` + cacheTag. For scaffold
  // we keep the default rendering model.

  // Allow Supabase Storage / Cloudflare R2 public bucket URLs for next/image.
  // Override the hostnames via env once you know your bucket / storage URL.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;
