"use client";

import * as React from "react";
import { ShieldCheck, ShieldX, Store } from "lucide-react";

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

export type KycDialogMode = "approve" | "reject";

export interface KycActionDialogProps {
  merchant: MerchantOnboarding | null;
  mode: KycDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

/**
 * Two-mode dialog (approve / reject) used to manage the KYC state of a
 * merchant. Approvals are optional remarks; rejections require a reason.
 */
export function KycActionDialog({
  merchant,
  mode,
  open,
  onOpenChange,
  onComplete,
}: KycActionDialogProps) {
  const { approveKyc, rejectKyc, canApproveKyc } = useMerchants();
  const [remarks, setRemarks] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setRemarks("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, merchant?.id, mode]);

  if (!merchant) return null;
  const isApprove = mode === "approve";
  const title = isApprove ? "Approve merchant KYC" : "Reject merchant KYC";
  const description = isApprove
    ? "Approve this merchant's KYC submission. They will become eligible for new voucher and campaign configuration once their status is also active."
    : "Reject this merchant's KYC submission. They will not be able to publish vouchers until a new submission is approved.";
  const Icon = isApprove ? ShieldCheck : ShieldX;
  const accent = isApprove
    ? "bg-emerald-50 text-emerald-700"
    : "bg-rose-50 text-rose-700";
  const btnLabel = isApprove ? "Approve KYC" : "Reject KYC";
  const reasonLabel = isApprove ? "Remarks (optional)" : "Rejection reason";
  const reasonPlaceholder = isApprove
    ? "e.g. Trade license and tax clearance verified."
    : "e.g. Trade license expired before submission.";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isApprove && !remarks.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setSubmitting(true);
    const result = isApprove
      ? approveKyc(merchant.id, remarks)
      : rejectKyc(merchant.id, remarks);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not update KYC.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      isApprove
        ? `Approved KYC for ${merchant.merchantName}.`
        : `Rejected KYC for ${merchant.merchantName}.`
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
            label={merchant.kycStatus}
            tone={
              merchant.kycStatus === "APPROVED"
                ? "success"
                : merchant.kycStatus === "REJECTED"
                ? "danger"
                : "warning"
            }
          />
        </div>

        {merchant.kycDocumentName ? (
          <p className="rounded-md border border-border/60 bg-card px-3 py-2 text-xs text-foreground">
            <span className="font-semibold">Document on file:</span>{" "}
            <span className="font-mono">{merchant.kycDocumentName}</span>
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="kyc-remarks">
              {reasonLabel}{" "}
              {!isApprove ? (
                <span className="text-rose-600">*</span>
              ) : null}
            </Label>
            <Input
              id="kyc-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={reasonPlaceholder}
              required={!isApprove}
              disabled={!canApproveKyc}
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
              variant={isApprove ? "default" : "destructive"}
              disabled={
                !canApproveKyc ||
                submitting ||
                (!isApprove && !remarks.trim())
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
