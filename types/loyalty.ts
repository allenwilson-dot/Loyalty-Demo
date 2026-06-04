// Core domain types for the Loyalty Management System.
// These types are intentionally framework-agnostic so they can be reused
// across the customer experience, admin back office, and merchant portal.

export type RoleId = "admin" | "merchant" | "viewer";

export interface Role {
  id: RoleId;
  label: string;
  description: string;
}

export type UserStatus =
  | "active"
  | "locked"
  | "suspended"
  | "inactive"
  | "pending"
  | "churned";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  /** National ID / civic number for a telecom loyalty member. */
  nid: string;
  /** Mobile Station International Subscriber Directory Number. */
  msisdn: string;
  /** Linked mobile wallet identifier. */
  walletId: string;
  status: UserStatus;
  tierId: TierId;
  pointsBalance: number;
  lifetimePoints: number;
  joinedAt: string;
  lastActivityAt: string;
  city: string;
  country: string;
  /** Customer type: prepaid, postpaid, or hybrid.
   */
  customerType: CustomerType;
  /** Active sources the user has been earning from.
   */
  channels: UserChannels;
}

export type TierId = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type TierBenefitId =
  | "better_redemption_rate"
  | "exclusive_vouchers"
  | "early_campaign_access"
  | "higher_earning_multiplier"
  | "data_addon_eligibility"
  | "wallet_credit_eligibility"
  | "priority_support"
  | "birthday_pack";

export interface TierBenefit {
  id: TierBenefitId;
  label: string;
  description: string;
}

export const TIER_BENEFITS: TierBenefit[] = [
  { id: "better_redemption_rate", label: "Better redemption rate", description: "Members get a discount when redeeming vouchers and wallet credits." },
  { id: "exclusive_vouchers", label: "Exclusive vouchers", description: "Members can redeem partner vouchers unavailable to lower tiers." },
  { id: "early_campaign_access", label: "Early campaign access", description: "Members see new redemption campaigns 48 hours before public release." },
  { id: "higher_earning_multiplier", label: "Higher earning multiplier", description: "Every qualifying transaction earns more points than the base rate." },
  { id: "data_addon_eligibility", label: "Data add-on eligibility", description: "Members can redeem data add-on rewards in the marketplace." },
  { id: "wallet_credit_eligibility", label: "Wallet credit eligibility", description: "Members can redeem wallet credit rewards into the Moolee wallet." },
  { id: "priority_support", label: "Priority support", description: "Inbound support requests jump to the front of the queue." },
  { id: "birthday_pack", label: "Birthday pack", description: "Members receive a complimentary birthday data or voucher pack." },
];

export const TIER_BENEFIT_LABEL: Record<TierBenefitId, string> = TIER_BENEFITS.reduce(
  (acc, b) => { acc[b.id] = b.label; return acc; },
  {} as Record<TierBenefitId, string>
);

export type TierStatus = "ACTIVE" | "INACTIVE";

export type TierIconName =
  | "Shield"
  | "Sparkles"
  | "Award"
  | "Crown"
  | "Gem"
  | "Star"
  | "Trophy"
  | "BadgeCheck";

export interface Tier {
  id: TierId;
  name: string;
  threshold: number;
  /** Visual ordering rank (0 = entry tier). */
  rank: number;
  multiplier: number;
  color: string;
  perks: string[];
  // Extended configuration (Step 5)
  /** Whether the threshold is measured in points or in spend amount. */
  thresholdType?: "POINTS" | "AMOUNT";
  /** Rule used to determine whether a member qualifies for this tier. */
  upgradeRule?: "lifetime_points" | "lifetime_spend" | "monthly_spend" | "manual";
  /** Tagged benefit categories the tier unlocks. */
  benefits?: TierBenefitId[];
  /** Human-readable description of the redemption benefit. */
  redemptionBenefit?: string;
  /** Short badge label rendered inside the tier medallion. */
  badgeLabel?: string;
  /** Lucide icon name rendered alongside the tier name. */
  iconName?: TierIconName;
  /** Operational status for the tier configuration. */
  status?: TierStatus;
  /** ISO timestamp of the last configuration change. */
  lastUpdated?: string;
  /** Free-form notes from the admin team. */
  notes?: string;
}

// ─── Rewards ──────────────────────────────────────────────────────────────

export type RewardType = "voucher" | "wallet" | "data" | "addon";

