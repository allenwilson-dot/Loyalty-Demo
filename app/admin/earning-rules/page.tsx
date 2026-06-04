"use client";

import * as React from "react";
import {
  Coins,
  Download,
  Edit3,
  Lock,
  PlayCircle,
  Plus,
  Power,
  RefreshCcw,
  Save,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { Separator } from "@/components/ui/separator";
import { EntrySourceBadge } from "@/components/loyalty/EntrySourceBadge";
import { MOCK_USERS } from "@/data/mockUsers";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/utils";
import {
  EarningRulesProvider,
  useEarningRules,
} from "@/components/earning-rules/EarningRulesProvider";
import { EarningRulesKpiBar } from "@/components/earning-rules/EarningRulesKpiBar";
import { EarningRuleFilterBar } from "@/components/earning-rules/EarningRuleFilterBar";
import { EarningRuleTable } from "@/components/earning-rules/EarningRuleTable";
import { EarningRuleFormDrawer } from "@/components/earning-rules/EarningRuleFormDrawer";
import { EarningRuleDetailsDrawer } from "@/components/earning-rules/EarningRuleDetailsDrawer";
import { EarningRuleStatusDialog } from "@/components/earning-rules/EarningRuleStatusDialog";
import { TestEarnEventDialog } from "@/components/earning-rules/TestEarnEventDialog";
import type { EarningRule } from "@/types/loyalty";
import type { EarningRuleFilters } from "@/components/earning-rules/EarningRuleFilterBar";

export default function AdminEarningRulesPage() {
  return (
    <EarningRulesProvider>
      <EarningRulesPageContent />
    </EarningRulesProvider>
  );
}

const DEFAULT_FILTERS: EarningRuleFilters = {
  query: "",
  serviceSource: "all",
  userType: "all",
  transactionType: "all",
  rewardType: "all",
  status: "all",
  sortField: "reward",
  sortDirection: "desc",
  page: 1,
  pageSize: 8,
};

function EarningRulesPageContent() {
  const {
    rules,
    visibleRules,
    canEdit,
    canExport,
    canApplyEvents,
    refresh,
    exportRules,
    lastRefreshedAt,
    testEvents,
    testUserBalances,
  } = useEarningRules();

  const [filters, setFilters] = React.useState<EarningRuleFilters>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<EarningRule | null>(null);
  const [drawerRule, setDrawerRule] = React.useState<EarningRule | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<EarningRule | null>(null);
  const [testOpen, setTestOpen] = React.useState(false);
  const [testPreset, setTestPreset] = React.useState<EarningRule | null>(null);
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

  const filteredRules = React.useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    let list = visibleRules;
    if (query) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(query) ||
          r.eventName.toLowerCase().includes(query) ||
          (r.customEventName ?? "").toLowerCase().includes(query)
      );
    }
    if (filters.serviceSource !== "all") {
      list = list.filter((r) => r.serviceSource === filters.serviceSource);
    }
    if (filters.userType !== "all") {
      list = list.filter((r) => r.userType === filters.userType);
    }
    if (filters.transactionType !== "all") {
      list = list.filter(
        (r) => r.transactionType === filters.transactionType
      );
    }
    if (filters.rewardType !== "all") {
      list = list.filter((r) => r.rewardType === filters.rewardType);
    }
    if (filters.status !== "all") {
      list = list.filter((r) => r.status === filters.status);
    }
    const sorted = [...list].sort((a, b) => {
      const dir = filters.sortDirection === "asc" ? 1 : -1;
      switch (filters.sortField) {
        case "reward":
          return (a.rewardValue - b.rewardValue) * dir;
        case "updated":
        default:
          return (
            (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) *
            dir
          );
      }
    });
    return sorted;
  }, [visibleRules, filters]);

  const handleSort = (field: "reward" | "updated") => {
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
    setEditingRule(null);
    setFormOpen(true);
  };

  const openEdit = (rule: EarningRule) => {
    setEditingRule(rule);
    setFormOpen(true);
    setDrawerRule(null);
  };

  const openTest = (rule: EarningRule | null) => {
    setTestPreset(rule);
    setTestOpen(true);
  };

  const handleExport = () => {
    if (!canExport) return;
    exportRules(filteredRules);
    showToast(
      `Exported ${filteredRules.length} rule${filteredRules.length === 1 ? "" : "s"}.`
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Program design"
        title="Earning rules"
        description="Configure event-based earning logic for Selfcare, Moolee, M Faisaa, and other loyalty channels."
        icon={Coins}
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
                showToast("Earning rules refreshed.");
              }}
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </Button>
            {canApplyEvents ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openTest(null)}
              >
                <PlayCircle className="h-3.5 w-3.5" /> Test earn event
              </Button>
            ) : null}
            {canEdit ? (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Create rule
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!canExport}
              aria-label="Export earning rules as CSV"
            >
              <Download className="h-3.5 w-3.5" /> Export rules
            </Button>
          </div>
        }
      />

      <EarningRulesKpiBar />

      <div className="space-y-4">
        <EarningRuleFilterBar
          filters={filters}
          onChange={setFilters}
          total={rules.length}
          visible={filteredRules.length}
        />
        <EarningRuleTable
          rules={filteredRules}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilters({ ...filters, page })}
          onSort={handleSort}
          sortField={filters.sortField}
          sortDirection={filters.sortDirection}
          onView={(r) => setDrawerRule(r)}
          onEdit={openEdit}
          onToggleStatus={(r) => setStatusTarget(r)}
          onTest={(r) => openTest(r)}
        />
      </div>

      <TestEventTimeline
        events={testEvents}
        balances={testUserBalances}
      />

      <EarningRuleFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        editingRule={editingRule}
        onComplete={(m) => showToast(m)}
      />

      <EarningRuleDetailsDrawer
        rule={drawerRule}
        open={drawerRule !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerRule(null);
        }}
        onEdit={openEdit}
        onToggleStatus={(r) => setStatusTarget(r)}
        onTest={(r) => openTest(r)}
      />

      <EarningRuleStatusDialog
        rule={statusTarget}
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        onComplete={(m) => showToast(m, "info")}
      />

      <TestEarnEventDialog
        open={testOpen}
        onOpenChange={(open) => {
          if (!open) {
            setTestOpen(false);
            setTestPreset(null);
          }
        }}
        presetRule={testPreset}
        onComplete={(m) => showToast(m)}
      />

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}

