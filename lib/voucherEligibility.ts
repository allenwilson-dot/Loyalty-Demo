import { MOCK_VOUCHER_API_CONFIGS } from "@/data/mockVoucherManagement";
import type {
  MerchantApiEnabled,
  MerchantKycStatus,
  MerchantOnboarding,
  MerchantOnboardingStatus,
  VoucherApiConfigOption,
  VoucherCapability,
  VoucherManagement,
  VoucherManagementMode,
  VoucherManagementStatus,
} from "@/types/loyalty";

/**
 * Returns true if the merchant is eligible to participate in voucher
 * configuration. Mirrors the Step 7 `canCreateVoucher` rule.
 */
export function isMerchantEligible(merchant: {
  status: MerchantOnboardingStatus;
  kycStatus: MerchantKycStatus;
}): boolean {
  return merchant.status === "ACTIVE" && merchant.kycStatus === "APPROVED";
}

/**
 * Returns true when the merchant can create API-driven vouchers.
 * Requires the merchant's `apiEnabled` to be YES in addition to the
 * standard active + KYC approved checks.
 */
export function canCreateApiVoucher(merchant: {
  status: MerchantOnboardingStatus;
  kycStatus: MerchantKycStatus;
  apiEnabled: MerchantApiEnabled;
}): boolean {
  return (
    merchant.status === "ACTIVE" &&
    merchant.kycStatus === "APPROVED" &&
    merchant.apiEnabled === "YES"
  );
}

/**
 * Returns the list of voucher modes a merchant can create given the
 * Step 7 eligibility rules.
 */
export function availableVoucherModes(merchant: MerchantOnboarding): VoucherManagementMode[] {
  if (!isMerchantEligible(merchant)) return [];
  if (canCreateApiVoucher(merchant)) return ["INVENTORY", "API"];
  return ["INVENTORY"];
}

/**
 * Builds a structured capability report for a given merchant + voucher
 * mode. Used by the form drawer's live preview and the details drawer.
 */
export function describeVoucherCapability(
  merchant: MerchantOnboarding,
  mode: VoucherManagementMode
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (merchant.status !== "ACTIVE") {
    reasons.push("Merchant is inactive.");
  }
  if (merchant.kycStatus !== "APPROVED") {
    reasons.push(`Merchant KYC is ${merchant.kycStatus.toLowerCase()}.`);
  }
  if (mode === "API" && merchant.apiEnabled !== "YES") {
    reasons.push("Merchant is configured for inventory vouchers only.");
  }
  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

/**
 * Computes the activation capability for an existing voucher. Returns
 * the reasons it cannot be activated (e.g. merchant inactive, expired,
 * no inventory, no API config).
 */
export function describeVoucherActivation(
  voucher: VoucherManagement,
  merchant: MerchantOnboarding | null
): VoucherCapability {
  const reasons: string[] = [];
  if (!merchant) {
    reasons.push("Linked merchant no longer exists.");
  } else {
    if (merchant.status !== "ACTIVE") {
      reasons.push("Merchant is inactive.");
    }
    if (merchant.kycStatus !== "APPROVED") {
      reasons.push(`Merchant KYC is ${merchant.kycStatus.toLowerCase()}.`);
    }
  }
  if (isVoucherExpired(voucher.expiryDate)) {
    reasons.push("Voucher expiry date is in the past.");
  }
  if (voucher.voucherMode === "INVENTORY") {
    if (voucher.remainingInventory <= 0) {
      reasons.push("Inventory is exhausted.");
    }
  } else {
    if (!voucher.apiConfigId) {
      reasons.push("API configuration is missing.");
    }
  }
  return {
    canActivate: reasons.length === 0 && voucher.status !== "ACTIVE",
    reasons,
    inventoryEligible: merchant
      ? isMerchantEligible(merchant)
      : false,
    apiEligible: merchant ? canCreateApiVoucher(merchant) : false,
  };
}

/**
 * Computes stock health for an inventory voucher.
 *
 * - Remaining inventory > 30% = Healthy
 * - Remaining inventory between 10% and 30% = Watch
 * - Remaining inventory below 10% = Critical
 * - Remaining inventory = 0 = Out of Stock
 * - API vouchers always return "API" so they can be rendered distinctly.
 */
export function computeStockHealth(
  voucher: VoucherManagement
): import("@/types/loyalty").VoucherStockHealth {
  if (voucher.voucherMode === "API") return "API";
  if (voucher.totalInventory <= 0) return "OUT_OF_STOCK";
  const ratio = voucher.remainingInventory / voucher.totalInventory;
  if (ratio <= 0) return "OUT_OF_STOCK";
  if (ratio < 0.1) return "CRITICAL";
  if (ratio < 0.3) return "WATCH";
  return "HEALTHY";
}

/**
 * Returns true when the expiry date is in the past.
 */
export function isVoucherExpired(expiryDate: string): boolean {
  if (!expiryDate) return true;
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return true;
  return expiry.getTime() < Date.now();
}

/**
 * Returns true when the voucher is expiring within the supplied window
 * (default 30 days).
 */
export function isVoucherExpiringSoon(
  expiryDate: string,
  windowDays = 30
): boolean {
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  const diff = expiry.getTime() - Date.now();
  if (diff < 0) return false;
  return diff <= windowDays * 24 * 60 * 60 * 1000;
}

/**
 * Aggregates stock + status + expiry into a single eligibility verdict
 * for the live preview card and the details drawer.
 */
export function computeVoucherEligibility(
  voucher: VoucherManagement,
  merchant: MerchantOnboarding | null
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (voucher.status !== "ACTIVE") reasons.push("Voucher is not active.");
  if (!merchant) {
    reasons.push("Linked merchant is missing.");
    return { eligible: false, reasons };
  }
  if (merchant.status !== "ACTIVE") reasons.push("Merchant is inactive.");
  if (merchant.kycStatus !== "APPROVED")
    reasons.push(`Merchant KYC is ${merchant.kycStatus.toLowerCase()}.`);
  if (isVoucherExpired(voucher.expiryDate))
    reasons.push("Voucher expiry date is in the past.");
  if (voucher.voucherMode === "INVENTORY" && voucher.remainingInventory <= 0)
    reasons.push("Inventory is exhausted.");
  if (voucher.voucherMode === "API" && !voucher.apiConfigId)
    reasons.push("API configuration is missing.");
  return { eligible: reasons.length === 0, reasons };
}

/**
 * Returns the available API configurations for a given merchant. Only
 * API-enabled merchants should have non-empty results.
 */
export function availableApiConfigs(
  merchant: MerchantOnboarding
): VoucherApiConfigOption[] {
  if (merchant.apiEnabled !== "YES") return [];
  // For the prototype we just return every configured API — production
  // code would scope this by merchant.
  return MOCK_VOUCHER_API_CONFIGS;
}

/**
 * Validates whether a particular voucher status transition is allowed.
 * Used to gate the activate / deactivate CTAs.
 */
export function isStatusTransitionAllowed(
  voucher: VoucherManagement,
  merchant: MerchantOnboarding | null,
  next: VoucherManagementStatus
): { ok: boolean; message?: string } {
  if (next === "INACTIVE") return { ok: true };
  // Activating — must clear the activation checks.
  const cap = describeVoucherActivation(voucher, merchant);
  if (!cap.canActivate) {
    return {
      ok: false,
      message: cap.reasons[0] ?? "Voucher cannot be activated.",
    };
  }
  return { ok: true };
}
