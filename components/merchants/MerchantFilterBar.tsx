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
  MerchantApiEnabled,
  MerchantKycStatus,
  MerchantOnboardingStatus,
  MerchantType,
} from "@/types/loyalty";

export interface MerchantFilters {
  query: string;
  merchantType: MerchantType | "all";
  apiEnabled: MerchantApiEnabled | "all";
  kycStatus: MerchantKycStatus | "all";
  status: MerchantOnboardingStatus | "all";
  sortField: "name" | "updated";
  sortDirection: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface MerchantFilterBarProps {
  filters: MerchantFilters;
  onChange: (next: MerchantFilters) => void;
  total: number;
  visible: number;
  className?: string;
}

const TYPE_OPTIONS: { value: MerchantType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "INTERNAL", label: "Internal" },
  { value: "EXTERNAL", label: "External" },
  { value: "PARTNER", label: "Partner" },
];

const API_OPTIONS: { value: MerchantApiEnabled | "all"; label: string }[] = [
  { value: "all", label: "API · Any" },
  { value: "YES", label: "API enabled" },
  { value: "NO", label: "API disabled" },
];

const KYC_OPTIONS: { value: MerchantKycStatus | "all"; label: string }[] = [
  { value: "all", label: "KYC · Any" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_OPTIONS: { value: MerchantOnboardingStatus | "all"; label: string }[] = [
  { value: "all", label: "Status · Any" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export function MerchantFilterBar({
  filters,
  onChange,
  total,
  visible,
  className,
}: MerchantFilterBarProps) {
  const update = <K extends keyof MerchantFilters>(
    key: K,
    value: MerchantFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const isFiltered =
    filters.query.trim().length > 0 ||
    filters.merchantType !== "all" ||
    filters.apiEnabled !== "all" ||
    filters.kycStatus !== "all" ||
    filters.status !== "all";

  const clear = () =>
    onChange({
      ...filters,
      query: "",
      merchantType: "all",
      apiEnabled: "all",
      kycStatus: "all",
      status: "all",
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
              placeholder="Search by name, merchant ID, or contact email…"
              className="h-10 pl-9 pr-9"
              aria-label="Search merchants"
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
            value={filters.merchantType}
            onValueChange={(v) =>
              update("merchantType", v as MerchantType | "all")
            }
          >
            <SelectTrigger className="h-10 w-[150px]" aria-label="Merchant type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.apiEnabled}
            onValueChange={(v) =>
              update("apiEnabled", v as MerchantApiEnabled | "all")
            }
          >
            <SelectTrigger className="h-10 w-[160px]" aria-label="API enabled">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {API_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.kycStatus}
            onValueChange={(v) =>
              update("kycStatus", v as MerchantKycStatus | "all")
            }
          >
            <SelectTrigger className="h-10 w-[150px]" aria-label="KYC status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KYC_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(v) =>
              update("status", v as MerchantOnboardingStatus | "all")
            }
          >
            <SelectTrigger className="h-10 w-[150px]" aria-label="Status">
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
              update("sortField", v as "name" | "updated")
            }
          >
            <SelectTrigger className="h-10 w-[200px]" aria-label="Sort by">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort · Merchant name</SelectItem>
              <SelectItem value="updated">Sort · Last updated</SelectItem>
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
        <span className="font-semibold text-foreground">{total}</span> merchants
      </p>
    </div>
  );
}