function TestEventTimeline({
  events,
  balances,
}: {
  events: ReturnType<typeof useEarningRules>["testEvents"];
  balances: ReturnType<typeof useEarningRules>["testUserBalances"];
}) {
  if (events.length === 0) {
    return (
      <SectionCard
        title="Test simulator output"
        description="Earn events applied through the test simulator will appear here with their calculated points and updated user balances."
        icon={Sparkles}
      >
        <EmptyState
          icon={PlayCircle}
          title="No test events yet"
          description="Click 'Test earn event' to run a simulation and see the matched rule + calculated points."
        />
      </SectionCard>
    );
  }
  return (
    <SectionCard
      title="Test simulator output"
      description="Most recent events applied through the test earn simulator."
      icon={Sparkles}
    >
      <ul className="space-y-2">
        {events.slice(0, 8).map((e) => {
          const user = MOCK_USERS.find((u) => u.id === e.userId);
          const newBalance =
            balances[e.userId] !== undefined
              ? balances[e.userId]
              : user?.pointsBalance ?? 0;
          const channel =
            e.serviceSource === "SELFCARE"
              ? "selfcare"
              : e.serviceSource === "MOOLEE"
              ? "moolee"
              : e.serviceSource === "MFAISAA"
              ? "mfaisaa"
              : "api";
          return (
            <li
              key={e.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900/5 text-xs font-semibold text-navy-900">
                {(user?.fullName ?? "—")
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user?.fullName ?? "Unknown member"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.eventName === "Custom Event" && e.customEventName
                    ? e.customEventName
                    : e.eventName}{" "}
                  · {formatNumber(e.amount)} amt · ref {e.referenceId}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatDateTime(e.occurredAt)} ·{" "}
                  {formatRelative(e.occurredAt)}
                </p>
              </div>
              <EntrySourceBadge source={channel} />
              <StatusBadge label="Applied" tone="success" />
              <div className="text-right text-xs text-muted-foreground">
                <p className="text-[10px] font-semibold uppercase tracking-wide">
                  New balance
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatNumber(newBalance)} pts
                </p>
              </div>
            </li>
          );
        })}
      </ul>
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
      ? Sparkles
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
