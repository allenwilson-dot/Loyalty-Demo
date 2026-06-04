"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Lock,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Unlock,
  User as UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { cn, formatCompact, formatRelative } from "@/lib/utils";
import { TIER_BY_ID } from "@/data/mockTiers";
import type {
  TierId,
  User,
  UserAccountStatus,
  UserSortField,
} from "@/types/loyalty";

import { useUsers, statusBadgeTone } from "./UsersProvider";

export interface UsersTableProps {
  users: User[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort: (field: UserSortField) => void;
  sortField: UserSortField;
  sortDirection: "asc" | "desc";
  onView: (user: User) => void;
  onAddPoints: (user: User) => void;
  onReversePoints: (user: User) => void;
  onToggleLock: (user: User) => void;
  className?: string;
}

const STATUS_LABEL: Record<UserAccountStatus, string> = {
  active: "Active",
  locked: "Locked",
  suspended: "Suspended",
  inactive: "Inactive",
};

const TIER_TONE: Record<TierId, "neutral" | "info" | "accent" | "warning" | "success"> = {
  bronze: "neutral",
  silver: "info",
  gold: "warning",
  platinum: "accent",
  diamond: "success",
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
  user: User;
  canEdit: boolean;
  onView: () => void;
  onAddPoints: () => void;
  onReversePoints: () => void;
  onToggleLock: () => void;
}

function RowMenu({
  user,
  canEdit,
  onView,
  onAddPoints,
  onReversePoints,
  onToggleLock,
}: RowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handle = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const isLocked = user.status === "locked";
  const isSuspendedOrInactive =
    user.status === "suspended" || user.status === "inactive";
  const canAdjust = canEdit && user.status === "active";
  const canLockToggle = canEdit && !isSuspendedOrInactive;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Open actions for ${user.fullName}`}
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
            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> View profile
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canAdjust}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onAddPoints();
            }}
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600" /> Add points
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canAdjust}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onReversePoints();
            }}
          >
            <RotateCcw className="h-3.5 w-3.5 text-rose-600" /> Reverse points
          </button>
          <div className="my-1 h-px bg-border/60" />
          <button
            type="button"
            role="menuitem"
            disabled={!canLockToggle}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onToggleLock();
            }}
          >
            {isLocked ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-emerald-600" /> Unlock user
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-amber-600" /> Lock user
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function UsersTable({
  users,
  page,
  pageSize,
  onPageChange,
  onSort,
  sortField,
  sortDirection,
  onView,
  onAddPoints,
  onReversePoints,
  onToggleLock,
  className,
}: UsersTableProps) {
  const { canEdit } = useUsers();
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageUsers = users.slice(start, start + pageSize);

  const headerButton = (label: string, field: UserSortField, align: "left" | "right" = "left") => (
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

  if (users.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-card p-6 shadow-soft", className)}>
        <EmptyState
          icon={UserIcon}
          title="No users match these filters"
          description="Try clearing search or selecting a different tier, status, or channel."
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
                {headerButton("User", "name")}
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  NID · MSISDN
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Wallet
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                {headerButton("Tier", "tier")}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                {headerButton("Balance", "balance", "right")}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Lifetime
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                {headerButton("Last activity", "activity")}
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pageUsers.map((user) => {
              const tier = TIER_BY_ID[user.tierId];
              const accountStatus = (
                ["active", "locked", "suspended", "inactive"] as UserAccountStatus[]
              ).includes(user.status as UserAccountStatus)
                ? (user.status as UserAccountStatus)
                : "inactive";
              return (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onView(user)}
                      className="flex items-center gap-3 text-left transition-colors hover:text-accent"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-xs font-semibold uppercase text-navy-900">
                        {user.fullName
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {user.fullName}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-xs font-medium text-foreground">
                      {user.nid}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.msisdn}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {user.walletId}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={tier.name}
                      tone={TIER_TONE[user.tierId]}
                    />
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="text-sm font-semibold text-foreground">
                      {formatCompact(user.pointsBalance)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">pts</div>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="text-xs text-foreground">
                      E {formatCompact(user.lifetimePoints)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      R {formatCompact(Math.max(0, user.lifetimePoints - user.pointsBalance - 1000))}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={STATUS_LABEL[accountStatus]}
                      tone={statusBadgeTone(accountStatus)}
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                    {formatRelative(user.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <RowMenu
                      user={user}
                      canEdit={canEdit}
                      onView={() => onView(user)}
                      onAddPoints={() => onAddPoints(user)}
                      onReversePoints={() => onReversePoints(user)}
                      onToggleLock={() => onToggleLock(user)}
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
          <span className="font-semibold text-foreground">{totalPages}</span> · {pageUsers.length}{" "}
          rows on screen
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
