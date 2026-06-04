"use client";

import * as React from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useRedemptionCampaigns } from "./RedemptionCampaignProvider";
import { readStorage, StorageKeys } from "@/lib/storage";
import { MOCK_VOUCHER_MANAGEMENT } from "@/data/mockVoucherManagement";
import type {
  RedemptionCampaign,
  RedemptionCampaignFormInput,
  RedemptionRewardType,
  RedemptionCampaignStatus,
  TierId,
  VoucherManagement,
} from "@/types/loyalty";

const TIERS: TierId[] = ["bronze", "silver", "gold", "platinum"];
const TIER_LABELS: Record<TierId, string> = {
  bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum", diamond: "Diamond",
};
const TIER_COLORS: Record<TierId, string> = {
  bronze: "bg-orange-100 text-orange-700 border-orange-200",
  silver: "bg-slate-100 text-slate-600 border-slate-200",
  gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
  platinum: "bg-blue-100 text-blue-700 border-blue-200",
  diamond: "bg-purple-100 text-purple-700 border-purple-200",
};

const REWARD_TYPES: { value: RedemptionRewardType; label: string; description: string }[] = [
  { value: "VOUCHER", label: "Voucher", description: "Partner coupon code assigned on redemption" },
  { value: "WALLET", label: "Wallet Credit", description: "Credit applied directly to M Faisaa wallet" },
  { value: "DATA", label: "Data Pack", description: "Mobile data add-on activated on MSISDN" },
  { value: "ADDON", label: "Add-On Service", description: "Service add-on activated on account" },
];

const EMPTY: RedemptionCampaignFormInput = {
  rewardName: "", rewardType: "WALLET", voucherId: "", pointsRequired: 1000,
  conversionRate: 100, startDate: "", endDate: "", eligibleTiers: ["bronze", "silver", "gold", "platinum"],
  status: "INACTIVE", description: "",
};

// Required field label helper
function Req() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

// Error message helper
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />{msg}
    </p>
  );
}

interface Props {
  open: boolean;
  editing?: RedemptionCampaign | null;
  onClose: () => void;
}

