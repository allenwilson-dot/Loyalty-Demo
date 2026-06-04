import type {
  ActiveCampaign,
  ActivityFeedEntry,
  ChannelContribution,
  KpiCardData,
  PendingAction,
  RedemptionTypeStat,
  TrendPoint,
  VoucherInventoryRow,
} from "@/types/loyalty";

/**
 * Back-office dashboard mock data. All numbers are stable so the charts
 * don't flicker between renders. Date math is computed from `Date.now()` at
 * module load so the trend series feels current.
 */

const now = new Date();
const isoDay = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - offset);
  return d.toISOString();
};
const shortLabel = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - offset);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── KPI snapshots ───────────────────────────────────────────────────────

export const MOCK_KPI_CARDS: KpiCardData[] = [
  {
    id: "kpi_total_users",
    label: "Total loyalty users",
    value: 184_320,
    format: "compact",
    changePercent: 4.2,
    changeLabel: "+4.2% vs last period",
    status: "healthy",
  },
  {
    id: "kpi_active_users",
    label: "Active users (30d)",
    value: 132_874,
    format: "compact",
    changePercent: 1.8,
    changeLabel: "+1.8% vs last period",
    status: "healthy",
  },
  {
    id: "kpi_points_issued",
    label: "Points issued",
    value: 9_412_330,
    format: "compact",
    changePercent: 6.4,
    changeLabel: "+6.4% vs last period",
    status: "healthy",
    visibleTo: ["admin", "merchant"],
  },
  {
    id: "kpi_points_redeemed",
    label: "Points redeemed",
    value: 4_122_780,
    format: "compact",
    changePercent: 2.1,
    changeLabel: "+2.1% vs last period",
    status: "healthy",
    visibleTo: ["admin", "merchant"],
  },
  {
    id: "kpi_redemption_rate",
    label: "Redemption rate",
    value: 43.8,
    format: "percent",
    changePercent: -0.6,
    changeLabel: "-0.6 pts vs last period",
    status: "watch",
  },
  {
    id: "kpi_active_campaigns",
    label: "Active campaigns",
    value: 14,
    format: "number",
    changePercent: 12.5,
    changeLabel: "+12.5% vs last period",
    status: "healthy",
  },
  {
    id: "kpi_voucher_inventory",
    label: "Voucher inventory remaining",
    value: 14_280,
    format: "compact",
    changePercent: -3.1,
    changeLabel: "-3.1% vs last period",
    status: "watch",
  },
  {
    id: "kpi_api_success",
    label: "API voucher success rate",
    value: 98.6,
    format: "percent",
    changePercent: 0.4,
    changeLabel: "+0.4 pts vs last period",
    status: "healthy",
  },
];

// ─── Trend series (last 30 days) ────────────────────────────────────────

const baseEarned = [120_000, 135_000, 128_000, 142_000, 150_000, 138_000, 132_000];
const baseRedeemed = [55_000, 60_000, 58_000, 64_000, 70_000, 66_000, 62_000];

export const MOCK_TREND: TrendPoint[] = (() => {
  const days: TrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const dow = (29 - i) % 7;
    // A gentle weekly seasonality: earn/redeem peak mid-week.
    const weekly = 1 + 0.15 * Math.sin((dow / 7) * Math.PI * 2);
    const drift = 1 + (29 - i) * 0.004;
    const earned = Math.round(baseEarned[dow] * weekly * drift);
    const redeemed = Math.round(baseRedeemed[dow] * weekly * drift);
    days.push({
      date: isoDay(i),
      label: shortLabel(i),
      earned,
      redeemed,
    });
  }
  return days;
})();

export const MOCK_TREND_7D: TrendPoint[] = MOCK_TREND.slice(-7);

// ─── Channel contribution ───────────────────────────────────────────────

export const MOCK_CHANNEL_CONTRIBUTION: ChannelContribution[] = [
  { channel: "selfcare", label: "Selfcare", points: 4_812_400, percent: 51.1, color: "#0F172A" },
  { channel: "moolee", label: "Moolee", points: 2_410_900, percent: 25.6, color: "#06B6D4" },
  { channel: "mfaisaa", label: "M Faisaa", points: 1_544_300, percent: 16.4, color: "#F59E0B" },
  { channel: "other", label: "Other (store, API, campaign)", points: 644_730, percent: 6.9, color: "#94A3B8" },
];

// ─── Redemption type breakdown ──────────────────────────────────────────

export const MOCK_REDEMPTION_TYPES: RedemptionTypeStat[] = [
  { type: "wallet", total: 18_420, success: 18_184, failed: 184, pending: 52 },
  { type: "voucher", total: 9_810, success: 9_512, failed: 246, pending: 52 },
  { type: "data", total: 12_640, success: 12_488, failed: 116, pending: 36 },
  { type: "addon", total: 4_120, success: 4_044, failed: 56, pending: 20 },
];

