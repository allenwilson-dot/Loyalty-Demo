"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Lock,
  Minus,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn, formatCompact, formatNumber } from "@/lib/utils";

import { useUsers, type UsersKpis } from "./UsersProvider";

type Tone = "navy" | "cyan" | "emerald" | "amber" | "violet" | "rose";

const TONE_STYLES: Record<Tone, string> = {
  navy: "bg-navy-900/5 text-navy-900",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
};

interface CardDef {
  key: keyof UsersKpis;
  label: string;
  icon: LucideIcon;
  accent: Tone;
  format: "number" | "compact";
  helper: (k: UsersKpis) => string;
  /** Optional change indicator (delta vs prior session). */
  change?: (k: UsersKpis) => number;
  /** Tone for the change chip when the value is trending. */
  trendTone?: "up-good" | "down-good" | "neutral";
}

const CARDS: CardDef[] = [
  {
    key: "total",
    label: "Total users",
    icon: Users,
    accent: "navy",
    format: "number",
    helper: (k) => `${k.active} active · ${k.goldPlatinum} gold+`,
    change: () => 4.2,
  },
  {
    key: "active",
    label: "Active users",
    icon: Sparkles,
    accent: "cyan",
    format: "number",
    helper: (k) =>
      k.total > 0 ? `${Math.round((k.active / k.total) * 100)}% of total roster` : "No users yet",
    change: () => 2.1,
  },
  {
    key: "locked",
    label: "Locked users",
    icon: Lock,
    accent: "amber",
    format: "number",
    helper: (k) =>
      k.total > 0
        ? k.locked === 0
          ? "All accounts can transact"
          : `${Math.round((k.locked / k.total) * 100)}% of roster`
        : "—",
    change: (k) => (k.locked === 0 ? 0 : -3.4),
  },
  {
    key: "totalPointsBalance",
    label: "Total points balance",
    icon: Wallet,
    accent: "violet",
    format: "compact",
    helper: (k) => `${formatNumber(k.totalPointsBalance)} pts outstanding`,
    change: () => 6.8,
  },
  {
    key: "manuallyAdded",
    label: "Points added manually",
    icon: TrendingUp,
    accent: "emerald",
    format: "compact",
    helper: () => "Adjustments credited this session",
    change: (k) => (k.manuallyAdded > 0 ? 100 : 0),
  },
  {
    key: "manuallyReversed",
    label: "Points reversed",
    icon: TrendingDown,
    accent: "rose",
    format: "compact",
    helper: () => "Reversed this session",
    change: (k) => (k.manuallyReversed > 0 ? 100 : 0),
  },
  {
    key: "goldPlatinum",
    label: "Gold & platinum",
    icon: Coins,
    accent: "amber",
    format: "number",
    helper: (k) =>
      k.total > 0
        ? `${Math.round((k.goldPlatinum / k.total) * 100)}% of total roster`
        : "—",
    change: () => 1.2,
  },
  {
    key: "failedRedemptions",
    label: "Failed redemptions",
    icon: ShieldAlert,
    accent: "rose",
    format: "number",
    helper: () => "Across all redemptions in mock history",
    change: (k) => (k.failedRedemptions > 0 ? -1.6 : 0),
  },
];

function formatValue(value: number, format: CardDef["format"]): string {
  if (format === "compact") return formatCompact(value);
  return formatNumber(value);
}

function getChangeColor(change: number | undefined): string {
  if (change === undefined || change === 0) return "text-muted-foreground";
  return change > 0 ? "text-emerald-600" : "text-rose-600";
}

function getChangeIcon(change: number | undefined): LucideIcon {
  if (change === undefined || change === 0) return Minus;
  return change > 0 ? ArrowUpRight : ArrowDownRight;
}

/**
 * Eight-tile KPI summary for the User Management page. Reuses the
 * `UsersProvider` snapshot so values stay in sync with mutations.
 */
export function UsersKpiBar() {
  const { kpis } = useUsers();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = kpis[card.key] as number;
        const change = card.change?.(kpis);
        const ChangeIcon = getChangeIcon(change);
        return (
          <div
            key={card.key}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-shadow hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  TONE_STYLES[card.accent]
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              {formatValue(value, card.format)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {change !== undefined ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    getChangeColor(change)
                  )}
                >
                  <ChangeIcon className="h-3 w-3" />
                  {change > 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{card.helper(kpis)}</p>
          </div>
        );
      })}
    </div>
  );
}
