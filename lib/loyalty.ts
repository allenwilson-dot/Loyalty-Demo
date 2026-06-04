import type {
  LoyaltyTransaction,
  OwnedVoucher,
  RedemptionFailureReason,
  Reward,
  RewardStatus,
  Tier,
  User,
} from "@/types/loyalty";
import { TIER_BY_ID } from "@/data/mockTiers";
import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";

const POINTS_EXPIRING_DAYS = 90;

/**
 * Re-derives a derived status for a reward in the context of a user.
 * Rewards past their expiry are always marked as out of stock; otherwise
 * the catalogue flag (locked / out_of_stock / available) wins.
 */
export function deriveRewardStatus(reward: Reward, user: User): RewardStatus {
  if (isRewardExpired(reward)) return "out_of_stock";
  if (reward.stock <= 0) return "out_of_stock";
  if (isTierLocked(reward, user)) return "locked";
  return "available";
}

export function isTierLocked(reward: Reward, user: User): boolean {
  const userTier = TIER_BY_ID[user.tierId];
  const required = TIER_BY_ID[reward.minTier];
  return userTier.rank < required.rank;
}

export function isRewardExpired(reward: Reward): boolean {
  return new Date(reward.expiresAt).getTime() < Date.now();
}

/**
 * Returns a stable, human-friendly message for a redemption failure.
 */
export function describeFailure(reason: RedemptionFailureReason): string {
  switch (reason) {
    case "tier_locked":
      return "Your current tier doesn't include this reward yet. Keep earning to unlock it.";
    case "out_of_stock":
      return "This reward is currently out of stock. We'll restock soon.";
    case "expired":
      return "This reward has expired and can no longer be redeemed.";
    case "insufficient_points":
      return "You don't have enough points to redeem this reward.";
    case "simulated_failure":
      return "We couldn't complete the redemption. Your points have been rolled back.";
    default:
      return "Redemption failed. Please try again.";
  }
}

/**
 * Generates a memorable 4-4-4 alphanumeric coupon code.
 * Pure function — safe to call from server and client components.
 */
export function generateCouponCode(): string {
  const segment = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X");
  return `${segment()}-${segment()}-${segment()}`;
}

export function generateTransactionId(): string {
  return `txn_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export function generateOwnedVoucherId(): string {
  return `own_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

/**
 * Builds a fresh OwnedVoucher for a redeemed voucher-type reward.
 */
export function buildOwnedVoucher(
  reward: Reward,
  code: string,
  user: User
): OwnedVoucher {
  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + reward.validityDays * 86_400_000
  );
  return {
    id: generateOwnedVoucherId(),
    rewardId: reward.id,
    rewardTitle: reward.title,
    code,
    merchantId: reward.merchantId,
    merchantName: reward.merchantName,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "active",
  };
}

/**
 * Returns the number of points a member has earned from completed earn /
 * bonus transactions. Reversed or pending entries are excluded.
 */
export function computeLifetimeEarned(transactions: LoyaltyTransaction[]): number {
  return transactions
    .filter(
      (t) =>
        t.status === "completed" && (t.type === "earn" || t.type === "bonus")
    )
    .reduce((sum, t) => sum + Math.max(0, t.points), 0);
}

/**
 * Returns the number of points a member has spent on completed redemptions.
 */
export function computeLifetimeRedeemed(
  transactions: LoyaltyTransaction[]
): number {
  return transactions
    .filter((t) => t.status === "completed" && t.type === "redeem")
    .reduce((sum, t) => sum + Math.abs(t.points), 0);
}

/**
 * Returns points that will expire within the configured window.
 * For the prototype we approximate this from a fixed slice of the user's
 * points balance so the dashboard always has a number to display.
 */
export function computeExpiringPoints(user: User): number {
  if (user.pointsBalance <= 0) return 0;
  // Roughly 4% of balance expires within the window in the demo model.
  return Math.round(user.pointsBalance * 0.04);
}

/**
 * Locates the tier the user is currently on, the next tier (if any), and
 * the progress percentage through to the next threshold.
 */
export interface TierProgress {
  current: Tier;
  next: Tier | null;
  pointsToNext: number;
  progress: number;
}

export function computeTierProgress(
  user: User,
  tiers: Tier[]
): TierProgress {
  const sorted = [...tiers].sort((a, b) => a.rank - b.rank);
  const current = sorted.find((t) => t.id === user.tierId) ?? sorted[0];
  const next = sorted.find((t) => t.rank === current.rank + 1) ?? null;
  if (!next) {
    return {
      current,
      next: null,
      pointsToNext: 0,
      progress: 100,
    };
  }
  const span = next.threshold - current.threshold;
  const earned = Math.max(0, user.lifetimePoints - current.threshold);
  return {
    current,
    next,
    pointsToNext: Math.max(0, next.threshold - user.lifetimePoints),
    progress: Math.min(100, Math.round((earned / span) * 100)),
  };
}

/**
 * Splits the recent transaction stream by entry source so the dashboard
 * can render the Selfcare / Moolee / M-Faisaa mix.
 */
export function summarizeEntrySources(
  transactions: LoyaltyTransaction[],
  limit: number = 6
) {
  const sources = ["selfcare", "moolee", "mfaisaa"] as const;
  return sources.map((source) => {
    const matches = transactions.filter((t) => t.channel === source);
    const total = matches
      .filter((t) => t.status === "completed" && t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);
    return {
      source,
      count: matches.length,
      points: total,
      recent: matches.slice(0, limit),
    };
  });
}

/**
 * Currency-free pretty number for points and balances.
 */
export function formatPoints(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Friendly label for a reward type, used in many surfaces.
 */
export const REWARD_TYPE_LABEL: Record<Reward["type"], string> = {
  voucher: "Voucher",
  wallet: "Wallet",
  data: "Data Pack",
  addon: "Add-on",
};

/**
 * Re-export the demo transactions so older imports keep working.
 */
export { MOCK_TRANSACTIONS };
