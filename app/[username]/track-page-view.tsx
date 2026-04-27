"use client";

import { useEffect, useRef } from "react";

/**
 * Fire-and-forget pageview beacon. Runs once per mount.
 */
export function TrackPageView({ profileId }: { profileId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const payload = JSON.stringify({
      profile_id: profileId,
      referrer: document.referrer || null,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track/view",
        new Blob([payload], { type: "application/json" }),
      );
    } else {
      fetch("/api/track/view", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }, [profileId]);

  return null;
}
