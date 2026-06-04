"use client";

import * as React from "react";
import {
  Download,
  FileSpreadsheet,
  Info,
  Lock,
  Plus,
  Power,
  RefreshCcw,
  Save,
  Ticket,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { MOCK_MERCHANTS } from "@/data/mockMerchants";
import { formatRelative } from "@/lib/utils";

import {
  VouchersProvider,
  useVouchers,
} from "@/components/vouchers/VouchersProvider";
import { VouchersKpiBar } from "@/components/vouchers/VouchersKpiBar";
import {
  VoucherFilterBar,
  type VoucherFilters,
} from "@/components/vouchers/VoucherFilterBar";
import { VoucherTable } from "@/components/vouchers/VoucherTable";
import { VoucherFormDrawer } from "@/components/vouchers/VoucherFormDrawer";
import { VoucherDetailsDrawer } from "@/components/vouchers/VoucherDetailsDrawer";
import { VoucherStatusDialog } from "@/components/vouchers/VoucherStatusDialog";
import { VoucherInventoryDialog } from "@/components/vouchers/VoucherInventoryDialog";
import { VoucherApiTestDialog } from "@/components/vouchers/VoucherApiTestDialog";
import { VoucherUploadDialog } from "@/components/vouchers/VoucherUploadDialog";
import {
  computeStockHealth,
  isVoucherExpired,
  isVoucherExpiringSoon,
} from "@/lib/voucherEligibility";
import type { VoucherManagement } from "@/types/loyalty";

export default function AdminVouchersPage() {
  return (
    <VouchersProvider>
      <VouchersPageContent />
    </VouchersProvider>
  );
}

const DEFAULT_FILTERS: VoucherFilters = {
  query: "",
  mode: "all",
  merchantId: "all",
  status: "all",
  stock: "all",
  expiry: "all",
  sortField: "updated",
  sortDirection: "desc",
  page: 1,
  pageSize: 8,
};

function VouchersPageContent() {
  const {
    visibleVouchers,
    canEdit,
    canExport,
    canManageInventory,
    canTestApi,
    refresh,
    exportVouchers,
    lastRefreshedAt,
    logVoucherView,
  } = useVouchers();

  const [filters, setFilters] = React.useState<VoucherFilters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingVoucher, setEditingVoucher] =
    React.useState<VoucherManagement | null>(null);
  const [drawerVoucher, setDrawerVoucher] =
    React.useState<VoucherManagement | null>(null);
  const [statusTarget, setStatusTarget] =
    React.useState<VoucherManagement | null>(null);
  const [inventoryTarget, setInventoryTarget] =
    React.useState<VoucherManagement | null>(null);
  const [apiTestTarget, setApiTestTarget] =
    React.useState<VoucherManagement | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{
    message: string;
    tone: "success" | "info" | "warning" | "error";
  } | null>(null);

  const showToast = React.useCallback(
    (
      message: string,
      tone: "success" | "info" | "warning" | "error" = "success"
    ) => {
      setToast({ message, tone });
      window.setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const merchantOptions = React.useMemo(
    () =>
      MOCK_MERCHANTS.map((m) => ({
        value: m.id,
        label: m.merchantName,
      })).sort((a, b) => a.label.localeCompare(b.label)),
    []
  );

  const filteredVouchers = React.useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    let list = visibleVouchers;
    if (query) {
      list = list.filter(
        (v) =>
          v.voucherTitle.toLowerCase().includes(query) ||
          v.voucherId.toLowerCase().includes(query) ||
          v.merchantName.toLowerCase().includes(query)
      );
    }
    if (filters.mode !== "all") {
      list = list.filter((v) => v.voucherMode === filters.mode);
    }
    if (filters.merchantId !== "all") {
      list = list.filter((v) => v.merchantId === filters.merchantId);
    }
    if (filters.status !== "all") {
      list = list.filter((v) => v.status === filters.status);
    }
    if (filters.stock !== "all") {
      list = list.filter((v) => {
        const health = computeStockHealth(v);
        return health === filters.stock;
      });
    }
    if (filters.expiry !== "all") {
      list = list.filter((v) => {
        if (filters.expiry === "expiring_soon") return isVoucherExpiringSoon(v.expiryDate);
        if (filters.expiry === "expired") return isVoucherExpired(v.expiryDate);
        return true;
      });
    }
    const sorted = [...list].sort((a, b) => {
      const dir = filters.sortDirection === "asc" ? 1 : -1;
      switch (filters.sortField) {
        case "remaining":
          return (a.remainingInventory - b.remainingInventory) * dir;
        case "expiry":
          return (
            (new Date(a.expiryDate).getTime() -
              new Date(b.expiryDate).getTime()) *
            dir
          );
        case "updated":
        default:
          return (
            (new Date(a.updatedAt).getTime() -
              new Date(b.updatedAt).getTime()) *
            dir
          );
      }
    });
    return sorted;
  }, [visibleVouchers, filters]);

  const handleSort = (field: "updated" | "remaining" | "expiry") => {
    if (filters.sortField === field) {
      setFilters({
        ...filters,
        sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
        page: 1,
      });
    } else {
      setFilters({
        ...filters,
        sortField: field,
        sortDirection: "asc",
        page: 1,
      });
    }
  };

  const openCreate = () => {
    setEditingVoucher(null);
    setFormOpen(true);
  };

  const openEdit = (voucher: VoucherManagement) => {
    setEditingVoucher(voucher);
    setFormOpen(true);
    setDrawerVoucher(null);
  };

  const openDetails = (voucher: VoucherManagement) => {
    setDrawerVoucher(voucher);
    logVoucherView(voucher.id);
  };

  const openStatus = (voucher: VoucherManagement) => {
    setStatusTarget(voucher);
  };

  const openInventory = (voucher: VoucherManagement) => {
    setInventoryTarget(voucher);
  };

  const openApiTest = (voucher: VoucherManagement) => {
    setApiTestTarget(voucher);
  };

  const handleExport = () => {
    if (!canExport) return;
    exportVouchers(filteredVouchers);
    showToast(
      `Exported ${filteredVouchers.length} voucher${
        filteredVouchers.length === 1 ? "" : "s"
      }.`
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catalog"
        title="Voucher Management"
        description="Create and manage inventory-based and API-based vouchers for loyalty redemption campaigns."
        icon={Ticket}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-muted-foreground md:inline">
              Last refreshed {formatRelative(lastRefreshedAt)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refresh();
                showToast("Voucher roster refreshed.");
              }}
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </Button>
            {canEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadOpen(true)}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Upload coupon codes
              </Button>
            ) : null}
            {canEdit ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Create voucher
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!canExport}
              aria-label="Export vouchers as CSV"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        }
      />

      <VouchersKpiBar />

      <div className="space-y-4">
        <VoucherFilterBar
          filters={filters}
          onChange={setFilters}
          total={visibleVouchers.length}
          visible={filteredVouchers.length}
          merchantOptions={merchantOptions}
        />
        <VoucherTable
          vouchers={filteredVouchers}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilters({ ...filters, page })}
          onSort={handleSort}
          sortField={filters.sortField}
          sortDirection={filters.sortDirection}
          onView={openDetails}
          onEdit={openEdit}
          onToggleStatus={openStatus}
          onManageInventory={openInventory}
          onTestApi={openApiTest}
        />
      </div>

      <ReferenceSection
        canManageInventory={canManageInventory}
        canTestApi={canTestApi}
      />

      <VoucherFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        editingVoucher={editingVoucher}
        onComplete={(m) => showToast(m)}
      />

      <VoucherDetailsDrawer
        voucher={drawerVoucher}
        open={drawerVoucher !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerVoucher(null);
        }}
        onEdit={openEdit}
        onToggleStatus={openStatus}
        onManageInventory={openInventory}
        onTestApi={openApiTest}
      />

      <VoucherStatusDialog
        voucher={statusTarget}
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        onComplete={(m) => showToast(m, "info")}
      />

      <VoucherInventoryDialog
        voucher={inventoryTarget}
        open={inventoryTarget !== null}
        onOpenChange={(open) => {
          if (!open) setInventoryTarget(null);
        }}
        onComplete={(m) => showToast(m)}
      />

      <VoucherApiTestDialog
        voucher={apiTestTarget}
        open={apiTestTarget !== null}
        onOpenChange={(open) => {
          if (!open) setApiTestTarget(null);
        }}
        onComplete={(m) => showToast(m, "info")}
      />

      <VoucherUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onComplete={(m) => showToast(m)}
      />

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}

function ReferenceSection({
  canManageInventory,
  canTestApi,
}: {
  canManageInventory: boolean;
  canTestApi: boolean;
}) {
  return (
    <SectionCard
      title="Voucher reference"
      description="Operational notes for the back-office voucher catalogue."
      icon={Info}
    >
      <EmptyState
        icon={Ticket}
        title="Inventory and API catalogues live side by side"
        description={
          canManageInventory || canTestApi
            ? "Inventory vouchers draw from a coupon catalogue you can top up at any time. API vouchers call out to a partner endpoint when members redeem."
            : "Read-only reference. Switch to Admin to manage inventory or test API vouchers."
        }
        action={{ label: "Open merchant onboarding", href: "/admin/merchants" }}
      />
    </SectionCard>
  );
}

function Toast({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "info" | "warning" | "error";
}) {
  const toneStyles: Record<typeof tone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-navy-900/20 bg-navy-900/5 text-navy-900",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
  };
  const Icon: LucideIcon =
    tone === "success"
      ? Save
      : tone === "info"
      ? Info
      : tone === "warning"
      ? Lock
      : Power;
  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-elevated ${toneStyles[tone]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
