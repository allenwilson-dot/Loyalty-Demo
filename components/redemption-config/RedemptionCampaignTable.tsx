"use client";

import * as React from "react";
import { MoreHorizontal, Edit2, Eye, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RedemptionCampaign, TierId } from "@/types/loyalty";

const TYPE_BADGE: Record<RedemptionCampaign["rewardType"], string> = {
  VOUCHER: "bg-violet-100 text-violet-700",
  WALLET: "bg-blue-100 text-blue-700",
  DATA: "bg-cyan-100 text-cyan-700",
  ADDON: "bg-amber-100 text-amber-700",
};
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

interface Props {
  campaigns: RedemptionCampaign[];
  canWrite?: boolean;
  onEdit: (c: RedemptionCampaign) => void;
  onView: (c: RedemptionCampaign) => void;
  onToggle: (c: RedemptionCampaign) => void;
}

export function RedemptionCampaignTable({ campaigns, canWrite = true, onEdit, onView, onToggle }: Props) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50/60">
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Campaign</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Points</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Period</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Tiers</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 && (
            <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No campaigns found</td></tr>
          )}
          {campaigns.map(c => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3">
                <button onClick={() => onView(c)} className="font-medium text-blue-700 hover:underline text-left">{c.rewardName}</button>
                {c.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description}</p>}
              </td>
              <td className="px-4 py-3">
                <Badge className={`border-0 text-xs ${TYPE_BADGE[c.rewardType]}`}>{TYPE_LABEL[c.rewardType]}</Badge>
              </td>
              <td className="px-4 py-3 font-mono text-sm font-semibold">{c.pointsRequired.toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}
                {c.intradaySlot && <div className="text-xs">{c.intradaySlot.startTime}–{c.intradaySlot.endTime}</div>}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1 flex-wrap">
                  {c.eligibleTiers.map(t => (
                    <Badge key={t} className={`border-0 text-xs capitalize ${TIER_COLOR[t]}`}>{t}</Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge className={`border-0 text-xs ${STATUS_BADGE[c.status]}`}>{c.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(c)}><Eye className="h-4 w-4 mr-2" />View details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(c)} disabled={!canWrite || c.status === "EXPIRED"}><Edit2 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggle(c)} disabled={!canWrite || c.status === "EXPIRED"}
                      className={canWrite ? (c.status === "ACTIVE" ? "text-red-600" : "text-emerald-600") : ""}>
                      <Power className="h-4 w-4 mr-2" />{c.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
