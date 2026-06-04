"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  Megaphone,
  Minus,
  Percent,
  Plug,
  Tag,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn, formatCompact, formatNumber } from "@/lib/utils";
import { kpiStatusTone } from "@/lib/dashboard";
import type { KpiCardData, KpiFormat } from "@/types/loyalty";

const TONE_STYLES: Record<
  "navy" | "cyan" | "emerald" | "amber" | "violet" | "rose",
  string
> = {
  navy: "bg-navy-900/5 text-navy-900",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
};

const ACCENT_BY_KPI_ID: Record<string, keyof typeof TONE_STYLES> = {
  kpi_total_users: "navy",
  kpi_active_users: "cyan",
  kpi_points_issued: "emerald",
  kpi_points_redeemed: "amber",
  kpi_redemption_rate: "violet",
  kpi_active_campaigns: "cyan",
  kpi_voucher_inventory: "amber",
  kpi_api_success: "emerald",
};

const ICON_BY_KPI_ID: Record<string, LucideIcon> = {
  kpi_total_users: Users,
  kpi_active_users: UserCheck,
  kpi_points_issued: Coins,
  kpi_points_redeemed: Wallet,
  kpi_redemption_rate: Percent,
  kpi_active_campaigns: Megaphone,
  kpi_voucher_inventory: Tag,
  kpi_api_success: Plug,
};

function formatValue(value: number, format: KpiFormat): string {
  switch (format) {
    case "compact":
      return formatCompact(value);
    case "percent":
      return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    default:
      return formatNumber(value);
  }
}

export interface KpiCardProps {
  kpi: KpiCardData;
  icon?: LucideIcon;
  accent?: keyof typeof TONE_STYLES;
}

/**
 * Polished KPI tile used in the dashboard summary grid. Surfaces the value,
 * a comparison line, and a status dot.
 */
export function KpiCard({ kpi, icon, accent }: KpiCardProps) {
  const Icon = icon ?? ICON_BY_KPI_ID[kpi.id];
  const tone = accent ?? ACCENT_BY_KPI_ID[kpi.id] ?? "navy";
  const toneLabel = kpiStatusTone(kpi.status);
  const changeColor =
    kpi.changePercent > 0
      ? "text-emerald-600"
      : kpi.changePercent < 0
      ? "text-rose-600"
      : "text-muted-foreground";
  const ChangeIcon =
    kpi.changePercent > 0
      ? ArrowUpRight
      : kpi.changePercent < 0
      ? ArrowDownRight
      : Minus;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft transition-shadow hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {kpi.label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              TONE_STYLES[tone]
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {formatValue(kpi.value, kpi.format)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 text-xs font-medium", changeColor)}>
          <ChangeIcon className="h-3 w-3" />
          {kpi.changePercent > 0 ? "+" : ""}
          {kpi.changePercent.toFixed(1)}%
        </span>
        <span className="text-xs text-muted-foreground">vs last period</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
            toneLabel === "success" && "bg-emerald-50 text-emerald-700",
            toneLabel === "warning" && "bg-amber-50 text-amber-700",
            toneLabel === "danger" && "bg-rose-50 text-rose-700"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              toneLabel === "success" && "bg-emerald-500",
              toneLabel === "warning" && "bg-amber-500",
              toneLabel === "danger" && "bg-rose-500"
            )}
          />
          {kpi.status === "healthy"
            ? "Healthy"
            : kpi.status === "watch"
            ? "Watch"
            : "Critical"}
        </span>
      </div>
    </div>
  );
}
