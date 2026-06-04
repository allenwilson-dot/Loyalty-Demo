"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { cn, formatNumber } from "@/lib/utils";

import { useTiers } from "./TiersProvider";

export interface TierDistributionChartProps {
  className?: string;
}

/**
 * Donut chart of users across the configured tiers plus a side table of
 * the percentage distribution and a "users near upgrade" stat.
 */
export function TierDistributionChart({ className }: TierDistributionChartProps) {
  const { visibleTiers, countUsersInTier, kpis } = useTiers();

  const data = visibleTiers
    .map((tier) => ({
      id: tier.id,
      name: tier.name,
      value: countUsersInTier(tier.id),
      color: tier.color,
      threshold: tier.threshold,
    }))
    .filter((entry) => entry.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const nearUpgrade = kpis.usersNearUpgrade;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-6 shadow-card md:p-8",
        className
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            User tier distribution
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Members per tier
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Snapshot of the active roster grouped by their current tier.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {formatNumber(total)}
          </p>
          <p className="text-xs text-muted-foreground">members across all tiers</p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="h-56 w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-secondary/30 text-xs text-muted-foreground">
              No members mapped to any tier yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    `${formatNumber(value)} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-2">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Once members start earning, they will appear here grouped by tier.
            </p>
          ) : (
            data.map((entry) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                      <span>{entry.name}</span>
                      <span className="text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: entry.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {formatNumber(entry.value)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Users near upgrade
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {formatNumber(nearUpgrade)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Members within 80% of their next threshold.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Highest active tier
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {kpis.highestTier ? kpis.highestTier.name : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {kpis.highestTier
              ? `Threshold ${formatNumber(kpis.highestTier.threshold)} ${(kpis.highestTier.thresholdType ?? "POINTS").toLowerCase()}`
              : "No tier configured."}
          </p>
        </div>
      </div>
    </div>
  );
}
