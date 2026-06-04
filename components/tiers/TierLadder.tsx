"use client";

import * as React from "react";
import {
  Award,
  Check,
  ChevronRight,
  Crown,
  Gem,
  Shield,
  Sparkles,
  Star,
  Trophy,
  BadgeCheck,
  Users as UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { cn, formatCompact } from "@/lib/utils";
import type { Tier, TierIconName } from "@/types/loyalty";

import { useTiers } from "./TiersProvider";

const ICONS: Record<TierIconName, LucideIcon> = {
  Shield,
  Sparkles,
  Award,
  Crown,
  Gem,
  Star,
  Trophy,
  BadgeCheck,
};

const tierStatusBadge = (status: Tier["status"]): {
  label: string;
  tone: "success" | "neutral" | "warning";
} => {
  if (status === "INACTIVE") return { label: "Inactive", tone: "neutral" };
  return { label: "Active", tone: "success" };
};

export function TierLadder() {
  const { visibleTiers, countUsersInTier } = useTiers();

  if (visibleTiers.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-card md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tier ladder
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Member progression
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each tier unlocks new earning power, redemption benefits, and exclusive
            rewards. Configure thresholds and perks to grow program engagement.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {visibleTiers.length} configured · scroll horizontally on small screens
        </p>
      </div>

      <ol className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {visibleTiers.map((tier, idx) => {
          const Icon = ICONS[tier.iconName ?? "Shield"] ?? Shield;
          const userCount = countUsersInTier(tier.id);
          const isActive = (tier.status ?? "ACTIVE") === "ACTIVE";
          const isLast = idx === visibleTiers.length - 1;
          const next = visibleTiers[idx + 1];
          const upgradeDelta = next ? next.threshold - tier.threshold : null;
          const tone = tierStatusBadge(tier.status);

          return (
            <React.Fragment key={tier.id}>
              <li
                className={cn(
                  "flex flex-1 min-w-0 flex-col gap-4 rounded-xl border bg-secondary/30 p-5 transition-shadow",
                  isActive
                    ? "border-border/60 hover:shadow-card"
                    : "border-dashed border-border/60 opacity-75"
                )}
                style={{
                  borderTopColor: tier.color,
                  borderTopWidth: 4,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-soft"
                      style={{ backgroundColor: tier.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-base font-semibold tracking-tight text-foreground">
                        {tier.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rank {tier.rank} ·{" "}
                        {(tier.thresholdType ?? "POINTS").toLowerCase()} threshold
                      </p>
                    </div>
                  </div>
                  <StatusBadge label={tone.label} tone={tone.tone} />
                </div>

                <div className="rounded-lg border border-border/60 bg-card p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Threshold
                  </p>
                  <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
                    {formatCompact(tier.threshold)}
                    <span className="ml-1 text-xs font-medium text-muted-foreground">
                      {(tier.thresholdType ?? "POINTS").toLowerCase()}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {upgradeRuleLabel(tier.upgradeRule)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-card p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Multiplier
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {tier.multiplier.toFixed(2)}×
                    </p>
                  </div>
                  <div className="rounded-md bg-card p-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Members
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {userCount}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Top benefits
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-foreground">
                    {(tier.perks ?? []).slice(0, 3).map((perk) => (
                      <li key={perk} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="line-clamp-2">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {next ? (
                  <div className="mt-auto flex items-center justify-between rounded-md border border-dashed border-border/60 bg-card/60 px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                    <span>
                      Upgrade from previous:{" "}
                      <span className="font-semibold text-foreground">
                        +{formatCompact(upgradeDelta ?? 0)}
                      </span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="mt-auto flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-700">
                    <Crown className="h-3.5 w-3.5" /> Top tier in the program
                  </div>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}

function upgradeRuleLabel(
  rule: Tier["upgradeRule"] | undefined
): string {
  switch (rule) {
    case "lifetime_points":
      return "Computed from lifetime points";
    case "lifetime_spend":
      return "Computed from lifetime spend amount";
    case "monthly_spend":
      return "Computed from current month spend";
    case "manual":
      return "Assigned manually by an admin";
    default:
      return "Computed from lifetime points";
  }
}
