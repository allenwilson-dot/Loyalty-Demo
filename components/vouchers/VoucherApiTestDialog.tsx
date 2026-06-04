"use client";

import * as React from "react";
import {
  CheckCircle2,
  ExternalLink,
  Plug,
  ShieldAlert,
  XCircle,
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/lib/utils";
import type { VoucherManagement } from "@/types/loyalty";

import { useVouchers } from "./VouchersProvider";

export interface VoucherApiTestDialogProps {
  voucher: VoucherManagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

export function VoucherApiTestDialog({
  voucher,
  open,
  onOpenChange,
  onComplete,
}: VoucherApiTestDialogProps) {
  const { testApiVoucher, canTestApi } = useVouchers();
  const [outcome, setOutcome] = React.useState<
    | { kind: "idle" }
    | { kind: "success"; message: string; at: string }
    | { kind: "failure"; message: string; at: string }
  >({ kind: "idle" });

  React.useEffect(() => {
    if (open) {
      setOutcome({ kind: "idle" });
    }
  }, [open, voucher?.id]);

  if (!voucher) return null;
  if (voucher.voucherMode !== "API") return null;

  const runTest = (mode: "success" | "failure") => {
    const result = testApiVoucher(voucher.id, mode);
    setOutcome({
      kind: result.status === "SUCCESS" ? "success" : "failure",
      message: result.message,
      at: new Date().toISOString(),
    });
    onComplete?.(
      result.status === "SUCCESS"
        ? `Test succeeded for ${voucher.voucherTitle}.`
        : `Test failed for ${voucher.voucherTitle}.`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700 shadow-soft">
              <Plug className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Test API voucher</DialogTitle>
              <DialogDescription>
                Simulate a redemption against{" "}
                <strong>{voucher.voucherTitle}</strong>. No real API call is
                made — the response is mocked.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-3 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Request template
          </p>
          <pre className="overflow-x-auto rounded-md bg-navy-900/5 p-2 font-mono text-[11px] text-foreground">
{`POST ${voucher.apiEndpoint ?? "<endpoint>"}
Authorization: ${voucher.apiAuthType ?? "API_KEY"}
Content-Type: application/json

{
  "voucherId": "${voucher.voucherId}",
  "merchantId": "${voucher.merchantId}",
  "amount": ${voucher.voucherValue}
}`}
          </pre>
          <p className="text-[11px] text-muted-foreground">
            Timeout {voucher.apiTimeoutMs ?? 0} ms · Retry{" "}
            {voucher.apiRetryCount ?? 0}
          </p>
        </div>

        <Separator />

        {outcome.kind === "idle" ? (
          <p className="rounded-md border border-dashed border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
            Run a test to see the mock response. Both outcomes generate a new
            audit log entry.
          </p>
        ) : outcome.kind === "success" ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <p className="font-semibold">Test succeeded</p>
            </div>
            <p className="mt-1 font-mono text-[11px]">{outcome.message}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {formatDateTime(outcome.at)}
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              <p className="font-semibold">Test failed</p>
            </div>
            <p className="mt-1 font-mono text-[11px]">{outcome.message}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {formatDateTime(outcome.at)}
            </p>
          </div>
        )}

        {voucher.lastApiTestAt ? (
          <p className="text-[11px] text-muted-foreground">
            <StatusBadge
              label={voucher.lastApiTestStatus ?? "PENDING"}
              tone={
                voucher.lastApiTestStatus === "SUCCESS"
                  ? "success"
                  : voucher.lastApiTestStatus === "FAILED"
                  ? "danger"
                  : "info"
              }
              icon={
                voucher.lastApiTestStatus === "SUCCESS" ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : voucher.lastApiTestStatus === "FAILED" ? (
                  <XCircle className="h-3 w-3" />
                ) : undefined
              }
            />
            <span className="ml-2">
              Last test ran at {formatDateTime(voucher.lastApiTestAt)}
            </span>
            {voucher.lastApiTestMessage ? (
              <span className="ml-2 text-muted-foreground">
                · {voucher.lastApiTestMessage}
              </span>
            ) : null}
          </p>
        ) : null}

        {voucher.apiEndpoint ? (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span className="font-mono">{voucher.apiEndpoint}</span>
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => runTest("failure")}
            disabled={!canTestApi}
          >
            <XCircle className="h-3.5 w-3.5" /> Simulate failure
          </Button>
          <Button
            type="button"
            onClick={() => runTest("success")}
            disabled={!canTestApi}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Simulate success
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
