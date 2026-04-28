"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
] as const;

export function RangeTabs({ active }: { active: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {RANGES.map((r) => {
          const isActive = r.value === active;
          return (
            <Link
              key={r.value}
              href={`/dashboard/analytics?range=${r.value}`}
              scroll={false}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </Link>
          );
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={refresh}
        disabled={pending}
      >
        <RefreshCw
          className={cn("mr-1.5 h-3.5 w-3.5", pending && "animate-spin")}
        />
        {pending ? "Refreshing" : "Refresh"}
      </Button>
    </div>
  );
}
