"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UpgradeButton({
  planCode,
  label,
}: {
  planCode: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_code: planCode }),
        });
        const json = (await res.json()) as {
          authorization_url?: string;
          error?: string;
        };
        if (!res.ok || !json.authorization_url) {
          toast.error(json.error ?? "Could not start checkout");
          return;
        }
        window.location.href = json.authorization_url;
      } catch {
        toast.error("Network error. Try again in a moment.");
      }
    });
  }

  return (
    <Button className="w-full" onClick={onClick} disabled={pending}>
      {pending ? "Redirecting to Paystack…" : label}
    </Button>
  );
}
