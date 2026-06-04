"use client";

import * as React from "react";
import {
  CalendarClock,
  Coins,
  Layers,
  Percent,
  PlayCircle,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn, formatNumber } from "@/lib/utils";

import { useEarningRules } from "./EarningRulesProvider";

type Tone = "navy" | "cyan" | "emerald" | "amber" | "violet" | "rose";

const TONE_STYLES: Record<Tone, string> = {
  navy: "bg-navy-900/5 text-navy-900",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
};

export function EarningRulesKpiBar() {
  const { kpis } = useEarningRules();

  const cards: Array<{
    label: string;
    value: string;
    helper: string;
    icon: LucideIcon;
    accent: Tone;
  }> = [
    {
      label: "Total rules",
      value: formatNumber(kpis.total),
      helper: `${kpis.active} active · ${kpis.inactive} inactive`,
      icon: Layers,
      accent: "navy",
    },
    {
      label: "Active rules",
      value: formatNumber(kpis.active),
      helper: "Live event handlers in production",
      icon: Sparkles,
      accent: "emerald",
    },
    {
      label: "Transactional events",
      value: formatNumber(kpis.transactional),
      helper: "Recharge, payments, Moolee purchases",
      icon: Coins,
      accent: "cyan",
    },
    {
      label: "Non-transactional events",
      value: formatNumber(kpis.nonTransactional),
      helper: "Streaks, profile, referrals, bonuses",
      icon: Zap,
      accent: "amber",
    },
    {
      label: "Selfcare rules",
      value: formatNumber(kpis.selfcare),
      helper: "Includes pre/post/hybrid sub-types",
      icon: Wallet,
      accent: "navy",
    },
    {
      label: "Moolee rules",
      value: formatNumber(kpis.moolee),
      helper: "Marketplace earning logic",
      icon: Wallet,
      accent: "violet",
    },
    {
      label: "M Faisaa rules",
      value: formatNumber(kpis.mfaisaa),
      helper: "Wallet and bill-payment earning logic",
      icon: Percent,
      accent: "amber",
    },
    {
      label: "Rules with expiry",
      value: formatNumber(kpis.withExpiry),
      helper: "Earned points expire automatically",
      icon: CalendarClock,
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
