"use client";

import * as React from "react";
import { Check, Clock, X } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";
import { REWARD_TYPE_LABEL } from "@/lib/dashboard";
import type { RedemptionTypeStat } from "@/types/loyalty";

const TYPE_META: Record<
  RedemptionTypeStat["type"],
  { gradient: string; soft: string; ring: string }
> = {
  voucher: {
    gradient: "from-navy-900 to-cyan-700",
    soft: "bg-navy-900/5",
    ring: "ring-navy-900/10",
  },
  wallet: {
    gradient: "from-cyan-600 to-cyan-400",
    soft: "bg-cyan-50",
    ring: "ring-cyan-500/15",
  },
  data: {
    gradient: "from-violet-700 to-violet-400",
    soft: "bg-violet-50",
    ring: "ring-violet-500/15",
  },
  addon: {
    gradient: "from-amber-600 to-amber-400",
    soft: "bg-amber-50",
    ring: "ring-amber-500/15",
  },
};

export interface RedemptionTypeBreakdownProps {
  data: RedemptionTypeStat[];
}

export function RedemptionTypeBreakdown({ data }: RedemptionTypeBreakdownProps) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-muted-foreground">Total redemptions</p>
        <p className="text-2xl font-semibold tracking-tight">
          {formatNumber(total)}
        </p>
      </div>

      <ul className="space-y-3">
        {data.map((row) => {
          const share = total > 0 ? (row.total / total) * 100 : 0;
          const successRate = row.total > 0 ? (row.success / row.total) * 100 : 0;
          const meta = TYPE_META[row.type];

          return (
            <li
              key={row.type}
              className="rounded-xl border border-border/60 bg-secondary/30 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full bg-gradient-to-br",
                      meta.gradient
                    )}
                    aria-hidden
                  />
                  <span className="font-medium text-foreground">
                    {REWARD_TYPE_LABEL[row.type]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {share.toFixed(1)}% share
                  </span>
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatNumber(row.total)}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full bg-gradient-to-r", meta.gradient)}
                  style={{ width: `${share.toFixed(1)}%` }}
                />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                <BreakdownStat
                  icon={<Check className="h-3 w-3 text-emerald-600" />}
                  label="Success"
                  value={formatNumber(row.success)}
                />
                <BreakdownStat
                  icon={<Clock className="h-3 w-3 text-amber-500" />}
                  label="Pending"
                  value={formatNumber(row.pending)}
                />
                <BreakdownStat
                  icon={<X className="h-3 w-3 text-rose-500" />}
                  label="Failed"
                  value={formatNumber(row.failed)}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {successRate.toFixed(1)}% success rate
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BreakdownStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="font-medium text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}
