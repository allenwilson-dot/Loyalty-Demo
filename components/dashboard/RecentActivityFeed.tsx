"use client";

import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  RefreshCcw,
  Settings2,
  TimerReset,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { EntrySourceBadge } from "@/components/loyalty/EntrySourceBadge";
import { cn, formatNumber, formatRelative } from "@/lib/utils";
import type { ActivityFeedEntry } from "@/types/loyalty";

const KIND_META: Record<
  ActivityFeedEntry["kind"],
  { icon: LucideIcon; tone: "up" | "down" | "neutral" }
> = {
  earn: { icon: ArrowDownLeft, tone: "up" },
  redeem: { icon: Gift, tone: "down" },
  rollback: { icon: RefreshCcw, tone: "neutral" },
  failure: { icon: TimerReset, tone: "neutral" },
  config: { icon: Settings2, tone: "neutral" },
};

const STATUS_TONE: Record<
  ActivityFeedEntry["status"],
  "success" | "warning" | "danger" | "neutral"
> = {
  completed: "success",
  pending: "warning",
  reversed: "danger",
  failed: "danger",
};

const STATUS_LABEL: Record<ActivityFeedEntry["status"], string> = {
  completed: "Success",
  pending: "Pending",
  reversed: "Reversed",
  failed: "Failed",
};

export interface RecentActivityFeedProps {
  entries: ActivityFeedEntry[];
}

export function RecentActivityFeed({ entries }: RecentActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
        Nothing has happened in the last few minutes.
      </div>
    );
  }
  return (
    <ol className="space-y-3">
      {entries.map((entry) => {
        const meta = KIND_META[entry.kind];
        const Icon = meta.icon;
        const isCredit = entry.kind === "earn";
        return (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-soft"
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                isCredit
                  ? "bg-emerald-50 text-emerald-600"
                  : entry.status === "failed"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-secondary text-navy-900"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {entry.userName}
                </p>
                {entry.points !== 0 ? (
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      isCredit ? "text-emerald-600" : "text-foreground"
                    )}
                  >
                    {isCredit ? "+" : ""}
                    {formatNumber(entry.points)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {entry.action}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <EntrySourceBadge source={entry.channel} showIcon={false} />
                <span aria-hidden>·</span>
                <StatusBadge
                  label={STATUS_LABEL[entry.status]}
                  tone={STATUS_TONE[entry.status]}
                />
                <span aria-hidden>·</span>
                <span>{formatRelative(entry.occurredAt)}</span>
                {entry.reference ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-mono tracking-tight">
                      {entry.reference}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