export type RewardStatus = "available" | "locked" | "out_of_stock" | "expiring";

export type EntrySource = "selfcare" | "moolee" | "mfaisaa";

export interface Reward {
  id: string;
  title: string;
  type: RewardType;
  pointsCost: number;
  /** Minimum tier required to redeem. `bronze` means everyone qualifies. */
  minTier: TierId;
  description: string;
  /** Long-form terms shown on the detail page. */
  terms: string[];
  /** Available inventory. 0 = out of stock. */
  stock: number;
  /** ISO expiry date. Rewards past this date are auto-blocked. */
  expiresAt: string;
  /** Whether this reward is featured on the member dashboard. */
  featured: boolean;
  /** Voucher-only metadata. */
  merchantId?: string;
  merchantName?: string;
  /** For "data" rewards: how many MB the pack contains. */
  dataMb?: number;
  /** Validity period for the redeemed reward, in days. */
  validityDays: number;
}

export interface OwnedVoucher {
  id: string;
  rewardId: string;
  rewardTitle: string;
  code: string;
  /** Underlying merchant when the reward is a voucher. */
  merchantId?: string;
  merchantName?: string;
  /** ISO date when the coupon was issued. */
  issuedAt: string;
  /** ISO date when the coupon expires. */
  expiresAt: string;
  status: "active" | "redeemed" | "expired";
}

export type RewardFilterType = RewardType | "all";
export type RewardFilterTier = TierId | "all";
export type RewardFilterStatus = "available" | "locked" | "out_of_stock" | "all";

// ─── Vouchers (system-wide catalogue) ────────────────────────────────────

export type VoucherStatus = "active" | "draft" | "expired" | "disabled";

export interface Voucher {
  id: string;
  code: string;
  name: string;
  merchantId: string;
  merchantName: string;
  value: number;
  currency: string;
  pointsCost: number;
  status: VoucherStatus;
  issued: number;
  redeemed: number;
  expiresAt: string;
}

// ─── Transactions ────────────────────────────────────────────────────────

export type TransactionType = "earn" | "redeem" | "adjust" | "expire" | "bonus";
export type TransactionStatus = "completed" | "pending" | "reversed" | "failed";

export type TransactionChannel =
  | "selfcare"
  | "moolee"
  | "mfaisaa"
  | "store"
  | "api"
  | "campaign";

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  userName: string;
  type: TransactionType;
  status: TransactionStatus;
  points: number;
  description: string;
  /** Free-form reference like a voucher code or order id. */
  reference: string;
  occurredAt: string;
  channel: TransactionChannel;
  /** Optional link back to the source reward when the txn is a redemption. */
  rewardId?: string;
}

// ─── Redemption result ───────────────────────────────────────────────────

export type RedemptionFailureReason =
  | "tier_locked"
  | "out_of_stock"
  | "expired"
  | "insufficient_points"
  | "simulated_failure";

export interface RedemptionSuccess {
  ok: true;
  transactionId: string;
  voucher?: OwnedVoucher;
  reward: Reward;
  newPointsBalance: number;
}

export interface RedemptionFailure {
  ok: false;
  reason: RedemptionFailureReason;
  message: string;
}

export type RedemptionResult = RedemptionSuccess | RedemptionFailure;

// ─── Audit ───────────────────────────────────────────────────────────────

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  severity: AuditSeverity;
  occurredAt: string;
  ipAddress: string;
}

// ─── Merchants (back-office merchant onboarding) ─────────────────────────

export type MerchantStatus = "active" | "onboarding" | "paused";

export interface Merchant {
  id: string;
  name: string;
  category: string;
  contactName: string;
  contactEmail: string;
  city: string;
  status: MerchantOnboardingStatus;
  joinedAt: string;
  outstandingVouchers: number;
}

// ─── Back-office dashboard ────────────────────────────────────────────────

export type DateRange = "today" | "7d" | "30d" | "custom";

export type KpiStatus = "healthy" | "watch" | "critical";

export type KpiFormat = "number" | "percent" | "compact" | "currency";

export interface KpiCardData {
  id: string;
  label: string;
  value: number;
  format: KpiFormat;
  /** Percent change vs the previous comparable period. */
  changePercent: number;
  /** Short human label, e.g. "+12.4% vs last period". */
  changeLabel?: string;
  status: KpiStatus;
  /** Roles that should see this card. Empty array = visible to all. */
  visibleTo?: RoleId[];
}

