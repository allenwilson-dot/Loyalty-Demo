"use client";

import * as React from "react";
import { Check, Copy, Gift, Loader2, ShieldAlert, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { describeFailure, formatPoints, REWARD_TYPE_LABEL } from "@/lib/loyalty";
import type {
  RedemptionResult,
  Reward,
  RewardType,
} from "@/types/loyalty";

import { useLoyaltySession } from "./LoyaltyProvider";

type Phase = "confirm" | "processing" | "success" | "failure";

interface RedeemModalProps {
  reward: Reward;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_SUCCESS_HEADLINE: Record<RewardType, string> = {
  voucher: "Your voucher is ready",
  wallet: "Wallet credit applied",
  data: "Data pack activated",
  addon: "Add-on activated",
};

const TYPE_SUCCESS_BODY = (reward: Reward): string => {
  switch (reward.type) {
    case "voucher":
      return "Show the code at the partner counter or paste it during online checkout. It expires as printed on the coupon.";
    case "wallet":
      return "Your linked mobile wallet has been credited. Use it instantly at any partner merchant.";
    case "data":
      return "The data pack has been provisioned on your line and will be available within a few minutes.";
    case "addon":
      return "The add-on is now active on your line. Enjoy the extra benefits until it expires.";
    default:
      return "Your reward is now active.";
  }
};

export function RedeemModal({ reward, open, onOpenChange }: RedeemModalProps) {
  const { redeem, simulateFailure, setSimulateFailure, user } =
    useLoyaltySession();

  const [phase, setPhase] = React.useState<Phase>("confirm");
  const [result, setResult] = React.useState<RedemptionResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Reset state when the modal is opened/closed.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setPhase("confirm");
        setResult(null);
        setCopied(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const canAfford = user.pointsBalance >= reward.pointsCost;

  const handleConfirm = async () => {
    setPhase("processing");
    const res = await redeem(reward.id);
    setResult(res);
    if (res.ok) {
      setPhase("success");
    } else {
      setPhase("failure");
    }
  };

  const handleCopy = async () => {
    if (!result?.ok || !result.voucher) return;
    try {
      await navigator.clipboard.writeText(result.voucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is best-effort; ignore failures in the demo.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {phase === "confirm" ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white shadow-soft">
                  <Gift className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle>Redeem {REWARD_TYPE_LABEL[reward.type]}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {reward.title}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-secondary/50 p-4">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Cost</dt>
                    <dd className="mt-0.5 text-base font-semibold text-foreground">
                      {formatPoints(reward.pointsCost)} pts
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Balance after</dt>
                    <dd className="mt-0.5 text-base font-semibold text-foreground">
                      {formatPoints(Math.max(0, user.pointsBalance - reward.pointsCost))} pts
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Validity</dt>
                    <dd className="mt-0.5 text-sm font-medium text-foreground">
                      {reward.validityDays} days
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Tier required</dt>
                    <dd className="mt-0.5 text-sm font-medium capitalize text-foreground">
                      {reward.minTier}+
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Simulate failure</p>
                    <p className="text-xs text-amber-800/80">
                      Demo control. When on, the next redemption will fail and roll back.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={simulateFailure}
                  onCheckedChange={setSimulateFailure}
                  aria-label="Simulate redemption failure"
                />
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!canAfford}>
                <Sparkles className="h-4 w-4" /> Confirm redemption
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {phase === "processing" ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <Loader2 className="h-6 w-6 animate-spin text-navy-900" />
            </div>
            <div>
              <DialogTitle className="text-lg">Processing your redemption</DialogTitle>
              <DialogDescription className="mt-1">
                Please wait while we deduct points and provision your reward.
              </DialogDescription>
            </div>
          </div>
        ) : null}

        {phase === "success" && result?.ok ? (
          <>
            <div className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                )}
              >
                <Check className="h-7 w-7" />
              </span>
              <DialogTitle>{TYPE_SUCCESS_HEADLINE[reward.type]}</DialogTitle>
              <DialogDescription className="mt-1">
                {TYPE_SUCCESS_BODY(reward)}
              </DialogDescription>
            </div>

            {reward.type === "voucher" && result.voucher ? (
              <div className="mt-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Your coupon code
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <code className="font-mono text-lg font-semibold tracking-widest text-foreground">
                    {result.voucher.code}
                  </code>
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </Button>
                </div>
                {reward.merchantName ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Redeemable at {reward.merchantName}
                  </p>
                ) : null}
              </div>
            ) : null}

            {reward.type === "wallet" ? (
              <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Wallet</p>
                <p className="mt-0.5 font-mono text-sm text-foreground">
                  {user.walletId}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  New balance reflects in your wallet within a few seconds.
                </p>
              </div>
            ) : null}

            {reward.type === "data" ? (
              <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Activated on</p>
                <p className="mt-0.5 font-mono text-sm text-foreground">
                  {user.msisdn}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {(reward.dataMb ?? 0) / 1024} GB pack · {reward.validityDays} days
                  validity.
                </p>
              </div>
            ) : null}

            {reward.type === "addon" ? (
              <div className="rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Activated on</p>
                <p className="mt-0.5 font-mono text-sm text-foreground">
                  {user.msisdn}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Add-on stays active for {reward.validityDays} days.
                </p>
              </div>
            ) : null}

            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}

        {phase === "failure" && result && !result.ok ? (
          <>
            <div className="flex flex-col items-center text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <X className="h-7 w-7" />
              </span>
              <DialogTitle>Redemption failed</DialogTitle>
              <DialogDescription className="mt-1">
                {result.message ?? describeFailure(result.reason)}
              </DialogDescription>
            </div>

            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => setPhase("confirm")}>Try again</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
