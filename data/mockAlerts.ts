import type { OperationalAlert } from "@/types/loyalty";

export const MOCK_OPERATIONAL_ALERTS: OperationalAlert[] = [
  {
    id: "alert_001",
    severity: "critical",
    module: "Vouchers",
    message: "10 GB Data Pack inventory is fully depleted.",
    details:
      "The 10 GB Data Pack (Selfcare) has hit 0% stock. Redemptions are blocked. A refill ticket has been opened with the carrier partner.",
    occurredAt: "2026-06-01T18:32:00Z",
    primaryCta: { label: "Resolve", action: "resolve" },
    secondaryCta: { label: "View details", action: "view" },
    href: "/admin/vouchers",
  },
  {
    id: "alert_002",
    severity: "warning",
    module: "API Vouchers",
    message: "M Faisaa partner failure rate up 1.8 pts in 24h.",
    details:
      "Success rate is 96.4% over the last 24 hours, down from 98.2% the day before. Mostly 504 timeouts from the partner endpoint.",
    occurredAt: "2026-06-01T17:11:00Z",
    primaryCta: { label: "View details", action: "view" },
    secondaryCta: { label: "Ignore", action: "ignore" },
    href: "/admin/api-config",
  },
  {
    id: "alert_003",
    severity: "warning",
    module: "Campaigns",
    message: "Platinum 2× Points Weekend ends in 2 days.",
    details:
      "4,120 redemptions so far. Consider extending the campaign or publishing a follow-up offer for platinum members.",
    occurredAt: "2026-06-01T16:00:00Z",
    primaryCta: { label: "View details", action: "view" },
    secondaryCta: { label: "Ignore", action: "ignore" },
    href: "/admin/redemption-config",
  },
  {
    id: "alert_004",
    severity: "info",
    module: "Vouchers",
    message: "High redemption volume detected on $25 Coffee Credit.",
    details:
      "Redemption rate on the $25 Coffee Credit is 2.4× the weekly average. Inventory still healthy at 75% remaining.",
    occurredAt: "2026-06-01T14:18:00Z",
    primaryCta: { label: "View details", action: "view" },
    href: "/admin/vouchers",
  },
  {
    id: "alert_005",
    severity: "warning",
    module: "Merchants",
    message: "Pending merchant KYC approval for Aurelia Audio.",
    details:
      "Aurelia Audio submitted incorporation documents 36 hours ago. KYC review is required before the merchant can issue vouchers.",
    occurredAt: "2026-06-01T12:00:00Z",
    primaryCta: { label: "View details", action: "view" },
    secondaryCta: { label: "Resolve", action: "resolve" },
    href: "/admin/merchants",
  },
  {
    id: "alert_006",
    severity: "info",
    module: "Wallet",
    message: "Failed wallet credit rollback completed for Diego Fernández.",
    details:
      "The Moolee partner returned a 502 during the credit attempt. The system rolled back the points and notified the member.",
    occurredAt: "2026-06-01T11:42:00Z",
    primaryCta: { label: "View details", action: "view" },
    href: "/admin/reports",
  },
];
