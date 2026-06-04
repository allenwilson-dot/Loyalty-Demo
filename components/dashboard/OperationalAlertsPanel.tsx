"use client";

import * as React from "react";
import { Bell, Check, Eye, ShieldAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn, formatRelative } from "@/lib/utils";
import { alertSeverityTone } from "@/lib/dashboard";
import type { OperationalAlert } from "@/types/loyalty";

import { AlertDetailDialog } from "./AlertDetailDialog";

export interface OperationalAlertsPanelProps {
  alerts: OperationalAlert[];
  canManage: boolean;
  onResolve: (id: string) => void;
  onIgnore: (id: string) => void;
}

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 } as const;

export function OperationalAlertsPanel({
  alerts,
  canManage,
  onResolve,
  onIgnore,
}: OperationalAlertsPanelProps) {
  const [active, setActive] = React.useState<OperationalAlert | null>(null);
  const sorted = React.useMemo(
    () =>
      [...alerts].sort((a, b) => {
        const rank = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
        if (rank !== 0) return rank;
        return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      }),
    [alerts]
  );

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-secondary/40 p-8 text-center">
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-card text-emerald-600 shadow-soft">
          <Bell className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium text-foreground">No active alerts</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Everything is operating within normal parameters.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {sorted.map((alert) => {
          const tone = alertSeverityTone(alert.severity);
          const iconWrap =
            tone === "danger"
              ? "bg-rose-50 text-rose-600"
              : tone === "warning"
              ? "bg-amber-50 text-amber-600"
              : "bg-sky-50 text-sky-600";
          return (
            <li
              key={alert.id}
              className={cn(
                "rounded-xl border bg-card p-4 shadow-soft",
                tone === "danger"
                  ? "border-rose-200/70"
                  : tone === "warning"
                  ? "border-amber-200/70"
                  : "border-border/60"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    iconWrap
                  )}
                >
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={
                        alert.severity === "critical"
                          ? "Critical"
                          : alert.severity === "warning"
                          ? "Warning"
                          : "Info"
                      }
                      tone={tone}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {alert.module}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {formatRelative(alert.occurredAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {alert.message}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {alert.primaryCta ? (
                  canManage || alert.primaryCta.action === "view" ? (
                    <Button
                      size="sm"
                      variant={
                        alert.primaryCta.action === "resolve"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        if (alert.primaryCta.action === "resolve") {
                          onResolve(alert.id);
                        } else if (alert.primaryCta.action === "ignore") {
                          onIgnore(alert.id);
                        } else {
                          setActive(alert);
                        }
                      }}
                    >
                      {alert.primaryCta.action === "resolve" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : alert.primaryCta.action === "ignore" ? (
                        <X className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {alert.primaryCta.label}
                    </Button>
                  ) : null
                ) : null}
                {alert.secondaryCta && canManage ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (alert.secondaryCta?.action === "resolve") {
                        onResolve(alert.id);
                      } else if (alert.secondaryCta?.action === "ignore") {
                        onIgnore(alert.id);
                      } else {
                        setActive(alert);
                      }
                    }}
                  >
                    {alert.secondaryCta.action === "ignore" ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {alert.secondaryCta.label}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActive(alert)}
                  className="ml-auto"
                >
                  View details
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <AlertDetailDialog
        alert={active}
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
        canManage={canManage}
        onResolve={onResolve}
        onIgnore={onIgnore}
      />
    </>
  );
}