export function RedemptionCampaignFormDrawer({ open, editing, onClose }: Props) {
  const { addCampaign, updateCampaign } = useRedemptionCampaigns();
  const [form, setForm] = React.useState<RedemptionCampaignFormInput>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<string, string>>>({});

  // Load live vouchers for the dropdown — re-read from storage each render so it stays fresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vouchers: VoucherManagement[] = React.useMemo(
    () => readStorage(StorageKeys.adminVouchers, MOCK_VOUCHER_MANAGEMENT),
    [] // intentionally stable; storage is refreshed via useEffect below
  );
  const activeVouchers = vouchers.filter(v => v.status === "ACTIVE" && (v.voucherMode === "API" || v.remainingInventory > 0));

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        rewardName: editing.rewardName,
        rewardType: editing.rewardType,
        voucherId: editing.voucherId ?? "",
        pointsRequired: editing.pointsRequired,
        conversionRate: editing.conversionRate,
        startDate: editing.startDate.slice(0, 10),
        endDate: editing.endDate.slice(0, 10),
        intradaySlot: editing.intradaySlot,
        eligibleTiers: editing.eligibleTiers,
        status: editing.status === "EXPIRED" ? "INACTIVE" : editing.status,
        description: editing.description ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, editing]);

  function set<K extends keyof RedemptionCampaignFormInput>(k: K, v: RedemptionCampaignFormInput[K]) {
    setForm(f => ({ ...f, [k]: v }));
    // clear error on change
    setErrors(e => { const next = { ...e }; delete next[k as string]; return next; });
  }

  function toggleTier(tier: TierId) {
    setForm(f => ({
      ...f,
      eligibleTiers: f.eligibleTiers.includes(tier)
        ? f.eligibleTiers.filter(t => t !== tier)
        : [...f.eligibleTiers, tier],
    }));
    setErrors(e => { const next = { ...e }; delete next.eligibleTiers; return next; });
  }

  function validate(): boolean {
    const e: Partial<Record<string, string>> = {};
    if (!form.rewardName.trim()) e.rewardName = "Reward name is required";
    if (form.rewardType === "VOUCHER" && !form.voucherId?.trim()) e.voucherId = "Please select a voucher";
    if (!form.pointsRequired || form.pointsRequired <= 0) e.pointsRequired = "Points required must be greater than 0";
    if (!form.startDate) e.startDate = "Start date is required";
    if (!form.endDate) e.endDate = "End date is required";
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      e.endDate = "End date must be after start date";
    }
    if (form.eligibleTiers.length === 0) e.eligibleTiers = "Select at least one eligible tier";
    if (form.conversionRate <= 0) e.conversionRate = "Conversion rate must be greater than 0";
    if (form.intradaySlot?.startTime && form.intradaySlot?.endTime) {
      if (form.intradaySlot.startTime >= form.intradaySlot.endTime) {
        e.intradaySlot = "Slot start must be before end time";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    // Enrich with voucher metadata
    let voucherTitle: string | undefined;
    let merchantId: string | undefined;
    let merchantName: string | undefined;
    if (form.rewardType === "VOUCHER" && form.voucherId) {
      const v = vouchers.find(v => v.id === form.voucherId);
      if (v) { voucherTitle = v.voucherTitle; merchantId = v.merchantId; merchantName = v.merchantName; }
    }
    const payload: RedemptionCampaignFormInput & { voucherTitle?: string; merchantId?: string; merchantName?: string } = {
      ...form,
      voucherTitle,
      merchantId,
      merchantName,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate + "T23:59:59").toISOString(),
    };
    if (editing) updateCampaign(editing.id, payload);
    else addCampaign(payload);
    onClose();
  }

  const selectedVoucher = form.rewardType === "VOUCHER" && form.voucherId
    ? vouchers.find(v => v.id === form.voucherId)
    : null;

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-1">
          <SheetTitle>{editing ? "Edit Campaign" : "New Redemption Campaign"}</SheetTitle>
          <SheetDescription>
            Fields marked with <span className="text-red-500">*</span> are required.
          </SheetDescription>
        </SheetHeader>

        {hasErrors && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Please fix the highlighted fields before saving.
          </div>
        )}

        <div className="space-y-5">

          {/* Reward Name */}
          <div className="space-y-1.5">
            <Label>Reward Name <Req /></Label>
            <Input
              placeholder="e.g. Coffee Voucher – $25"
              value={form.rewardName}
              onChange={e => set("rewardName", e.target.value)}
              className={errors.rewardName ? "border-red-400 focus-visible:ring-red-300" : ""}
            />
            <FieldError msg={errors.rewardName} />
          </div>

          {/* Reward Type */}
          <div className="space-y-1.5">
            <Label>Reward Type <Req /></Label>
            <Select value={form.rewardType} onValueChange={v => set("rewardType", v as RedemptionRewardType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REWARD_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voucher selection — only for VOUCHER type */}
          {form.rewardType === "VOUCHER" && (
            <div className="space-y-1.5">
              <Label>Voucher <Req /></Label>
              {activeVouchers.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  No active vouchers with available inventory. Please create or restock a voucher first.
                </div>
              ) : (
                <Select value={form.voucherId ?? ""} onValueChange={v => set("voucherId", v)}>
                  <SelectTrigger className={errors.voucherId ? "border-red-400" : ""}>
                    <SelectValue placeholder="Select a voucher…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeVouchers.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        <div className="flex items-center justify-between gap-4 w-full">
                          <div>
                            <p className="font-medium text-sm">{v.voucherTitle}</p>
                            <p className="text-xs text-muted-foreground">{v.merchantName} · {v.voucherMode}</p>
                          </div>
                          {v.voucherMode === "INVENTORY" && (
                            <Badge className="text-[10px] border-0 bg-slate-100 text-slate-600 ml-2 shrink-0">
                              {v.remainingInventory} left
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FieldError msg={errors.voucherId} />
              {selectedVoucher && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  ✓ {selectedVoucher.voucherTitle} · {selectedVoucher.merchantName}
                  {selectedVoucher.voucherMode === "INVENTORY" && ` · ${selectedVoucher.remainingInventory} codes available`}
                </div>
              )}
            </div>
          )}

          {/* Points + Conversion */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Points Required <Req /></Label>
              <Input
                type="number" min={1}
                value={form.pointsRequired}
                onChange={e => set("pointsRequired", Number(e.target.value))}
                className={errors.pointsRequired ? "border-red-400" : ""}
              />
              <FieldError msg={errors.pointsRequired} />
            </div>
            <div className="space-y-1.5">
              <Label>Conversion Rate <span className="text-muted-foreground text-xs font-normal">(pts/unit)</span></Label>
              <Input
                type="number" min={1}
                value={form.conversionRate}
                onChange={e => set("conversionRate", Number(e.target.value))}
                className={errors.conversionRate ? "border-red-400" : ""}
              />
              <FieldError msg={errors.conversionRate} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date <Req /></Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => set("startDate", e.target.value)}
                className={errors.startDate ? "border-red-400" : ""}
              />
              <FieldError msg={errors.startDate} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date <Req /></Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={e => set("endDate", e.target.value)}
                className={errors.endDate ? "border-red-400" : ""}
              />
              <FieldError msg={errors.endDate} />
            </div>
          </div>

          {/* Intraday slot */}
          <div className="space-y-1.5">
            <Label>
              Intraday Slot
              <span className="text-muted-foreground text-xs font-normal ml-1">(optional — restrict to time window)</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  type="time"
                  value={form.intradaySlot?.startTime ?? ""}
                  onChange={e => set("intradaySlot", e.target.value
                    ? { startTime: e.target.value, endTime: form.intradaySlot?.endTime ?? "" }
                    : undefined)}
                  placeholder="Start time"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Start</p>
              </div>
              <div>
                <Input
                  type="time"
                  value={form.intradaySlot?.endTime ?? ""}
                  onChange={e => set("intradaySlot", e.target.value
                    ? { startTime: form.intradaySlot?.startTime ?? "", endTime: e.target.value }
                    : undefined)}
                  placeholder="End time"
                />
                <p className="text-[11px] text-muted-foreground mt-1">End</p>
              </div>
            </div>
            <FieldError msg={errors.intradaySlot} />
          </div>

          {/* Eligible tiers */}
          <div className="space-y-2">
            <Label>Eligible Tiers <Req /></Label>
            <div className="flex gap-2 flex-wrap">
              {TIERS.map(tier => {
                const selected = form.eligibleTiers.includes(tier);
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => toggleTier(tier)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selected
                        ? `${TIER_COLORS[tier]} shadow-sm`
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {TIER_LABELS[tier]}
                    {selected && " ✓"}
                  </button>
                );
              })}
            </div>
            <FieldError msg={errors.eligibleTiers} />
            {form.eligibleTiers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {form.eligibleTiers.length === 4 ? "Available to all tiers" : `${form.eligibleTiers.length} tier(s) selected`}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <Textarea
              rows={2}
              placeholder="Shown to members in the rewards marketplace…"
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status <Req /></Label>
            <Select value={form.status} onValueChange={v => set("status", v as RedemptionCampaignStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <div>
                    <p className="font-medium text-emerald-700">Active</p>
                    <p className="text-xs text-muted-foreground">Visible and redeemable by eligible members</p>
                  </div>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <div>
                    <p className="font-medium">Inactive</p>
                    <p className="text-xs text-muted-foreground">Hidden from members, cannot be redeemed</p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-4 border-t border-border/60">
          <Button onClick={handleSave} className="flex-1">
            {editing ? "Save changes" : "Create campaign"}
          </Button>
          <Button variant="outline" onClick={onClose} className="gap-1.5">
            <X className="h-4 w-4" />Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
