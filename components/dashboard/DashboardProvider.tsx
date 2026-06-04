"use client";

import * as React from "react";

import { MOCK_AUDIT_LOG } from "@/data/mockReports";
import {
  MOCK_ACTIVE_CAMPAIGNS,
  MOCK_ACTIVITY_FEED,
  MOCK_CHANNEL_CONTRIBUTION,
  MOCK_KPI_CARDS,
  MOCK_PENDING_ACTIONS,
  MOCK_REDEMPTION_TYPES,
  MOCK_TREND,
  MOCK_VOUCHER_INVENTORY,
} from "@/data/mockDashboard";
import {
  MOCK_OPERATIONAL_ALERTS,
} from "@/data/mockAlerts";
import {
  buildDashboardCsv,
  downloadCsv,
  kpiVisibleTo,
} from "@/lib/dashboard";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import type {
  ActiveCampaign,
  ActivityFeedEntry,
  ChannelContribution,
  DashboardAuditEntry,
  DateRange,
  KpiCardData,
  OperationalAlert,
  PendingAction,
  RedemptionTypeStat,
  RoleId,
  TrendPoint,
  VoucherInventoryRow,
} from "@/types/loyalty";

import { useRole } from "@/components/layout/RoleProvider";

// Combine alerts sources (kept here so consumers don't have to import
// the data file directly).
const ALL_ALERTS: OperationalAlert[] = MOCK_OPERATIONAL_ALERTS;

interface DashboardState {
  range: DateRange;
  lastRefreshedAt: string;
  resolvedAlerts: Set<string>;
  ignoredAlerts: Set<string>;
  auditLog: DashboardAuditEntry[];
  isHydrated: boolean;
  kpis: KpiCardData[];
  trend: TrendPoint[];
  trend7d: TrendPoint[];
  channels: ChannelContribution[];
  redemptionTypes: RedemptionTypeStat[];
  voucherInventory: VoucherInventoryRow[];
  campaigns: ActiveCampaign[];
  activity: ActivityFeedEntry[];
  pendingActions: PendingAction[];
  alerts: OperationalAlert[];
}

interface DashboardActions {
  setRange: (range: DateRange) => void;
  refresh: () => void;
  exportCsv: () => void;
  resolveAlert: (id: string) => void;
  ignoreAlert: (id: string) => void;
  restoreAlert: (id: string) => void;
}

interface DashboardContextValue extends DashboardState, DashboardActions {
  visibleKpis: KpiCardData[];
  activeAlerts: OperationalAlert[];
  /** Whether the current role can take write actions. */
  canManage: boolean;
  /** Whether the current role can export the dashboard. */
  canExport: boolean;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}

