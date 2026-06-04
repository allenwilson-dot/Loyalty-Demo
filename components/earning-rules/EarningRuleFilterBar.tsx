"use client";

import * as React from "react";
import { Filter, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  EarningRuleStatus,
  EarningServiceSource,
  EarningTransactionType,
  EarningUserType,
} from "@/types/loyalty";

export interface EarningRuleFilters {
  query: string;
  serviceSource: EarningServiceSource | "all";
  userType: EarningUserType | "all";
  transactionType: EarningTransactionType | "all";
  rewardType: "POINT" | "PERCENT" | "all";
  status: EarningRuleStatus | "all";
  sortField: "reward" | "updated";
  sortDirection: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface EarningRuleFilterBarProps {
  filters: EarningRuleFilters;
  onChange: (next: EarningRuleFilters) => void;
  total: number;
  visible: number;
  className?: string;
}

const SOURCE_OPTIONS: { value: EarningServiceSource | "all"; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "SELFCARE", label: "Selfcare" },
  { value: "MOOLEE", label: "Moolee" },
  { value: "MFAISAA", label: "M Faisaa" },
  { value: "OTHER", label: "Other" },
];

const USER_TYPE_OPTIONS: { value: EarningUserType | "all"; label: string }[] = [
  { value: "all", label: "All user types" },
  { value: "PREPAID", label: "Prepaid" },
  { value: "POSTPAID", label: "Postpaid" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ALL", label: "Any" },
];

const TXN_OPTIONS: { value: EarningTransactionType | "all"; label: string }[] = [
  { value: "all", label: "All transaction types" },
  { value: "TRANSACTIONAL", label: "Transactional" },
  { value: "NON_TRANSACTIONAL", label: "Non-transactional" },
];

const REWARD_OPTIONS: { value: "POINT" | "PERCENT" | "all"; label: string }[] = [
  { value: "all", label: "All reward types" },
  { value: "POINT", label: "Fixed points" },
  { value: "PERCENT", label: "Percent of spend" },
];

const STATUS_OPTIONS: { value: EarningRuleStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export function EarningRuleFilterBar({
  filters,
  onChange,
  total,
  visible,
  className,
}: EarningRuleFilterBarProps) {
  const update = <K extends keyof EarningRuleFilters>(
    key: K,
    value: EarningRuleFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const isFiltered =
    filters.query.trim().length > 0 ||
    filters.serviceSource !== "all" ||
    filters.userType !== "all" ||
    filters.transactionType !== "all" ||
    filters.rewardType !== "all" ||
    filters.status !== "all";

  const clear = () =>
    onChange({
      ...filters,
      query: "",
      serviceSource: "all",
      userType: "all",
      transactionType: "all",
      rewardType: "all",
      status: "all",
    });

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
              placeholder="Search by event name or rule ID…"
              className="h-10 pl-9 pr-9"
              aria-label="Search earning rules"
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
            value={filters.serviceSource}
            onValueChange={(v) =>
              update("serviceSource", v as EarningRuleFilters["serviceSource"])
            }
          >
            <SelectTrigger className="h-10 w-[150px]" aria-label="Service source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.userType}
            onValueChange={(v) =>
              update("userType", v as EarningRuleFilters["userType"])
            }
          >
            <SelectTrigger className="h-10 w-[150px]" aria-label="User type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.transactionType}
            onValueChange={(v) =>
              update("transactionType", v as EarningRuleFilters["transactionType"])
            }
          >
            <SelectTrigger className="h-10 w-[170px]" aria-label="Transaction type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TXN_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.rewardType}
            onValueChange={(v) =>
              update("rewardType", v as EarningRuleFilters["rewardType"])
            }
          >
            <SelectTrigger className="h-10 w-[160px]" aria-label="Reward type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REWARD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(v) =>
              update("status", v as EarningRuleFilters["status"])
            }
          >
            <SelectTrigger className="h-10 w-[140px]" aria-label="Status">
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
              update("sortField", v as EarningRuleFilters["sortField"])
            }
          >
            <SelectTrigger className="h-10 w-[180px]" aria-label="Sort by">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reward">Sort · Reward value</SelectItem>
              <SelectItem value="updated">Sort · Last updated</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              update(
                "sortDirection",
                filters.sortDirection === "asc" ? "desc" : "asc"
              )
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
        <span className="font-semibold text-foreground">{total}</span> rules
      </p>
    </div>
  );
}