export interface TrendPoint {
  date: string;
  label: string;
  earned: number;
  redeemed: number;
}

export type DashboardChannel = "selfcare" | "moolee" | "mfaisaa" | "other";

export interface ChannelContribution {
  channel: DashboardChannel;
  label: string;
  points: number;
  percent: number;
  color: string;
}

export interface RedemptionTypeStat {
  type: RewardType;
  total: number;
  success: number;
  failed: number;
  pending: number;
}

export type VoucherMode = "inventory" | "api";
export type VoucherHealth = "healthy" | "watch" | "critical" | "api";

export interface VoucherInventoryRow {
  id: string;
  title: string;
  merchantName: string;
  mode: VoucherMode;
  total: number;
  remaining: number;
  usagePercent: number;
  health: VoucherHealth;
  expiresAt: string;
  apiSuccessRate?: number;
}

export type CampaignStatus = "active" | "scheduled" | "expiring_soon" | "paused";

export interface ActiveCampaign {
  id: string;
  name: string;
  rewardType: RewardType;
  eligibleTier: TierId;
  pointsRequired: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  redemptions: number;
}

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertAction = "view" | "resolve" | "ignore";

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  module: string;
  message: string;
  details: string;
  occurredAt: string;
  primaryCta: { label: string; action: AlertAction };
  secondaryCta?: { label: string; action: AlertAction };
  /** Optional link to open when the user clicks "View details". */
  href?: string;
}

export type PendingActionKind =
  | "merchant_approvals"
  | "api_config_review"
  | "campaign_approval"
  | "low_inventory_refill"
  | "failed_txn_review";

export interface PendingAction {
  id: string;
  kind: PendingActionKind;
  title: string;
  description: string;
  cta: { label: string; href: string };
  count: number;
  severity: AlertSeverity;
}

export interface DashboardAuditEntry {
  id: string;
  occurredAt: string;
  actor: string;
  role: RoleId;
  module: string;
  action: string;
  status: "success" | "info" | "warning";
  details: string;
}

export type ActivityKind =
  | "earn"
  | "redeem"
  | "rollback"
  | "failure"
  | "config";

export interface ActivityFeedEntry {
  id: string;
  userName: string;
  userId: string;
  action: string;
  channel: TransactionChannel;
  points: number;
  status: TransactionStatus;
  occurredAt: string;
  kind: ActivityKind;
  reference?: string;
}

// ─── User Management (Step 4) ───────────────────────────────────────────

export type CustomerType = "prepaid" | "postpaid" | "hybrid";

/** Booleans per source — every user can have any combination. */
export interface UserChannels {
  selfcare: boolean;
  moolee: boolean;
  mfaisaa: boolean;
}

export type UserAccountStatus = "active" | "locked" | "suspended" | "inactive";

export type LedgerEntryType =
  | "earn"
  | "redeem"
  | "adjustment"
  | "reversal"
  | "rollback"
  | "bonus"
  | "expire";

export interface LedgerEntry {
  id: string;
  userId: string;
  /** Signed point value. Positive for earn / adjustment, negative for redeem / reversal. */
  points: number;
  type: LedgerEntryType;
  openingBalance: number;
  closingBalance: number;
  source: TransactionChannel | "admin";
  reference: string;
  description: string;
  occurredAt: string;
  /** Set when an admin action drove the entry. */
  actor?: string;
  /** Set when an admin adjustment includes a free-form reason. */
  reason?: string;
  status: TransactionStatus;
}

export interface UserRedemption {
  id: string;
  userId: string;
  rewardId: string;
  rewardTitle: string;
  rewardType: RewardType;
  points: number;
  status: "completed" | "pending" | "failed";
  couponCode?: string;
  merchantName?: string;
  occurredAt: string;
  reference: string;
}

export type AdminActionType =
  | "points_added"
  | "points_reversed"
  | "locked"
  | "unlocked";

export interface UserAdminAction {
  id: string;
  userId: string;
  action: AdminActionType;
  /** Point value for add / reverse actions. */
  points?: number;
  reason: string;
  actor: string;
  role: RoleId;
  occurredAt: string;
  /** Free-form note from the admin. */
  note?: string;
  /** Whether the member was notified. */
  notifyUser?: boolean;
}

