"use client";

import * as React from "react";

import { MOCK_MERCHANTS } from "@/data/mockMerchants";
import {
  MOCK_VOUCHER_API_CONFIGS,
  MOCK_VOUCHER_MANAGEMENT,
} from "@/data/mockVoucherManagement";
import { buildAuditEntry, loadAuditLog, nowIso, persistAuditLog } from "@/lib/audit";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import {
  describeVoucherActivation,
  isStatusTransitionAllowed,
} from "@/lib/voucherEligibility";
import type {
  AdminAuditEntry,
  CouponCode,
  RoleId,
  VoucherApiConfigOption,
  VoucherFormInput,
  VoucherManagement,
  VoucherManagementMode,
  VoucherManagementStatus,
  VoucherStockHealth,
} from "@/types/loyalty";

import { useRole } from "@/components/layout/RoleProvider";

// ─── Types ────────────────────────────────────────────────────────────

export interface VoucherMutationResult {
  ok: boolean;
  message?: string;
  voucher?: VoucherManagement;
}

export interface AddInventoryResult {
  ok: boolean;
  message?: string;
  addedCount: number;
  duplicateCount: number;
  invalidCount: number;
  totalRequested: number;
}

export interface ApiTestResult {
  ok: boolean;
  message: string;
  status: "SUCCESS" | "FAILED";
  voucher?: VoucherManagement;
}

export interface VouchersKpis {
  total: number;
  active: number;
  inactive: number;
  inventory: number;
  api: number;
  totalInventory: number;
  remainingInventory: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
}

export interface VouchersState {
  vouchers: VoucherManagement[];
  lastRefreshedAt: string;
  isHydrated: boolean;
}

export interface VouchersActions {
  refresh: () => void;
  exportVouchers: (visible: VoucherManagement[]) => void;
  createVoucher: (input: VoucherFormInput) => VoucherMutationResult;
  updateVoucher: (id: string, input: VoucherFormInput) => VoucherMutationResult;
  activateVoucher: (id: string, reason: string) => VoucherMutationResult;
  deactivateVoucher: (id: string, reason: string) => VoucherMutationResult;
  addInventory: (id: string, codes: string[]) => AddInventoryResult;
  testApiVoucher: (
    id: string,
    outcome: "success" | "failure"
  ) => ApiTestResult;
  uploadBulk: (
    fileName: string,
    rows: { voucherId: string; codes: string[] }[]
  ) => { ok: boolean; message: string; addedCount: number };
  logVoucherView: (id: string) => void;
  resetSession: () => void;
  setCurrentMerchantId: (id: string | null) => void;
}

export interface VouchersContextValue
  extends VouchersState,
    VouchersActions {
  visibleVouchers: VoucherManagement[];
  kpis: VouchersKpis;
  canEdit: boolean;
  canExport: boolean;
  canManageInventory: boolean;
  canTestApi: boolean;
  canActivate: boolean;
  apiConfigs: VoucherApiConfigOption[];
  merchantFor: (id: string) => ReturnType<typeof MOCK_MERCHANTS.find> | null;
  detectDuplicateTitle: (
    title: string,
    merchantId: string,
    excludeId?: string
  ) => VoucherManagement | null;
  scopedVouchers: VoucherManagement[];
}

const VouchersContext = React.createContext<VouchersContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────