// ─── Voucher inventory ──────────────────────────────────────────────────

export const MOCK_VOUCHER_INVENTORY: VoucherInventoryRow[] = [
  {
    id: "vinv_001",
    title: "$25 Coffee Credit",
    merchantName: "Bluewater Roasters",
    mode: "inventory",
    total: 5_000,
    remaining: 3_760,
    usagePercent: 24.8,
    health: "healthy",
    expiresAt: "2026-12-31T00:00:00Z",
  },
  {
    id: "vinv_002",
    title: "Weekend City Stay",
    merchantName: "Halcyon Hotels",
    mode: "inventory",
    total: 800,
    remaining: 716,
    usagePercent: 10.5,
    health: "watch",
    expiresAt: "2027-03-15T00:00:00Z",
  },
  {
    id: "vinv_003",
    title: "$50 Dining Voucher",
    merchantName: "The Marble Table",
    mode: "inventory",
    total: 1_000,
    remaining: 780,
    usagePercent: 22.0,
    health: "healthy",
    expiresAt: "2026-10-15T00:00:00Z",
  },
  {
    id: "vinv_004",
    title: "10 GB Data Pack",
    merchantName: "Selfcare",
    mode: "inventory",
    total: 6_000,
    remaining: 0,
    usagePercent: 100,
    health: "critical",
    expiresAt: "2026-09-30T00:00:00Z",
  },
  {
    id: "vinv_005",
    title: "5 GB Data Pack",
    merchantName: "Selfcare",
    mode: "inventory",
    total: 2_400,
    remaining: 600,
    usagePercent: 75.0,
    health: "critical",
    expiresAt: "2026-11-30T00:00:00Z",
  },
  {
    id: "vinv_006",
    title: "Annual Wellness Pass",
    merchantName: "Nordic Wellness Co.",
    mode: "inventory",
    total: 120,
    remaining: 102,
    usagePercent: 15.0,
    health: "watch",
    expiresAt: "2026-12-15T00:00:00Z",
  },
  {
    id: "vinv_007",
    title: "M Faisaa Cashback Voucher",
    merchantName: "M Faisaa",
    mode: "api",
    total: 0,
    remaining: 0,
    usagePercent: 0,
    health: "api",
    expiresAt: "2026-12-31T00:00:00Z",
    apiSuccessRate: 98.6,
  },
  {
    id: "vinv_008",
    title: "Moolee Wallet Top-up",
    merchantName: "Moolee",
    mode: "api",
    total: 0,
    remaining: 0,
    usagePercent: 0,
    health: "api",
    expiresAt: "2027-06-30T00:00:00Z",
    apiSuccessRate: 99.4,
  },
];

// ─── Active campaigns ───────────────────────────────────────────────────

export const MOCK_ACTIVE_CAMPAIGNS: ActiveCampaign[] = [
  {
    id: "cmp_001",
    name: "Platinum 2× Points Weekend",
    rewardType: "wallet",
    eligibleTier: "platinum",
    pointsRequired: 0,
    startDate: "2026-05-23T00:00:00Z",
    endDate: "2026-06-02T23:59:59Z",
    status: "expiring_soon",
    redemptions: 4_120,
  },
  {
    id: "cmp_002",
    name: "Selfcare Recharge Bonus",
    rewardType: "data",
    eligibleTier: "bronze",
    pointsRequired: 800,
    startDate: "2026-05-01T00:00:00Z",
    endDate: "2026-08-31T23:59:59Z",
    status: "active",
    redemptions: 22_410,
  },
  {
    id: "cmp_003",
    name: "Diamond Concierge Drop",
    rewardType: "voucher",
    eligibleTier: "diamond",
    pointsRequired: 60_000,
    startDate: "2026-06-10T00:00:00Z",
    endDate: "2026-07-10T23:59:59Z",
    status: "scheduled",
    redemptions: 0,
  },
  {
    id: "cmp_004",
    name: "Halcyon Summer Stay",
    rewardType: "voucher",
    eligibleTier: "gold",
    pointsRequired: 32_000,
    startDate: "2026-04-15T00:00:00Z",
    endDate: "2026-07-15T23:59:59Z",
    status: "active",
    redemptions: 612,
  },
  {
    id: "cmp_005",
    name: "Moolee Cashback Boost",
    rewardType: "wallet",
    eligibleTier: "silver",
    pointsRequired: 0,
    startDate: "2026-05-15T00:00:00Z",
    endDate: "2026-06-15T23:59:59Z",
    status: "active",
    redemptions: 9_840,
  },
  {
    id: "cmp_006",
    name: "M Faisaa Bill-Pay Bonus",
    rewardType: "wallet",
    eligibleTier: "bronze",
    pointsRequired: 0,
    startDate: "2026-05-15T00:00:00Z",
    endDate: "2026-07-15T23:59:59Z",
    status: "paused",
    redemptions: 1_240,
  },
];

