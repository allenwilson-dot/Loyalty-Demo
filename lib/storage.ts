/**
 * Lightweight, SSR-safe wrapper around `window.localStorage`.
 *
 * The loyalty prototype persists mock data and the currently selected role
 * in the browser. All access is funneled through this module so the rest of
 * the app does not need to think about `typeof window` guards.
 */

const PREFIX = "loyalty.";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[storage] failed to read key "${key}"`, error);
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[storage] failed to write key "${key}"`, error);
  }
}

export function removeStorage(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch (error) {
    console.warn(`[storage] failed to remove key "${key}"`, error);
  }
}

export const StorageKeys = {
  activeRole: "activeRole",
  users: "users",
  tiers: "tiers",
  rewards: "rewards",
  merchants: "merchants",
  vouchers: "vouchers",
  transactions: "transactions",
  auditLogs: "auditLogs",
  /** Current member powering the customer experience. */
  sessionUser: "sessionUser",
  /** Vouchers the member has redeemed (codes they own). */
  ownedVouchers: "ownedVouchers",
  /** Demo control: if true, redemption flows are forced to fail. */
  simulateFailure: "simulateFailure",
  /** Last selected date range for the back-office dashboard. */
  dashboardRange: "dashboardRange",
  /** Set of alert ids the admin has resolved. */
  resolvedAlerts: "resolvedAlerts",
  /** Set of alert ids the admin has dismissed. */
  ignoredAlerts: "ignoredAlerts",
  /** Back-office audit trail (seeded from MOCK_AUDIT_LOG). */
  dashboardAudit: "dashboardAudit",
  /** Persisted user roster for the back-office. */
  adminUsers: "adminUsers",
  /** Admin actions applied to users (lock, add, reverse). */
  adminUserActions: "adminUserActions",
  /** Per-user points ledger (auto-generated from transactions + admin actions). */
  userLedgers: "userLedgers",
  /** Last refreshed timestamp for the user management page. */
  usersLastRefreshed: "usersLastRefreshed",
  /** Canonical admin audit log (shared by dashboard + user management). */
  adminAudit: "adminAudit",
  /** Persisted tier roster for the back-office Tier Management module. */
  adminTiers: "adminTiers",
  /** ISO timestamp of the last tier refresh. */
  tiersLastRefreshed: "tiersLastRefreshed",
  /** Manual tier overrides applied to specific users. */
  adminUserTiers: "adminUserTiers",
  /** Persisted earning rules roster for the back-office Earning Rules module. */
  adminEarningRules: "adminEarningRules",
  /** ISO timestamp of the last earning-rules refresh. */
  earningRulesLastRefreshed: "earningRulesLastRefreshed",
  /** Processed earn event reference ids (used for duplicate detection). */
  processedEarnReferences: "processedEarnReferences",
  /** Earn events applied through the test simulator. */
  testEarnEvents: "testEarnEvents",
  /** User points balance overrides for the test earn flow. */
  testEarnUserBalances: "testEarnUserBalances",
  /** Persisted merchant roster for the back-office Merchant Onboarding module. */
  adminMerchants: "adminMerchants",
  /** ISO timestamp of the last merchant refresh. */
  merchantsLastRefreshed: "merchantsLastRefreshed",
  /** Persisted voucher roster for the back-office Voucher Management module. */
  adminVouchers: "adminVouchers",
  /** ISO timestamp of the last voucher refresh. */
  vouchersLastRefreshed: "vouchersLastRefreshed",
  /** Merchant scope applied to the merchant-role view of vouchers. */
  vouchersScopedMerchant: "vouchersScopedMerchant",
  /** Persisted API configuration roster for the back-office. */
  adminApiConfigs: "adminApiConfigs",
  /** ISO timestamp of the last API config refresh. */
  apiConfigsLastRefreshed: "apiConfigsLastRefreshed",
  /** Persisted redemption campaigns for the back-office. */
  adminRedemptionCampaigns: "adminRedemptionCampaigns",
  /** ISO timestamp of the last redemption campaign refresh. */
  redemptionCampaignsLastRefreshed: "redemptionCampaignsLastRefreshed",
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
