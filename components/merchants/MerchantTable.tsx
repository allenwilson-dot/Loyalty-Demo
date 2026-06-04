"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MoreHorizontal,
  Plug,
  Power,
  PowerOff,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { cn, formatDate } from "@/lib/utils";
import type {
  MerchantApiEnabled,
  MerchantKycStatus,
  MerchantOnboarding,
  MerchantOnboardingStatus,
  MerchantType,
} from "@/types/loyalty";

import { useMerchants } from "./MerchantsProvider";

export interface MerchantTableProps {
  merchants: MerchantOnboarding[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort: (field: "name" | "updated") => void;
  sortField: "name" | "updated";
  sortDirection: "asc" | "desc";
  onView: (merchant: MerchantOnboarding) => void;
  onEdit: (merchant: MerchantOnboarding) => void;
  onToggleStatus: (merchant: MerchantOnboarding) => void;
  onKycAction: (merchant: MerchantOnboarding) => void;
  className?: string;
}

const TYPE_LABEL: Record<MerchantType, string> = {
  INTERNAL: "Internal",
  EXTERNAL: "External",
  PARTNER: "Partner",
};

const TYPE_TONE: Record<MerchantType, "info" | "accent" | "warning"> = {
  INTERNAL: "info",
  EXTERNAL: "accent",
  PARTNER: "warning",
};

const KYC_TONE: Record<MerchantKycStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const STATUS_TONE: Record<MerchantOnboardingStatus, "success" | "neutral"> = {
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
  merchant: MerchantOnboarding;
  canEdit: boolean;
  canApproveKyc: boolean;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onKycAction: () => void;
}

function RowMenu({
  merchant,
  canEdit,
  canApproveKyc,
  onView,
  onEdit,
  onToggleStatus,
  onKycAction,
}: RowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isInactive = merchant.status === "INACTIVE";
  const kycPending = merchant.kycStatus === "PENDING";

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
        aria-label={`Open actions for ${merchant.merchantName}`}
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
            <Edit3 className="h-3.5 w-3.5 text-accent" /> Edit merchant
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canApproveKyc}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onKycAction();
            }}
          >
            {kycPending ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Review KYC
              </>
            ) : (
              <>
                <ShieldX className="h-3.5 w-3.5 text-rose-600" /> Re-evaluate KYC
              </>
            )}
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

export function MerchantTable({
  merchants,
  page,
  pageSize,
  onPageChange,
  onSort,
  sortField,
  sortDirection,
  onView,
  onEdit,
  onToggleStatus,
  onKycAction,
  className,
}: MerchantTableProps) {
  const { canEdit, canApproveKyc } = useMerchants();

  const totalPages = Math.max(1, Math.ceil(merchants.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageMerchants = merchants.slice(start, start + pageSize);

  const headerButton = (
    label: string,
    field: "name" | "updated",
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

  if (merchants.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-card p-6 shadow-soft", className)}>
        <EmptyState
          icon={Edit3}
          title="No merchants match these filters"
          description="Try clearing search or selecting a different type, KYC, or status."
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
                  Merchant ID
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                {headerButton("Merchant", "name")}
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  API
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  KYC
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Vouchers
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
            {pageMerchants.map((merchant) => {
              const isInactive = merchant.status === "INACTIVE";
              const apiLabel: MerchantApiEnabled = merchant.apiEnabled;
              return (
                <tr
                  key={merchant.id}
                  className="transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onView(merchant)}
                      className="text-left font-mono text-xs font-semibold text-foreground transition-colors hover:text-accent"
                    >
                      {merchant.merchantId}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onView(merchant)}
                      className="text-left transition-colors hover:text-accent"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {merchant.merchantName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {merchant.city ?? "—"}
                      </p>
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={TYPE_LABEL[merchant.merchantType]}
                      tone={TYPE_TONE[merchant.merchantType]}
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-foreground">
                    <p className="font-medium">{merchant.contactPerson || "—"}</p>
                    <p className="text-muted-foreground">{merchant.contactEmail || "—"}</p>
                    <p className="text-muted-foreground">{merchant.contactNumber || "—"}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {apiLabel === "YES" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <Plug className="h-3 w-3" /> Enabled
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={merchant.kycStatus}
                      tone={KYC_TONE[merchant.kycStatus]}
                      icon={
                        merchant.kycStatus === "APPROVED" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : merchant.kycStatus === "REJECTED" ? (
                          <XCircle className="h-3 w-3" />
                        ) : undefined
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right align-top text-sm font-semibold text-foreground">
                    {merchant.voucherCount}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge
                      label={isInactive ? "Inactive" : "Active"}
                      tone={STATUS_TONE[merchant.status]}
                    />
                  </td>
                  <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                    {formatDate(merchant.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <RowMenu
                      merchant={merchant}
                      canEdit={canEdit}
                      canApproveKyc={canApproveKyc}
                      onView={() => onView(merchant)}
                      onEdit={() => onEdit(merchant)}
                      onToggleStatus={() => onToggleStatus(merchant)}
                      onKycAction={() => onKycAction(merchant)}
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
          {pageMerchants.length} rows on screen
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
