"use client";

import * as React from "react";
import { AlertTriangle, Lock, Unlock } from "lucide-react";

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
import type { Tier } from "@/types/loyalty";

import { useTiers } from "./TiersProvider";

export interface TierStatusDialogProps {
  tier: Tier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

/**
 * Confirmation dialog for activating or deactivating a tier. Mandatory
 * reason field is captured and written to the audit log.
 */
export function TierStatusDialog({
  tier,
  open,
  onOpenChange,
  onComplete,
}: TierStatusDialogProps) {
  const { activateTier, deactivateTier, canEdit } = useTiers();
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, tier?.id]);

  if (!tier) return null;
  const isInactive = (tier.status ?? "ACTIVE") === "INACTIVE";
  const title = isInactive ? "Activate tier" : "Deactivate tier";
  const description = isInactive
    ? "This tier will be eligible for new reward configurations and member upgrades."
    : "This tier will stop being available for new configurations. Existing members will remain visible but new reward eligibility should not use inactive tiers.";
  const Icon = isInactive ? Unlock : Lock;
  const accent = isInactive
    ? "bg-emerald-50 text-emerald-700"
    : "bg-rose-50 text-rose-700";
  const btnLabel = isInactive ? "Activate tier" : "Deactivate tier";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = isInactive
      ? activateTier(tier.id, reason)
      : deactivateTier(tier.id, reason);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not update tier status.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      isInactive
        ? `Activated ${tier.name}.`
        : `Deactivated ${tier.name}.`
    );
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

        {!isInactive ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Existing rewards that require this tier will keep the requirement
              but the tier won’t be assignable to new members until reactivated.
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold text-white shadow-soft"
            style={{ backgroundColor: tier.color }}
          >
            {tier.badgeLabel ?? tier.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {tier.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {tier.id} · {tier.multiplier.toFixed(2)}× multiplier
            </p>
          </div>
          <StatusBadge
            label={isInactive ? "Inactive" : "Active"}
            tone={isInactive ? "neutral" : "success"}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tier-status-reason">
              Reason <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="tier-status-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isInactive
                  ? "e.g. Finance sign-off received"
                  : "e.g. Tier paused pending review"
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
