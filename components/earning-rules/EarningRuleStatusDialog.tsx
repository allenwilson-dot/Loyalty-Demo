"use client";

import * as React from "react";
import { Lock, Power, Unlock } from "lucide-react";

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
import { StatusBadge } from "@/components/common/StatusBadge";
import type { EarningRule } from "@/types/loyalty";

import { useEarningRules } from "./EarningRulesProvider";

export interface EarningRuleStatusDialogProps {
  rule: EarningRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

export function EarningRuleStatusDialog({
  rule,
  open,
  onOpenChange,
  onComplete,
}: EarningRuleStatusDialogProps) {
  const { activateRule, deactivateRule, canEdit } = useEarningRules();
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, rule?.id]);

  if (!rule) return null;
  const isInactive = rule.status === "INACTIVE";
  const title = isInactive ? "Activate earning rule" : "Deactivate earning rule";
  const description = isInactive
    ? "This rule will resume awarding points for matching events."
    : "This rule will stop awarding points for matching events. Existing event matches will not be reversed.";
  const Icon = isInactive ? Power : Lock;
  const accent = isInactive
    ? "bg-emerald-50 text-emerald-700"
    : "bg-rose-50 text-rose-700";
  const btnLabel = isInactive ? "Activate rule" : "Deactivate rule";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = isInactive
      ? activateRule(rule.id, reason)
      : deactivateRule(rule.id, reason);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not update rule status.");
      return;
    }
    onOpenChange(false);
    onComplete?.(isInactive ? `Activated ${rule.id}.` : `Deactivated ${rule.id}.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-soft ${accent}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900/5 text-xs font-mono font-semibold text-navy-900">
            {rule.id.slice(0, 4).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {rule.eventName === "Custom Event" && rule.customEventName
                ? rule.customEventName
                : rule.eventName}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {rule.id}
            </p>
          </div>
          <StatusBadge
            label={isInactive ? "Inactive" : "Active"}
            tone={isInactive ? "neutral" : "success"}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rule-status-reason">
              Reason <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="rule-status-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isInactive
                  ? "e.g. Finance sign-off received"
                  : "e.g. Rule paused pending review"
              }
              required
              disabled={!canEdit}
            />
          </div>

          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isInactive ? "default" : "destructive"}
              disabled={!canEdit || submitting || !reason.trim()}
            >
              <Icon className="h-3.5 w-3.5" /> {btnLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