function newInternalId(): string {
  return `vmg_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function newCouponId(code: string): string {
  return `cpn_${code.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function newVoucherIdFromTitle(
  title: string,
  mode: VoucherManagementMode
): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "voucher";
  const code = mode === "API" ? "API" : "INV";
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `VMG-${code}-${slug.toUpperCase()}-${suffix}`;
}

function buildVoucherFromInput(
  input: VoucherFormInput,
  existing: VoucherManagement | null
): VoucherManagement {
  const merchant =
    MOCK_MERCHANTS.find((m) => m.id === input.merchantId) ?? null;
  const codes: CouponCode[] = [];
  let totalInventory = existing?.totalInventory ?? 0;
  let remainingInventory = existing?.remainingInventory ?? 0;
  if (input.voucherMode === "INVENTORY") {
    const seen = new Set<string>();
    for (const raw of input.initialCouponCodes) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      const key = trimmed.toUpperCase();
      if (seen.has(key)) continue;
      if (
        existing?.couponCodes.some((c) => c.code.toUpperCase() === key)
      ) {
        continue;
      }
      seen.add(key);
      codes.push({ id: newCouponId(trimmed), code: trimmed, status: "AVAILABLE" });
    }
    totalInventory = (existing?.totalInventory ?? 0) + codes.length;
    remainingInventory = (existing?.remainingInventory ?? 0) + codes.length;
  }
  const apiConfig = input.apiConfigId
    ? MOCK_VOUCHER_API_CONFIGS.find((c) => c.id === input.apiConfigId)
    : null;

  return {
    id: existing?.id ?? newInternalId(),
    voucherId:
      existing?.voucherId ?? newVoucherIdFromTitle(input.voucherTitle, input.voucherMode),
    merchantId: input.merchantId,
    merchantName: merchant?.merchantName ?? existing?.merchantName ?? "Unknown",
    voucherTitle: input.voucherTitle.trim(),
    voucherMode: input.voucherMode,
    voucherValue: Number.isFinite(input.voucherValue) ? input.voucherValue : 0,
    description: input.description.trim(),
    expiryDate: input.expiryDate,
    status: input.status,
    totalInventory: input.voucherMode === "INVENTORY" ? totalInventory : 0,
    remainingInventory:
      input.voucherMode === "INVENTORY" ? remainingInventory : 0,
    couponCodes:
      input.voucherMode === "INVENTORY"
        ? [...(existing?.couponCodes ?? []), ...codes]
        : [],
    apiConfigId: input.voucherMode === "API" ? apiConfig?.id : undefined,
    apiConfigName:
      input.voucherMode === "API" ? apiConfig?.name ?? input.apiConfigName : undefined,
    apiEndpoint:
      input.voucherMode === "API" ? apiConfig?.endpoint ?? input.apiEndpoint : undefined,
    apiAuthType:
      input.voucherMode === "API" ? apiConfig?.authType ?? input.apiAuthType : undefined,
    apiTimeoutMs:
      input.voucherMode === "API" ? apiConfig?.timeoutMs ?? input.apiTimeoutMs : undefined,
    apiRetryCount:
      input.voucherMode === "API" ? apiConfig?.retryCount ?? input.apiRetryCount : undefined,
    lastApiTestStatus: existing?.lastApiTestStatus,
    lastApiTestAt: existing?.lastApiTestAt,
    lastApiTestMessage: existing?.lastApiTestMessage,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
}

function validateInput(
  input: VoucherFormInput,
  existing: VoucherManagement | null
): { ok: true } | { ok: false; message: string } {
  if (!input.merchantId) return { ok: false, message: "Merchant is required." };
  const merchant = MOCK_MERCHANTS.find((m) => m.id === input.merchantId);
  if (!merchant) return { ok: false, message: "Selected merchant was not found." };
  if (!input.voucherTitle.trim())
    return { ok: false, message: "Voucher title is required." };
  if (!input.voucherMode)
    return { ok: false, message: "Voucher mode is required." };
  if (!Number.isFinite(input.voucherValue) || input.voucherValue < 0)
    return { ok: false, message: "Voucher value must be 0 or higher." };
  if (!input.expiryDate) {
    return { ok: false, message: "Expiry date is required." };
  }
  const expiry = new Date(input.expiryDate);
  if (Number.isNaN(expiry.getTime())) {
    return { ok: false, message: "Expiry date is invalid." };
  }
  if (expiry.getTime() <= Date.now()) {
    return { ok: false, message: "Expiry date must be in the future." };
  }
  if (input.voucherMode === "API" && !input.apiConfigId) {
    return {
      ok: false,
      message: "API configuration is required for API vouchers.",
    };
  }
  if (input.voucherMode === "API" && merchant.apiEnabled !== "YES") {
    return {
      ok: false,
      message: "Selected merchant is configured for inventory vouchers only.",
    };
  }
  if (input.status === "ACTIVE" && merchant.status !== "ACTIVE") {
    return {
      ok: false,
      message: "Merchant must be active to create an active voucher.",
    };
  }
  if (input.status === "ACTIVE" && merchant.kycStatus !== "APPROVED") {
    return {
      ok: false,
      message: "Merchant KYC must be approved to create an active voucher.",
    };
  }
  if (
    input.status === "ACTIVE" &&
    input.voucherMode === "INVENTORY" &&
    !existing &&
    input.initialCouponCodes.length === 0
  ) {
    return {
      ok: false,
      message: "Inventory vouchers need at least one coupon code to activate.",
    };
  }
  if (input.voucherMode === "INVENTORY" && input.initialCouponCodes.length > 0) {
    const seen = new Set<string>();
    for (const raw of input.initialCouponCodes) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (seen.has(trimmed.toUpperCase())) {
        return {
          ok: false,
          message: `Duplicate coupon code inside pasted input: ${trimmed}.`,
        };
      }
      seen.add(trimmed.toUpperCase());
    }
  }
  return { ok: true };
}

