import * as React from "react";
import { Check, Crown, Lock } from "lucide-react";

import { MOCK_TIERS } from "@/data/mockTiers";
import { computeTierProgress, formatPoints } from "@/lib/loyalty";
import { cn } from "@/lib/utils";

import { useLoyaltySession } from "./LoyaltyProvider";

/**
 * Card showing the user's current tier, the next tier target, the progress
 * bar between them, and a horizontal list of all tiers with locked state.
 */
export function TierProgressCard({ className }: { className?: string }) {
  const { user } = useLoyaltySession();
  const { current, next, pointsToNext, progress } = computeTierProgress(
    user,
    MOCK_TIERS
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-6 shadow-card md:p-8",
        className
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tier status
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Crown className="h-5 w-5" style={{ color: current.color }} />
            {current.name}
            <span className="ml-2 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {current.multiplier}× points
            </span>
          </h2>
        </div>
        {next ? (
          <p className="text-sm text-muted-foreground">
            {formatPoints(pointsToNext)} lifetime points to{" "}
            <span className="font-semibold text-foreground">{next.name}</span>
          </p>
        ) : (
          <p className="text-sm font-medium text-emerald-600">
            You&rsquo;ve reached the top tier.
          </p>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            {formatPoints(current.threshold)} pts
          </span>
          <span>{progress}%</span>
          <span>{next ? `${formatPoints(next.threshold)} pts` : "Max"}</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-navy-900 to-cyan-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {MOCK_TIERS.map((tier) => {
          const reached = user.lifetimePoints >= tier.threshold;
          const isCurrent = tier.id === current.id;
          return (
            <li
              key={tier.id}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                isCurrent
                  ? "border-navy-900 bg-navy-900/5"
                  : reached
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-border/60 bg-secondary/30"
              )}
            >
              <span className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide">
                <span style={{ color: reached ? tier.color : undefined }}>
                  {tier.name}
                </span>
                {isCurrent ? (
                  <span className="rounded-full bg-navy-900 px-1.5 text-[9px] font-medium text-white">
                    YOU
                  </span>
                ) : reached ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {tier.multiplier}× · {formatPoints(tier.threshold)} pts
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
