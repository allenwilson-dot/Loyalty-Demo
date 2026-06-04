"use client";

import * as React from "react";
import { AlertTriangle, Lock, Power, Ticket } from "lucide-react";

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
import { describeVoucherActivation } from "@/lib/voucherEligibility";
import type { VoucherManagement } from "@/types/loyalty";

import { useVouchers } from "./VouchersProvider";

export interface VoucherStatusDialogProps {
  voucher: VoucherManagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

export function VoucherStatusDialog({
  voucher,
  open,
  onOpenChange,
  onComplete,
}: VoucherStatusDialogProps) {
  const { activateVoucher, deactivateVoucher, canEdit, merchantFor } =
    useVouchers();
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, voucher?.id]);

  if (!voucher) return null;
  const isInactive = voucher.status === "INACTIVE";
  const title = isInactive ? "Activate voucher" : "Deactivate voucher";
  const description = isInactive
    ? "This voucher will become eligible for new redemption campaigns."
    : "This voucher will no longer be available for new redemption campaigns.";
  const Icon = isInactive ? Power : Lock;
  const accent = isInactive
    ? "bg-emerald-50 text-emerald-700"
    : "bg-rose-50 text-rose-700";
  const btnLabel = isInactive ? "Activate voucher" : "Deactivate voucher";

  const activation = describeVoucherActivation(
    voucher,
    merchantFor(voucher.merchantId) ?? null
  );
  const showActivationBlock = isInactive && !activation.canActivate;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError("A reason is required.");
      return;
    }
    setSubmitting(true);
    const result = isInactive
      ? activateVoucher(voucher.id, reason)
      : deactivateVoucher(voucher.id, reason);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not update voucher status.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      isInactive
        ? `Activated ${voucher.voucherTitle}.`
        : `Deactivated ${voucher.voucherTitle}.`
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
            <Ticket className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {voucher.voucherTitle}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {voucher.voucherId} · {voucher.merchantName}
            </p>
          </div>
          <StatusBadge
            label={isInactive ? "Inactive" : "Active"}
            tone={isInactive ? "neutral" : "success"}
          />
        </div>

        {showActivationBlock ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <p className="flex items-center gap-1 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              Activation checks failed
            </p>
            <ul className="mt-1 space-y-0.5">
              {activation.reasons.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="voucher-status-reason">
              Reason <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="voucher-status-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isInactive
                  ? "e.g. Merchant KYC renewed and inventory topped up"
                  : "e.g. Campaign paused for the season"
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
              disabled={
                !canEdit ||
                submitting ||
                !reason.trim() ||
                (isInactive && !activation.canActivate)
              }
            >
              <Icon className="h-3.5 w-3.5" /> {btnLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
