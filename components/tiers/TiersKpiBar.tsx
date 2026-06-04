"use client";

import * as React from "react";
import {
  Award,
  Crown,
  Gem,
  Layers,
  Lock,
  Minus,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn, formatCompact, formatNumber } from "@/lib/utils";
import type { Tier } from "@/types/loyalty";

import { useTiers } from "./TiersProvider";

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
  key: string;
  label: string;
  icon: LucideIcon;
  accent: Tone;
  helper: (k: ReturnType<typeof useTiers>["kpis"]) => string;
}

function getTierIcon(tier: Tier | null): LucideIcon {
  if (!tier) return Crown;
  switch (tier.id) {
    case "bronze":
      return Sparkles;
    case "silver":
      return Award;
    case "gold":
      return Award;
    case "platinum":
      return Crown;
    case "diamond":
      return Gem;
    default:
      return Crown;
  }
}

export function TiersKpiBar() {
  const { kpis, visibleTiers } = useTiers();

  const highest = kpis.highestTier;

  const cards: Array<{
    label: string;
    value: string;
    helper: string;
    icon: LucideIcon;
    accent: Tone;
  }> = [
    {
      label: "Total tiers",
      value: formatNumber(kpis.total),
      helper: `${kpis.active} active · ${kpis.inactive} inactive`,
      icon: Layers,
      accent: "navy",
    },
    {
      label: "Active tiers",
      value: formatNumber(kpis.active),
      helper:
        kpis.active > 0
          ? "Available for new reward eligibility"
          : "Activate at least one tier to resume reward eligibility",
      icon: Sparkles,
      accent: "emerald",
    },
    {
      label: "Highest tier",
      value: highest ? highest.name : "—",
      helper: highest
        ? `Threshold ${formatNumber(highest.threshold)} ${(highest.thresholdType ?? "POINTS").toLowerCase()}`
        : "No tier configured",
      icon: getTierIcon(highest),
      accent: "amber",
    },
    {
      label: "Users in gold or above",
      value: formatNumber(kpis.usersInGoldOrAbove),
      helper: "Across all members in the roster",
      icon: Users,
      accent: "cyan",
    },
    {
      label: "Avg active threshold",
      value: formatCompact(kpis.averageThreshold),
      helper: "Mean of active tier thresholds (pts)",
      icon: TrendingUp,
      accent: "violet",
    },
    {
      label: "Rewards locked by tier",
      value: formatNumber(kpis.rewardsLockedByTier),
      helper: "Rewards that require an inactive tier",
      icon: Lock,
      accent: "rose",
    },
    {
      label: "Users near upgrade",
      value: formatNumber(kpis.usersNearUpgrade),
      helper: "Within 80% of the next tier threshold",
      icon: Award,
      accent: "emerald",
    },
    {
      label: "Inactive tiers",
      value: formatNumber(kpis.inactive),
      helper:
        kpis.inactive === 0
          ? "All tiers are currently active"
          : `Hidden from new reward eligibility`,
      icon: Lock,
      accent: "amber",
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
