import * as React from "react";
import { Lock, Package, Sparkles, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";
import type { RewardStatus } from "@/types/loyalty";

const META: Record<RewardStatus, {
  label: string;
  tone: "info" | "success" | "warning" | "danger" | "accent";
  icon: LucideIcon;
}> = {
  available: { label: "Available", tone: "success", icon: Sparkles },
  locked: { label: "Locked", tone: "warning", icon: Lock },
  out_of_stock: { label: "Out of stock", tone: "danger", icon: Package },
  expiring: { label: "Expiring soon", tone: "warning", icon: Tag },
};

/**
 * Status indicator used on reward cards and detail headers.
 */
export function RewardStatusBadge({
  status,
  className,
}: {
  status: RewardStatus;
  className?: string;
}) {
  const meta = META[status];
  const Icon = meta.icon;
  return (
    <StatusBadge
      label={meta.label}
      tone={meta.tone}
      className={cn("text-[11px]", className)}
      icon={<Icon className="h-3 w-3" />}
    />
  );
}
