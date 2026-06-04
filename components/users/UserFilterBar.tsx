"use client";

import * as React from "react";
import { Filter, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  TierId,
  UserAccountStatus,
  UserFilters,
  UserSortField,
} from "@/types/loyalty";

export interface UserFilterBarProps {
  filters: UserFilters;
  onChange: (next: UserFilters) => void;
  total: number;
  visible: number;
  className?: string;
}

const TIER_OPTIONS: { value: TierId | "all"; label: string }[] = [
  { value: "all", label: "All tiers" },
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "diamond", label: "Diamond" },
];

const STATUS_OPTIONS: { value: UserAccountStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "locked", label: "Locked" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
];

const CHANNEL_OPTIONS: { value: "selfcare" | "moolee" | "mfaisaa" | "all"; label: string }[] = [
  { value: "all", label: "All channels" },
  { value: "selfcare", label: "Selfcare" },
  { value: "moolee", label: "Moolee" },
  { value: "mfaisaa", label: "M Faisaa" },
];

const SORT_OPTIONS: { value: UserSortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "tier", label: "Tier" },
  { value: "balance", label: "Points balance" },
  { value: "activity", label: "Last activity" },
];

/**
 * Filter + sort bar for the user table. Controlled — the page owns the
 * `UserFilters` state and re-derives the visible users on every change.
 */
export function UserFilterBar({
  filters,
  onChange,
  total,
  visible,
  className,
}: UserFilterBarProps) {
  const update = React.useCallback(
    <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => {
      onChange({ ...filters, [key]: value, page: key === "page" ? (value as number) : 1 });
    },
    [filters, onChange]
  );

  const isFiltered =
    filters.query.trim().length > 0 ||
    filters.tier !== "all" ||
    filters.status !== "all" ||
    filters.channel !== "all";

  const clear = () => {
    onChange({
      ...filters,
      query: "",
      tier: "all",
      status: "all",
      channel: "all",
      page: 1,
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4 shadow-soft",
        className
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full min-w-[220px] flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={filters.query}
              onChange={(e) => update("query", e.target.value)}
              placeholder="Search by name, NID, MSISDN, or wallet ID…"
              className="h-10 pl-9 pr-9"
              aria-label="Search users"
            />
            {filters.query ? (
              <button
                type="button"
                onClick={() => update("query", "")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filters.tier}
              onValueChange={(v) => update("tier", v as UserFilters["tier"])}
            >
              <SelectTrigger className="h-10 w-[150px]" aria-label="Filter by tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(v) => update("status", v as UserFilters["status"])}
            >
              <SelectTrigger className="h-10 w-[150px]" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.channel}
              onValueChange={(v) => update("channel", v as UserFilters["channel"])}
            >
              <SelectTrigger className="h-10 w-[150px]" aria-label="Filter by channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.sortField}
            onValueChange={(v) => update("sortField", v as UserSortField)}
          >
            <SelectTrigger className="h-10 w-[180px]" aria-label="Sort by">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  Sort · {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              update("sortDirection", filters.sortDirection === "asc" ? "desc" : "asc")
            }
            aria-label="Toggle sort direction"
            className="h-10 px-3"
          >
            {filters.sortDirection === "asc" ? "Asc" : "Desc"}
          </Button>
          {isFiltered ? (
            <Button variant="ghost" size="sm" onClick={clear} className="h-10">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{visible}</span> of{" "}
        <span className="font-semibold text-foreground">{total}</span> users
      </p>
    </div>
  );
}
