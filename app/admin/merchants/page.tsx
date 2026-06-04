"use client";

import * as React from "react";
import {
  Download,
  Info,
  Lock,
  Plus,
  Power,
  RefreshCcw,
  Save,
  ShieldCheck,
  Store,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";

import {
  MerchantFilters,
  MerchantFilterBar,
} from "@/components/merchants/MerchantFilterBar";
import {
  MerchantsProvider,
  useMerchants,
} from "@/components/merchants/MerchantsProvider";
import { MerchantsKpiBar } from "@/components/merchants/MerchantsKpiBar";
import { MerchantTable } from "@/components/merchants/MerchantTable";
import { MerchantFormDrawer } from "@/components/merchants/MerchantFormDrawer";
import { MerchantDetailsDrawer } from "@/components/merchants/MerchantDetailsDrawer";
import { MerchantStatusDialog } from "@/components/merchants/MerchantStatusDialog";
import { KycActionDialog, type KycDialogMode } from "@/components/merchants/KycActionDialog";
import { formatRelative } from "@/lib/utils";
import type { MerchantOnboarding } from "@/types/loyalty";


export default function AdminMerchantsPage() {
  return (
    <MerchantsProvider>
      <MerchantsPageContent />
    </MerchantsProvider>
  );
}

const DEFAULT_FILTERS: MerchantFilters = {
  query: "",
  merchantType: "all",
  apiEnabled: "all",
  kycStatus: "all",
  status: "all",
  sortField: "name",
  sortDirection: "asc",
  page: 1,
  pageSize: 8,
};

function MerchantsPageContent() {
  const {
    visibleMerchants,
    canEdit,
    canExport,
    refresh,
    exportMerchants,
    lastRefreshedAt,
    logMerchantView,
  } = useMerchants();

  const [filters, setFilters] = React.useState<MerchantFilters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingMerchant, setEditingMerchant] =
    React.useState<MerchantOnboarding | null>(null);
  const [drawerMerchant, setDrawerMerchant] =
    React.useState<MerchantOnboarding | null>(null);
  const [statusTarget, setStatusTarget] =
    React.useState<MerchantOnboarding | null>(null);
  const [kycTarget, setKycTarget] =
    React.useState<MerchantOnboarding | null>(null);
  const [kycMode, setKycMode] = React.useState<KycDialogMode>("approve");
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

  const filteredMerchants = React.useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    let list = visibleMerchants;
    if (query) {
      list = list.filter(
        (m) =>
          m.merchantName.toLowerCase().includes(query) ||
          m.merchantId.toLowerCase().includes(query) ||
          m.contactEmail.toLowerCase().includes(query)
      );
    }
    if (filters.merchantType !== "all") {
      list = list.filter((m) => m.merchantType === filters.merchantType);
    }
    if (filters.apiEnabled !== "all") {
      list = list.filter((m) => m.apiEnabled === filters.apiEnabled);
    }
    if (filters.kycStatus !== "all") {
      list = list.filter((m) => m.kycStatus === filters.kycStatus);
    }
    if (filters.status !== "all") {
      list = list.filter((m) => m.status === filters.status);
    }
    const sorted = [...list].sort((a, b) => {
      const dir = filters.sortDirection === "asc" ? 1 : -1;
      if (filters.sortField === "updated") {
        return (
          (new Date(a.updatedAt).getTime() -
            new Date(b.updatedAt).getTime()) *
          dir
        );
      }
      return a.merchantName.localeCompare(b.merchantName) * dir;
    });
    return sorted;
  }, [visibleMerchants, filters]);

  const handleSort = (field: "name" | "updated") => {
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
    setEditingMerchant(null);
    setFormOpen(true);
  };

  const openEdit = (merchant: MerchantOnboarding) => {
    setEditingMerchant(merchant);
    setFormOpen(true);
    setDrawerMerchant(null);
  };

  const openDetails = (merchant: MerchantOnboarding) => {
    setDrawerMerchant(merchant);
    logMerchantView(merchant.id);
  };

  const openStatus = (merchant: MerchantOnboarding) => {
    setStatusTarget(merchant);
  };

  const openKyc = (merchant: MerchantOnboarding) => {
    setKycTarget(merchant);
    setKycMode(merchant.kycStatus === "APPROVED" ? "reject" : "approve");
  };

  const handleExport = () => {
    if (!canExport) return;
    exportMerchants(filteredMerchants);
    showToast(
      `Exported ${filteredMerchants.length} merchant${
        filteredMerchants.length === 1 ? "" : "s"
      }.`
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partners"
        title="Merchant onboarding"
        description="Onboard and verify partner merchants. Manage KYC, contact details, API enablement, and eligibility for voucher configuration."
        icon={Store}
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
                showToast("Merchant directory refreshed.");
              }}
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </Button>
            {canEdit ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add merchant
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!canExport}
              aria-label="Export merchants as CSV"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        }
      />

      <MerchantsKpiBar />

      <div className="space-y-4">
        <MerchantFilterBar
          filters={filters}
          onChange={setFilters}
          total={visibleMerchants.length}
          visible={filteredMerchants.length}
        />
        <MerchantTable
          merchants={filteredMerchants}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilters({ ...filters, page })}
          onSort={handleSort}
          sortField={filters.sortField}
          sortDirection={filters.sortDirection}
          onView={openDetails}
          onEdit={openEdit}
          onToggleStatus={openStatus}
          onKycAction={openKyc}
        />
      </div>

      <OnboardingGuidance />

      <MerchantFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        editingMerchant={editingMerchant}
        onComplete={(m) => showToast(m)}
      />

      <MerchantDetailsDrawer
        merchant={drawerMerchant}
        open={drawerMerchant !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerMerchant(null);
        }}
        onEdit={openEdit}
        onToggleStatus={openStatus}
        onKycAction={openKyc}
      />

      <MerchantStatusDialog
        merchant={statusTarget}
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        onComplete={(m) => showToast(m, "info")}
      />

      <KycActionDialog
        merchant={kycTarget}
        mode={kycMode}
        open={kycTarget !== null}
        onOpenChange={(open) => {
          if (!open) setKycTarget(null);
        }}
        onComplete={(m) => showToast(m)}
      />

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}

function OnboardingGuidance() {
  return (
    <SectionCard
      title="Onboarding pipeline"
      description="Standard operating procedure for bringing a merchant live in the loyalty program."
      icon={Info}
    >
      <EmptyState
        icon={ShieldCheck}
        title="Pipeline reference"
        description="Lead → KYC submission → Compliance review → Contract → Activation → Voucher configuration. Detailed workflows are managed in the merchant drawer."
        action={{ label: "View onboarding guide", href: "/admin/vouchers" }}
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
