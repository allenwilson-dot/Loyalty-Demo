import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: {
    direction: "up" | "down" | "flat";
    label: string;
  };
  accent?: "navy" | "cyan" | "emerald" | "amber" | "violet";
  className?: string;
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  navy: "bg-navy-900/5 text-navy-900",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
};

const TREND_STYLES: Record<
  NonNullable<StatCardProps["trend"]>["direction"],
  string
> = {
  up: "text-emerald-600",
  down: "text-rose-600",
  flat: "text-muted-foreground",
};

/**
 * Compact metric tile used in dashboard headers and section summaries.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  accent = "navy",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card p-5 shadow-soft",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg",
              ACCENT_STYLES[accent]
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {trend ? (
          <span
            className={cn(
              "text-xs font-medium",
              TREND_STYLES[trend.direction]
            )}
          >
            {trend.label}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
