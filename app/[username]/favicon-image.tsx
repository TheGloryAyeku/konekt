"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

export function FaviconImage({ domain }: { domain: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Globe className="h-4 w-4 opacity-40" />;
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 object-contain"
      onError={() => setFailed(true)}
    />
  );
}
