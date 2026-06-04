import type {
  MerchantApiEnabled,
  MerchantCapability,
  MerchantKycStatus,
  MerchantOnboarding,
  MerchantOnboardingStatus,
} from "@/types/loyalty";

/**
 * Returns true when the merchant is allowed to participate in voucher
 * creation flows. Inactive merchants or merchants without approved KYC
 * are excluded.
 */
export function canCreateVoucher(merchant: {
  status: MerchantOnboardingStatus;
  kycStatus: MerchantKycStatus;
}): boolean {
  return merchant.status === "ACTIVE" && merchant.kycStatus === "APPROVED";
}

/**
 * Returns true when the merchant can create API-driven vouchers in
 * addition to inventory vouchers. Requires API enablement in addition
 * to the standard active + KYC approved checks.
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
 * Returns true when the merchant can create inventory-backed vouchers.
 * API enablement is not required for inventory vouchers.
 */
export function canCreateInventoryVoucher(merchant: {
  status: MerchantOnboardingStatus;
  kycStatus: MerchantKycStatus;
}): boolean {
  return merchant.status === "ACTIVE" && merchant.kycStatus === "APPROVED";
}

/**
 * Computes a structured capability report for the supplied merchant.
 * Used by the back-office drawer, the form preview pane, and the
 * voucher management module (later).
 */
export function describeMerchantCapability(
  merchant: MerchantOnboarding
): MerchantCapability {
  const reasons: string[] = [];
  if (merchant.status !== "ACTIVE") {
    reasons.push("Merchant is inactive.");
  }
  if (merchant.kycStatus !== "APPROVED") {
    reasons.push(`KYC is ${merchant.kycStatus.toLowerCase()}.`);
  }
  return {
    canCreateVoucher: canCreateVoucher(merchant),
    canCreateApiVoucher: canCreateApiVoucher(merchant),
    canCreateInventoryVoucher: canCreateInventoryVoucher(merchant),
    reasons,
  };
}

/**
 * Returns a human-friendly description of the merchant's current voucher
 * capability — used inside the capability preview card.
 */
export function describeCapabilityLine(merchant: MerchantOnboarding): string {
  if (merchant.status === "INACTIVE") {
    return "Merchant is inactive and will not be available for new voucher configuration.";
  }
  if (merchant.kycStatus !== "APPROVED") {
    return "Merchant is not yet eligible for active voucher campaigns until KYC is approved.";
  }
  if (merchant.apiEnabled === "YES") {
    return "Merchant will be eligible for Inventory and API voucher modes once active and KYC approved.";
  }
  return "Merchant will be eligible for Inventory voucher mode only once active and KYC approved.";
}
