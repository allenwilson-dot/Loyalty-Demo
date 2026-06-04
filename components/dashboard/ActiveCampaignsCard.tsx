"use client";

import * as React from "react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { EntrySourceBadge } from "@/components/loyalty/EntrySourceBadge";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import {
  campaignStatusLabel,
  campaignStatusTone,
  REWARD_TYPE_LABEL,
} from "@/lib/dashboard";
import type { ActiveCampaign, TransactionChannel } from "@/types/loyalty";

export interface ActiveCampaignsCardProps {
  campaigns: ActiveCampaign[];
}

function channelForType(type: ActiveCampaign["rewardType"]): TransactionChannel {
  switch (type) {
    case "wallet":
      return "moolee";
    case "data":
    case "addon":
      return "selfcare";
    case "voucher":
    default:
      return "campaign";
  }
}

export function ActiveCampaignsCard({ campaigns }: ActiveCampaignsCardProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-secondary/40 p-8 text-center text-sm text-muted-foreground">
        No active campaigns in the selected window.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-soft">
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Campaign</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Eligible tier</th>
            <th className="px-4 py-3 font-medium">Window</th>
            <th className="px-4 py-3 font-medium">Redemptions</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {campaigns.map((campaign) => {
            const tone = campaignStatusTone(campaign.status);
            return (
              <tr key={campaign.id} className="text-foreground/90">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{campaign.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {campaign.pointsRequired > 0
                      ? `${formatNumber(campaign.pointsRequired)} pts`
                      : "No points required"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <EntrySourceBadge
                      source={channelForType(campaign.rewardType)}
                      showIcon={false}
                    />
                    <span className="text-foreground">
                      {REWARD_TYPE_LABEL[campaign.rewardType]}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize"
                    )}
                  >
                    {campaign.eligibleTier}+
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <p>{formatDate(campaign.startDate)}</p>
                  <p>→ {formatDate(campaign.endDate)}</p>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums text-foreground">
                  {formatNumber(campaign.redemptions)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge label={campaignStatusLabel(campaign.status)} tone={tone} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
