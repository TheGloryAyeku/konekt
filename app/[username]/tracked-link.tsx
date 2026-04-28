"use client";

type Props = {
  profileId: string;
  linkId: string;
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function TrackedLink({ profileId, linkId, href, className, style, children }: Props) {
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
      style={style}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
