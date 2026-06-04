"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lock,
  PlusCircle,
  Signal,
  Tag,
  Wallet as WalletIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { Reward, RewardType } from "@/types/loyalty";

import { useLoyaltySession } from "./LoyaltyProvider";
import { RewardStatusBadge } from "./RewardStatusBadge";
import { deriveRewardStatus, formatPoints, REWARD_TYPE_LABEL } from "@/lib/loyalty";

const TYPE_META: Record<RewardType, { icon: LucideIcon; gradient: string; ring: string }> = {
  voucher: {
    icon: Tag,
    gradient: "from-navy-900 to-cyan-700",
    ring: "ring-navy-900/10",
  },
  wallet: {
    icon: WalletIcon,
    gradient: "from-cyan-600 to-cyan-400",
    ring: "ring-cyan-500/15",
  },
  data: {
    icon: Signal,
    gradient: "from-violet-600 to-violet-400",
    ring: "ring-violet-500/15",
  },
  addon: {
    icon: PlusCircle,
    gradient: "from-amber-600 to-amber-400",
    ring: "ring-amber-500/15",
  },
};

export interface RewardCardProps {
  reward: Reward;
  className?: string;
  /** Render a compact variant (used inside horizontal scrollers). */
  compact?: boolean;
}

/**
 * Marketplace card for a single reward. Renders the type-specific icon,
 * the points cost, the tier requirement, and a CTA that respects the
 * user's current eligibility.
 */
export function RewardCard({ reward, className, compact }: RewardCardProps) {
  const { user } = useLoyaltySession();
  const status = deriveRewardStatus(reward, user);
  const meta = TYPE_META[reward.type];
  const Icon = meta.icon;
  const isLocked = status === "locked";
  const isOutOfStock = status === "out_of_stock";
  const ctaLabel = isOutOfStock
    ? "Out of stock"
    : isLocked
    ? "Locked"
    : "View details";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated",
        compact ? "min-w-[260px] max-w-[300px]" : "w-full",
        className
      )}
    >
      <div
        className={cn(
          "relative flex h-28 items-center justify-between gap-3 bg-gradient-to-br p-4 text-white",
          meta.gradient
        )}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {REWARD_TYPE_LABEL[reward.type]}
          </p>
          <p className="mt-1 text-base font-semibold leading-snug line-clamp-2">
            {reward.title}
          </p>
        </div>
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur",
            meta.ring
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Cost</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {formatPoints(reward.pointsCost)}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                pts
              </span>
            </p>
          </div>
          <RewardStatusBadge status={status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Tier</dt>
            <dd className="mt-0.5 font-medium capitalize text-foreground">
              {reward.minTier}+
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Expires</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatDate(reward.expiresAt)}
            </dd>
          </div>
          {reward.merchantName ? (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Merchant</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {reward.merchantName}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isLocked ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>Unlock at {reward.minTier}</span>
              </>
            ) : (
              <>
                <span>Stock</span>
                <span className="font-medium text-foreground">
                  {reward.stock.toLocaleString()}
                </span>
              </>
            )}
          </div>
          <Button
            asChild={!isOutOfStock && !isLocked}
            size="sm"
            variant={
              isOutOfStock || isLocked
                ? "outline"
                : reward.featured
                ? "default"
                : "accent"
            }
            disabled={isOutOfStock || isLocked}
            className={cn(
              isOutOfStock || isLocked
                ? "pointer-events-none opacity-100"
                : "shadow-soft"
            )}
          >
            {isOutOfStock || isLocked ? (
              <span>{ctaLabel}</span>
            ) : (
              <Link href={`/user/rewards/${reward.id}`}>{ctaLabel}</Link>
            )}
          </Button>
        </div>
      </div>

      {reward.featured ? (
        <Badge
          variant="accent"
          className="absolute right-3 top-3 bg-white/90 text-navy-900 shadow-soft"
        >
          Featured
        </Badge>
      ) : null}
    </article>
  );
}