export interface BulkAdjustmentPreviewRow {
  rowNumber: number;
  msisdn: string;
  points: number;
  reason: string;
  status: "valid" | "invalid" | "skipped";
  message?: string;
  userId?: string;
  userName?: string;
}

export interface BulkAdjustmentSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

export type UserSortField = "name" | "tier" | "balance" | "activity";
export type UserSortDirection = "asc" | "desc";

export interface UserFilters {
  query: string;
  tier: TierId | "all";
  status: UserAccountStatus | "all";
  channel: "selfcare" | "moolee" | "mfaisaa" | "all";
  sortField: UserSortField;
  sortDirection: UserSortDirection;
  page: number;
  pageSize: number;
}

export type AdminAuditAction =
  | "USER_EXPORT"
  | "USER_REFRESH"
  | "USER_PROFILE_VIEWED"
  | "POINTS_ADDED"
  | "POINTS_REVERSED"
  | "USER_LOCKED"
  | "USER_UNLOCKED"
  | "BULK_POINTS_ADJUSTMENT"
  | "BULK_POINTS_VALIDATION_FAILED"
  | "TIER_EXPORT"
  | "TIER_REFRESH"
  | "TIER_CREATED"
  | "TIER_UPDATED"
  | "TIER_ACTIVATED"
  | "TIER_DEACTIVATED"
  | "TIER_VIEWED"
  | "TIER_UPGRADE_SIMULATED"
  | "USER_TIER_UPDATED"
  | "EARNING_RULE_EXPORT"
  | "EARNING_RULE_REFRESH"
  | "EARNING_RULE_CREATED"
  | "EARNING_RULE_UPDATED"
  | "EARNING_RULE_VIEWED"
  | "EARNING_RULE_ACTIVATED"
  | "EARNING_RULE_DEACTIVATED"
  | "EARNING_RULE_TESTED"
  | "EARN_EVENT_APPLIED"
  | "EARN_EVENT_DUPLICATE_BLOCKED"
  | "EARN_EVENT_NO_RULE_FOUND"
  | "MERCHANT_EXPORT"
  | "MERCHANT_REFRESH"
  | "MERCHANT_CREATED"
  | "MERCHANT_UPDATED"
  | "MERCHANT_VIEWED"
  | "MERCHANT_ACTIVATED"
  | "MERCHANT_DEACTIVATED"
  | "MERCHANT_KYC_APPROVED"
  | "MERCHANT_KYC_REJECTED"
  | "MERCHANT_VALIDATION_FAILED"
  | "VOUCHER_EXPORT"
  | "VOUCHER_REFRESH"
  | "VOUCHER_CREATED"
  | "VOUCHER_UPDATED"
  | "VOUCHER_VIEWED"
  | "VOUCHER_ACTIVATED"
  | "VOUCHER_DEACTIVATED"
  | "VOUCHER_INVENTORY_ADDED"
  | "VOUCHER_INVENTORY_UPLOAD_FAILED"
  | "VOUCHER_API_TEST_SUCCESS"
  | "VOUCHER_API_TEST_FAILED"
  | "VOUCHER_VALIDATION_FAILED"
  | "VOUCHER_UPLOADED";

export type AdminAuditStatus = "success" | "info" | "warning" | "error";

/**
 * Canonical admin audit log entry. Backed by `lib/audit.ts`. Both the
 * dashboard and the user management module write into the same store.
 */
export interface AdminAuditEntry {
  id: string;
  occurredAt: string;
  actor: string;
  role: RoleId;
  module: string;
  action: AdminAuditAction | string;
  status: AdminAuditStatus;
  details: string;
  /** Free-form target reference (e.g. user id, alert id, csv file). */
  target?: string;
}


// ─── Earning Rules (Step 6) ────────────────────────────────────────────

export type EarningServiceSource = "MFAISAA" | "MOOLEE" | "SELFCARE" | "OTHER";
export type EarningUserType = "PREPAID" | "POSTPAID" | "HYBRID" | "ALL";
export type EarningTransactionType = "TRANSACTIONAL" | "NON_TRANSACTIONAL";
export type EarningRewardType = "POINT" | "PERCENT";
export type EarningEventName =
  | "Recharge"
  | "Data Pack Purchase"
  | "Moolee Purchase"
  | "Wallet Payment"
  | "Wallet Top-Up"
  | "Bill Payment"
  | "First Transaction"
  | "Login Streak"
  | "Campaign Bonus"
  | "Referral Bonus"
  | "Profile Completion"
  | "Custom Event";