function buildAuditId() {
  return `aud_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();

  // ─── Persisted state ──────────────────────────────────────────────
  const [range, setRangeState] = React.useState<DateRange>("30d");
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<string>(nowIso());
  const [resolvedAlerts, setResolvedAlerts] = React.useState<Set<string>>(
    new Set()
  );
  const [ignoredAlerts, setIgnoredAlerts] = React.useState<Set<string>>(
    new Set()
  );
  const [auditLog, setAuditLog] = React.useState<DashboardAuditEntry[]>(
    MOCK_AUDIT_LOG
  );
  const [isHydrated, setHydrated] = React.useState(false);

  // ─── Hydration from localStorage ──────────────────────────────────
  React.useEffect(() => {
    const storedRange = readStorage<DateRange | null>(
      StorageKeys.dashboardRange,
      null
    );
    if (storedRange) setRangeState(storedRange);

    const storedResolved = readStorage<string[] | null>(
      StorageKeys.resolvedAlerts,
      null
    );
    if (storedResolved) setResolvedAlerts(new Set(storedResolved));

    const storedIgnored = readStorage<string[] | null>(
      StorageKeys.ignoredAlerts,
      null
    );
    if (storedIgnored) setIgnoredAlerts(new Set(storedIgnored));

    const storedAudit = readStorage<DashboardAuditEntry[] | null>(
      StorageKeys.dashboardAudit,
      null
    );
    if (storedAudit && storedAudit.length > 0) setAuditLog(storedAudit);

    setHydrated(true);
  }, []);

  // ─── Persist effects ──────────────────────────────────────────────
  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.dashboardRange, range);
  }, [range, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.resolvedAlerts, Array.from(resolvedAlerts));
  }, [resolvedAlerts, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.ignoredAlerts, Array.from(ignoredAlerts));
  }, [ignoredAlerts, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.dashboardAudit, auditLog);
  }, [auditLog, isHydrated]);

  // ─── Derived data ─────────────────────────────────────────────────
  const trend = range === "7d" ? MOCK_TREND.slice(-7) : MOCK_TREND;
  const trend7d = MOCK_TREND.slice(-7);

  const visibleKpis = React.useMemo(
    () => MOCK_KPI_CARDS.filter((kpi) => kpiVisibleTo(kpi, role)),
    [role]
  );

  const activeAlerts = React.useMemo(
    () =>
      ALL_ALERTS.filter(
        (a) => !ignoredAlerts.has(a.id) && !resolvedAlerts.has(a.id)
      ),
    [ignoredAlerts, resolvedAlerts]
  );

  // Role-based capabilities. Viewers are read-only; merchants can refresh
  // and export but cannot resolve / ignore alerts.
  const canManage = role === "admin";
  const canExport = role === "admin" || role === "merchant";

  // ─── Audit log helpers ───────────────────────────────────────────
  const appendAudit = React.useCallback(
    (entry: Omit<DashboardAuditEntry, "id" | "occurredAt" | "actor" | "role">) => {
      const next: DashboardAuditEntry = {
        id: buildAuditId(),
        occurredAt: nowIso(),
        actor: actorForRole(role),
        role,
        ...entry,
      };
      setAuditLog((prev) => [next, ...prev].slice(0, 50));
    },
    [role]
  );

  // ─── Actions ─────────────────────────────────────────────────────
  const setRange = React.useCallback((next: DateRange) => {
    setRangeState(next);
  }, []);

  const refresh = React.useCallback(() => {
    setLastRefreshedAt(nowIso());
    appendAudit({
      module: "Dashboard",
      action: "REFRESH",
      status: "info",
      details: "Refreshed dashboard data.",
    });
  }, [appendAudit]);

  const exportCsv = React.useCallback(() => {
    if (!canExport) return;
    const csv = buildDashboardCsv({
      range,
      kpis: visibleKpis,
      generatedAt: nowIso(),
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`loyalty-dashboard-${stamp}.csv`, csv);
    appendAudit({
      module: "Dashboard",
      action: "EXPORT",
      status: "success",
      details: `Exported dashboard summary (CSV) for the ${range} window.`,
    });
  }, [canExport, range, visibleKpis, appendAudit]);

  const resolveAlert = React.useCallback(
    (id: string) => {
      if (!canManage) return;
      setResolvedAlerts((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setIgnoredAlerts((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const alert = ALL_ALERTS.find((a) => a.id === id);
      appendAudit({
        module: alert?.module ?? "Alerts",
        action: "RESOLVE_ALERT",
        status: "success",
        details: alert ? `Resolved alert: ${alert.message}` : `Resolved alert ${id}`,
      });
    },
    [canManage, appendAudit]
  );

  const ignoreAlert = React.useCallback(
    (id: string) => {
      if (!canManage) return;
      setIgnoredAlerts((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setResolvedAlerts((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      const alert = ALL_ALERTS.find((a) => a.id === id);
      appendAudit({
        module: alert?.module ?? "Alerts",
        action: "IGNORE_ALERT",
        status: "info",
        details: alert ? `Dismissed alert: ${alert.message}` : `Dismissed alert ${id}`,
      });
    },
    [canManage, appendAudit]
  );

  const restoreAlert = React.useCallback((id: string) => {
    setResolvedAlerts((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setIgnoredAlerts((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value = React.useMemo<DashboardContextValue>(
    () => ({
      range,
      lastRefreshedAt,
      resolvedAlerts,
      ignoredAlerts,
      auditLog,
      isHydrated,
      kpis: MOCK_KPI_CARDS,
      trend,
      trend7d,
      channels: MOCK_CHANNEL_CONTRIBUTION,
      redemptionTypes: MOCK_REDEMPTION_TYPES,
      voucherInventory: MOCK_VOUCHER_INVENTORY,
      campaigns: MOCK_ACTIVE_CAMPAIGNS,
      activity: MOCK_ACTIVITY_FEED,
      pendingActions: MOCK_PENDING_ACTIONS,
      alerts: ALL_ALERTS,
      setRange,
      refresh,
      exportCsv,
      resolveAlert,
      ignoreAlert,
      restoreAlert,
      visibleKpis,
      activeAlerts,
      canManage,
      canExport,
    }),
    [
      range,
      lastRefreshedAt,
      resolvedAlerts,
      ignoredAlerts,
      auditLog,
      isHydrated,
      trend,
      trend7d,
      visibleKpis,
      activeAlerts,
      canManage,
      canExport,
      setRange,
      refresh,
      exportCsv,
      resolveAlert,
      ignoreAlert,
      restoreAlert,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}

function actorForRole(role: RoleId): string {
  switch (role) {
    case "admin":
      return "amelia.chen@loyaltyco.com";
    case "merchant":
      return "marcus.patel@loyaltyco.com";
    case "viewer":
      return "sofia.rossi@loyaltyco.com";
  }
}

// Note: kept available so existing imports keep compiling if reused later.
