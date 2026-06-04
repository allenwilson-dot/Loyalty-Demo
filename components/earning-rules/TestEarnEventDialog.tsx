"use client";

import * as React from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Coins,
  Hash,
  Play,
  Save,
  Sparkles,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn, formatNumber } from "@/lib/utils";
import { MOCK_USERS } from "@/data/mockUsers";
import type {
  EarningEventName,
  EarningRule,
  EarningServiceSource,
  EarningTransactionType,
  EarningUserType,
  EarnEvent,
  EarnEventResult,
} from "@/types/loyalty";

import { useEarningRules } from "./EarningRulesProvider";

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

interface FormState {
  serviceSource: EarningServiceSource;
  userType: EarningUserType;
  transactionType: EarningTransactionType;
  eventName: EarningEventName;
  customEventName: string;
  amount: number;
  referenceId: string;
  userId: string;
}

const DEFAULT_FORM: FormState = {
  serviceSource: "SELFCARE",
  userType: "PREPAID",
  transactionType: "TRANSACTIONAL",
  eventName: "Recharge",
  customEventName: "",
  amount: 500,
  referenceId: "",
  userId: MOCK_USERS[0]?.id ?? "",
};

function formFromRule(rule: EarningRule): Partial<FormState> {
  return {
    serviceSource: rule.serviceSource,
    userType: rule.userType === "ALL" ? "PREPAID" : rule.userType,
    transactionType: rule.transactionType,
    eventName: rule.eventName,
    customEventName: rule.customEventName ?? "",
    amount: rule.maximumTransactionAmount ?? 500,
  };
}

export interface TestEarnEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetRule: EarningRule | null;
  onComplete?: (message: string) => void;
}

