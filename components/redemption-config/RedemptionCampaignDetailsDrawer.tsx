"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRoleAccess } from "@/lib/roleAccess";
import type { RedemptionCampaign, TierId } from "@/types/loyalty";

const TYPE_LABEL: Record<RedemptionCampaign["rewardType"], string> = {
  VOUCHER: "Voucher", WALLET: "Wallet Credit", DATA: "Data Pack", ADDON: "Add-On",
};
const STATUS_BADGE: Record<RedemptionCampaign["status"], string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-500",
  EXPIRED: "bg-red-100 text-red-600",
};
const TIER_COLOR: Record<TierId, string> = {
  bronze: "bg-orange-100 text-orange-700",
  silver: "bg-slate-100 text-slate-600",
  gold: "bg-yellow-100 text-yellow-700",
  platinum: "bg-blue-100 text-blue-700",
  diamond: "bg-purple-100 text-purple-700",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right font-medium">{value}</span>
    </div>
  );
}

interface Props {
  open: boolean;
  campaign: RedemptionCampaign | null;
  onClose: () => void;
  onEdit: () => void;
}

export function RedemptionCampaignDetailsDrawer({ open, campaign, onClose, onEdit }: Props) {
  const { can } = useRoleAccess();
  if (!campaign) return null;
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{campaign.rewardName}</SheetTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge className="border-0 text-xs bg-violet-100 text-violet-700">{TYPE_LABEL[campaign.rewardType]}</Badge>
            <Badge className={`border-0 text-xs ${STATUS_BADGE[campaign.status]}`}>{campaign.status}</Badge>
          </div>
        </SheetHeader>

        {campaign.description && (
          <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
        )}

        <div className="divide-y">
          <Row label="Campaign ID" value={<span className="font-mono text-xs">{campaign.id}</span>} />
          <Row label="Points Required" value={<span className="font-semibold">{campaign.pointsRequired.toLocaleString()} pts</span>} />
          <Row label="Conversion Rate" value={`1 unit = ${campaign.conversionRate} pts`} />
          {campaign.voucherTitle && <Row label="Voucher" value={campaign.voucherTitle} />}
          {campaign.merchantName && <Row label="Merchant" value={campaign.merchantName} />}
          <Row label="Start Date" value={new Date(campaign.startDate).toLocaleDateString()} />
          <Row label="End Date" value={new Date(campaign.endDate).toLocaleDateString()} />
          {campaign.intradaySlot && (
            <Row label="Intraday Slot" value={`${campaign.intradaySlot.startTime} – ${campaign.intradaySlot.endTime}`} />
          )}
          <Row label="Created" value={new Date(campaign.createdAt).toLocaleString()} />
          <Row label="Updated" value={new Date(campaign.updatedAt).toLocaleString()} />
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Eligible Tiers</p>
          <div className="flex gap-2 flex-wrap">
            {campaign.eligibleTiers.map(t => (
              <Badge key={t} className={`border-0 capitalize ${TIER_COLOR[t]}`}>{t}</Badge>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 p-4 bg-slate-50/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Customer-facing preview</p>
          <div className="rounded-lg bg-white shadow-sm p-4 border">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{campaign.rewardName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{campaign.description}</p>
              </div>
              <Badge className="border-0 text-xs bg-violet-100 text-violet-700">{TYPE_LABEL[campaign.rewardType]}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-lg font-bold text-blue-700">{campaign.pointsRequired.toLocaleString()} pts</span>
              <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full">Redeem</button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onEdit}
            disabled={campaign.status === "EXPIRED" || !can("write")}
            title={!can("write") ? "Your role cannot edit campaigns" : campaign.status === "EXPIRED" ? "Expired campaigns cannot be edited" : undefined}
            className="flex-1"
          >
            Edit Campaign
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
