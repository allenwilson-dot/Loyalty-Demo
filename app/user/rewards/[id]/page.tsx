"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Clock,
  Crown,
  Lock,
  Package,
  PlusCircle,
  ShieldCheck,
  Signal,
  Sparkles,
  Tag,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RewardCard } from "@/components/loyalty/RewardCard";
import { RedeemModal } from "@/components/loyalty/RedeemModal";
import { RewardStatusBadge } from "@/components/loyalty/RewardStatusBadge";
import { useLoyaltySession } from "@/components/loyalty/LoyaltyProvider";
import { MOCK_REWARDS } from "@/data/mockRewards";
import { getCampaignRewards } from "@/lib/campaignRewards";
import {
  deriveRewardStatus,
  formatPoints,
  isRewardExpired,
  isTierLocked,
  REWARD_TYPE_LABEL,
} from "@/lib/loyalty";
import { TIER_BY_ID } from "@/data/mockTiers";
import { cn, formatDate } from "@/lib/utils";
import type { RewardType } from "@/types/loyalty";

const TYPE_ICON: Record<RewardType, LucideIcon> = {
  voucher: Tag,
  wallet: WalletIcon,
  data: Signal,
  addon: PlusCircle,
};

const TYPE_GRADIENT: Record<RewardType, string> = {
  voucher: "from-navy-900 via-navy-800 to-cyan-700",
  wallet: "from-cyan-600 via-cyan-500 to-cyan-400",
  data: "from-violet-700 via-violet-600 to-violet-400",
  addon: "from-amber-600 via-amber-500 to-amber-400",
};

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useLoyaltySession();

  const reward = React.useMemo(() => {
    const allRewards = [...MOCK_REWARDS, ...getCampaignRewards()];
    return allRewards.find((r) => r.id === params.id);
  }, [params.id]);

  // Must be declared before the early return to satisfy Rules of Hooks
  const related = React.useMemo(() => {
    if (!reward) return [];
    const all = [...MOCK_REWARDS, ...getCampaignRewards()];
    return all.filter(r => r.id !== reward.id && r.type === reward.type).slice(0, 3);
  }, [reward]);

  const [redeemOpen, setRedeemOpen] = React.useState(false);

  if (!reward) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center shadow-soft">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <Package className="h-5 w-5" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          Reward not found
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The reward you are looking for has been removed or doesn&rsquo;t exist.
        </p>
        <Button asChild className="mt-4">
          <Link href="/user/rewards">
            <ArrowLeft className="h-4 w-4" /> Back to rewards
          </Link>
        </Button>
      </div>
    );
  }

  const status = deriveRewardStatus(reward, user);
  const locked = isTierLocked(reward, user);
  const expired = isRewardExpired(reward);
  const canAfford = user.pointsBalance >= reward.pointsCost;
  const requiredTier = TIER_BY_ID[reward.minTier];
  const userTier = TIER_BY_ID[user.tierId];
  const TypeIcon = TYPE_ICON[reward.type];

  const blockedReason = (() => {
    if (expired) return "This reward has expired.";
    if (reward.stock <= 0) return "This reward is currently out of stock.";
    if (locked)
      return `Available from ${requiredTier.name} tier and above. You&rsquo;&rsquo;re on ${userTier.name}.`;
    if (!canAfford)
      return `You need ${formatPoints(reward.pointsCost - user.pointsBalance)} more points to redeem.`;
    return null;
  })();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/user/rewards"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to rewards
      </Link>

      {/* Hero */}
      <header
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-elevated md:p-10",
          TYPE_GRADIENT[reward.type]
        )}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <TypeIcon className="h-3 w-3" /> {REWARD_TYPE_LABEL[reward.type]}
              </Badge>
              <RewardStatusBadge status={status} className="bg-white text-foreground" />
              {reward.featured ? (
                <Badge variant="accent" className="bg-white/15 text-white">
                  <Sparkles className="h-3 w-3" /> Featured
                </Badge>
              ) : null}
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
              {reward.title}
            </h1>
            {reward.merchantName ? (
              <p className="text-sm text-white/80">
                Redeemable at <span className="font-semibold">{reward.merchantName}</span>
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
              Costs
            </p>
            <p className="mt-1 text-4xl font-semibold tracking-tight">
              {formatPoints(reward.pointsCost)}
            </p>
            <p className="text-xs text-white/70">points</p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="text-base font-semibold tracking-tight">About this reward</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {reward.description}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Tier</dt>
                <dd className="mt-0.5 flex items-center gap-1 text-sm font-medium capitalize">
                  <Crown
                    className="h-3.5 w-3.5"
                    style={{ color: requiredTier.color }}
                  />
                  {reward.minTier}+
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Validity</dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {reward.validityDays} days
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Expires</dt>
                <dd className="mt-0.5 flex items-center gap-1 text-sm font-medium">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(reward.expiresAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Stock</dt>
                <dd className="mt-0.5 text-sm font-medium">
                  {reward.stock.toLocaleString()} available
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <h2 className="text-base font-semibold tracking-tight">Terms &amp; conditions</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {reward.terms.map((term) => (
                <li key={term} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </section>

          {reward.merchantName ? (
            <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
              <h2 className="text-base font-semibold tracking-tight">Merchant</h2>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {reward.merchantName}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Partner of the loyalty program. Vouchers are honoured at any
                    participating location.
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-navy-900">
                  <ShieldCheck className="h-4 w-4" />
                </span>
              </div>
            </section>
          ) : null}
        </div>

        {/* Sticky redemption card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-elevated">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Your balance
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {formatPoints(user.pointsBalance)}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                pts
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              After this redemption:{" "}
              <span className="font-semibold text-foreground">
                {formatPoints(Math.max(0, user.pointsBalance - reward.pointsCost))} pts
              </span>
            </p>

            <div className="my-5 h-px bg-border" />

            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Reward cost</span>
                <span className="font-semibold">
                  {formatPoints(reward.pointsCost)} pts
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Tier required</span>
                <span className="font-semibold capitalize">
                  {reward.minTier}+
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Validity</span>
                <span className="font-semibold">{reward.validityDays} days</span>
              </li>
            </ul>

            {blockedReason ? (
              <div
                className={cn(
                  "mt-5 flex items-start gap-2 rounded-lg p-3 text-xs",
                  expired || reward.stock <= 0
                    ? "bg-rose-50 text-rose-700"
                    : locked
                    ? "bg-amber-50 text-amber-800"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {expired || reward.stock <= 0 ? (
                  <X className="mt-0.5 h-3.5 w-3.5" />
                ) : locked ? (
                  <Lock className="mt-0.5 h-3.5 w-3.5" />
                ) : (
                  <Clock className="mt-0.5 h-3.5 w-3.5" />
                )}
                <span>{blockedReason}</span>
              </div>
            ) : null}

            <Button
              size="lg"
              className="mt-5 w-full"
              disabled={Boolean(blockedReason)}
              onClick={() => setRedeemOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              {blockedReason ? "Redemption unavailable" : "Redeem now"}
            </Button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              By redeeming, you accept the reward&rsquo;s terms and conditions.
            </p>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 ? (
        <section className="space-y-3">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              More like this
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Other {REWARD_TYPE_LABEL[reward.type].toLowerCase()} rewards
            </h2>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RewardCard key={r.id} reward={r} />
            ))}
          </div>
        </section>
      ) : null}

      <RedeemModal
        reward={reward}
        open={redeemOpen}
        onOpenChange={setRedeemOpen}
      />
    </div>
  );
}