export function TestEarnEventDialog({
  open,
  onOpenChange,
  presetRule,
  onComplete,
}: TestEarnEventDialogProps) {
  const { testEarnEvent, applyEarnEvent, canApplyEvents, rules } =
    useEarningRules();
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
  const [projection, setProjection] = React.useState<EarnEventResult | null>(null);
  const [applied, setApplied] = React.useState<{
    points: number;
    userName: string;
    newBalance?: number;
    ruleId?: string;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setProjection(null);
    setApplied(null);
    setSubmitting(false);
    if (presetRule) {
      setForm({ ...DEFAULT_FORM, ...formFromRule(presetRule) });
    } else {
      setForm(DEFAULT_FORM);
    }
    setForm((prev) => ({
      ...prev,
      referenceId: `TEST-${Date.now().toString(36).toUpperCase()}`,
    }));
  }, [open, presetRule]);

  const showUserType = form.serviceSource === "SELFCARE";
  const showCustomName = form.eventName === "Custom Event";

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setProjection(null);
    setApplied(null);
  };

  const buildEvent = (): EarnEvent => ({
    id: `pev_${Date.now().toString(36)}`,
    serviceSource: form.serviceSource,
    userType: showUserType ? form.userType : "ALL",
    transactionType: form.transactionType,
    eventName: form.eventName,
    customEventName:
      form.eventName === "Custom Event" ? form.customEventName : undefined,
    amount: form.amount,
    referenceId: form.referenceId.trim(),
    userId: form.userId,
    occurredAt: new Date().toISOString(),
  });

  const handleTest = () => {
    setError(null);
    if (!form.referenceId.trim()) {
      setError("Reference id is required to test an event.");
      return;
    }
    if (!form.userId) {
      setError("Please select a user.");
      return;
    }
    const event = buildEvent();
    const result = testEarnEvent(event);
    setProjection(result);
  };

  const handleApply = () => {
    setError(null);
    if (!canApplyEvents) {
      setError("Only admins can apply earn events.");
      return;
    }
    if (!form.referenceId.trim()) {
      setError("Reference id is required to apply an event.");
      return;
    }
    setSubmitting(true);
    const result = applyEarnEvent(buildEvent());
    setSubmitting(false);
    if (result.status === "applied") {
      setApplied({
        points: result.points,
        userName: result.userName,
        newBalance: result.newBalance,
        ruleId: result.ruleId,
      });
      setProjection(null);
      onComplete?.(
        `Applied ${formatNumber(result.points)} pts to ${result.userName}.`
      );
    } else {
      setError(result.message);
    }
  };

  const appliedResultTone =
    projection?.status === "applied"
      ? "success"
      : projection?.status === "no_rule"
      ? "warning"
      : projection?.status === "duplicate"
      ? "danger"
      : "info";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              <Play className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Test earn event</DialogTitle>
              <DialogDescription>
                Simulate an incoming earn event and see which rule fires. Apply
                to credit the member’s balance and create a transaction record.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Service source</Label>
            <Select
              value={form.serviceSource}
              onValueChange={(v) => {
                update("serviceSource", v as EarningServiceSource);
                if (v !== "SELFCARE") update("userType", "ALL");
              }}
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
                onValueChange={(v) => update("userType", v as EarningUserType)}
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

          <div className="space-y-1.5">
            <Label>Transaction type</Label>
            <Select
              value={form.transactionType}
              onValueChange={(v) =>
                update("transactionType", v as EarningTransactionType)
              }
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

          {showCustomName ? (
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="test-custom-event">Custom event name</Label>
              <Input
                id="test-custom-event"
                value={form.customEventName}
                onChange={(e) => update("customEventName", e.target.value)}
                placeholder="e.g. Survey Submission"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="test-amount">Transaction amount</Label>
            <Input
              id="test-amount"
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => update("amount", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="test-ref">Reference ID</Label>
            <Input
              id="test-ref"
              value={form.referenceId}
              onChange={(e) => update("referenceId", e.target.value)}
              placeholder="e.g. SC-TPU-001"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Member</Label>
            <Select
              value={form.userId}
              onValueChange={(v) => update("userId", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_USERS.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {projection ? (
          <div
            className={cn(
              "rounded-lg border p-3 text-sm",
              projection.status === "applied"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : projection.status === "no_rule"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            )}
          >
            <div className="flex items-center gap-2">
              {projection.status === "applied" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <p className="font-medium">{projection.message}</p>
            </div>
            {projection.rule ? (
              <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                <div>
                  <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                    Matched rule
                  </p>
                  <p className="font-mono">{projection.rule.id}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                    Reward
                  </p>
                  <p>
                    {projection.rule.rewardType === "POINT"
                      ? `${formatNumber(projection.rule.rewardValue)} pts`
                      : `${projection.rule.rewardValue}%`}{" "}
                    {projection.rule.maximumTransactionAmount
                      ? `(capped at ${formatNumber(projection.rule.maximumTransactionAmount)})`
                      : null}
                  </p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                    Calculated points
                  </p>
                  <p>{formatNumber(projection.points)} pts</p>
                </div>
                {projection.expiryDate ? (
                  <div>
                    <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                      Expiry date
                    </p>
                    <p>{new Date(projection.expiryDate).toLocaleDateString()}</p>
                  </div>
                ) : null}
                {projection.rule.pushNotification ? (
                  <div className="md:col-span-2">
                    <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                      Push notification
                    </p>
                    <p>
                      {projection.rule.notificationMessage ?? "Will be triggered."}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {applied ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-semibold">
              {formatNumber(applied.points)} pts credited to {applied.userName}
            </p>
            {applied.newBalance !== undefined ? (
              <p className="mt-0.5 text-xs text-emerald-700">
                New balance: {formatNumber(applied.newBalance)} pts
                {applied.ruleId ? ` · via rule ${applied.ruleId}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3.5 w-3.5" /> Close
          </Button>
          <Button type="button" variant="outline" onClick={handleTest}>
            <Calculator className="h-3.5 w-3.5" /> Test calculation
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={
              !canApplyEvents ||
              submitting ||
              !form.referenceId.trim() ||
              !form.userId
            }
          >
            <Save className="h-3.5 w-3.5" /> Apply test event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
