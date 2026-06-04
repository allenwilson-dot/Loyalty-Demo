"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompact } from "@/lib/utils";
import type { TrendPoint } from "@/types/loyalty";

export interface EarnRedeemChartProps {
  data: TrendPoint[];
}

/**
 * Stacked area chart of points earned vs redeemed over time.
 * The view automatically switches to a denser tick set for longer windows.
 */
export function EarnRedeemChart({ data }: EarnRedeemChartProps) {
  const tickInterval = data.length > 14 ? Math.floor(data.length / 7) : 0;
  const totalEarned = data.reduce((sum, d) => sum + d.earned, 0);
  const totalRedeemed = data.reduce((sum, d) => sum + d.redeemed, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <LegendItem color="#06B6D4" label="Earned" value={formatCompact(totalEarned)} />
        <LegendItem color="#0F172A" label="Redeemed" value={formatCompact(totalRedeemed)} />
        <span className="ml-auto text-xs text-muted-foreground">
          {data.length}-day window
        </span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 6, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="earnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="redeemGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0F172A" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#0F172A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={42}
              tickFormatter={(value: number) => formatCompact(value)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid hsl(214 32% 91%)",
                boxShadow: "0 8px 24px -12px rgb(15 23 42 / 0.18)",
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                `${formatCompact(value)} pts`,
                name === "earned" ? "Earned" : "Redeemed",
              ]}
              labelStyle={{ color: "#0F172A", fontWeight: 600 }}
            />
            <Legend
              verticalAlign="top"
              align="left"
              iconType="circle"
              wrapperStyle={{ display: "none" }}
            />
            <Area
              type="monotone"
              dataKey="earned"
              stroke="#06B6D4"
              strokeWidth={2.5}
              fill="url(#earnGradient)"
            />
            <Area
              type="monotone"
              dataKey="redeemed"
              stroke="#0F172A"
              strokeWidth={2.5}
              fill="url(#redeemGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
