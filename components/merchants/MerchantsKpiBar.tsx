"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Plug,
  Store,
  Truck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";

import { useMerchants } from "./MerchantsProvider";

type Tone = "navy" | "cyan" | "emerald" | "amber" | "violet" | "rose";

const TONE_STYLES: Record<Tone, string> = {
  navy: "bg-navy-900/5 text-navy-900",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
};

export function MerchantsKpiBar() {
  const { kpis } = useMerchants();

  const cards: Array<{
    label: string;
    value: string;
    helper: string;
    icon: LucideIcon;
    accent: Tone;
  }> = [
    {
      label: "Total merchants",
      value: formatNumber(kpis.total),
      helper: `${kpis.active} active · ${kpis.inactive} inactive`,
      icon: Store,
      accent: "navy",
    },
    {
      label: "Active merchants",
      value: formatNumber(kpis.active),
      helper: "Live partners across the loyalty ecosystem",
      icon: UserCheck,
      accent: "emerald",
    },
    {
      label: "Internal merchants",
      value: formatNumber(kpis.internal),
      helper: "Owned brands like M Faisaa and Moolee",
      icon: Wallet,
      accent: "navy",
    },
    {
      label: "External merchants",
      value: formatNumber(kpis.external),
      helper: "Third-party voucher partners",
      icon: Truck,
      accent: "cyan",
    },
    {
      label: "Partner merchants",
      value: formatNumber(kpis.partner),
      helper: "Strategic co-marketing partners",
      icon: Layers,
      accent: "violet",
    },
    {
      label: "API enabled",
      value: formatNumber(kpis.apiEnabled),
      helper: "Capable of API-driven voucher issuance",
      icon: Plug,
      accent: "emerald",
    },
    {
      label: "Pending KYC",
      value: formatNumber(kpis.pendingKyc),
      helper: "Awaiting finance / compliance review",
      icon: AlertCircle,
      accent: "amber",
    },
    {
      label: "Inactive merchants",
      value: formatNumber(kpis.inactive),
      helper:
        kpis.inactive === 0
          ? "Every partner is currently active"
          : "Excluded from new voucher configuration",
      icon: Users,
      accent: "rose",
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
