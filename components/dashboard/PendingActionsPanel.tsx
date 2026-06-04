"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  KeyRound,
  PackageCheck,
  ScrollText,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn, formatNumber } from "@/lib/utils";
import { alertSeverityTone } from "@/lib/dashboard";
import type { PendingAction, PendingActionKind } from "@/types/loyalty";

const KIND_ICON: Record<PendingActionKind, LucideIcon> = {
  merchant_approvals: Store,
  api_config_review: KeyRound,
  campaign_approval: Banknote,
  low_inventory_refill: PackageCheck,
  failed_txn_review: ScrollText,
};

export interface PendingActionsPanelProps {
  actions: PendingAction[];
  role: "admin" | "merchant" | "viewer";
}

function visibleActions(
  actions: PendingAction[],
  role: "admin" | "merchant" | "viewer"
): PendingAction[] {
  if (role === "admin") return actions;
  if (role === "merchant") {
    return actions.filter((a) =>
      ["merchant_approvals", "low_inventory_refill", "failed_txn_review"].includes(
        a.kind
      )
    );
  }
  // Viewer: read-only and limited to actions that don't involve approvals.
  return actions.filter((a) => a.kind === "failed_txn_review");
}

export function PendingActionsPanel({ actions, role }: PendingActionsPanelProps) {
  const filtered = visibleActions(actions, role);
  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
        Nothing needs your attention right now.
      </div>
    );
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((action) => {
        const Icon = KIND_ICON[action.kind] ?? AlertCircle;
        const tone = alertSeverityTone(action.severity);
        return (
          <li
            key={action.id}
            className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-soft"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  tone === "danger"
                    ? "bg-rose-50 text-rose-600"
                    : tone === "warning"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-sky-50 text-sky-600"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {action.title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                {formatNumber(action.count)}
              </span>
            </div>
            <div className="mt-auto flex items-center justify-between">
              <StatusBadge
                label={
                  action.severity === "critical"
                    ? "Urgent"
                    : action.severity === "warning"
                    ? "Action needed"
                    : "Heads up"
                }
                tone={tone}
              />
              <Button asChild size="sm" variant="outline">
                <Link href={action.cta.href}>
                  {action.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
