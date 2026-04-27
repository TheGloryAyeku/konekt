"use client";

type Props = {
  profileId: string;
  linkId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Fires a click beacon, then lets the browser navigate normally.
 *
 * We intentionally use `navigator.sendBeacon` so the request survives the
 * imminent navigation. Falls back to a fire-and-forget fetch for browsers
 * without beacon support.
 */
export function TrackedLink({ profileId, linkId, href, className, children }: Props) {
  function onClick() {
    const payload = JSON.stringify({
      profile_id: profileId,
      link_id: linkId,
      referrer: typeof document !== "undefined" ? document.referrer : null,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track/click", blob);
    } else {
      fetch("/api/track/click", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
