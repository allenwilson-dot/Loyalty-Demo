import type {
  CouponCode,
  VoucherApiConfigOption,
  VoucherManagement,
} from "@/types/loyalty";

/**
 * Seeded voucher roster for the back-office Voucher Management module.
 * Each voucher references a Step 7 merchant onboarding `id` (e.g. "mob_001")
 * so the eligibility logic can be applied accurately.
 */

function makeCoupon(code: string, status: CouponCode["status"], extras: Partial<CouponCode> = {}): CouponCode {
  return {
    id: `cpn_${code}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    code,
    status,
    ...extras,
  };
}

function buildInventory(count: number, redeemed: number): CouponCode[] {
  const list: CouponCode[] = [];
  for (let i = 0; i < count; i += 1) {
    const code = `VC-${1000 + i}`;
    if (i < redeemed) {
      list.push(makeCoupon(code, "REDEEMED", {
        assignedToUserId: "u_test",
        assignedAt: "2026-04-12T08:30:00Z",
        redeemedAt: "2026-04-13T11:20:00Z",
      }));
    } else {
      list.push(makeCoupon(code, "AVAILABLE"));
    }
  }
  return list;
}

export const MOCK_VOUCHER_API_CONFIGS: VoucherApiConfigOption[] = [
  {
    id: "api_cfg_mfaisaa",
    name: "M Faisaa Voucher API",
    endpoint: "https://api.m-faisaa.example/v1/vouchers",
    authType: "API_KEY",
    timeoutMs: 5_000,
    retryCount: 2,
  },
  {
    id: "api_cfg_moolee",
    name: "Moolee Marketplace Voucher API",
    endpoint: "https://api.moolee.example/v2/vouchers",
    authType: "OAUTH",
    timeoutMs: 8_000,
    retryCount: 3,
  },
  {
    id: "api_cfg_travel",
    name: "Travel Deals Voucher API",
    endpoint: "https://api.traveldeals.example/vouchers/issue",
    authType: "API_KEY",
    timeoutMs: 6_000,
    retryCount: 1,
  },
  {
    id: "api_cfg_digital",
    name: "Digital Services Voucher API",
    endpoint: "https://api.digitalservices.example/v1/codes",
    authType: "BASIC",
    timeoutMs: 4_000,
    retryCount: 2,
  },
];

export const MOCK_VOUCHER_MANAGEMENT: VoucherManagement[] = [
  // ── M Faisaa Rewards (INTERNAL, API enabled, KYC approved) ─────────────
  {
    id: "vmg_001",
    voucherId: "VMG-MFA-001",
    merchantId: "mob_001",
    merchantName: "M Faisaa Rewards",
    voucherTitle: "MVR 100 Wallet Credit Voucher",
    voucherMode: "API",
    voucherValue: 100,
    description:
      "Top up the linked Moolee wallet with MVR 100 of credit that can be used at any partner merchant.",
    expiryDate: "2026-12-31T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 0,
    remainingInventory: 0,
    couponCodes: [],
    apiConfigId: "api_cfg_mfaisaa",
    apiConfigName: "M Faisaa Voucher API",
    apiEndpoint: "https://api.m-faisaa.example/v1/vouchers",
    apiAuthType: "API_KEY",
    apiTimeoutMs: 5_000,
    apiRetryCount: 2,
    lastApiTestStatus: "SUCCESS",
    lastApiTestAt: "2026-05-21T14:08:00Z",
    lastApiTestMessage: "Issued voucher code MVR-7841 in 412ms.",
    createdAt: "2025-09-12T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  {
    id: "vmg_002",
    voucherId: "VMG-MFA-002",
    merchantId: "mob_001",
    merchantName: "M Faisaa Rewards",
    voucherTitle: "MVR 25 Top-up Voucher",
    voucherMode: "INVENTORY",
    voucherValue: 25,
    description:
      "Reusable MVR 25 wallet top-up voucher. Redeem in the customer app to receive the credit instantly.",
    expiryDate: "2026-08-15T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 500,
    remainingInventory: 412,
    couponCodes: buildInventory(500, 88),
    createdAt: "2025-11-04T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  // ── Moolee Marketplace (INTERNAL, API enabled, KYC approved) ──────────
  {
    id: "vmg_003",
    voucherId: "VMG-MOO-001",
    merchantId: "mob_002",
    merchantName: "Moolee Marketplace",
    voucherTitle: "Moolee Weekend City Stay",
    voucherMode: "API",
    voucherValue: 420,
    description:
      "Two nights at any partner hotel, breakfast included. Voucher code is generated at redemption.",
    expiryDate: "2027-03-15T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 0,
    remainingInventory: 0,
    couponCodes: [],
    apiConfigId: "api_cfg_moolee",
    apiConfigName: "Moolee Marketplace Voucher API",
    apiEndpoint: "https://api.moolee.example/v2/vouchers",
    apiAuthType: "OAUTH",
    apiTimeoutMs: 8_000,
    apiRetryCount: 3,
    lastApiTestStatus: "SUCCESS",
    lastApiTestAt: "2026-05-19T09:15:00Z",
    lastApiTestMessage: "OAuth handshake + voucher lookup completed in 612ms.",
    createdAt: "2024-12-09T10:00:00Z",
    updatedAt: "2026-05-12T09:30:00Z",
  },
  {
    id: "vmg_004",
    voucherId: "VMG-MOO-002",
    merchantId: "mob_002",
    merchantName: "Moolee Marketplace",
    voucherTitle: "Moolee $10 Flash Discount",
    voucherMode: "INVENTORY",
    voucherValue: 10,
    description:
      "Limited-time flash discount voucher valid at participating marketplace merchants.",
    expiryDate: "2026-06-30T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 200,
    remainingInventory: 28,
    couponCodes: buildInventory(200, 172),
    createdAt: "2026-02-18T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  // ── Maldives Café Partner (EXTERNAL, API enabled, KYC approved) ───────
  {
    id: "vmg_005",
    voucherId: "VMG-CAF-001",
    merchantId: "mob_004",
    merchantName: "Maldives Café Partner",
    voucherTitle: "$25 Coffee Credit",
    voucherMode: "INVENTORY",
    voucherValue: 25,
    description:
      "Enjoy a $25 credit at any Maldives Café Partner location worldwide. Perfect for the morning brew or a quick catch-up.",
    expiryDate: "2026-12-31T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 1_240,
    remainingInventory: 980,
    couponCodes: buildInventory(1_240, 260),
    createdAt: "2025-04-22T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  {
    id: "vmg_006",
    voucherId: "VMG-CAF-002",
    merchantId: "mob_004",
    merchantName: "Maldives Café Partner",
    voucherTitle: "Free Pastry with $50 Voucher",
    voucherMode: "API",
    voucherValue: 50,
    description:
      "Redeem a $50 voucher at any café and receive a complimentary pastry while stocks last.",
    expiryDate: "2026-09-30T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 0,
    remainingInventory: 0,
    couponCodes: [],
    apiConfigId: "api_cfg_moolee",
    apiConfigName: "Moolee Marketplace Voucher API",
    apiEndpoint: "https://api.moolee.example/v2/vouchers",
    apiAuthType: "OAUTH",
    apiTimeoutMs: 8_000,
    apiRetryCount: 3,
    lastApiTestStatus: "FAILED",
    lastApiTestAt: "2026-05-20T11:42:00Z",
    lastApiTestMessage: "API returned 502 Bad Gateway. Will retry in next maintenance window.",
    createdAt: "2025-08-04T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  // ── Travel Deals Partner (PARTNER, API enabled, KYC approved) ─────────
  {
    id: "vmg_007",
    voucherId: "VMG-TRV-001",
    merchantId: "mob_005",
    merchantName: "Travel Deals Partner",
    voucherTitle: "Weekend City Stay",
    voucherMode: "INVENTORY",
    voucherValue: 420,
    description:
      "Two nights at any partner hotel, breakfast for two included. Blackout dates apply.",
    expiryDate: "2027-03-15T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 120,
    remainingInventory: 4,
    couponCodes: buildInventory(120, 116),
    createdAt: "2024-09-18T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  {
    id: "vmg_008",
    voucherId: "VMG-TRV-002",
    merchantId: "mob_005",
    merchantName: "Travel Deals Partner",
    voucherTitle: "Travel Concierge $200 Voucher",
    voucherMode: "API",
    voucherValue: 200,
    description:
      "Apply $200 of credit toward any booking made through the Travel Deals concierge service.",
    expiryDate: "2026-11-30T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 0,
    remainingInventory: 0,
    couponCodes: [],
    apiConfigId: "api_cfg_travel",
    apiConfigName: "Travel Deals Voucher API",
    apiEndpoint: "https://api.traveldeals.example/vouchers/issue",
    apiAuthType: "API_KEY",
    apiTimeoutMs: 6_000,
    apiRetryCount: 1,
    lastApiTestStatus: "SUCCESS",
    lastApiTestAt: "2026-05-18T16:30:00Z",
    lastApiTestMessage: "Issued voucher code TRV-9921 in 318ms.",
    createdAt: "2025-01-12T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  // ── Telecom Add-on Partner (PARTNER, API enabled, KYC approved) ───────
  {
    id: "vmg_009",
    voucherId: "VMG-TEL-001",
    merchantId: "mob_007",
    merchantName: "Telecom Add-on Partner",
    voucherTitle: "1 GB Data Add-on Voucher",
    voucherMode: "API",
    voucherValue: 30,
    description:
      "Redeem to add 1 GB of high-speed data to your line, valid for 7 days from activation.",
    expiryDate: "2027-01-31T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 0,
    remainingInventory: 0,
    couponCodes: [],
    apiConfigId: "api_cfg_mfaisaa",
    apiConfigName: "M Faisaa Voucher API",
    apiEndpoint: "https://api.m-faisaa.example/v1/vouchers",
    apiAuthType: "API_KEY",
    apiTimeoutMs: 5_000,
    apiRetryCount: 2,
    lastApiTestStatus: "SUCCESS",
    lastApiTestAt: "2026-05-15T10:00:00Z",
    lastApiTestMessage: "Issued voucher code TEL-2345 in 280ms.",
    createdAt: "2025-06-30T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  // ── Digital Services Partner (PARTNER, API enabled, KYC approved) ─────
  {
    id: "vmg_010",
    voucherId: "VMG-DIG-001",
    merchantId: "mob_010",
    merchantName: "Digital Services Partner",
    voucherTitle: "Streaming Subscription 3-Month Pass",
    voucherMode: "API",
    voucherValue: 60,
    description:
      "Activate a 3-month streaming subscription at checkout using this voucher code.",
    expiryDate: "2026-12-31T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 0,
    remainingInventory: 0,
    couponCodes: [],
    apiConfigId: "api_cfg_digital",
    apiConfigName: "Digital Services Voucher API",
    apiEndpoint: "https://api.digitalservices.example/v1/codes",
    apiAuthType: "BASIC",
    apiTimeoutMs: 4_000,
    apiRetryCount: 2,
    lastApiTestStatus: "SUCCESS",
    lastApiTestAt: "2026-05-12T15:45:00Z",
    lastApiTestMessage: "Issued voucher code DS-7755 in 196ms.",
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  // ── Selfcare Data Benefits (INTERNAL, NO API, KYC approved) ───────────
  {
    id: "vmg_011",
    voucherId: "VMG-SLF-001",
    merchantId: "mob_003",
    merchantName: "Selfcare Data Benefits",
    voucherTitle: "Selfcare 5 GB Data Pack",
    voucherMode: "INVENTORY",
    voucherValue: 25,
    description:
      "Redeem to credit 5 GB of data to your primary MSISDN, valid for 30 days from activation.",
    expiryDate: "2026-11-30T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 1_800,
    remainingInventory: 1_220,
    couponCodes: buildInventory(1_800, 580),
    createdAt: "2024-08-09T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  // ── Wellness Pass Partner (PARTNER, NO API, KYC approved) ─────────────
  {
    id: "vmg_012",
    voucherId: "VMG-WEL-001",
    merchantId: "mob_011",
    merchantName: "Wellness Pass Partner",
    voucherTitle: "Annual Wellness Pass",
    voucherMode: "INVENTORY",
    voucherValue: 1_200,
    description:
      "Annual wellness pass redeemable at any participating wellness studio. Includes 50+ partner locations.",
    expiryDate: "2027-01-31T00:00:00Z",
    status: "ACTIVE",
    totalInventory: 220,
    remainingInventory: 0,
    couponCodes: (() => {
      // Mark all as REDEEMED to simulate out-of-stock
      const codes: CouponCode[] = [];
      for (let i = 0; i < 220; i += 1) {
        codes.push(makeCoupon(`WL-${1000 + i}`, "REDEEMED", {
          assignedToUserId: "u_test",
          assignedAt: "2026-03-12T08:00:00Z",
          redeemedAt: "2026-03-12T11:30:00Z",
        }));
      }
      return codes;
    })(),
    createdAt: "2025-03-18T10:00:00Z",
    updatedAt: "2026-05-22T17:12:00Z",
  },
  {
    id: "vmg_013",
    voucherId: "VMG-WEL-002",
    merchantId: "mob_011",
    merchantName: "Wellness Pass Partner",
    voucherTitle: "Wellness Studio Drop-in Pass",
    voucherMode: "INVENTORY",
    voucherValue: 35,
    description:
      "Single-visit pass for any wellness studio. Great for sampling new locations.",
    expiryDate: "2026-07-15T00:00:00Z",
    status: "INACTIVE",
    totalInventory: 480,
    remainingInventory: 480,
    couponCodes: buildInventory(480, 0),
    createdAt: "2025-09-04T10:00:00Z",
    updatedAt: "2026-04-18T10:00:00Z",
  },
  // ── Food Delivery Partner (PARTNER, API enabled, KYC PENDING) ─────────
  {
    id: "vmg_014",
    voucherId: "VMG-FOD-001",
    merchantId: "mob_009",
    merchantName: "Food Delivery Partner",
    voucherTitle: "Free Delivery Voucher (Pending KYC)",
    voucherMode: "API",
    voucherValue: 15,
    description:
      "Free delivery on any order above $25. Voucher is generated on redemption.",
    expiryDate: "2026-12-31T00:00:00Z",
    status: "INACTIVE",
    totalInventory: 0,
    remainingInventory: 0,
    couponCodes: [],
    apiConfigId: "api_cfg_moolee",
    apiConfigName: "Moolee Marketplace Voucher API",
    apiEndpoint: "https://api.moolee.example/v2/vouchers",
    apiAuthType: "OAUTH",
    apiTimeoutMs: 8_000,
    apiRetryCount: 3,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-04-10T10:00:00Z",
  },
];

export const VOUCHER_API_CONFIG_BY_ID = Object.fromEntries(
  MOCK_VOUCHER_API_CONFIGS.map((c) => [c.id, c])
) as Record<string, VoucherApiConfigOption>;