function buildVouchersCsv(vouchers: VoucherManagement[]): string {
  const header = [
    "Voucher ID",
    "Voucher title",
    "Merchant",
    "Voucher mode",
    "Voucher value",
    "Total inventory",
    "Remaining inventory",
    "Usage %",
    "Expiry date",
    "Status",
    "Last API test",
    "Last API test at",
    "Created at",
    "Updated at",
  ];
  const rows = vouchers.map((v) => {
    const usage =
      v.totalInventory > 0
        ? Math.round(
            ((v.totalInventory - v.remainingInventory) / v.totalInventory) * 100
          )
        : 0;
    return [
      v.voucherId,
      v.voucherTitle,
      v.merchantName,
      v.voucherMode,
      String(v.voucherValue),
      String(v.totalInventory),
      String(v.remainingInventory),
      String(usage),
      v.expiryDate,
      v.status,
      v.lastApiTestStatus ?? "",
      v.lastApiTestAt ?? "",
      v.createdAt,
      v.updatedAt,
    ]
      .map((cell) => {
        const value = String(cell ?? "");
        return value.includes(",") || value.includes('"') || value.includes("\n")
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

function downloadCsv(filename: string, csv: string): void {
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

function computeHealth(v: VoucherManagement): VoucherStockHealth {
  if (v.voucherMode === "API") return "API";
  if (v.totalInventory <= 0) return "OUT_OF_STOCK";
  const ratio = v.remainingInventory / v.totalInventory;
  if (ratio <= 0) return "OUT_OF_STOCK";
  if (ratio < 0.1) return "CRITICAL";
  if (ratio < 0.3) return "WATCH";
  return "HEALTHY";
}

function isExpiringSoon(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  const diff = expiry.getTime() - Date.now();
  if (diff < 0) return false;
  return diff <= 30 * 24 * 60 * 60 * 1000;
}

function buildKpis(vouchers: VoucherManagement[]): VouchersKpis {
  const expiringSoon = vouchers.filter(
    (v) => isExpiringSoon(v.expiryDate) && v.status === "ACTIVE"
  ).length;
  const totalInventory = vouchers
    .filter((v) => v.voucherMode === "INVENTORY")
    .reduce((sum, v) => sum + v.totalInventory, 0);
  const remainingInventory = vouchers
    .filter((v) => v.voucherMode === "INVENTORY")
    .reduce((sum, v) => sum + v.remainingInventory, 0);
  return {
    total: vouchers.length,
    active: vouchers.filter((v) => v.status === "ACTIVE").length,
    inactive: vouchers.filter((v) => v.status === "INACTIVE").length,
    inventory: vouchers.filter((v) => v.voucherMode === "INVENTORY").length,
    api: vouchers.filter((v) => v.voucherMode === "API").length,
    totalInventory,
    remainingInventory,
    lowStock: vouchers.filter((v) => {
      const health = computeHealth(v);
      return health === "WATCH" || health === "CRITICAL";
    }).length,
    outOfStock: vouchers.filter(
      (v) => computeHealth(v) === "OUT_OF_STOCK"
    ).length,
    expiringSoon,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────

export function VouchersProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [vouchers, setVouchers] = React.useState<VoucherManagement[]>(() =>
    MOCK_VOUCHER_MANAGEMENT.map((v) => ({ ...v, couponCodes: [...v.couponCodes] }))
  );
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<string>(nowIso());
  const [isHydrated, setHydrated] = React.useState(false);
  const [currentMerchantId, setCurrentMerchantId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = readStorage<VoucherManagement[] | null>(
      StorageKeys.adminVouchers,
      null
    );
    if (stored && stored.length > 0) {
      const merged = MOCK_VOUCHER_MANAGEMENT.map((seed) => {
        const override = stored.find((v) => v.voucherId === seed.voucherId);
        return override
          ? {
              ...seed,
              ...override,
              couponCodes: override.couponCodes ?? seed.couponCodes,
            }
          : seed;
      });
      const known = new Set(MOCK_VOUCHER_MANAGEMENT.map((v) => v.voucherId));
      const extras = stored
        .filter((v) => !known.has(v.voucherId))
        .map((v) => ({ ...v, couponCodes: v.couponCodes ?? [] }));
      setVouchers([...merged, ...extras]);
    }
    const refreshed = readStorage<string | null>(
      StorageKeys.vouchersLastRefreshed,
      null
    );
    if (refreshed) setLastRefreshedAt(refreshed);
    const scopedMerchant = readStorage<string | null>(
      StorageKeys.vouchersScopedMerchant,
      null
    );
    if (scopedMerchant) setCurrentMerchantId(scopedMerchant);
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.adminVouchers, vouchers);
  }, [vouchers, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.vouchersLastRefreshed, lastRefreshedAt);
  }, [lastRefreshedAt, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.vouchersScopedMerchant, currentMerchantId);
  }, [currentMerchantId, isHydrated]);

  const appendAudit = React.useCallback(
    (
      input: Omit<AdminAuditEntry, "id" | "occurredAt" | "actor" | "role">
    ) => {
      const entry = buildAuditEntry({ ...input, role });
      const current = loadAuditLog();
      persistAuditLog([entry, ...current]);
    },
    [role]
  );

  const refresh = React.useCallback(() => {
    setLastRefreshedAt(nowIso());
    appendAudit({
      module: "Voucher Management",
      action: "VOUCHER_REFRESH",
      status: "info",
      details: "Refreshed voucher roster.",
    });
  }, [appendAudit]);

  const exportVouchers = React.useCallback(
    (visible: VoucherManagement[]) => {
      const csv = buildVouchersCsv(visible);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`vouchers-${stamp}.csv`, csv);
      appendAudit({
        module: "Voucher Management",
        action: "VOUCHER_EXPORT",
        status: "success",
        details: `Exported ${visible.length} voucher(s) as CSV.`,
        target: `vouchers-${visible.length}`,
      });
    },
    [appendAudit]
  );

  const logVoucherView = React.useCallback(
    (id: string) => {
      const voucher = vouchers.find((v) => v.id === id);
      if (!voucher) return;
      appendAudit({
        module: "Voucher Management",
        action: "VOUCHER_VIEWED",
        status: "info",
        details: `Opened voucher detail drawer for ${voucher.voucherTitle}.`,
        target: voucher.voucherId,
      });
    },
    [vouchers, appendAudit]
  );

  const createVoucher = React.useCallback(
    (input: VoucherFormInput): VoucherMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can create vouchers." };
      }
      const validation = validateInput(input, null);
      if (!validation.ok) {
        appendAudit({
          module: "Voucher Management",
          action: "VOUCHER_VALIDATION_FAILED",
          status: "warning",
          details: `Validation failed for new voucher "${input.voucherTitle}": ${validation.message}`,
        });
        return validation;
      }
      const voucher = buildVoucherFromInput(input, null);
      setVouchers((prev) => [voucher, ...prev]);
      appendAudit({
        module: "Voucher Management",
        action: "VOUCHER_CREATED",
        status: "success",
        details: `Created ${voucher.voucherMode.toLowerCase()} voucher ${voucher.voucherTitle} (${voucher.voucherId}) for ${voucher.merchantName}.`,
        target: voucher.voucherId,
      });
      return { ok: true, voucher };
    },
    [role, appendAudit]
  );

  const updateVoucher = React.useCallback(
    (id: string, input: VoucherFormInput): VoucherMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can edit vouchers." };
      }
      const existing = vouchers.find((v) => v.id === id);
      if (!existing) return { ok: false, message: "Voucher not found." };
      const validation = validateInput(input, existing);
      if (!validation.ok) {
        appendAudit({
          module: "Voucher Management",
          action: "VOUCHER_VALIDATION_FAILED",
          status: "warning",
          details: `Validation failed while updating ${existing.voucherTitle}: ${validation.message}`,
          target: existing.voucherId,
        });
        return validation;
      }
      const voucher = buildVoucherFromInput(input, existing);
      setVouchers((prev) => prev.map((v) => (v.id === id ? voucher : v)));
      appendAudit({
        module: "Voucher Management",
        action: "VOUCHER_UPDATED",
        status: "success",
        details: `Updated voucher ${voucher.voucherTitle} (${voucher.voucherId}).`,
        target: voucher.voucherId,
      });
      return { ok: true, voucher };
    },
    [vouchers, role, appendAudit]
  );

  const activateVoucher = React.useCallback(
    (id: string, reason: string): VoucherMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change voucher status." };
      }
      if (!reason.trim()) return { ok: false, message: "A reason is required." };
      const existing = vouchers.find((v) => v.id === id);
      if (!existing) return { ok: false, message: "Voucher not found." };
      const merchant =
        MOCK_MERCHANTS.find((m) => m.id === existing.merchantId) ?? null;
      const gate = isStatusTransitionAllowed(existing, merchant, "ACTIVE");
      if (!gate.ok) {
        appendAudit({
          module: "Voucher Management",
          action: "VOUCHER_VALIDATION_FAILED",
          status: "warning",
          details: `Activation blocked for ${existing.voucherTitle}: ${gate.message}`,
          target: existing.voucherId,
        });
        return { ok: false, message: gate.message };
      }
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, status: "ACTIVE", updatedAt: nowIso() } : v
        )
      );
      appendAudit({
        module: "Voucher Management",
        action: "VOUCHER_ACTIVATED",
        status: "success",
        details: `Activated ${existing.voucherTitle}. Reason: ${reason.trim()}.`,
        target: existing.voucherId,
      });
      return { ok: true, voucher: existing };
    },
    [vouchers, role, appendAudit]
  );

  const deactivateVoucher = React.useCallback(
    (id: string, reason: string): VoucherMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change voucher status." };
      }
      if (!reason.trim()) return { ok: false, message: "A reason is required." };
      const existing = vouchers.find((v) => v.id === id);
      if (!existing) return { ok: false, message: "Voucher not found." };
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, status: "INACTIVE", updatedAt: nowIso() } : v
        )
      );
      appendAudit({
        module: "Voucher Management",
        action: "VOUCHER_DEACTIVATED",
        status: "warning",
        details: `Deactivated ${existing.voucherTitle}. Reason: ${reason.trim()}.`,
        target: existing.voucherId,
      });
      return { ok: true, voucher: existing };
    },
    [vouchers, role, appendAudit]
  );

  const addInventory = React.useCallback(
    (id: string, codes: string[]): AddInventoryResult => {
      if (role !== "admin") {
        return {
          ok: false,
          message: "Only admins can manage inventory.",
          addedCount: 0,
          duplicateCount: 0,
          invalidCount: codes.length,
          totalRequested: codes.length,
        };
      }
      const existing = vouchers.find((v) => v.id === id);
      if (!existing) {
        return {
          ok: false,
          message: "Voucher not found.",
          addedCount: 0,
          duplicateCount: 0,
          invalidCount: codes.length,
          totalRequested: codes.length,
        };
      }
      if (existing.voucherMode !== "INVENTORY") {
        return {
          ok: false,
          message: "Inventory can only be added to inventory vouchers.",
          addedCount: 0,
          duplicateCount: 0,
          invalidCount: codes.length,
          totalRequested: codes.length,
        };
      }
      const existingCodes = new Set(
        existing.couponCodes.map((c) => c.code.toUpperCase())
      );
      const seen = new Set<string>();
      let added = 0;
      let duplicate = 0;
      let invalid = 0;
      const newCoupons: CouponCode[] = [];
      for (const raw of codes) {
        const trimmed = raw.trim();
        if (!trimmed) {
          invalid += 1;
          continue;
        }
        const key = trimmed.toUpperCase();
        if (existingCodes.has(key) || seen.has(key)) {
          duplicate += 1;
          continue;
        }
        seen.add(key);
        newCoupons.push({
          id: newCouponId(trimmed),
          code: trimmed,
          status: "AVAILABLE",
        });
        added += 1;
      }
      if (added === 0) {
        appendAudit({
          module: "Voucher Management",
          action: "VOUCHER_INVENTORY_UPLOAD_FAILED",
          status: "warning",
          details: `No new codes added to ${existing.voucherTitle}. ${duplicate} duplicates, ${invalid} invalid.`,
          target: existing.voucherId,
        });
        return {
          ok: false,
          message: "No valid new codes to add.",
          addedCount: 0,
          duplicateCount: duplicate,
          invalidCount: invalid,
          totalRequested: codes.length,
        };
      }
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                couponCodes: [...v.couponCodes, ...newCoupons],
                totalInventory: v.totalInventory + newCoupons.length,
                remainingInventory: v.remainingInventory + newCoupons.length,
                updatedAt: nowIso(),
              }
            : v
        )
      );
      appendAudit({
        module: "Voucher Management",
        action: "VOUCHER_INVENTORY_ADDED",
        status: "success",
        details: `Added ${added} coupon code(s) to ${existing.voucherTitle}. ${duplicate} duplicates skipped, ${invalid} empty rows ignored.`,
        target: existing.voucherId,
      });
      return {
        ok: true,
        message: `Added ${added} new coupon code(s).`,
        addedCount: added,
        duplicateCount: duplicate,
        invalidCount: invalid,
        totalRequested: codes.length,
      };
    },
    [vouchers, role, appendAudit]
  );

  const testApiVoucher = React.useCallback(
    (id: string, outcome: "success" | "failure"): ApiTestResult => {
      if (role !== "admin") {
        return {
          ok: false,
          message: "Only admins can test API vouchers.",
          status: "FAILED",
        };
      }
      const existing = vouchers.find((v) => v.id === id);
      if (!existing) {
        return { ok: false, message: "Voucher not found.", status: "FAILED" };
      }
      if (existing.voucherMode !== "API") {
        return {
          ok: false,
          message: "Only API vouchers can be tested here.",
          status: "FAILED",
        };
      }
      const isSuccess = outcome === "success";
      const message = isSuccess
        ? `Voucher code ${existing.voucherId.replace("VMG", "CD")}-${Math.floor(
            Math.random() * 9000 + 1000
          )} issued in ${Math.floor(180 + Math.random() * 800)}ms.`
        : `API returned ${
            [
              "502 Bad Gateway",
              "504 Gateway Timeout",
              "401 Unauthorized",
              "429 Too Many Requests",
            ][Math.floor(Math.random() * 4)]
          }. Will retry in next maintenance window.`;
      const updated: VoucherManagement = {
        ...existing,
        lastApiTestStatus: isSuccess ? "SUCCESS" : "FAILED",
        lastApiTestAt: nowIso(),
        lastApiTestMessage: message,
        updatedAt: nowIso(),
      };
      setVouchers((prev) => prev.map((v) => (v.id === id ? updated : v)));
      appendAudit({
        module: "Voucher Management",
        action: isSuccess
          ? "VOUCHER_API_TEST_SUCCESS"
          : "VOUCHER_API_TEST_FAILED",
        status: isSuccess ? "success" : "error",
        details: `${isSuccess ? "Simulated success" : "Simulated failure"} for ${
          existing.voucherTitle
        }: ${message}`,
        target: existing.voucherId,
      });
      return {
        ok: isSuccess,
        message,
        status: isSuccess ? "SUCCESS" : "FAILED",
        voucher: updated,
      };
    },
    [vouchers, role, appendAudit]
  );

  const uploadBulk = React.useCallback(
    (
      fileName: string,
      rows: { voucherId: string; codes: string[] }[]
    ): { ok: boolean; message: string; addedCount: number } => {
      if (role !== "admin") {
        return {
          ok: false,
          message: "Only admins can upload coupons.",
          addedCount: 0,
        };
      }
      let totalAdded = 0;
      setVouchers((prev) => {
        const next = [...prev];
        for (const row of rows) {
          const idx = next.findIndex((v) => v.voucherId === row.voucherId);
          if (idx === -1) continue;
          const existing = next[idx];
          if (existing.voucherMode !== "INVENTORY") continue;
          const existingCodes = new Set(
            existing.couponCodes.map((c) => c.code.toUpperCase())
          );
          const seen = new Set<string>();
          const additions: CouponCode[] = [];
          for (const raw of row.codes) {
            const trimmed = raw.trim();
            if (!trimmed) continue;
            const key = trimmed.toUpperCase();
            if (existingCodes.has(key) || seen.has(key)) continue;
            seen.add(key);
            additions.push({
              id: newCouponId(trimmed),
              code: trimmed,
              status: "AVAILABLE",
            });
          }
          if (additions.length > 0) {
            totalAdded += additions.length;
            next[idx] = {
              ...existing,
              couponCodes: [...existing.couponCodes, ...additions],
              totalInventory: existing.totalInventory + additions.length,
              remainingInventory: existing.remainingInventory + additions.length,
              updatedAt: nowIso(),
            };
          }
        }
        return next;
      });
      appendAudit({
        module: "Voucher Management",
        action: "VOUCHER_UPLOADED",
        status: "success",
        details: `Bulk upload via ${fileName}: added ${totalAdded} coupon code(s) across ${rows.length} voucher row(s).`,
      });
      return {
        ok: true,
        message: `Added ${totalAdded} coupon code(s).`,
        addedCount: totalAdded,
      };
    },
    [role, appendAudit]
  );

  const resetSession = React.useCallback(() => {
    setVouchers(
      MOCK_VOUCHER_MANAGEMENT.map((v) => ({
        ...v,
        couponCodes: [...v.couponCodes],
      }))
    );
    setLastRefreshedAt(nowIso());
  }, []);

  const merchantFor = React.useCallback((id: string) => {
    return MOCK_MERCHANTS.find((m) => m.id === id) ?? null;
  }, []);

  const detectDuplicateTitle = React.useCallback(
    (title: string, merchantId: string, excludeId?: string) => {
      const trimmed = title.trim().toLowerCase();
      if (!trimmed || !merchantId) return null;
      return (
        vouchers.find(
          (v) =>
            v.id !== excludeId &&
            v.merchantId === merchantId &&
            v.status === "ACTIVE" &&
            v.voucherTitle.toLowerCase() === trimmed
        ) ?? null
      );
    },
    [vouchers]
  );

  const visibleVouchers = React.useMemo(
    () =>
      [...vouchers].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [vouchers]
  );

  const scopedVouchers = React.useMemo(() => {
    if (role !== "merchant" || !currentMerchantId) return visibleVouchers;
    return visibleVouchers.filter((v) => v.merchantId === currentMerchantId);
  }, [visibleVouchers, role, currentMerchantId]);

  const kpis = React.useMemo(() => buildKpis(visibleVouchers), [visibleVouchers]);

  const canEdit = role === "admin";
  const canExport = role === "admin" || role === "merchant";
  const canManageInventory = role === "admin";
  const canTestApi = role === "admin";
  const canActivate = role === "admin";

  const value = React.useMemo<VouchersContextValue>(
    () => ({
      vouchers,
      lastRefreshedAt,
      isHydrated,
      visibleVouchers: scopedVouchers,
      scopedVouchers,
      kpis,
      canEdit,
      canExport,
      canManageInventory,
      canTestApi,
      canActivate,
      apiConfigs: MOCK_VOUCHER_API_CONFIGS,
      merchantFor,
      detectDuplicateTitle,
      refresh,
      exportVouchers,
      createVoucher,
      updateVoucher,
      activateVoucher,
      deactivateVoucher,
      addInventory,
      testApiVoucher,
      uploadBulk,
      logVoucherView,
      resetSession,
      setCurrentMerchantId,
    }),
    [
      vouchers,
      lastRefreshedAt,
      isHydrated,
      scopedVouchers,
      kpis,
      canEdit,
      canExport,
      canManageInventory,
      canTestApi,
      canActivate,
      merchantFor,
      detectDuplicateTitle,
      refresh,
      exportVouchers,
      createVoucher,
      updateVoucher,
      activateVoucher,
      deactivateVoucher,
      addInventory,
      testApiVoucher,
      uploadBulk,
      logVoucherView,
      resetSession,
    ]
  );

  return (
    <VouchersContext.Provider value={value}>{children}</VouchersContext.Provider>
  );
}

export function useVouchers(): VouchersContextValue {
  const ctx = React.useContext(VouchersContext);
  if (!ctx) {
    throw new Error("useVouchers must be used within a VouchersProvider");
  }
  return ctx;
}

export { describeVoucherActivation };
