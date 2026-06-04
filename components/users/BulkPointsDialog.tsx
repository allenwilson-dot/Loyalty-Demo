"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, FileUp, MinusCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";
import type { BulkAdjustmentPreviewRow } from "@/types/loyalty";

import { useUsers, type AdjustmentKind } from "./UsersProvider";

const SAMPLE_CSV = `MSISDN,POINTS,REASON
+960 7771234,100,Welcome bonus
+1 312 555 0177,50,Service recovery
+81 80 5555 0211,250,Loyalty bonus
+960 7794118,500,Campaign bonus
+91 98555 10101,75,Goodwill credit`;

export interface BulkPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

interface ParsedRow {
  rowNumber: number;
  msisdn: string;
  points: number | null;
  reason: string;
}

interface PreviewSummary {
  total: number;
  valid: number;
  invalid: number;
  skipped: number;
}

function parseCsv(raw: string): ParsedRow[] {
  if (!raw.trim()) return [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines
    .filter((line) => !/^MSISDN\s*,/i.test(line))
    .map((line, idx) => {
      const [msisdnRaw, pointsRaw, ...rest] = line.split(",");
      const msisdn = (msisdnRaw ?? "").trim();
      const points = Number((pointsRaw ?? "").trim());
      const reason = rest.join(",").trim();
      return {
        rowNumber: idx + 1,
        msisdn,
        points: Number.isFinite(points) ? points : null,
        reason,
      };
    });
}

function summarize(rows: BulkAdjustmentPreviewRow[]): PreviewSummary {
  return rows.reduce<PreviewSummary>(
    (acc, r) => {
      acc.total += 1;
      if (r.status === "valid") acc.valid += 1;
      else if (r.status === "skipped") acc.skipped += 1;
      else acc.invalid += 1;
      return acc;
    },
    { total: 0, valid: 0, invalid: 0, skipped: 0 }
  );
}

/**
 * Bulk points adjustment dialog. Admins paste a CSV, get a per-row preview
 * with valid / invalid / skipped tags, and apply only the valid rows.
 */
export function BulkPointsDialog({
  open,
  onOpenChange,
  onComplete,
}: BulkPointsDialogProps) {
  const { users, applyBulk, canEdit } = useUsers();
  const [kind, setKind] = React.useState<AdjustmentKind>("add");
  const [csv, setCsv] = React.useState(SAMPLE_CSV);
  const [notify, setNotify] = React.useState(true);
  const [preview, setPreview] = React.useState<BulkAdjustmentPreviewRow[]>([]);
  const [result, setResult] = React.useState<null | {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  }>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setKind("add");
      setCsv(SAMPLE_CSV);
      setNotify(true);
      setResult(null);
      setError(null);
    }
  }, [open]);

  const generatePreview = React.useCallback(() => {
    setError(null);
    setResult(null);
    const rows = parseCsv(csv);
    if (rows.length === 0) {
      setError("Paste at least one CSV row to preview.");
      setPreview([]);
      return;
    }
    const enriched: BulkAdjustmentPreviewRow[] = rows.map((row) => {
      if (!row.msisdn) {
        return {
          rowNumber: row.rowNumber,
          msisdn: "",
          points: row.points ?? 0,
          reason: row.reason,
          status: "invalid",
          message: "Missing MSISDN",
        };
      }
      if (row.points === null || row.points <= 0) {
        return {
          rowNumber: row.rowNumber,
          msisdn: row.msisdn,
          points: 0,
          reason: row.reason,
          status: "invalid",
          message: "Points must be greater than 0",
        };
      }
      if (!row.reason) {
        return {
          rowNumber: row.rowNumber,
          msisdn: row.msisdn,
          points: row.points,
          reason: "",
          status: "invalid",
          message: "Reason is required",
        };
      }
      const user = users.find(
        (u) =>
          u.msisdn.replace(/\s+/g, "") === row.msisdn.replace(/\s+/g, "") ||
          u.phone.replace(/\s+/g, "") === row.msisdn.replace(/\s+/g, "")
      );
      if (!user) {
        return {
          rowNumber: row.rowNumber,
          msisdn: row.msisdn,
          points: row.points,
          reason: row.reason,
          status: "invalid",
          message: "MSISDN not found",
        };
      }
      if (user.status !== "active") {
        return {
          rowNumber: row.rowNumber,
          msisdn: row.msisdn,
          points: row.points,
          reason: row.reason,
          status: "skipped",
          message: `User is ${user.status}`,
          userId: user.id,
          userName: user.fullName,
        };
      }
      if (kind === "reverse" && row.points > user.pointsBalance) {
        return {
          rowNumber: row.rowNumber,
          msisdn: row.msisdn,
          points: row.points,
          reason: row.reason,
          status: "invalid",
          message: "Insufficient points to reverse",
          userId: user.id,
          userName: user.fullName,
        };
      }
      return {
        rowNumber: row.rowNumber,
        msisdn: row.msisdn,
        points: row.points,
        reason: row.reason,
        status: "valid",
        userId: user.id,
        userName: user.fullName,
      };
    });
    setPreview(enriched);
  }, [csv, kind, users]);

  React.useEffect(() => {
    if (open) {
      // Auto-preview on open so the table isn't empty.
      const id = setTimeout(generatePreview, 50);
      return () => clearTimeout(id);
    }
  }, [open, generatePreview]);

  const summary = summarize(preview);
  const validRows = preview.filter((r) => r.status === "valid");
  const blocked = !canEdit;

  const handleApply = () => {
    if (validRows.length === 0) return;
    const res = applyBulk({ kind, rows: validRows, notifyUser: notify });
    setResult({
      total: res.total,
      successful: res.successful,
      failed: res.failed,
      skipped: res.skipped,
    });
    onComplete?.(
      `Bulk ${kind === "add" ? "added" : "reversed"} ${res.successful} of ${res.total} rows.`
    );
  };

  const reset = () => {
    onOpenChange(false);
    setResult(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              <FileUp className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Bulk points adjustment</DialogTitle>
              <DialogDescription>
                Paste a CSV with MSISDN, points, and reason columns. Locked and
                suspended users will be skipped automatically.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {blocked ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              You don&rsquo;t have permission to run bulk adjustments. Switch to
              the admin role to use this tool.
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Adjustment type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["add", "reverse"] as AdjustmentKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setKind(k);
                    setResult(null);
                    setTimeout(generatePreview, 0);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    kind === k
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-border/60 bg-card text-foreground hover:bg-secondary"
                  )}
                >
                  {k === "add" ? "Add points" : "Reverse points"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-csv">CSV input</Label>
            <textarea
              id="bulk-csv"
              className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              spellCheck={false}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Expected header: MSISDN, POINTS, REASON</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={generatePreview}
              >
                <Upload className="h-3.5 w-3.5" /> Re-parse
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Notify users</p>
            <p className="text-xs text-muted-foreground">
              Send an in-app notification for each successful adjustment.
            </p>
          </div>
          <Switch
            checked={notify}
            onCheckedChange={setNotify}
            disabled={blocked}
            aria-label="Notify users"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <SummaryCell label="Total rows" value={summary.total} tone="navy" />
          <SummaryCell label="Valid" value={summary.valid} tone="emerald" />
          <SummaryCell label="Invalid" value={summary.invalid} tone="rose" />
          <SummaryCell label="Skipped" value={summary.skipped} tone="amber" />
        </div>

        <div className="max-h-64 overflow-auto rounded-lg border border-border/60">
          <table className="min-w-full divide-y divide-border/60 text-xs">
            <thead className="sticky top-0 bg-secondary/60 text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">MSISDN</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-right">Points</th>
                <th className="px-3 py-2 text-left">Reason</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {preview.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    Paste rows to see a preview.
                  </td>
                </tr>
              ) : (
                preview.map((row) => (
                  <tr key={row.rowNumber} className="bg-card">
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.rowNumber}
                    </td>
                    <td className="px-3 py-2 font-mono text-foreground">
                      {row.msisdn || "—"}
                    </td>
                    <td className="px-3 py-2 text-foreground">
                      {row.userName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-foreground">
                      {row.points}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.reason || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        label={row.status}
                        tone={
                          row.status === "valid"
                            ? "success"
                            : row.status === "skipped"
                            ? "warning"
                            : "danger"
                        }
                        icon={
                          row.status === "valid" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : row.status === "skipped" ? (
                            <MinusCircle className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )
                        }
                      />
                      {row.message ? (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {row.message}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-medium">Adjustment complete</p>
            <p className="mt-0.5">
              {result.successful} of {result.total} rows applied ·{" "}
              {result.failed} failed · {result.skipped} skipped
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={reset}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button
              type="button"
              onClick={handleApply}
              disabled={blocked || validRows.length === 0}
            >
              {kind === "add" ? "Apply add" : "Apply reverse"} ·{" "}
              {validRows.length} rows
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "navy" | "emerald" | "rose" | "amber";
}) {
  const toneStyles: Record<typeof tone, string> = {
    navy: "bg-navy-900/5 text-navy-900",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2">
      <div
        className={cn(
          "mx-auto mb-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold",
          toneStyles[tone]
        )}
      >
        {value}
      </div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
