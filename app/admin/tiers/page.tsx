"use client";

import * as React from "react";
import {
  Download,
  Layers,
  Lock,
  Plus,
  Power,
  PowerOff,
  RefreshCcw,
  Save,
  Sparkles,
  Unlock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { TiersProvider, useTiers } from "@/components/tiers/TiersProvider";
import { TiersKpiBar } from "@/components/tiers/TiersKpiBar";
import { TierLadder } from "@/components/tiers/TierLadder";
import { TierFilterBar } from "@/components/tiers/TierFilterBar";
import { TierTable } from "@/components/tiers/TierTable";
import { TierFormDrawer } from "@/components/tiers/TierFormDrawer";
import { TierDetailsDrawer } from "@/components/tiers/TierDetailsDrawer";
import { TierStatusDialog } from "@/components/tiers/TierStatusDialog";
import { SimulateUpgradePanel } from "@/components/tiers/SimulateUpgradePanel";
import { TierDistributionChart } from "@/components/tiers/TierDistributionChart";
import { formatRelative } from "@/lib/utils";
import type { Tier, TierStatus } from "@/types/loyalty";

export default function AdminTiersPage() {
  return (
    <TiersProvider>
      <TiersPageContent />
    </TiersProvider>
  );
}

const DEFAULT_FILTERS = {
  query: "",
  status: "all" as TierStatus | "all",
  sortField: "rank" as "name" | "threshold" | "lastUpdated",
  sortDirection: "asc" as "asc" | "desc",
};

function TiersPageContent() {
  const {
    tiers,
    visibleTiers,
    canEdit,
    canExport,
    refresh,
    exportTiers,
    lastRefreshedAt,
  } = useTiers();

  const [filters, setFilters] = React.useState<typeof DEFAULT_FILTERS>(DEFAULT_FILTERS);
  const [drawerTier, setDrawerTier] = React.useState<Tier | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingTier, setEditingTier] = React.useState<Tier | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<Tier | null>(null);
  const [toast, setToast] = React.useState<{
    message: string;
    tone: "success" | "info" | "warning" | "error";
  } | null>(null);

  const showToast = React.useCallback(
    (message: string, tone: "success" | "info" | "warning" | "error" = "success") => {
      setToast({ message, tone });
      window.setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const filteredTiers = React.useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    let list = visibleTiers;
    if (query) {
      list = list.filter((t) => t.name.toLowerCase().includes(query));
    }
    if (filters.status !== "all") {
      list = list.filter((t) => (t.status ?? "ACTIVE") === filters.status);
    }
    const sorted = [...list].sort((a, b) => {
      const dir = filters.sortDirection === "asc" ? 1 : -1;
      switch (filters.sortField) {
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "threshold":
          return (a.threshold - b.threshold) * dir;
        case "lastUpdated":
        default:
          return (
            (new Date(a.lastUpdated ?? 0).getTime() -
              new Date(b.lastUpdated ?? 0).getTime()) *
            dir
          );
      }
    });
    return sorted;
  }, [visibleTiers, filters]);

  const handleSort = (field: "name" | "threshold" | "lastUpdated") => {
    if (filters.sortField === field) {
      setFilters({
        ...filters,
        sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
      });
    } else {
      setFilters({ ...filters, sortField: field, sortDirection: "asc" });
    }
  };

  const openCreate = () => {
    setEditingTier(null);
    setFormOpen(true);
  };

  const openEdit = (tier: Tier) => {
    setEditingTier(tier);
    setFormOpen(true);
    setDrawerTier(null);
  };

  const handleToggleStatus = (tier: Tier) => {
    setStatusTarget(tier);
  };

  const handleExport = () => {
    if (!canExport) return;
    exportTiers(filteredTiers);
    showToast(`Exported ${filteredTiers.length} tier${filteredTiers.length === 1 ? "" : "s"}.`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Program design"
        title="Tier management"
        description="Configure loyalty tiers, threshold values, upgrade rules, benefits, and tier eligibility for users and rewards."
        icon={Layers}
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
                showToast("Tier configuration refreshed.");
              }}
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </Button>
            {canEdit ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Create tier
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!canExport}
              aria-label="Export tiers as CSV"
            >
              <Download className="h-3.5 w-3.5" /> Export tiers
            </Button>
          </div>
        }
      />

      <TiersKpiBar />

      <TierLadder />

      <TierDistributionChart />

      <div className="space-y-4">
        <TierFilterBar
          filters={filters}
          onChange={setFilters}
          total={tiers.length}
          visible={filteredTiers.length}
        />
        <TierTable
          tiers={filteredTiers}
          sortField={filters.sortField}
          sortDirection={filters.sortDirection}
          onSort={handleSort}
          onView={(t) => setDrawerTier(t)}
          onEdit={openEdit}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <SimulateUpgradePanel
        onApply={(m) => showToast(m, "info")}
      />

      <TierFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        editingTier={editingTier}
        onComplete={(m) => showToast(m)}
      />

      <TierDetailsDrawer
        tier={drawerTier}
        open={drawerTier !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerTier(null);
        }}
        onEdit={openEdit}
        onToggleStatus={handleToggleStatus}
      />

      <TierStatusDialog
        tier={statusTarget}
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        onComplete={(m) => showToast(m, "info")}
      />

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
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
      ? Sparkles
      : tone === "warning"
      ? Lock
      : Unlock;
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
