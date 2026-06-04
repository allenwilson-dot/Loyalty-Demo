"use client";

import * as React from "react";
import { Calculator, Save, Sparkles, X } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { cn, formatNumber } from "@/lib/utils";
import type {
  EarningEventName,
  EarningRule,
  EarningRuleStatus,
  EarningServiceSource,
  EarningTransactionType,
  EarningUserType,
} from "@/types/loyalty";

import { useEarningRules, type EarningRuleFormInput } from "./EarningRulesProvider";

const SERVICE_SOURCES: { value: EarningServiceSource; label: string }[] = [
  { value: "SELFCARE", label: "Selfcare" },
  { value: "MOOLEE", label: "Moolee" },
  { value: "MFAISAA", label: "M Faisaa" },
  { value: "OTHER", label: "Other" },
];

const USER_TYPES: { value: EarningUserType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PREPAID", label: "Prepaid" },
  { value: "POSTPAID", label: "Postpaid" },
  { value: "HYBRID", label: "Hybrid" },
];

const TXN_TYPES: { value: EarningTransactionType; label: string }[] = [
  { value: "TRANSACTIONAL", label: "Transactional" },
  { value: "NON_TRANSACTIONAL", label: "Non-transactional" },
];

const EVENT_NAMES: { value: EarningEventName; label: string }[] = [
  { value: "Recharge", label: "Recharge" },
  { value: "Data Pack Purchase", label: "Data Pack Purchase" },
  { value: "Moolee Purchase", label: "Moolee Purchase" },
  { value: "Wallet Payment", label: "Wallet Payment" },
  { value: "Wallet Top-Up", label: "Wallet Top-Up" },
  { value: "Bill Payment", label: "Bill Payment" },
  { value: "First Transaction", label: "First Transaction" },
  { value: "Login Streak", label: "Login Streak" },
  { value: "Campaign Bonus", label: "Campaign Bonus" },
  { value: "Referral Bonus", label: "Referral Bonus" },
  { value: "Profile Completion", label: "Profile Completion" },
  { value: "Custom Event", label: "Custom Event" },
];

const DEFAULT_FORM: EarningRuleFormInput = {
  serviceSource: "SELFCARE",
  userType: "ALL",
  transactionType: "TRANSACTIONAL",
  eventName: "Recharge",
  customEventName: "",
  rewardType: "POINT",
  rewardValue: 50,
  maximumTransactionAmount: 0,
  expiryDays: 0,
  pushNotification: true,
  notificationMessage: "",
  status: "ACTIVE",
  notes: "",
};

function formFromRule(rule: EarningRule): EarningRuleFormInput {
  return {
    serviceSource: rule.serviceSource,
    userType: rule.userType,
    transactionType: rule.transactionType,
    eventName: rule.eventName,
    customEventName: rule.customEventName ?? "",
    rewardType: rule.rewardType,
    rewardValue: rule.rewardValue,
    maximumTransactionAmount: rule.maximumTransactionAmount ?? 0,
    expiryDays: rule.expiryDays ?? 0,
    pushNotification: rule.pushNotification,
    notificationMessage: rule.notificationMessage ?? "",
    status: rule.status,
    notes: rule.notes ?? "",
  };
}

export interface EarningRuleFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule: EarningRule | null;
  onComplete?: (message: string) => void;
}

