"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { alertSeverityTone } from "@/lib/dashboard";
import type { OperationalAlert } from "@/types/loyalty";

export interface AlertDetailDialogProps {
  alert: OperationalAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onResolve?: (id: string) => void;
  onIgnore?: (id: string) => void;
}

export function AlertDetailDialog({
  alert,
  open,
  onOpenChange,
  canManage = false,
  onResolve,
  onIgnore,
}: AlertDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {alert ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl shadow-soft",
                    alertSeverityTone(alert.severity) === "danger"
                      ? "bg-rose-50 text-rose-600"
                      : alertSeverityTone(alert.severity) === "warning"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-sky-50 text-sky-600"
                  )}
                >
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      label={
                        alert.severity === "critical"
                          ? "Critical"
                          : alert.severity === "warning"
                          ? "Warning"
                          : "Info"
                      }
                      tone={alertSeverityTone(alert.severity)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {alert.module}
                    </span>
                  </div>
                  <DialogTitle>{alert.message}</DialogTitle>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <DialogDescription>{alert.details}</DialogDescription>
              <p className="text-xs text-muted-foreground">
                Detected {formatRelative(alert.occurredAt)} ·{" "}
                {formatDateTime(alert.occurredAt)}
              </p>
            </div>
            <DialogFooter className="mt-2">
              {alert.href ? (
                <Button variant="outline" asChild>
                  <Link href={alert.href}>
                    Open module <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
              {canManage && onIgnore ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onIgnore(alert.id);
                    onOpenChange(false);
                  }}
                >
                  Ignore
                </Button>
              ) : null}
              {canManage && onResolve ? (
                <Button
                  onClick={() => {
                    onResolve(alert.id);
                    onOpenChange(false);
                  }}
                >
                  Resolve
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Inline cn to keep this file self-contained.
function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}
