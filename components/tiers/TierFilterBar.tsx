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
import type { TierStatus } from "@/types/loyalty";

export interface TierFilters {
  query: string;
  status: TierStatus | "all";
  sortField: "name" | "threshold" | "lastUpdated";
  sortDirection: "asc" | "desc";
}

export interface TierFilterBarProps {
  filters: TierFilters;
  onChange: (next: TierFilters) => void;
  total: number;
  visible: number;
  className?: string;
}

const STATUS_OPTIONS: { value: TierStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const SORT_OPTIONS: { value: TierFilters["sortField"]; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "threshold", label: "Threshold value" },
  { value: "lastUpdated", label: "Last updated" },
];

/**
 * Controlled filter bar for the tier table. Mirrors the styling used by
 * the user management filter bar so the two experiences feel cohesive.
 */
export function TierFilterBar({
  filters,
  onChange,
  total,
  visible,
  className,
}: TierFilterBarProps) {
  const update = <K extends keyof TierFilters>(
    key: K,
    value: TierFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const isFiltered = filters.query.trim().length > 0 || filters.status !== "all";
  const clear = () =>
    onChange({ ...filters, query: "", status: "all" });

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
              placeholder="Search tier by name…"
              className="h-10 pl-9 pr-9"
              aria-label="Search tiers"
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

          <Select
            value={filters.status}
            onValueChange={(v) => update("status", v as TierStatus | "all")}
          >
            <SelectTrigger className="h-10 w-[160px]" aria-label="Filter by status">
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.sortField}
            onValueChange={(v) =>
              update("sortField", v as TierFilters["sortField"])
            }
          >
            <SelectTrigger className="h-10 w-[200px]" aria-label="Sort by">
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
        <span className="font-semibold text-foreground">{total}</span> tiers
      </p>
    </div>
  );
}
