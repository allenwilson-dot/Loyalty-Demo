/**
 * Bridges the back-office RedemptionCampaign model to the customer-facing
 * Reward model. Active campaigns are converted to Rewards and merged with
 * the static MOCK_REWARDS catalogue so the customer pages always reflect
 * what the admin has configured.
 */

import { readStorage, StorageKeys } from "@/lib/storage";
import { MOCK_REDEMPTION_CAMPAIGNS } from "@/data/mockRedemptionCampaigns";
import type { RedemptionCampaign, Reward, RewardType, TierId } from "@/types/loyalty";

const TYPE_MAP: Record<RedemptionCampaign["rewardType"], RewardType> = {
  VOUCHER: "voucher",
  WALLET: "wallet",
  DATA: "data",
  ADDON: "addon",
};

const TIER_ORDER: TierId[] = ["bronze", "silver", "gold", "platinum", "diamond"];

/** Convert a single RedemptionCampaign into a customer-facing Reward. */
export function campaignToReward(c: RedemptionCampaign): Reward {
  // The minimum eligible tier is the lowest-ranked one in the list
  const sorted = [...c.eligibleTiers].sort(
    (a, b) => TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b)
  );
  const minTier: TierId = sorted[0] ?? "bronze";

  const terms: string[] = [
    `Valid from ${new Date(c.startDate).toLocaleDateString()} to ${new Date(c.endDate).toLocaleDateString()}.`,
    `Eligible tiers: ${c.eligibleTiers.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}.`,
    `Conversion rate: 1 unit = ${c.conversionRate} points.`,
  ];
  if (c.intradaySlot) {
    terms.push(`Available between ${c.intradaySlot.startTime} and ${c.intradaySlot.endTime} only.`);
  }

  return {
    id: `campaign_${c.id}`,
    title: c.rewardName,
    type: TYPE_MAP[c.rewardType],
    pointsCost: c.pointsRequired,
    minTier,
    description: c.description ?? `Redeem ${c.pointsRequired.toLocaleString()} points for ${c.rewardName}.`,
    terms,
    stock: 9999, // campaigns don't have inventory limits unless voucher-backed
    expiresAt: c.endDate,
    featured: false,
    merchantId: c.merchantId,
    merchantName: c.merchantName,
    validityDays: 30,
  };
}

/** Read active campaigns from localStorage and return them as Rewards. */
export function getCampaignRewards(): Reward[] {
  const campaigns: RedemptionCampaign[] = readStorage(
    StorageKeys.adminRedemptionCampaigns,
    MOCK_REDEMPTION_CAMPAIGNS
  );

  const now = new Date();

  return campaigns
    .filter(c => {
      if (c.status !== "ACTIVE") return false;
      if (new Date(c.endDate) < now) return false;
      return true;
    })
    .map(campaignToReward);
}
