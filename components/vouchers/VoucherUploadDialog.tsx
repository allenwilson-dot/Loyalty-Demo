"use client";

import * as React from "react";
import { FileSpreadsheet, Upload } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatNumber } from "@/lib/utils";
import { useVouchers } from "./VouchersProvider";

export interface VoucherUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

const SAMPLE = `voucherId,code
VMG-MFA-002,VC-2500
VMG-MFA-002,VC-2501
VMG-CAF-001,VC-2502`;

interface ParsedRow {
  voucherId: string;
  code: string;
  status: "valid" | "unknown_voucher" | "duplicate" | "empty";
}

export function VoucherUploadDialog({
  open,
  onOpenChange,
  onComplete,
}: VoucherUploadDialogProps) {
  const { uploadBulk, canEdit, vouchers } = useVouchers();
  const [csv, setCsv] = React.useState(SAMPLE);
  const [fileName, setFileName] = React.useState<string | null>(
    "voucher-codes-sample.csv"
  );
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [summary, setSummary] = React.useState<{
    added: number;
    rows: number;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      setCsv(SAMPLE);
      setFileName("voucher-codes-sample.csv");
      setError(null);
      setSubmitting(false);
      setSummary(null);
    }
  }, [open]);

  const parsedRows: ParsedRow[] = React.useMemo(() => {
    if (!csv.trim()) return [];
    const lines = csv.split(/\r?\n/g);
    const voucherIndex = new Map(vouchers.map((v) => [v.voucherId, v]));
    const seen = new Set<string>();
    return lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line): ParsedRow | null => {
        const [voucherIdRaw, codeRaw] = line.split(",").map((c) => c.trim());
        if (!voucherIdRaw || !codeRaw) {
          return { voucherId: voucherIdRaw ?? "", code: codeRaw ?? "", status: "empty" };
        }
        const voucher = voucherIndex.get(voucherIdRaw);
        if (!voucher) {
          return { voucherId: voucherIdRaw, code: codeRaw, status: "unknown_voucher" };
        }
        const key = `${voucherIdRaw}:${codeRaw.toUpperCase()}`;
        if (seen.has(key)) {
          return { voucherId: voucherIdRaw, code: codeRaw, status: "duplicate" };
        }
        seen.add(key);
        return { voucherId: voucherIdRaw, code: codeRaw, status: "valid" };
      })
      .filter((row): row is ParsedRow => row !== null);
  }, [csv, vouchers]);

  const validRows = parsedRows.filter((r) => r.status === "valid");
  const unknownRows = parsedRows.filter((r) => r.status === "unknown_voucher");
  const duplicateRows = parsedRows.filter((r) => r.status === "duplicate");
  const emptyRows = parsedRows.filter((r) => r.status === "empty");

  const handleApply = () => {
    setError(null);
    if (!canEdit) {
      setError("You don't have permission to upload coupons.");
      return;
    }
    if (validRows.length === 0) {
      setError("No valid rows to apply. Check the preview below.");
      return;
    }
    setSubmitting(true);
    const grouped = new Map<string, string[]>();
    for (const row of validRows) {
      const list = grouped.get(row.voucherId) ?? [];
      list.push(row.code);
      grouped.set(row.voucherId, list);
    }
    const result = uploadBulk(
      fileName ?? "upload.csv",
      Array.from(grouped.entries()).map(([voucherId, codes]) => ({
        voucherId,
        codes,
      }))
    );
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Upload failed.");
      return;
    }
    setSummary({ added: result.addedCount, rows: validRows.length });
    onComplete?.(
      `Uploaded ${result.addedCount} coupon code(s) across ${grouped.size} voucher(s).`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 shadow-soft">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Upload coupon codes</DialogTitle>
              <DialogDescription>
                Bulk-add coupon codes to multiple inventory vouchers. Drop a
                .csv file or paste rows below.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-md border border-dashed border-border/60 bg-secondary/20 p-3 text-center text-xs text-muted-foreground">
          <Upload className="mx-auto mb-1 h-5 w-5 text-cyan-700" />
          <p className="font-mono text-foreground">{fileName ?? "No file selected"}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setFileName(`voucher-codes-${Date.now()}.csv`)}
            disabled={!canEdit}
          >
            Mock file picker
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="upload-csv">CSV rows</Label>
          <Textarea
            id="upload-csv"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={5}
            disabled={!canEdit}
            placeholder="voucherId,code"
          />
          <p className="text-[11px] text-muted-foreground">
            Format: <span className="font-mono">voucherId,code</span> — one row
            per line.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryStat label="Valid" value={validRows.length} tone="emerald" />
          <SummaryStat
            label="Unknown voucher"
            value={unknownRows.length}
            tone="rose"
          />
          <SummaryStat
            label="Duplicate"
            value={duplicateRows.length}
            tone="amber"
          />
          <SummaryStat label="Empty" value={emptyRows.length} tone="neutral" />
        </div>

        {parsedRows.length > 0 ? (
          <div className="max-h-40 overflow-y-auto rounded-md border border-border/60 bg-card">
            <ul className="divide-y divide-border/40 text-xs">
              {parsedRows.map((row, idx) => (
                <li
                  key={`${row.voucherId}-${row.code}-${idx}`}
                  className="flex items-center justify-between gap-2 px-3 py-1.5"
                >
                  <span className="font-mono text-foreground">
                    {row.voucherId || "(blank)"} · {row.code || "(blank)"}
                  </span>
                  <StatusBadge
                    label={statusLabel(row.status)}
                    tone={statusTone(row.status)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {summary ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Added {formatNumber(summary.added)} coupon code(s) across{" "}
            {summary.rows} row(s).
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        ) : null}

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
              disabled={!canEdit || submitting || validRows.length === 0}
            >
              <Upload className="h-3.5 w-3.5" />
              Apply {validRows.length} row{validRows.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function statusLabel(status: ParsedRow["status"]): string {
  switch (status) {
    case "valid":
      return "Valid";
    case "unknown_voucher":
      return "Unknown voucher";
    case "duplicate":
      return "Duplicate";
    case "empty":
    default:
      return "Empty";
  }
}

function statusTone(
  status: ParsedRow["status"]
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "valid":
      return "success";
    case "duplicate":
      return "warning";
    case "unknown_voucher":
      return "danger";
    case "empty":
    default:
      return "neutral";
  }
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "rose" | "neutral";
}) {
  const toneStyles: Record<typeof tone, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    neutral: "bg-secondary text-muted-foreground",
  };
  return (
    <div className="rounded-md border border-border/60 bg-card p-2 text-center">
      <div
        className={`mx-auto inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md px-2 text-xs font-semibold ${toneStyles[tone]}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
