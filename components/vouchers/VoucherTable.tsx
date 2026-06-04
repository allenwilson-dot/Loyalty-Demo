"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MoreHorizontal,
  Package,
  Plug,
  Power,
  PowerOff,
  Boxes as InventoryIcon,
  PlayCircle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import {
  computeStockHealth,
  isVoucherExpired,
  isVoucherExpiringSoon,
} from "@/lib/voucherEligibility";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import type {
  VoucherManagement,
  VoucherManagementMode,
  VoucherManagementStatus,
  VoucherStockHealth,
} from "@/types/loyalty";

import { useVouchers } from "./VouchersProvider";

const MODE_TONE: Record<VoucherManagementMode, "info" | "accent"> = {
  INVENTORY: "info",
  API: "accent",
};

const MODE_LABEL: Record<VoucherManagementMode, string> = {
  INVENTORY: "Inventory",
  API: "API",
};

const STATUS_TONE: Record<VoucherManagementStatus, "success" | "neutral"> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
};

const HEALTH_TONE: Record<
  VoucherStockHealth,
  "success" | "warning" | "danger" | "neutral" | "info"
> = {
  HEALTHY: "success",
  WATCH: "warning",
  CRITICAL: "danger",
  OUT_OF_STOCK: "danger",
  API: "info",
};

const HEALTH_LABEL: Record<VoucherStockHealth, string> = {
  HEALTHY: "Healthy",
  WATCH: "Watch",
  CRITICAL: "Critical",
  OUT_OF_STOCK: "Out of stock",
  API: "API based",
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
  voucher: VoucherManagement;
  canEdit: boolean;
  canManageInventory: boolean;
  canTestApi: boolean;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onManageInventory: () => void;
  onTestApi: () => void;
}