export function EarningRuleFormDrawer({
  open,
  onOpenChange,
  editingRule,
  onComplete,
}: EarningRuleFormDrawerProps) {
  const { createRule, updateRule, canEdit } = useEarningRules();
  const [form, setForm] = React.useState<EarningRuleFormInput>(DEFAULT_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    if (editingRule) {
      setForm(formFromRule(editingRule));
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [open, editingRule]);

  const update = <K extends keyof EarningRuleFormInput>(
    key: K,
    value: EarningRuleFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = editingRule
      ? updateRule(editingRule.id, form)
      : createRule(form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not save rule.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      editingRule
        ? `Updated ${editingRule.id}.`
        : `Created ${result.rule?.id}.`
    );
  };

  // Live preview calculation
  const previewAmount = 500;
  const previewPoints = (() => {
    if (form.rewardType === "POINT") {
      return Math.max(0, Math.round(form.rewardValue));
    }
    const cap = form.maximumTransactionAmount > 0 ? form.maximumTransactionAmount : previewAmount;
    const effective = Math.max(0, Math.min(previewAmount, cap));
    return Math.max(0, Math.round((effective * form.rewardValue) / 100));
  })();
  const showUserType = form.serviceSource === "SELFCARE";
  const showCustomName = form.eventName === "Custom Event";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              {editingRule ? (
                <Save className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </span>
            <div>
              <SheetTitle>
                {editingRule ? `Edit ${editingRule.id}` : "Create earning rule"}
              </SheetTitle>
              <SheetDescription>
                Configure the event, reward, and notification behavior. The
                preview on the right shows what members will earn.
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
                  <Label>Service source</Label>
                  <Select
                    value={form.serviceSource}
                    onValueChange={(v) => {
                      update("serviceSource", v as EarningServiceSource);
                      if (v !== "SELFCARE") update("userType", "ALL");
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {showUserType ? (
                  <div className="space-y-1.5">
                    <Label>User type</Label>
                    <Select
                      value={form.userType}
                      onValueChange={(v) =>
                        update("userType", v as EarningUserType)
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_TYPES.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>User type</Label>
                    <div className="flex h-10 items-center rounded-md border border-dashed border-border/60 bg-secondary/30 px-3 text-xs text-muted-foreground">
                      Not applicable — set to ALL automatically
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Transaction type</Label>
                  <Select
                    value={form.transactionType}
                    onValueChange={(v) =>
                      update("transactionType", v as EarningTransactionType)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TXN_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Event name</Label>
                  <Select
                    value={form.eventName}
                    onValueChange={(v) =>
                      update("eventName", v as EarningEventName)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_NAMES.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showCustomName ? (
                <div className="space-y-1.5">
                  <Label htmlFor="custom-event">Custom event name</Label>
                  <Input
                    id="custom-event"
                    value={form.customEventName}
                    onChange={(e) => update("customEventName", e.target.value)}
                    placeholder="e.g. Survey Submission"
                    disabled={!canEdit}
                  />
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Reward type</Label>
                  <Select
                    value={form.rewardType}
                    onValueChange={(v) => update("rewardType", v as "POINT" | "PERCENT")}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POINT">Fixed points</SelectItem>
                      <SelectItem value="PERCENT">Percent of spend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reward-value">
                    Reward value{" "}
                    <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="reward-value"
                    type="number"
                    min={1}
                    max={form.rewardType === "PERCENT" ? 100 : undefined}
                    value={form.rewardValue}
                    onChange={(e) =>
                      update("rewardValue", Number(e.target.value))
                    }
                    required
                    disabled={!canEdit}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {form.rewardType === "POINT"
                      ? "Fixed loyalty points per matching event"
                      : "Percent of the qualifying transaction"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-amount">Max transaction amount</Label>
                  <Input
                    id="max-amount"
                    type="number"
                    min={0}
                    value={form.maximumTransactionAmount}
                    onChange={(e) =>
                      update("maximumTransactionAmount", Number(e.target.value))
                    }
                    placeholder="Optional cap"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry-days">Expiry (days)</Label>
                  <Input
                    id="expiry-days"
                    type="number"
                    min={0}
                    value={form.expiryDays}
                    onChange={(e) =>
                      update("expiryDays", Number(e.target.value))
                    }
                    placeholder="0 for no expiry"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      update("status", v as EarningRuleStatus)
                    }
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

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    In-app push notification
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Send a confirmation message when points are credited.
                  </p>
                </div>
                <Switch
                  checked={form.pushNotification}
                  onCheckedChange={(v) => update("pushNotification", v)}
                  disabled={!canEdit}
                  aria-label="Toggle push notification"
                />
              </div>

              {form.pushNotification ? (
                <div className="space-y-1.5">
                  <Label htmlFor="notif-msg">
                    Notification message <span className="text-rose-600">*</span>
                  </Label>
                  <Textarea
                    id="notif-msg"
                    value={form.notificationMessage}
                    onChange={(e) => update("notificationMessage", e.target.value)}
                    placeholder="e.g. Your top-up just earned 50 loyalty points!"
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="rule-notes">Internal notes (optional)</Label>
                <Textarea
                  id="rule-notes"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="e.g. Approved in Q3 finance review"
                  rows={2}
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
              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Reward calculation
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {formatNumber(previewPoints)} pts
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.rewardType === "POINT"
                    ? "User will earn fixed loyalty points for this event."
                    : `For a transaction amount of ${formatNumber(previewAmount)}, user will earn ${formatNumber(previewPoints)} points.`}
                </p>
                {form.rewardType === "PERCENT" && form.maximumTransactionAmount > 0 ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Points will be calculated up to maximum transaction amount of{" "}
                    {formatNumber(form.maximumTransactionAmount)}.
                  </p>
                ) : null}
                {form.expiryDays > 0 ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Earned points will expire after {form.expiryDays} days.
                  </p>
                ) : null}
                {form.pushNotification ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    In-app push notification will be triggered.
                  </p>
                ) : null}
              </div>

              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Rule summary
                </p>
                <ul className="mt-1.5 space-y-1 text-xs text-foreground">
                  <li>
                    Source:{" "}
                    <span className="font-semibold">
                      {form.serviceSource}
                    </span>
                  </li>
                  {showUserType ? (
                    <li>
                      User type:{" "}
                      <span className="font-semibold">{form.userType}</span>
                    </li>
                  ) : null}
                  <li>
                    Transaction type:{" "}
                    <span className="font-semibold">
                      {form.transactionType === "TRANSACTIONAL"
                        ? "Transactional"
                        : "Non-transactional"}
                    </span>
                  </li>
                  <li>
                    Event:{" "}
                    <span className="font-semibold">
                      {form.eventName === "Custom Event" && form.customEventName
                        ? form.customEventName
                        : form.eventName}
                    </span>
                  </li>
                  <li>
                    Status:{" "}
                    <StatusBadge
                      label={form.status}
                      tone={form.status === "ACTIVE" ? "success" : "neutral"}
                    />
                  </li>
                </ul>
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
              disabled={!canEdit || submitting}
            >
              {editingRule ? (
                <>
                  <Save className="h-3.5 w-3.5" /> Save changes
                </>
              ) : (
                <>
                  <Calculator className="h-3.5 w-3.5" /> Create rule
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
