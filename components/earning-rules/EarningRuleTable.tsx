"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MoreHorizontal,
  PlayCircle,
  Power,
  PowerOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { cn, formatCompact, formatDate } from "@/lib/utils";
import type {
  EarningRule,
  EarningRuleStatus,
  EarningServiceSource,
  EarningTransactionType,
  EarningUserType,
} from "@/types/loyalty";

import { useEarningRules } from "./EarningRulesProvider";

export interface EarningRuleTableProps {
  rules: EarningRule[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort: (field: "reward" | "updated") => void;
  sortField: "reward" | "updated";
  sortDirection: "asc" | "desc";
  onView: (rule: EarningRule) => void;
  onEdit: (rule: EarningRule) => void;
  onToggleStatus: (rule: EarningRule) => void;
  onTest: (rule: EarningRule) => void;
  className?: string;
}

const SOURCE_LABEL: Record<EarningServiceSource, string> = {
  SELFCARE: "Selfcare",
  MOOLEE: "Moolee",
  MFAISAA: "M Faisaa",
  OTHER: "Other",
};

const SOURCE_TONE: Record<EarningServiceSource, "info" | "accent" | "warning" | "neutral"> = {
  SELFCARE: "info",
  MOOLEE: "accent",
  MFAISAA: "warning",
  OTHER: "neutral",
};

const USER_TYPE_LABEL: Record<EarningUserType, string> = {
  PREPAID: "Prepaid",
  POSTPAID: "Postpaid",
  HYBRID: "Hybrid",
  ALL: "All",
};

const TXN_TYPE_LABEL: Record<EarningTransactionType, string> = {
  TRANSACTIONAL: "Transactional",
  NON_TRANSACTIONAL: "Non-transactional",
};

const STATUS_TONE: Record<EarningRuleStatus, "success" | "neutral"> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
};

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  return direction === "asc" ? (
    <ArrowUp className="h-3 w-3" />
  ) : (
    <ArrowDown className="h-3 w-3" />
  );
}

interface RowMenuProps {
  rule: EarningRule;
  canEdit: boolean;
  canApplyEvents: boolean;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onTest: () => void;
}

function RowMenu({
  rule,
  canEdit,
  canApplyEvents,
  onView,
  onEdit,
  onToggleStatus,
  onTest,
}: RowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isInactive = rule.status === "INACTIVE";

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Open actions for ${rule.id}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 min-w-[180px] overflow-hidden rounded-lg border border-border/70 bg-card shadow-elevated"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
            onClick={() => {
              setOpen(false);
              onView();
            }}
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" /> View details
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canEdit}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Edit3 className="h-3.5 w-3.5 text-accent" /> Edit rule
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canApplyEvents}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onTest();
            }}
          >
            <PlayCircle className="h-3.5 w-3.5 text-emerald-600" /> Test rule
          </button>
          <div className="my-1 h-px bg-border/60" />
          <button
            type="button"
            role="menuitem"
            disabled={!canEdit}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onToggleStatus();
            }}
          >
            {isInactive ? (
              <>
                <Power className="h-3.5 w-3.5 text-emerald-600" /> Activate
              </>
            ) : (
              <>
                <PowerOff className="h-3.5 w-3.5 text-amber-600" /> Deactivate
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function EarningRuleTable({
  rules,
  page,
  pageSize,
  onPageChange,
  onSort,
  sortField,
  sortDirection,
  onView,
  onEdit,
  onToggleStatus,
  onTest,
  className,
}: EarningRuleTableProps) {
  const { canEdit, canApplyEvents } = useEarningRules();

  const totalPages = Math.max(1, Math.ceil(rules.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRules = rules.slice(start, start + pageSize);

  const headerButton = (
    label: string,
    field: "reward" | "updated",
    align: "left" | "right" = "left"
  ) => (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
        align === "right" && "justify-end"
      )}
    >
      {label}
      <SortIndicator active={sortField === field} direction={sortDirection} />
    </button>
  );

  if (rules.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-card p-6 shadow-soft", className)}>
        <EmptyState
          icon={Edit3}
          title="No earning rules match these filters"
          description="Try clearing search or selecting a different source, user type, or status."
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-secondary/40">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Rule ID
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Service source
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  User type
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Transaction type
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Event name
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Reward
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {headerButton("Reward value", "reward", "right")}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Max amount
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Expiry
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Push
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                {headerButton("Last updated", "updated")}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pageRules.map((rule) => {
              const isInactive = rule.status === "INACTIVE";
              return (
                <tr key={rule.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onView(rule)}
                      className="text-left font-mono text-xs font-semibold text-foreground transition-colors hover:text-accent"
                    >
                      {rule.id}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={SOURCE_LABEL[rule.serviceSource]}
                      tone={SOURCE_TONE[rule.serviceSource]}
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-foreground">
                    {USER_TYPE_LABEL[rule.userType]}
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-foreground">
                    {TXN_TYPE_LABEL[rule.transactionType]}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-semibold text-foreground">
                      {rule.eventName === "Custom Event" && rule.customEventName
                        ? rule.customEventName
                        : rule.eventName}
                    </p>
                    {rule.eventName === "Custom Event" ? (
                      <p className="text-[11px] text-muted-foreground">
                        Custom event
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={rule.rewardType === "POINT" ? "Points" : "Percent"}
                      tone={rule.rewardType === "POINT" ? "info" : "accent"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="text-sm font-semibold text-foreground">
                      {rule.rewardValue}
                      <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                        {rule.rewardType === "POINT" ? "pts" : "%"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-top text-xs text-foreground">
                    {rule.maximumTransactionAmount
                      ? formatCompact(rule.maximumTransactionAmount)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right align-top text-xs text-foreground">
                    {rule.expiryDays ? `${rule.expiryDays}d` : "—"}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {rule.pushNotification ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                        title={rule.notificationMessage ?? ""}
                      >
                        <Bell className="h-3 w-3" /> On
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Off</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={isInactive ? "Inactive" : "Active"}
                      tone={STATUS_TONE[rule.status]}
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                    {formatDate(rule.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <RowMenu
                      rule={rule}
                      canEdit={canEdit}
                      canApplyEvents={canApplyEvents}
                      onView={() => onView(rule)}
                      onEdit={() => onEdit(rule)}
                      onToggleStatus={() => onToggleStatus(rule)}
                      onTest={() => onTest(rule)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start justify-between gap-2 border-t border-border/60 bg-secondary/20 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <span>
          Page <span className="font-semibold text-foreground">{page}</span> of{" "}
          <span className="font-semibold text-foreground">{totalPages}</span> ·{" "}
          {pageRules.length} rows on screen
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