function RowMenu({
  voucher,
  canEdit,
  canManageInventory,
  canTestApi,
  onView,
  onEdit,
  onToggleStatus,
  onManageInventory,
  onTestApi,
}: RowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isInactive = voucher.status === "INACTIVE";
  const isInventory = voucher.voucherMode === "INVENTORY";
  const isApi = voucher.voucherMode === "API";

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
        aria-label={`Open actions for ${voucher.voucherTitle}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 min-w-[200px] overflow-hidden rounded-lg border border-border/70 bg-card shadow-elevated"
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
            <Edit3 className="h-3.5 w-3.5 text-accent" /> Edit voucher
          </button>
          {isInventory ? (
            <button
              type="button"
              role="menuitem"
              disabled={!canManageInventory}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                setOpen(false);
                onManageInventory();
              }}
            >
              <InventoryIcon className="h-3.5 w-3.5 text-cyan-700" /> Manage inventory
            </button>
          ) : null}
          {isApi ? (
            <button
              type="button"
              role="menuitem"
              disabled={!canTestApi}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                setOpen(false);
                onTestApi();
              }}
            >
              <PlayCircle className="h-3.5 w-3.5 text-violet-700" /> Test API voucher
            </button>
          ) : null}
          {canEdit ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
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
                  <PowerOff className="h-3.5 w-3.5 text-rose-600" /> Deactivate
                </>
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function InventoryProgressBar({
  voucher,
}: {
  voucher: VoucherManagement;
}) {
  if (voucher.voucherMode === "API") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
        <Plug className="h-3 w-3" /> API based
      </span>
    );
  }
  if (voucher.totalInventory <= 0) {
    return (
      <span className="text-[11px] text-muted-foreground">No inventory</span>
    );
  }
  const used = voucher.totalInventory - voucher.remainingInventory;
  const usagePct = Math.round((used / voucher.totalInventory) * 100);
  const remainingPct = 100 - usagePct;
  const health = computeStockHealth(voucher);
  const barColor =
    health === "HEALTHY"
      ? "bg-emerald-500"
      : health === "WATCH"
      ? "bg-amber-500"
      : health === "CRITICAL"
      ? "bg-rose-500"
      : "bg-rose-700";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {formatNumber(voucher.remainingInventory)} / {formatNumber(voucher.totalInventory)}
        </span>
        <span className="font-semibold text-foreground">{usagePct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full", barColor)}
          style={{ width: `${Math.max(0, Math.min(100, remainingPct))}%` }}
        />
      </div>
    </div>
  );
}

export interface VoucherTableProps {
  vouchers: VoucherManagement[];
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort: (field: "updated" | "remaining" | "expiry") => void;
  sortField: "updated" | "remaining" | "expiry";
  sortDirection: "asc" | "desc";
  onView: (voucher: VoucherManagement) => void;
  onEdit: (voucher: VoucherManagement) => void;
  onToggleStatus: (voucher: VoucherManagement) => void;
  onManageInventory: (voucher: VoucherManagement) => void;
  onTestApi: (voucher: VoucherManagement) => void;
  className?: string;
}

export function VoucherTable({
  vouchers,
  page,
  pageSize,
  onPageChange,
  onSort,
  sortField,
  sortDirection,
  onView,
  onEdit,
  onToggleStatus,
  onManageInventory,
  onTestApi,
  className,
}: VoucherTableProps) {
  const { canEdit, canManageInventory, canTestApi } = useVouchers();
  const totalPages = Math.max(1, Math.ceil(vouchers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageVouchers = vouchers.slice(start, start + pageSize);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => onSort("updated")}
                  className="inline-flex items-center gap-1 font-semibold"
                >
                  Voucher ID
                  <SortIndicator
                    active={sortField === "updated"}
                    direction={sortDirection}
                  />
                </button>
              </th>
              <th className="px-4 py-3 text-left">Voucher Title</th>
              <th className="px-4 py-3 text-left">Merchant</th>
              <th className="px-4 py-3 text-left">Mode</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-left">Inventory</th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => onSort("remaining")}
                  className="inline-flex items-center gap-1 font-semibold"
                >
                  Remaining
                  <SortIndicator
                    active={sortField === "remaining"}
                    direction={sortDirection}
                  />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => onSort("expiry")}
                  className="inline-flex items-center gap-1 font-semibold"
                >
                  Expiry
                  <SortIndicator
                    active={sortField === "expiry"}
                    direction={sortDirection}
                  />
                </button>
              </th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {pageVouchers.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-10">
                  <EmptyState
                    icon={Boxes}
                    title="No vouchers match the current filters"
                    description="Try clearing filters or creating a new voucher."
                  />
                </td>
              </tr>
            ) : (
              pageVouchers.map((voucher) => {
                const health = computeStockHealth(voucher);
                const isInactive = voucher.status === "INACTIVE";
                const expired = isVoucherExpired(voucher.expiryDate);
                const expiringSoon = isVoucherExpiringSoon(voucher.expiryDate);
                const usage =
                  voucher.totalInventory > 0
                    ? Math.round(
                        ((voucher.totalInventory - voucher.remainingInventory) /
                          voucher.totalInventory) *
                          100
                      )
                    : 0;
                return (
                  <tr
                    key={voucher.id}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => onView(voucher)}
                        className="text-left font-mono text-xs font-semibold text-foreground transition-colors hover:text-accent"
                      >
                        {voucher.voucherId}
                      </button>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Updated {formatDate(voucher.updatedAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        onClick={() => onView(voucher)}
                        className="text-left transition-colors hover:text-accent"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {voucher.voucherTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          ${voucher.voucherValue} value
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-foreground">
                      {voucher.merchantName}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge
                        label={MODE_LABEL[voucher.voucherMode]}
                        tone={MODE_TONE[voucher.voucherMode]}
                        icon={
                          voucher.voucherMode === "API" ? (
                            <Plug className="h-3 w-3" />
                          ) : (
                            <Package className="h-3 w-3" />
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right align-top text-sm font-semibold text-foreground">
                      ${formatNumber(voucher.voucherValue)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <InventoryProgressBar voucher={voucher} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      {voucher.voucherMode === "API" ? (
                        <span className="text-[11px] text-muted-foreground">
                          API based
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {formatNumber(voucher.remainingInventory)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            of {formatNumber(voucher.totalInventory)} · {usage}%
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-xs text-foreground">
                        {formatDate(voucher.expiryDate)}
                      </p>
                      {expired ? (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-rose-600">
                          <XCircle className="h-3 w-3" /> Expired
                        </span>
                      ) : expiringSoon ? (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
                          <CheckCircle2 className="h-3 w-3" /> Expiring soon
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge
                          label={isInactive ? "Inactive" : "Active"}
                          tone={STATUS_TONE[voucher.status]}
                        />
                        {voucher.voucherMode === "INVENTORY" ? (
                          <StatusBadge
                            label={HEALTH_LABEL[health]}
                            tone={HEALTH_TONE[health]}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <RowMenu
                        voucher={voucher}
                        canEdit={canEdit}
                        canManageInventory={canManageInventory}
                        canTestApi={canTestApi}
                        onView={() => onView(voucher)}
                        onEdit={() => onEdit(voucher)}
                        onToggleStatus={() => onToggleStatus(voucher)}
                        onManageInventory={() => onManageInventory(voucher)}
                        onTestApi={() => onTestApi(voucher)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-start justify-between gap-2 border-t border-border/60 bg-secondary/20 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <span>
          Page <span className="font-semibold text-foreground">{safePage}</span> of{" "}
          <span className="font-semibold text-foreground">{totalPages}</span> ·{" "}
          {pageVouchers.length} rows on screen
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Next page"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
