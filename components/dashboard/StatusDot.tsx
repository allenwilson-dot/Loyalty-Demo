import * as React from "react";
import { cn } from "@/lib/utils";

export type DotTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_STYLES: Record<DotTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  neutral: "bg-slate-400",
};

/**
 * Tiny status dot used inline in tables and list rows.
 */
export function StatusDot({
  tone,
  className,
}: {
  tone: DotTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        TONE_STYLES[tone],
        className
      )}
    />
  );
}
