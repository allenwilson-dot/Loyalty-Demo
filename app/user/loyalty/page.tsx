"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Coins,
  CreditCard,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/common/StatCard";
import { PointsBalanceCard } from "@/components/loyalty/PointsBalanceCard";
import { TierProgressCard } from "@/components/loyalty/TierProgressCard";
import { RewardCard } from "@/components/loyalty/RewardCard";
import { TransactionList } from "@/components/loyalty/TransactionList";
import { useLoyaltyDerived, useLoyaltySession } from "@/components/loyalty/LoyaltyProvider";
import { MOCK_REWARDS } from "@/data/mockRewards";
import { summarizeEntrySources, formatPoints } from "@/lib/loyalty";
import { getCampaignRewards } from "@/lib/campaignRewards";
import { cn } from "@/lib/utils";
import type { EntrySource } from "@/types/loyalty";

const SOURCE_META: Record<
  EntrySource,
  { label: string; icon: LucideIcon; gradient: string; ring: string; description: string }
> = {
  selfcare: {
    label: "Selfcare",
    icon: Smartphone,
    gradient: "from-navy-900 to-navy-700",
    ring: "ring-navy-900/10",
    description: "Recharges, plan renewals, and add-on purchases.",
  },
  moolee: {
    label: "Moolee",
    icon: CreditCard,
    gradient: "from-cyan-600 to-cyan-400",
    ring: "ring-cyan-500/15",
    description: "Cashback and partner spend through your mobile wallet.",
  },
  mfaisaa: {
    label: "M Faisaa",
    icon: Coins,
    gradient: "from-amber-600 to-amber-400",
    ring: "ring-amber-500/15",
    description: "Bill payments and peer-to-peer rewards.",
  },
};

export default function UserLoyaltyPage() {
  const { user, transactions, isHydrated } = useLoyaltySession();
  const { lifetimeEarned, lifetimeRedeemed, expiringPoints } =
    useLoyaltyDerived();

  const sources = React.useMemo(
    () => summarizeEntrySources(transactions, 3),
    [transactions]
  );

  const recent = transactions.slice(0, 5);
  const featured = React.useMemo(() => {
    const campaignRewards = getCampaignRewards().map(r => ({ ...r, featured: true }));
    const staticFeatured = MOCK_REWARDS.filter(r => r.featured);
    const campaignIds = new Set(campaignRewards.map(r => r.id));
    return [...campaignRewards, ...staticFeatured.filter(r => !campaignIds.has(r.id))].slice(0, 6);
  }, []);

  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {isHydrated ? "Welcome back" : "Loading…"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Hello, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&rsquo;s a quick look at your loyalty standing across Selfcare, Moolee,
          and M-Faisaa.
        </p>
      </section>

      {/* Hero balance + stats */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PointsBalanceCard />
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <StatCard
            label="Lifetime earned"
            value={formatPoints(lifetimeEarned)}
            hint="Across all entry sources"
            icon={TrendingUp}
            accent="cyan"
          />
          <StatCard
            label="Lifetime redeemed"
            value={formatPoints(lifetimeRedeemed)}
            hint="Spent on rewards"
            icon={WalletIcon}
            accent="navy"
          />
          <StatCard
            label="Expiring soon"
            value={formatPoints(expiringPoints)}
            hint="Within the next quarter"
            icon={CalendarClock}
            accent="amber"
          />
        </div>
      </section>

      {/* Tier progress */}
      <TierProgressCard />

      {/* Entry sources */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card md:p-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Earning channels
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Where your points come from
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A breakdown of activity across the three entry sources.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/user/history">
              View history <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {sources.map((entry) => {
            const meta = SOURCE_META[entry.source];
            const Icon = meta.icon;
            return (
              <div
                key={entry.source}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-secondary/30 p-4"
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                    meta.gradient
                  )}
                />
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg bg-card ring-1 shadow-soft",
                      meta.ring
                    )}
                  >
                    <Icon className="h-4 w-4 text-foreground" />
                  </span>
                  <span className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-soft">
                    {entry.count} txns
                  </span>
                </div>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {meta.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {meta.description}
                </p>
                <p className="mt-4 text-2xl font-semibold tabular-nums text-foreground">
                  {formatPoints(entry.points)}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                    pts earned
                  </span>
                </p>
                {entry.recent[0] ? (
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    Latest: {entry.recent[0].description}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured rewards */}
      <section className="space-y-3">
        <header className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Featured for you
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Redeem your points
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/user/rewards">
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </header>
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
          {featured.map((reward) => (
            <RewardCard key={reward.id} reward={reward} compact />
          ))}
        </div>
      </section>

      {/* Recent transactions */}
      <section className="space-y-3">
        <header className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Latest activity
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Recent transactions
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/user/history">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </header>
        <TransactionList
          transactions={recent}
          emptyState="You haven&rsquo;t earned or redeemed any points yet."
        />
      </section>

      {/* Footer note for the prototype */}
      <p className="text-center text-[11px] text-muted-foreground">
        <Sparkles className="mr-1 inline h-3 w-3" />
        All data is mocked and persisted in your browser. The points update
        after every redemption.
      </p>
    </div>
  );
}
