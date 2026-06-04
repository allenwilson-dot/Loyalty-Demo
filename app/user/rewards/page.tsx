"use client";

import * as React from "react";
import { Filter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RewardCard } from "@/components/loyalty/RewardCard";
import { useLoyaltySession } from "@/components/loyalty/LoyaltyProvider";
import { MOCK_REWARDS } from "@/data/mockRewards";
import { deriveRewardStatus, REWARD_TYPE_LABEL } from "@/lib/loyalty";
import { getCampaignRewards } from "@/lib/campaignRewards";
import { cn } from "@/lib/utils";
import type {
  RewardFilterStatus,
  RewardFilterTier,
  RewardFilterType,
  RewardType,
  TierId,
} from "@/types/loyalty";

const TYPE_OPTIONS: { value: RewardFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "voucher", label: REWARD_TYPE_LABEL.voucher },
  { value: "wallet", label: REWARD_TYPE_LABEL.wallet },
  { value: "data", label: REWARD_TYPE_LABEL.data },
  { value: "addon", label: REWARD_TYPE_LABEL.addon },
];

const TIER_OPTIONS: { value: RewardFilterTier; label: string }[] = [
  { value: "all", label: "All tiers" },
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "diamond", label: "Diamond" },
];

const STATUS_OPTIONS: { value: RewardFilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "locked", label: "Locked" },
  { value: "out_of_stock", label: "Out of stock" },
];

export default function RewardsPage() {
  const { user } = useLoyaltySession();

  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<RewardFilterType>("all");
  const [tierFilter, setTierFilter] = React.useState<RewardFilterTier>("all");
  const [statusFilter, setStatusFilter] = React.useState<RewardFilterStatus>(
    "all"
  );

  // Merge static rewards + active campaigns, then filter — single memo avoids cross-dependency warning
  const [allRewards, filtered] = React.useMemo(() => {
    const campaignRewards = getCampaignRewards();
    const campaignIds = new Set(campaignRewards.map(r => r.id));
    const all = [...MOCK_REWARDS.filter(r => !campaignIds.has(r.id)), ...campaignRewards];

    const q = query.trim().toLowerCase();
    const result = all.filter((reward) => {
      if (q) {
        const haystack = [
          reward.title,
          reward.description,
          reward.merchantName ?? "",
          reward.type,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter !== "all" && reward.type !== (typeFilter as RewardType)) {
        return false;
      }
      if (tierFilter !== "all" && reward.minTier !== (tierFilter as TierId)) {
        return false;
      }
      if (statusFilter !== "all") {
        const status = deriveRewardStatus(reward, user);
        if (statusFilter === "available" && status !== "available") return false;
        if (statusFilter === "locked" && status !== "locked") return false;
        if (statusFilter === "out_of_stock" && status !== "out_of_stock") {
          return false;
        }
      }
      return true;
    });
    return [all, result];
  }, [query, typeFilter, tierFilter, statusFilter, user]);

  const isFiltered =
    query.length > 0 ||
    typeFilter !== "all" ||
    tierFilter !== "all" ||
    statusFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setTierFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Rewards marketplace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Browse the catalogue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search and filter the rewards you can redeem with your points.
          </p>
        </div>
        <Badge variant="muted" className="self-start sm:self-auto">
          {filtered.length} of {allRewards.length} rewards
        </Badge>
      </header>

      {/* Search + filters */}
      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search rewards, merchants…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3 w-3" /> Type
            </span>
            {TYPE_OPTIONS.map((opt) => {
              const active = typeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-navy-900 bg-navy-900 text-white shadow-soft"
                      : "border-border/60 bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tier
          </span>
          {TIER_OPTIONS.map((opt) => {
            const active = tierFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTierFilter(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-navy-900 bg-navy-900 text-white shadow-soft"
                    : "border-border/60 bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            );
          })}

          <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          {STATUS_OPTIONS.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-navy-900 bg-navy-900 text-white shadow-soft"
                    : "border-border/60 bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            );
          })}

          {isFiltered ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          ) : null}
        </div>
      </section>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/40 p-10 text-center">
          <h3 className="text-base font-semibold text-foreground">
            No rewards match your filters
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try clearing filters or searching for a different keyword.
          </p>
          <Button variant="outline" className="mt-4" onClick={clearFilters}>
            Reset filters
          </Button>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((reward) => (
            <RewardCard key={reward.id} reward={reward} />
          ))}
        </section>
      )}
    </div>
  );
}
