"use client";

import * as React from "react";
import { Plug, Tag } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import { voucherHealthTone } from "@/lib/dashboard";
import type { VoucherInventoryRow } from "@/types/loyalty";

export interface VoucherInventoryCardProps {
  rows: VoucherInventoryRow[];
  emptyState?: React.ReactNode;
}

const TONE_BAR: Record<
  "success" | "warning" | "danger" | "info",
  string
> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-cyan-500",
};

const STATUS_LABEL: Record<VoucherInventoryRow["health"], string> = {
  healthy: "Healthy",
  watch: "Watch",
  critical: "Critical",
  api: "API Based",
};

export function VoucherInventoryCard({
  rows,
  emptyState,
}: VoucherInventoryCardProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
        {emptyState ?? "No vouchers to show."}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-soft">
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Voucher</th>
            <th className="px-4 py-3 font-medium">Merchant</th>
            <th className="px-4 py-3 font-medium">Mode</th>
            <th className="px-4 py-3 font-medium">Inventory</th>
            <th className="px-4 py-3 font-medium">Usage</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row) => {
            const tone = voucherHealthTone(row.health);
            const statusLabel = STATUS_LABEL[row.health];
            return (
              <tr key={row.id} className="text-foreground/90">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{row.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Expires {formatDate(row.expiresAt)}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.merchantName}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {row.mode === "api" ? (
                      <Plug className="h-3 w-3" />
                    ) : (
                      <Tag className="h-3 w-3" />
                    )}
                    {row.mode === "api" ? "API" : "Inventory"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.mode === "api" ? (
                    <span className="text-muted-foreground">
                      API-driven issuance
                    </span>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {formatNumber(row.remaining)}
                      </span>{" "}
                      / {formatNumber(row.total)}
                    </div>
                  )}
                </td>
                <td className="min-w-[140px] px-4 py-3">
                  {row.mode === "api" ? (
                    <span className="text-xs text-muted-foreground">
                      {row.apiSuccessRate?.toFixed(1)}% success rate
                    </span>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn("h-full rounded-full", TONE_BAR[tone])}
                          style={{ width: `${row.usagePercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {row.usagePercent.toFixed(1)}% used
                      </p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={statusLabel} tone={tone} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
