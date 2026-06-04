"use client";

import * as React from "react";
import { Boxes, ClipboardPaste, FileSpreadsheet, Plus, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn, formatNumber } from "@/lib/utils";
import type { VoucherManagement } from "@/types/loyalty";

import { useVouchers } from "./VouchersProvider";

export interface VoucherInventoryDialogProps {
  voucher: VoucherManagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

function parseCodes(text: string): string[] {
  return text
    .split(/\r?\n|,/g)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

interface PreviewRow {
  raw: string;
  status: "valid" | "duplicate_existing" | "duplicate_input" | "empty";
}

export function VoucherInventoryDialog({
  voucher,
  open,
  onOpenChange,
  onComplete,
}: VoucherInventoryDialogProps) {
  const { addInventory, canManageInventory } = useVouchers();
  const [codesText, setCodesText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [summary, setSummary] = React.useState<{
    added: number;
    duplicate: number;
    invalid: number;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      setCodesText("");
      setError(null);
      setSubmitting(false);
      setSummary(null);
    }
  }, [open, voucher?.id]);

  if (!voucher) return null;
  if (voucher.voucherMode !== "INVENTORY") return null;

  const parsed = parseCodes(codesText);
  const existingCodes = new Set(
    voucher.couponCodes.map((c) => c.code.toUpperCase())
  );
  const seen = new Set<string>();
  const preview: PreviewRow[] = parsed.map((code) => {
    const key = code.toUpperCase();
    if (!key) return { raw: code, status: "empty" };
    if (existingCodes.has(key)) return { raw: code, status: "duplicate_existing" };
    if (seen.has(key)) return { raw: code, status: "duplicate_input" };
    seen.add(key);
    return { raw: code, status: "valid" };
  });
  const validCount = preview.filter((p) => p.status === "valid").length;
  const duplicateExisting = preview.filter(
    (p) => p.status === "duplicate_existing"
  ).length;
  const duplicateInput = preview.filter(
    (p) => p.status === "duplicate_input"
  ).length;
  const emptyCount = preview.filter((p) => p.status === "empty").length;

  const handleApply = () => {
    setError(null);
    if (validCount === 0) {
      setError("No new codes to add. Paste at least one unique code.");
      return;
    }
    setSubmitting(true);
    const result = addInventory(voucher.id, parsed);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not add codes.");
      return;
    }
    setSummary({
      added: result.addedCount,
      duplicate: result.duplicateCount,
      invalid: result.invalidCount,
    });
    setCodesText("");
    onComplete?.(
      `Added ${result.addedCount} coupon code(s) to ${voucher.voucherTitle}.`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 shadow-soft">
              <Boxes className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Manage inventory</DialogTitle>
              <DialogDescription>
                Add coupon codes to <strong>{voucher.voucherTitle}</strong>.
                Existing codes will not be duplicated.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryStat
            label="Total"
            value={voucher.totalInventory}
            tone="navy"
          />
          <SummaryStat
            label="Remaining"
            value={voucher.remainingInventory}
            tone="emerald"
          />
          <SummaryStat
            label="Redeemed"
            value={
              voucher.couponCodes.filter((c) => c.status === "REDEEMED").length
            }
            tone="rose"
          />
          <SummaryStat
            label="Available"
            value={
              voucher.couponCodes.filter((c) => c.status === "AVAILABLE").length
            }
            tone="cyan"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_minmax(0,260px)]">
          <div className="space-y-2">
            <Label htmlFor="inventory-codes">New coupon codes</Label>
            <Textarea
              id="inventory-codes"
              value={codesText}
              onChange={(e) => setCodesText(e.target.value)}
              rows={6}
              placeholder="VC-2000&#10;VC-2001&#10;VC-2002"
              disabled={!canManageInventory}
            />
            <p className="text-[11px] text-muted-foreground">
              <ClipboardPaste className="mr-1 inline h-3 w-3" />
              One code per line. Comma-separated values are also accepted.
            </p>
          </div>
          <div className="space-y-2 rounded-md border border-border/60 bg-secondary/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <PreviewRow label="Valid (will be added)" count={validCount} tone="success" />
            <PreviewRow
              label="Already in inventory"
              count={duplicateExisting}
              tone="warning"
            />
            <PreviewRow
              label="Duplicate in pasted input"
              count={duplicateInput}
              tone="warning"
            />
            <PreviewRow label="Empty / blank rows" count={emptyCount} tone="neutral" />
            {summary ? (
              <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-[11px] text-emerald-800">
                <p className="font-semibold">
                  Added {summary.added} code{summary.added === 1 ? "" : "s"}
                </p>
                <p className="mt-0.5">
                  {summary.duplicate} duplicate
                  {summary.duplicate === 1 ? "" : "s"} skipped,{" "}
                  {summary.invalid} empty ignored.
                </p>
              </div>
            ) : null}
            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">
                {error}
              </p>
            ) : null}
          </div>
        </div>

        {preview.length > 0 ? (
          <div className="max-h-40 overflow-y-auto rounded-md border border-border/60 bg-card">
            <ul className="divide-y divide-border/40 text-xs">
              {preview.map((p, idx) => (
                <li
                  key={`${p.raw}-${idx}`}
                  className="flex items-center justify-between gap-2 px-3 py-1.5"
                >
                  <span className="font-mono text-foreground">
                    {p.raw || "(blank)"}
                  </span>
                  <StatusBadge
                    label={statusLabel(p.status)}
                    tone={statusTone(p.status)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
            Paste coupon codes on the left to see a live preview of what will
            be added.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {summary ? "Close" : "Cancel"}
          </Button>
          {summary ? null : (
            <Button
              type="button"
              onClick={handleApply}
              disabled={!canManageInventory || submitting || validCount === 0}
            >
              <Plus className="h-3.5 w-3.5" />
              Apply {validCount} new code{validCount === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function statusLabel(status: PreviewRow["status"]): string {
  switch (status) {
    case "valid":
      return "Valid";
    case "duplicate_existing":
      return "Already exists";
    case "duplicate_input":
      return "Duplicate input";
    case "empty":
    default:
      return "Empty";
  }
}

function statusTone(
  status: PreviewRow["status"]
): "success" | "warning" | "neutral" {
  switch (status) {
    case "valid":
      return "success";
    case "duplicate_existing":
    case "duplicate_input":
      return "warning";
    case "empty":
    default:
      return "neutral";
  }
}

function PreviewRow({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "success" | "warning" | "neutral";
}) {
  const toneStyles: Record<typeof tone, string> = {
    success: "text-emerald-700",
    warning: "text-amber-700",
    neutral: "text-muted-foreground",
  };
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", toneStyles[tone])}>
        {formatNumber(count)}
      </span>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "navy" | "emerald" | "rose" | "cyan";
}) {
  const toneStyles: Record<typeof tone, string> = {
    navy: "bg-navy-900/5 text-navy-900",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    cyan: "bg-cyan-50 text-cyan-700",
  };
  return (
    <div className="rounded-md border border-border/60 bg-card p-2 text-center">
      <div
        className={cn(
          "mx-auto inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md px-2 text-xs font-semibold",
          toneStyles[tone]
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
