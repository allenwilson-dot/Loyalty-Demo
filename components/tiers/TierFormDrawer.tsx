"use client";

import * as React from "react";
import {
  Award,
  BadgeCheck,
  Check,
  Crown,
  Gem,
  Layers,
  Plus,
  Save,
  Shield,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn, formatCompact } from "@/lib/utils";
import {
  TIER_BENEFITS,
  type Tier,
  type TierBenefitId,
  type TierIconName,
  type TierStatus,
} from "@/types/loyalty";

import { useTiers, type TierFormInput } from "./TiersProvider";

const ICONS: Record<TierIconName, LucideIcon> = {
  Shield,
  Sparkles,
  Award,
  Crown,
  Gem,
  Star,
  Trophy,
  BadgeCheck,
};

const ICON_OPTIONS: TierIconName[] = [
  "Shield",
  "Sparkles",
  "Award",
  "Crown",
  "Gem",
  "Star",
  "Trophy",
  "BadgeCheck",
];

const COLOR_OPTIONS = [
  "#0F172A",
  "#0891B2",
  "#B45309",
  "#64748B",
  "#CA8A04",
  "#7C3AED",
  "#DB2777",
  "#16A34A",
  "#EA580C",
];

const DEFAULT_FORM: TierFormInput = {
  name: "",
  thresholdType: "POINTS",
  thresholdValue: 0,
  upgradeRule: "lifetime_points",
  benefits: ["data_addon_eligibility", "wallet_credit_eligibility"],
  earningMultiplier: 1.0,
  redemptionBenefit: "",
  badgeLabel: "",
  badgeColor: "#0F172A",
  iconName: "Shield",
  status: "ACTIVE",
  notes: "",
};

export interface TierFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTier: Tier | null;
  onComplete?: (message: string) => void;
}

function formFromTier(tier: Tier): TierFormInput {
  return {
    name: tier.name,
    thresholdType: tier.thresholdType ?? "POINTS",
    thresholdValue: tier.threshold,
    upgradeRule: tier.upgradeRule ?? "lifetime_points",
    benefits: tier.benefits ?? [],
    earningMultiplier: tier.multiplier,
    redemptionBenefit: tier.redemptionBenefit ?? "",
    badgeLabel: tier.badgeLabel ?? tier.name.slice(0, 2).toUpperCase(),
    badgeColor: tier.color,
    iconName: tier.iconName ?? "Shield",
    status: (tier.status ?? "ACTIVE") as TierStatus,
    notes: tier.notes ?? "",
  };
}

