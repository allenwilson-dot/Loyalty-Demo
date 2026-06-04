import type { DashboardAuditEntry } from "@/types/loyalty";

/**
 * A small seed of back-office audit log entries. New entries created by
 * the dashboard (refresh, export, resolve alert, ignore alert) get
 * appended to this list in `localStorage`.
 */
export const MOCK_AUDIT_LOG: DashboardAuditEntry[] = [
  {
    id: "aud_seed_001",
    occurredAt: "2026-06-01T07:00:00Z",
    actor: "amelia.chen@loyaltyco.com",
    role: "admin",
    module: "Dashboard",
    action: "EXPORT",
    status: "success",
    details: "Exported dashboard summary (CSV) for the 30-day window.",
  },
  {
    id: "aud_seed_002",
    occurredAt: "2026-06-01T08:14:00Z",
    actor: "system",
    role: "admin",
    module: "Vouchers",
    action: "RESOLVE_ALERT",
    status: "success",
    details: "Auto-resolved 5 GB data pack low-stock alert after refill.",
  },
  {
    id: "aud_seed_003",
    occurredAt: "2026-06-01T10:30:00Z",
    actor: "marcus.patel@loyaltyco.com",
    role: "merchant",
    module: "API Vouchers",
    action: "REFRESH",
    status: "info",
    details: "Refreshed dashboard data.",
  },
];
