import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

export interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
  icon?: React.ReactNode;
}

const TONE_MAP: Record<StatusTone, "secondary" | "info" | "success" | "warning" | "destructive" | "accent"> = {
  neutral: "secondary",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "destructive",
  accent: "accent",
};

/**
 * Standardized status indicator used in tables, lists, and headers.
 * Maps semantic tones to the shadcn badge variants.
 */
export function StatusBadge({
  label,
  tone = "neutral",
  className,
  icon,
}: StatusBadgeProps) {
  return (
    <Badge variant={TONE_MAP[tone]} className={cn("font-medium", className)}>
      {icon ? (
        <span className="-ml-0.5 mr-0.5 flex h-3.5 w-3.5 items-center justify-center">
          {icon}
        </span>
      ) : null}
      {label}
    </Badge>
  );
}