export function TierFormDrawer({
  open,
  onOpenChange,
  editingTier,
  onComplete,
}: TierFormDrawerProps) {
  const { createTier, updateTier, canEdit } = useTiers();
  const [form, setForm] = React.useState<TierFormInput>(DEFAULT_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (editingTier) {
      setForm(formFromTier(editingTier));
    } else {
      setForm(DEFAULT_FORM);
    }
    setError(null);
    setSubmitting(false);
  }, [open, editingTier]);

  const update = <K extends keyof TierFormInput>(
    key: K,
    value: TierFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleBenefit = (id: TierBenefitId) => {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(id)
        ? prev.benefits.filter((b) => b !== id)
        : [...prev.benefits, id],
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = editingTier
      ? updateTier(editingTier.id, form)
      : createTier(form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not save tier.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      editingTier
        ? `Updated ${result.tier?.name ?? form.name}.`
        : `Created ${result.tier?.name ?? form.name}.`
    );
  };

  const Icon = ICONS[form.iconName];
  const isInactive = form.status === "INACTIVE";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              {editingTier ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </span>
            <div>
              <SheetTitle>
                {editingTier ? `Edit ${editingTier.name}` : "Create tier"}
              </SheetTitle>
              <SheetDescription>
                Configure threshold, upgrade rule, benefits, and visual badge.
                Live preview updates on the right.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_minmax(0,260px)]">
            <div className="space-y-5 border-b border-border/60 px-6 py-5 md:border-b-0 md:border-r">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tier-name">
                    Tier name <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="tier-name"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Platinum Plus"
                    required
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tier-id">Tier ID</Label>
                  <Input
                    id="tier-id"
                    value={
                      editingTier
                        ? editingTier.id
                        : form.name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "_")
                            .replace(/^_|_$/g, "")
                    }
                    readOnly
                    className="bg-secondary/40 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Threshold type</Label>
                  <Select
                    value={form.thresholdType}
                    onValueChange={(v) =>
                      update("thresholdType", v as TierFormInput["thresholdType"])
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POINTS">Points</SelectItem>
                      <SelectItem value="AMOUNT">Amount (currency)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tier-threshold">
                    Threshold value <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="tier-threshold"
                    type="number"
                    min={0}
                    value={form.thresholdValue}
                    onChange={(e) =>
                      update("thresholdValue", Number(e.target.value))
                    }
                    required
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Upgrade rule</Label>
                  <Select
                    value={form.upgradeRule}
                    onValueChange={(v) =>
                      update("upgradeRule", v as TierFormInput["upgradeRule"])
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lifetime_points">Lifetime points</SelectItem>
                      <SelectItem value="lifetime_spend">Lifetime spend</SelectItem>
                      <SelectItem value="monthly_spend">Monthly spend</SelectItem>
                      <SelectItem value="manual">Manual upgrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tier-multiplier">
                    Earning multiplier
                  </Label>
                  <Input
                    id="tier-multiplier"
                    type="number"
                    min={1}
                    step={0.05}
                    value={form.earningMultiplier}
                    onChange={(e) =>
                      update("earningMultiplier", Number(e.target.value))
                    }
                    required
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Benefits</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TIER_BENEFITS.map((b) => {
                    const selected = form.benefits.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => canEdit && toggleBenefit(b.id)}
                        disabled={!canEdit}
                        className={cn(
                          "flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                          selected
                            ? "border-navy-900 bg-navy-900/5 text-foreground"
                            : "border-border/60 bg-card hover:bg-secondary/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 items-center justify-center rounded border",
                            selected
                              ? "border-navy-900 bg-navy-900 text-white"
                              : "border-border/60 bg-card"
                          )}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-foreground">
                            {b.label}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {b.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tier-redemption">Redemption benefit</Label>
                <Input
                  id="tier-redemption"
                  value={form.redemptionBenefit}
                  onChange={(e) => update("redemptionBenefit", e.target.value)}
                  placeholder="e.g. 10% bonus value on partner vouchers"
                  disabled={!canEdit}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tier-badge">Badge label</Label>
                  <Input
                    id="tier-badge"
                    value={form.badgeLabel}
                    onChange={(e) => update("badgeLabel", e.target.value)}
                    placeholder="e.g. PL"
                    maxLength={4}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Badge color</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => canEdit && update("badgeColor", color)}
                        aria-label={`Select color ${color}`}
                        className={cn(
                          "h-7 w-7 rounded-full border-2 transition-transform",
                          form.badgeColor === color
                            ? "scale-110 border-navy-900"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <Input
                      type="color"
                      value={form.badgeColor}
                      onChange={(e) => update("badgeColor", e.target.value)}
                      className="h-7 w-12 cursor-pointer p-0.5"
                      aria-label="Custom badge color"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Badge icon</Label>
                  <Select
                    value={form.iconName}
                    onValueChange={(v) =>
                      update("iconName", v as TierIconName)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => {
                        const I = ICONS[icon];
                        return (
                          <SelectItem key={icon} value={icon}>
                            <span className="inline-flex items-center gap-2">
                              <I className="h-3.5 w-3.5" /> {icon}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => update("status", v as TierStatus)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tier-notes">Internal notes (optional)</Label>
                <Input
                  id="tier-notes"
                  value={form.notes ?? ""}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="e.g. Approved in Q3 finance review"
                  disabled={!canEdit}
                />
              </div>

              {error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="space-y-4 bg-secondary/30 px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Live preview
              </p>
              <div
                className={cn(
                  "rounded-2xl border bg-card p-4 shadow-soft",
                  isInactive ? "border-dashed opacity-80" : "border-border/60"
                )}
                style={{ borderTopColor: form.badgeColor, borderTopWidth: 4 }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-soft"
                    style={{ backgroundColor: form.badgeColor }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">
                      {form.name || "New tier"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {form.badgeLabel || "—"} ·{" "}
                      {form.earningMultiplier.toFixed(2)}× multiplier
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Users need {formatCompact(form.thresholdValue)}{" "}
                  {form.thresholdType.toLowerCase()} to reach this tier.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.benefits.length} benefits unlocked
                </p>
                <p className="mt-3 text-[11px] font-medium text-foreground">
                  Reward eligibility impact
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Members at this tier can redeem any reward whose min tier is
                  this tier or below.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Selected benefits
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {form.benefits.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      No benefits selected.
                    </span>
                  ) : (
                    form.benefits.map((b) => {
                      const meta = TIER_BENEFITS.find((x) => x.id === b);
                      return (
                        <StatusBadge
                          key={b}
                          label={meta?.label ?? b}
                          tone="info"
                        />
                      );
                    })
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Preview tagline
                </p>
                <p className="mt-1 text-xs font-medium text-foreground">
                  “Earn {form.earningMultiplier.toFixed(2)}× points · unlock{" "}
                  {form.benefits.length} benefits”
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border/60 bg-white/80 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !canEdit ||
                submitting ||
                !form.name.trim() ||
                form.benefits.length === 0 ||
                form.thresholdValue < 0 ||
                form.earningMultiplier < 1
              }
            >
              {editingTier ? (
                <>
                  <Save className="h-3.5 w-3.5" /> Save changes
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Create tier
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
