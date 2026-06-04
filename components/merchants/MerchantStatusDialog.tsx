"use client";

import * as React from "react";
import { AlertTriangle, Lock, Power, Store } from "lucide-react";

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
import type { MerchantOnboarding } from "@/types/loyalty";

import { useMerchants } from "./MerchantsProvider";

export interface MerchantStatusDialogProps {
  merchant: MerchantOnboarding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

/**
 * Confirmation dialog for activating or deactivating a merchant. When
 * activating a merchant whose KYC is not yet approved we surface an
 * explicit warning so the admin can confirm the intent.
 */
export function MerchantStatusDialog({
  merchant,
  open,
  onOpenChange,
  onComplete,
}: MerchantStatusDialogProps) {
  const { activateMerchant, deactivateMerchant, canEdit } = useMerchants();
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, merchant?.id]);

  if (!merchant) return null;
  const isInactive = merchant.status === "INACTIVE";
  const title = isInactive ? "Activate merchant" : "Deactivate merchant";
  const description = isInactive
    ? "This merchant will be available again for new voucher and campaign configuration."
    : "This merchant will no longer be available for new voucher or campaign configuration.";
  const Icon = isInactive ? Power : Lock;
  const accent = isInactive
    ? "bg-emerald-50 text-emerald-700"
    : "bg-rose-50 text-rose-700";
  const btnLabel = isInactive ? "Activate merchant" : "Deactivate merchant";
  const showKycWarning = isInactive && merchant.kycStatus !== "APPROVED";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setSubmitting(true);
    const result = isInactive
      ? activateMerchant(merchant.id, reason)
      : deactivateMerchant(merchant.id, reason);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not update merchant status.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      isInactive
        ? `Activated ${merchant.merchantName}.`
        : `Deactivated ${merchant.merchantName}.`
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

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900/5 text-navy-900">
            <Store className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {merchant.merchantName}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {merchant.merchantId}
            </p>
          </div>
          <StatusBadge
            label={isInactive ? "Inactive" : "Active"}
            tone={isInactive ? "neutral" : "success"}
          />
        </div>

        {showKycWarning ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              Merchant KYC is not approved. Activating this merchant may
              restrict voucher campaign usage until KYC is approved.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="merchant-status-reason">
              Reason <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="merchant-status-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isInactive
                  ? "e.g. KYC renewed and signed off"
                  : "e.g. Partner paused for the season"
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