// ─── Recent activity feed ──────────────────────────────────────────────

export const MOCK_ACTIVITY_FEED: ActivityFeedEntry[] = [
  {
    id: "act_2026_06_01_01",
    userName: "Aishath Naila",
    userId: "usr_01HZX7K",
    action: "Top-up via Selfcare — MVR 500 recharge",
    channel: "selfcare",
    points: 320,
    status: "completed",
    occurredAt: "2026-06-01T18:42:00Z",
    kind: "earn",
    reference: "SC-TPU-34821",
  },
  {
    id: "act_2026_06_01_02",
    userName: "Marcus Patel",
    userId: "usr_01HZX7L",
    action: "Redeemed $25 Coffee Credit",
    channel: "selfcare",
    points: -2_500,
    status: "completed",
    occurredAt: "2026-06-01T17:11:00Z",
    kind: "redeem",
    reference: "BW-COFFEE25-77XZ",
  },
  {
    id: "act_2026_06_01_03",
    userName: "Sofia Rossi",
    userId: "usr_01HZX7M",
    action: "M Faisaa wallet credit",
    channel: "mfaisaa",
    points: 480,
    status: "completed",
    occurredAt: "2026-06-01T16:08:00Z",
    kind: "earn",
    reference: "MFAISAA-CB-77120",
  },
  {
    id: "act_2026_06_01_04",
    userName: "Hiroshi Tanaka",
    userId: "usr_01HZX7N",
    action: "Redeemed 5 GB data add-on",
    channel: "selfcare",
    points: -3_200,
    status: "completed",
    occurredAt: "2026-06-01T15:22:00Z",
    kind: "redeem",
    reference: "DATA-5GB-9111",
  },
  {
    id: "act_2026_06_01_05",
    userName: "Diego Fernández",
    userId: "usr_01HZX7Q",
    action: "Failed wallet credit — rolled back",
    channel: "moolee",
    points: 0,
    status: "failed",
    occurredAt: "2026-06-01T14:31:00Z",
    kind: "rollback",
    reference: "MOOLEE-RB-2201",
  },
  {
    id: "act_2026_06_01_06",
    userName: "Aaliyah Carter",
    userId: "usr_01HZX7R",
    action: "Moolee merchant cashback",
    channel: "moolee",
    points: 180,
    status: "completed",
    occurredAt: "2026-06-01T13:45:00Z",
    kind: "earn",
    reference: "MOOLEE-CB-8821",
  },
  {
    id: "act_2026_06_01_07",
    userName: "Olivia Brooks",
    userId: "usr_01HZX7P",
    action: "Welcome bonus — pending KYC",
    channel: "selfcare",
    points: 250,
    status: "pending",
    occurredAt: "2026-06-01T12:30:00Z",
    kind: "earn",
    reference: "SC-WELCOME-3344",
  },
  {
    id: "act_2026_06_01_08",
    userName: "Liam O'Connor",
    userId: "usr_01HZX7S",
    action: "Tier migration — Bronze → Silver",
    channel: "campaign",
    points: 0,
    status: "completed",
    occurredAt: "2026-06-01T11:10:00Z",
    kind: "config",
    reference: "TIER-MIG-2201",
  },
];

// ─── Pending actions ────────────────────────────────────────────────────

export const MOCK_PENDING_ACTIONS: PendingAction[] = [
  {
    id: "pend_001",
    kind: "merchant_approvals",
    title: "Merchant approvals pending",
    description: "Aurelia Audio, Nordic Wellness Co. and 2 more awaiting KYC sign-off.",
    cta: { label: "Review merchants", href: "/admin/merchants" },
    count: 4,
    severity: "warning",
  },
  {
    id: "pend_002",
    kind: "api_config_review",
    title: "API config review",
    description: "A new webhook destination for M Faisaa is awaiting review.",
    cta: { label: "Open API config", href: "/admin/api-config" },
    count: 1,
    severity: "info",
  },
  {
    id: "pend_003",
    kind: "campaign_approval",
    title: "Redemption campaign approval",
    description: "Diamond Concierge Drop is scheduled to launch and needs sign-off.",
    cta: { label: "Open campaign", href: "/admin/redemption-config" },
    count: 1,
    severity: "info",
  },
  {
    id: "pend_004",
    kind: "low_inventory_refill",
    title: "Low inventory refill required",
    description: "10 GB and 5 GB data packs are at or below 10% stock.",
    cta: { label: "Open vouchers", href: "/admin/vouchers" },
    count: 2,
    severity: "critical",
  },
  {
    id: "pend_005",
    kind: "failed_txn_review",
    title: "Failed transaction review",
    description: "4 wallet credit failures and 1 voucher rollback in the last 24h.",
    cta: { label: "Open reports", href: "/admin/reports" },
    count: 5,
    severity: "warning",
  },
];
