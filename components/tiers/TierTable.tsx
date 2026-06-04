"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit3,
  Eye,
  MoreHorizontal,
  Power,
  PowerOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { cn, formatCompact, formatDate } from "@/lib/utils";
import type { Tier, TierId, TierStatus } from "@/types/loyalty";

import { useTiers } from "./TiersProvider";

export interface TierTableProps {
  tiers: Tier[];
  sortField: "name" | "threshold" | "lastUpdated";
  sortDirection: "asc" | "desc";
  onSort: (field: "name" | "threshold" | "lastUpdated") => void;
  onView: (tier: Tier) => void;
  onEdit: (tier: Tier) => void;
  onToggleStatus: (tier: Tier) => void;
  className?: string;
}

const UPGRADE_RULE_LABEL: Record<string, string> = {
  lifetime_points: "Lifetime points",
  lifetime_spend: "Lifetime spend",
  monthly_spend: "Monthly spend",
  manual: "Manual",
};

const STATUS_TONE: Record<TierStatus, "success" | "neutral"> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
};

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  return direction === "asc" ? (
    <ArrowUp className="h-3 w-3" />
  ) : (
    <ArrowDown className="h-3 w-3" />
  );
}

interface RowMenuProps {
  tier: Tier;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function RowMenu({ tier, canEdit, onView, onEdit, onToggleStatus }: RowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isInactive = (tier.status ?? "ACTIVE") === "INACTIVE";

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Open actions for ${tier.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 min-w-[180px] overflow-hidden rounded-lg border border-border/70 bg-card shadow-elevated"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
            onClick={() => {
              setOpen(false);
              onView();
            }}
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View details
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canEdit}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Edit3 className="h-3.5 w-3.5 text-accent" /> Edit tier
          </button>
          <div className="my-1 h-px bg-border/60" />
          <button
            type="button"
            role="menuitem"
            disabled={!canEdit}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onToggleStatus();
            }}
          >
            {isInactive ? (
              <>
                <Power className="h-3.5 w-3.5 text-emerald-600" /> Activate
              </>
            ) : (
              <>
                <PowerOff className="h-3.5 w-3.5 text-amber-600" /> Deactivate
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TierTable({
  tiers,
  sortField,
  sortDirection,
  onSort,
  onView,
  onEdit,
  onToggleStatus,
  className,
}: TierTableProps) {
  const { canEdit, countUsersInTier, rewardsEligibleFor } = useTiers();

  if (tiers.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-card p-6 shadow-soft", className)}>
        <EmptyState
          icon={Edit3}
          title="No tiers match these filters"
          description="Try a different search term or status filter. New tiers can be created with the Create tier CTA above."
        />
      </div>
    );
  }

  const headerButton = (
    label: string,
    field: "name" | "threshold" | "lastUpdated"
  ) => (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <SortIndicator
        active={sortField === field}
        direction={sortDirection}
      />
    </button>
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-secondary/40">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                {headerButton("Tier", "name")}
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Threshold type
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {headerButton("Threshold", "threshold")}
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Upgrade rule
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Benefits
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Users
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Eligible rewards
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                {headerButton("Last updated", "lastUpdated")}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {tiers.map((tier) => {
              const userCount = countUsersInTier(tier.id);
              const rewardCount = rewardsEligibleFor(tier.id).length;
              const benefitCount = tier.benefits?.length ?? 0;
              const isInactive = (tier.status ?? "ACTIVE") === "INACTIVE";
              return (
                <tr
                  key={tier.id}
                  className="transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onView(tier)}
                      className="flex items-center gap-3 text-left transition-colors hover:text-accent"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white shadow-soft"
                        style={{ backgroundColor: tier.color }}
                      >
                        {tier.badgeLabel ?? tier.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {tier.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {tier.multiplier.toFixed(2)}× multiplier · rank {tier.rank}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {tier.thresholdType ?? "POINTS"}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="text-sm font-semibold text-foreground">
                      {formatCompact(tier.threshold)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      pts
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-foreground">
                    {UPGRADE_RULE_LABEL[tier.upgradeRule ?? "lifetime_points"] ??
                      "Lifetime points"}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-foreground">
                    <span className="font-semibold">{benefitCount}</span>{" "}
                    <span className="text-muted-foreground">tagged</span>
                  </td>
                  <td className="px-4 py-3 text-right align-top text-sm font-semibold text-foreground">
                    {userCount}
                  </td>
                  <td className="px-4 py-3 text-right align-top text-sm font-semibold text-foreground">
                    {rewardCount}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={isInactive ? "Inactive" : "Active"}
                      tone={STATUS_TONE[(tier.status ?? "ACTIVE") as TierStatus]}
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                    {tier.lastUpdated ? formatDate(tier.lastUpdated) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <RowMenu
                      tier={tier}
                      canEdit={canEdit}
                      onView={() => onView(tier)}
                      onEdit={() => onEdit(tier)}
                      onToggleStatus={() => onToggleStatus(tier)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