export type EarningRuleStatus = "ACTIVE" | "INACTIVE";

export interface EarningRule {
  id: string;
  serviceSource: EarningServiceSource;
  userType: EarningUserType;
  transactionType: EarningTransactionType;
  eventName: EarningEventName;
  /** Free-form label when eventName is "Custom Event". */
  customEventName?: string;
  rewardType: EarningRewardType;
  rewardValue: number;
  /** Optional cap on the transaction amount that counts toward earning. */
  maximumTransactionAmount?: number;
  /** Optional expiry in days for points earned through this rule. */
  expiryDays?: number;
  pushNotification: boolean;
  notificationMessage?: string;
  status: EarningRuleStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface EarnEvent {
  id: string;
  serviceSource: EarningServiceSource;
  userType: EarningUserType;
  transactionType: EarningTransactionType;
  eventName: EarningEventName;
  customEventName?: string;
  amount: number;
  referenceId: string;
  userId: string;
  occurredAt: string;
}

export type EarnEventResultStatus =
  | "applied"
  | "no_rule"
  | "duplicate"
  | "invalid";

export interface EarnEventResult {
  status: EarnEventResultStatus;
  message: string;
  points: number;
  rule?: EarningRule;
  expiryDate?: string;
  transaction?: LoyaltyTransaction;
  ledgerEntry?: LedgerEntry;
}


// ─── Merchant Onboarding (Step 7) ──────────────────────────────────────

export type MerchantType = "INTERNAL" | "EXTERNAL" | "PARTNER";
export type MerchantKycStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MerchantApiEnabled = "YES" | "NO";
export type MerchantOnboardingStatus = "ACTIVE" | "INACTIVE";

/** Augmented merchant shape used by the Merchant Onboarding module. */
export interface MerchantOnboarding {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantType: MerchantType;
  contactPerson: string;
  contactEmail: string;
  contactNumber: string;
  apiEnabled: MerchantApiEnabled;
  kycDocumentName: string;
  kycStatus: MerchantKycStatus;
  kycRemarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  status: MerchantOnboardingStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  /** Free-form contact city (used to keep the directory human-friendly). */
  city?: string;
  /** Voucher count is denormalised but also computable from MOCK_VOUCHERS. */
  voucherCount: number;
}

export interface MerchantFormInput {
  merchantName: string;
  merchantType: MerchantType;
  contactPerson: string;
  contactEmail: string;
  contactNumber: string;
  apiEnabled: MerchantApiEnabled;
  kycDocumentName: string;
  kycStatus: MerchantKycStatus;
  status: MerchantOnboardingStatus;
  notes: string;
  city: string;
}

export interface MerchantCapability {
  canCreateVoucher: boolean;
  canCreateApiVoucher: boolean;
  canCreateInventoryVoucher: boolean;
  reasons: string[];
}


// ─── Voucher Management (Step 8) ───────────────────────────────────────

/** Independent type for the back-office voucher module. Coexists with the
 * legacy `Voucher` (used by the customer rewards marketplace) but uses
 * the merchant onboarding identifiers from Step 7. */
export type VoucherManagementMode = "INVENTORY" | "API";

export type VoucherManagementStatus = "ACTIVE" | "INACTIVE";

export type CouponCodeStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "REDEEMED"
  | "EXPIRED";

export type VoucherStockHealth =
  | "HEALTHY"
  | "WATCH"
  | "CRITICAL"
  | "OUT_OF_STOCK"
  | "API";

export interface CouponCode {
  id: string;
  code: string;
  status: CouponCodeStatus;
  assignedToUserId?: string;
  assignedAt?: string;
  redeemedAt?: string;
}

export interface VoucherManagement {
  id: string;
  voucherId: string;
  /** References the Step 7 merchant onboarding `id` (e.g. "mob_001"). */
  merchantId: string;
  /** Snapshotted merchant name for display. */
  merchantName: string;
  voucherTitle: string;
  voucherMode: VoucherManagementMode;
  /** Monetary value of the voucher (in the merchant's currency). */
  voucherValue: number;
  description: string;
  expiryDate: string;
  status: VoucherManagementStatus;
  /** Inventory vouchers only — total number of coupon codes attached. */
  totalInventory: number;
  /** Inventory vouchers only — number of coupon codes in AVAILABLE status. */
  remainingInventory: number;
  /** Inventory vouchers only — full coupon code catalogue. */
  couponCodes: CouponCode[];
  /** API vouchers only — references an API configuration. */
  apiConfigId?: string;
  apiConfigName?: string;
  apiEndpoint?: string;
  apiAuthType?: "API_KEY" | "OAUTH" | "BASIC" | "NONE";
  apiTimeoutMs?: number;
  apiRetryCount?: number;
  lastApiTestStatus?: "SUCCESS" | "FAILED" | "PENDING";
  lastApiTestAt?: string;
  lastApiTestMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherFormInput {
  merchantId: string;
  voucherTitle: string;
  voucherMode: VoucherManagementMode;
  voucherValue: number;
  description: string;
  expiryDate: string;
  status: VoucherManagementStatus;
  /** Used by the create flow to seed inventory. */
  initialCouponCodes: string[];
  /** Used by API mode. */
  apiConfigId?: string;
  apiConfigName?: string;
  apiEndpoint?: string;
  apiAuthType?: "API_KEY" | "OAUTH" | "BASIC" | "NONE";
  apiTimeoutMs?: number;
  apiRetryCount?: number;
}

export interface VoucherCapability {
  canActivate: boolean;
  reasons: string[];
  inventoryEligible: boolean;
  apiEligible: boolean;
}

export interface VoucherApiConfigOption {
  id: string;
  name: string;
  endpoint: string;
  authType: "API_KEY" | "OAUTH" | "BASIC" | "NONE";
  timeoutMs: number;
  retryCount: number;
}

// ─── API Configuration (Admin) ─────────────────────────────────────────

export type ApiCategory =
  | "VMS"
  | "THIRD_PARTY_VOUCHER"
  | "WALLET_CREDIT"
  | "DATA_ADDON"
  | "ADDON_SERVICE"
  | "OTHER";

export type HttpMethod = "GET" | "POST" | "PUT";

export type ApiAuthType = "NONE" | "BASIC" | "BEARER" | "API_KEY" | "OAUTH";

export type ApiConfigStatus = "ACTIVE" | "INACTIVE";

export interface ApiConfig {
  id: string;
  partnerName: string;
  apiCategory: ApiCategory;
  endpointUrl: string;
  httpMethod: HttpMethod;
  authType: ApiAuthType;
  credentialsJson: string;
  headersJson: string;
  requestTemplateJson: string;
  responseMappingJson: string;
  timeoutMs: number;
  retryCount: number;
  status: ApiConfigStatus;
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  slaNotes: string;
  lastTestedAt?: string;
  lastTestStatus?: "SUCCESS" | "FAILURE" | "TIMEOUT" | "INVALID_MAPPING";
  lastTestMessage?: string;
  linkedVoucherIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiConfigFormInput {
  partnerName: string;
  apiCategory: ApiCategory;
  endpointUrl: string;
  httpMethod: HttpMethod;
  authType: ApiAuthType;
  credentialsJson: string;
  headersJson: string;
  requestTemplateJson: string;
  responseMappingJson: string;
  timeoutMs: number;
  retryCount: number;
  status: ApiConfigStatus;
  sandboxBaseUrl: string;
  productionBaseUrl: string;
  slaNotes: string;
}

// ─── Redemption Campaigns ──────────────────────────────────────────────

export type RedemptionRewardType = "VOUCHER" | "DATA" | "ADDON" | "WALLET";

export type RedemptionCampaignStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export interface IntradaySlot {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface RedemptionCampaign {
  id: string;
  rewardName: string;
  rewardType: RedemptionRewardType;
  /** Only populated when rewardType = VOUCHER */
  voucherId?: string;
  voucherTitle?: string;
  pointsRequired: number;
  /** e.g. how many points per 1 currency unit */
  conversionRate: number;
  startDate: string;
  endDate: string;
  intradaySlot?: IntradaySlot;
  eligibleTiers: TierId[];
  status: RedemptionCampaignStatus;
  description?: string;
  merchantId?: string;
  merchantName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RedemptionCampaignFormInput {
  rewardName: string;
  rewardType: RedemptionRewardType;
  voucherId?: string;
  pointsRequired: number;
  conversionRate: number;
  startDate: string;
  endDate: string;
  intradaySlot?: IntradaySlot;
  eligibleTiers: TierId[];
  status: RedemptionCampaignStatus;
  description?: string;
}
