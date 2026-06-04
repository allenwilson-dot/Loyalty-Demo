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
  VoucherManagementMode,
  VoucherManagementStatus,
  VoucherStockHealth,
} from "@/types/loyalty";

export type StockFilter = "all" | "HEALTHY" | "WATCH" | "CRITICAL" | "OUT_OF_STOCK" | "API";
export type ExpiryFilter = "all" | "expiring_soon" | "expired";

export interface VoucherFilters {
  query: string;
  mode: VoucherManagementMode | "all";
  merchantId: string;
  status: VoucherManagementStatus | "all";
  stock: StockFilter;
  expiry: ExpiryFilter;
  sortField: "updated" | "remaining" | "expiry";
  sortDirection: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface VoucherFilterBarProps {
  filters: VoucherFilters;
  onChange: (next: VoucherFilters) => void;
  total: number;
  visible: number;
  merchantOptions: { value: string; label: string }[];
  className?: string;
}

const MODE_OPTIONS: { value: VoucherManagementMode | "all"; label: string }[] = [
  { value: "all", label: "All modes" },
  { value: "INVENTORY", label: "Inventory" },
  { value: "API", label: "API" },
];

const STATUS_OPTIONS: { value: VoucherManagementStatus | "all"; label: string }[] = [
  { value: "all", label: "All status" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const STOCK_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "All stock health" },
  { value: "HEALTHY", label: "Healthy" },
  { value: "WATCH", label: "Watch" },
  { value: "CRITICAL", label: "Critical" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "API", label: "API based" },
];

const EXPIRY_OPTIONS: { value: ExpiryFilter; label: string }[] = [
  { value: "all", label: "All expiry" },
  { value: "expiring_soon", label: "Expiring in 30 days" },
  { value: "expired", label: "Already expired" },
];

export function VoucherFilterBar({
  filters,
  onChange,
  total,
  visible,
  merchantOptions,
  className,
}: VoucherFilterBarProps) {
  const update = <K extends keyof VoucherFilters>(
    key: K,
    value: VoucherFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const isFiltered =
    filters.query.trim().length > 0 ||
    filters.mode !== "all" ||
    filters.merchantId !== "all" ||
    filters.status !== "all" ||
    filters.stock !== "all" ||
    filters.expiry !== "all";

  const clear = () =>
    onChange({
      ...filters,
      query: "",
      mode: "all",
      merchantId: "all",
      status: "all",
      stock: "all",
      expiry: "all",
      page: 1,
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
              placeholder="Search by voucher title, voucher ID, or merchant…"
              className="h-10 pl-9 pr-9"
              aria-label="Search vouchers"
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
            value={filters.mode}
            onValueChange={(v) =>
              update("mode", v as VoucherManagementMode | "all")
            }
          >
            <SelectTrigger className="h-10 w-[150px]" aria-label="Voucher mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.merchantId}
            onValueChange={(v) => update("merchantId", v)}
          >
            <SelectTrigger className="h-10 w-[220px]" aria-label="Merchant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All merchants</SelectItem>
              {merchantOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(v) =>
              update("status", v as VoucherManagementStatus | "all")
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

          <Select
            value={filters.stock}
            onValueChange={(v) => update("stock", v as StockFilter)}
          >
            <SelectTrigger className="h-10 w-[160px]" aria-label="Stock health">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STOCK_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.expiry}
            onValueChange={(v) => update("expiry", v as ExpiryFilter)}
          >
            <SelectTrigger className="h-10 w-[170px]" aria-label="Expiry status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map((opt) => (
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
              update("sortField", v as "updated" | "remaining" | "expiry")
            }
          >
            <SelectTrigger className="h-10 w-[220px]" aria-label="Sort by">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Sort · Last updated</SelectItem>
              <SelectItem value="remaining">Sort · Remaining inventory</SelectItem>
              <SelectItem value="expiry">Sort · Expiry date</SelectItem>
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
        <span className="font-semibold text-foreground">{total}</span> vouchers
      </p>
    </div>
  );
}
