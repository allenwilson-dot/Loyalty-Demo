"use client";

import * as React from "react";
import {
  AlertTriangle,
  CalendarClock,
  Database,
  Package,
  Plug,
  Tag,
  Ticket,
  TimerReset,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";

import { useVouchers } from "./VouchersProvider";

type Tone = "navy" | "cyan" | "emerald" | "amber" | "violet" | "rose";

const TONE_STYLES: Record<Tone, string> = {
  navy: "bg-navy-900/5 text-navy-900",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
};

export function VouchersKpiBar() {
  const { kpis } = useVouchers();

  const cards: Array<{
    label: string;
    value: string;
    helper: string;
    icon: LucideIcon;
    accent: Tone;
  }> = [
    {
      label: "Total vouchers",
      value: formatNumber(kpis.total),
      helper: `${kpis.active} active · ${kpis.inactive} inactive`,
      icon: Ticket,
      accent: "navy",
    },
    {
      label: "Active vouchers",
      value: formatNumber(kpis.active),
      helper: "Eligible for redemption campaigns",
      icon: Tag,
      accent: "emerald",
    },
    {
      label: "Inventory vouchers",
      value: formatNumber(kpis.inventory),
      helper: "Stocked from coupon catalogue",
      icon: Package,
      accent: "cyan",
    },
    {
      label: "API vouchers",
      value: formatNumber(kpis.api),
      helper: "Issued through partner APIs",
      icon: Plug,
      accent: "violet",
    },
    {
      label: "Total coupon inventory",
      value: formatNumber(kpis.totalInventory),
      helper: "Sum of all inventory codes",
      icon: Database,
      accent: "navy",
    },
    {
      label: "Remaining coupons",
      value: formatNumber(kpis.remainingInventory),
      helper: "Available for assignment",
      icon: Package,
      accent: "emerald",
    },
    {
      label: "Low stock vouchers",
      value: formatNumber(kpis.lowStock),
      helper: `${kpis.outOfStock} out of stock`,
      icon: AlertTriangle,
      accent: kpis.lowStock > 0 ? "amber" : "emerald",
    },
    {
      label: "Expiring soon",
      value: formatNumber(kpis.expiringSoon),
      helper: "Active vouchers expiring in 30 days",
      icon: CalendarClock,
      accent: kpis.expiringSoon > 0 ? "rose" : "emerald",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
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
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
          </div>
        );
      })}
    </div>
  );
}
