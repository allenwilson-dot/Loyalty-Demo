import * as React from "react";
import { Award, Sparkles, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn, formatNumber } from "@/lib/utils";

import { useLoyaltyDerived } from "./LoyaltyProvider";

/**
 * Hero points-balance card. Lives at the top of the loyalty dashboard and
 * shows the live balance, current tier, multiplier, and a lifetime tally.
 */
export function PointsBalanceCard({ className }: { className?: string }) {
  const { user, lifetimeEarned, lifetimeRedeemed } = useLoyaltyDerived();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-cyan-700 p-6 text-white shadow-elevated md:p-8",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="accent"
              className="bg-white/10 text-cyan-200 hover:bg-white/10"
            >
              <Sparkles className="h-3 w-3" /> Loyalty balance
            </Badge>
            <Badge
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <Award className="h-3 w-3" /> {user.tierId.toUpperCase()} TIER
            </Badge>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
              Available points
            </p>
            <p className="mt-2 text-5xl font-semibold tracking-tight md:text-6xl">
              {formatNumber(user.pointsBalance)}
            </p>
            <p className="mt-1 text-sm text-cyan-100/70">
              Lifetime earned {formatNumber(lifetimeEarned)} · redeemed{" "}
              {formatNumber(lifetimeRedeemed)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:max-w-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/70">
              Multiplier
            </p>
            <p className="mt-1 text-2xl font-semibold text-white">1.75×</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/70">
              Rank
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-2xl font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-cyan-200" /> Top 4%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
