"use client";

import * as React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { formatCompact } from "@/lib/utils";
import type { ChannelContribution } from "@/types/loyalty";

export interface ChannelContributionChartProps {
  data: ChannelContribution[];
}

/**
 * Donut chart of points earned per channel, with a legend on the right.
 */
export function ChannelContributionChart({ data }: ChannelContributionChartProps) {
  const total = data.reduce((sum, d) => sum + d.points, 0);
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="h-56 w-full lg:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="points"
              nameKey="label"
              innerRadius={50}
              outerRadius={84}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.channel} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(214 32% 91%)",
                boxShadow: "0 8px 24px -12px rgb(15 23 42 / 0.18)",
                fontSize: 12,
              }}
              formatter={(value: number, _name, item) => [
                `${formatCompact(value)} pts (${(item?.payload as ChannelContribution)?.percent?.toFixed(1) ?? "0"}%)`,
                item?.payload?.label ?? "",
              ]}
            />
            <Legend
              iconType="circle"
              verticalAlign="bottom"
              wrapperStyle={{ display: "none" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((entry) => (
          <li
            key={entry.channel}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2"
          >
            <span className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="font-medium text-foreground">{entry.label}</span>
            </span>
            <span className="text-right text-sm">
              <span className="block font-semibold text-foreground">
                {formatCompact(entry.points)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {entry.percent.toFixed(1)}% of total
              </span>
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between border-t border-border/60 px-3 pt-2 text-sm font-medium">
          <span className="text-muted-foreground">Total earned</span>
          <span className="text-foreground">{formatCompact(total)} pts</span>
        </li>
      </ul>
    </div>
  );
}
