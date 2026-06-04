import * as React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Gift,
  RefreshCcw,
  Sparkles,
  TimerReset,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import type { LoyaltyTransaction, TransactionStatus } from "@/types/loyalty";

import { formatPoints } from "@/lib/loyalty";

import { EntrySourceBadge } from "./EntrySourceBadge";

const TYPE_META: Record<
  LoyaltyTransaction["type"],
  { icon: LucideIcon; tone: "up" | "down" }
> = {
  earn: { icon: ArrowDownLeft, tone: "up" },
  bonus: { icon: Sparkles, tone: "up" },
  redeem: { icon: Gift, tone: "down" },
  adjust: { icon: RefreshCcw, tone: "down" },
  expire: { icon: TimerReset, tone: "down" },
};

const STATUS_TONE: Record<TransactionStatus, "success" | "warning" | "danger" | "neutral"> = {
  completed: "success",
  pending: "warning",
  reversed: "danger",
  failed: "danger",
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  completed: "Success",
  pending: "Pending",
  reversed: "Reversed",
  failed: "Failed",
};

export interface TransactionListProps {
  transactions: LoyaltyTransaction[];
  className?: string;
  /** Render transactions as a vertical card list (default) or compact rows. */
  variant?: "cards" | "rows";
  emptyState?: React.ReactNode;
}

/**
 * Renders the member's transaction stream. Used by the dashboard
 * "recent activity" panel and by the full /user/history page.
 */
export function TransactionList({
  transactions,
  className,
  variant = "cards",
  emptyState,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
        {emptyState ?? "No transactions to show."}
      </div>
    );
  }

  return (
    <ul
      className={cn(
        variant === "cards"
          ? "divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft"
          : "space-y-2",
        className
      )}
    >
      {transactions.map((txn) => {
        const meta = TYPE_META[txn.type];
        const Icon = meta.icon;
        const isCredit = txn.points >= 0;
        return (
          <li
            key={txn.id}
            className={cn(
              variant === "cards"
                ? "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                : "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 shadow-soft"
            )}
          >
            <div className="flex flex-1 items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  isCredit
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-secondary text-navy-900"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {txn.description}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-mono text-[11px] tracking-tight">
                    {txn.id.slice(0, 12)}…
                  </span>
                  <span aria-hidden>·</span>
                  <EntrySourceBadge source={txn.channel} showIcon={false} />
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    {formatDate(txn.occurredAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
              <span
                className={cn(
                  "text-base font-semibold tabular-nums",
                  isCredit ? "text-emerald-600" : "text-foreground"
                )}
              >
                {isCredit ? "+" : ""}
                {formatPoints(txn.points)}
              </span>
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={STATUS_LABEL[txn.status]}
                  tone={STATUS_TONE[txn.status]}
                  icon={
                    txn.status === "pending" ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : null
                  }
                />
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {formatRelative(txn.occurredAt)}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
