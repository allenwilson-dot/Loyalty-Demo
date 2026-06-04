import type {
  AlertSeverity,
  CampaignStatus,
  DateRange,
  KpiCardData,
  KpiStatus,
  RewardType,
  RoleId,
  VoucherHealth,
} from "@/types/loyalty";

/** Maps a KPI status to a CSS tone used by `StatusBadge` / `StatusDot`. */
export function kpiStatusTone(status: KpiStatus): "success" | "warning" | "danger" {
  switch (status) {
    case "healthy":
      return "success";
    case "watch":
      return "warning";
    case "critical":
      return "danger";
  }
}

export function alertSeverityTone(
  severity: AlertSeverity
): "info" | "warning" | "danger" {
  switch (severity) {
    case "info":
      return "info";
    case "warning":
      return "warning";
    case "critical":
      return "danger";
  }
}

export function voucherHealthTone(
  health: VoucherHealth
): "success" | "warning" | "danger" | "info" {
  switch (health) {
    case "healthy":
      return "success";
    case "watch":
      return "warning";
    case "critical":
      return "danger";
    case "api":
      return "info";
  }
}

export function campaignStatusLabel(status: CampaignStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "scheduled":
      return "Scheduled";
    case "expiring_soon":
      return "Expiring soon";
    case "paused":
      return "Paused";
  }
}

export function campaignStatusTone(
  status: CampaignStatus
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "scheduled":
      return "info" as never;
    case "expiring_soon":
      return "warning";
    case "paused":
      return "neutral";
  }
  return "neutral";
}

export const REWARD_TYPE_LABEL: Record<RewardType, string> = {
  voucher: "Voucher",
  wallet: "Wallet Credit",
  data: "Data Pack",
  addon: "Add-on",
};

export const DATE_RANGE_LABEL: Record<DateRange, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  custom: "Custom range",
};

/** Returns true if a KPI is visible to the given role. */
export function kpiVisibleTo(kpi: KpiCardData, role: RoleId): boolean {
  if (!kpi.visibleTo || kpi.visibleTo.length === 0) return true;
  return kpi.visibleTo.includes(role);
}

/**
 * Builds a CSV string from the dashboard summary. Designed to download
 * cleanly in Excel / Google Sheets.
 */
export function buildDashboardCsv(input: {
  range: DateRange;
  kpis: KpiCardData[];
  generatedAt: string;
}): string {
  const header = [
    "Loyalty Co. — Dashboard summary",
    `Range: ${DATE_RANGE_LABEL[input.range]}`,
    `Generated at: ${input.generatedAt}`,
  ].join("\n");

  const rows: string[] = [
    "Metric,Value,Format,Change %,Status",
    ...input.kpis.map((kpi) =>
      [
        escapeCsv(kpi.label),
        String(kpi.value),
        kpi.format,
        kpi.changePercent.toFixed(1),
        kpi.status,
      ].join(",")
    ),
  ];

  return [header, "", ...rows].join("\n");
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Triggers a browser download for the provided CSV content.
 * SSR-safe: no-ops outside the browser.
 */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
