"use client";

import * as React from "react";

import { MOCK_MERCHANTS } from "@/data/mockMerchants";
import { MOCK_VOUCHERS } from "@/data/mockVouchers";
import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";
import { actorForRole, buildAuditEntry, loadAuditLog, nowIso, persistAuditLog } from "@/lib/audit";
import {
  describeMerchantCapability,
  canCreateVoucher,
  canCreateApiVoucher,
  canCreateInventoryVoucher,
} from "@/lib/merchantEligibility";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import type {
  AdminAuditEntry,
  MerchantApiEnabled,
  MerchantFormInput,
  MerchantKycStatus,
  MerchantOnboarding,
  MerchantOnboardingStatus,
  MerchantType,
  RoleId,
  Voucher,
} from "@/types/loyalty";

import { useRole } from "@/components/layout/RoleProvider";

// ─── Types ────────────────────────────────────────────────────────────

export interface MerchantMutationResult {
  ok: boolean;
  message?: string;
  merchant?: MerchantOnboarding;
}

export interface MerchantsKpis {
  total: number;
  active: number;
  inactive: number;
  internal: number;
  external: number;
  partner: number;
  apiEnabled: number;
  pendingKyc: number;
}

export interface MerchantsState {
  merchants: MerchantOnboarding[];
  lastRefreshedAt: string;
  isHydrated: boolean;
}

export interface MerchantsActions {
  refresh: () => void;
  exportMerchants: (visible: MerchantOnboarding[]) => void;
  createMerchant: (input: MerchantFormInput) => MerchantMutationResult;
  updateMerchant: (id: string, input: MerchantFormInput) => MerchantMutationResult;
  activateMerchant: (id: string, reason: string) => MerchantMutationResult;
  deactivateMerchant: (id: string, reason: string) => MerchantMutationResult;
  approveKyc: (id: string, remarks: string) => MerchantMutationResult;
  rejectKyc: (id: string, reason: string) => MerchantMutationResult;
  logMerchantView: (id: string) => void;
  resetSession: () => void;
}

export interface MerchantsContextValue extends MerchantsState, MerchantsActions {
  visibleMerchants: MerchantOnboarding[];
  kpis: MerchantsKpis;
  canEdit: boolean;
  canExport: boolean;
  canApproveKyc: boolean;
  vouchersForMerchant: (id: string) => Voucher[];
  performanceForMerchant: (id: string) => {
    totalRedemptions: number;
    successful: number;
    failed: number;
    redemptionValue: number;
    mostRedeemed: Voucher | null;
  };
  detectDuplicateName: (name: string, excludeId?: string) => MerchantOnboarding | null;
}

const MerchantsContext = React.createContext<MerchantsContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────

function buildMerchantIdFromName(name: string, type: MerchantType): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "merchant";
  const typeCode = type === "INTERNAL" ? "INT" : type === "EXTERNAL" ? "EXT" : "PRTN";
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MRCH-${typeCode}-${slug.toUpperCase()}-${suffix}`;
}

function newMerchantInternalId(): string {
  return `mob_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;
}

function buildMerchantFromInput(
  input: MerchantFormInput,
  existing: MerchantOnboarding | null
): MerchantOnboarding {
  return {
    id: existing?.id ?? newMerchantInternalId(),
    merchantId: existing?.merchantId ?? buildMerchantIdFromName(input.merchantName, input.merchantType),
    merchantName: input.merchantName.trim(),
    merchantType: input.merchantType,
    contactPerson: input.contactPerson.trim(),
    contactEmail: input.contactEmail.trim(),
    contactNumber: input.contactNumber.trim(),
    apiEnabled: input.apiEnabled,
    kycDocumentName: input.kycDocumentName.trim(),
    kycStatus: input.kycStatus,
    kycRemarks: existing?.kycRemarks,
    approvedBy: existing?.approvedBy,
    approvedAt: existing?.approvedAt,
    rejectedBy: existing?.rejectedBy,
    rejectedAt: existing?.rejectedAt,
    status: input.status,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    notes: input.notes.trim() || undefined,
    city: input.city.trim() || undefined,
    voucherCount: existing?.voucherCount ?? 0,
  };
}

function validateInput(
  input: MerchantFormInput,
  merchants: MerchantOnboarding[],
  excludeId?: string
): { ok: true } | { ok: false; message: string } {
  if (!input.merchantName.trim()) {
    return { ok: false, message: "Merchant name is required." };
  }
  if (!input.merchantType) {
    return { ok: false, message: "Merchant type is required." };
  }
  if (!input.apiEnabled) {
    return { ok: false, message: "API enabled selection is required." };
  }
  if (!input.kycStatus) {
    return { ok: false, message: "KYC status is required." };
  }
  if (!input.status) {
    return { ok: false, message: "Status is required." };
  }
  if (input.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail.trim())) {
    return { ok: false, message: "Contact email must be a valid address." };
  }
  if (input.contactNumber.trim() && !/^[+\d][\d\s-]{4,}$/.test(input.contactNumber.trim())) {
    return { ok: false, message: "Contact number must contain digits only." };
  }
  if (
    (input.merchantType === "EXTERNAL" || input.merchantType === "PARTNER") &&
    !input.kycDocumentName.trim()
  ) {
    return {
      ok: false,
      message: "KYC document is required for EXTERNAL and PARTNER merchants.",
    };
  }
  // Duplicate active name check.
  const nameConflict = merchants.find(
    (m) =>
      m.id !== excludeId &&
      m.status === "ACTIVE" &&
      m.merchantName.toLowerCase() === input.merchantName.trim().toLowerCase()
  );
  if (nameConflict) {
    return {
      ok: false,
      message: `An active merchant with the name "${nameConflict.merchantName}" already exists.`,
    };
  }
  return { ok: true };
}

function buildMerchantsCsv(merchants: MerchantOnboarding[]): string {
  const header = [
    "Merchant ID",
    "Merchant name",
    "Merchant type",
    "Contact person",
    "Contact email",
    "Contact number",
    "API enabled",
    "KYC document",
    "KYC status",
    "Status",
    "Voucher count",
    "Created at",
    "Updated at",
  ];
  const rows = merchants.map((m) =>
    [
      m.merchantId,
      m.merchantName,
      m.merchantType,
      m.contactPerson,
      m.contactEmail,
      m.contactNumber,
      m.apiEnabled,
      m.kycDocumentName,
      m.kycStatus,
      m.status,
      String(m.voucherCount),
      m.createdAt,
      m.updatedAt,
    ]
      .map((cell) => {
        const value = String(cell ?? "");
        return value.includes(",") || value.includes('"') || value.includes("\n")
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      })
      .join(",")
  );
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

function buildKpis(merchants: MerchantOnboarding[]): MerchantsKpis {
  return {
    total: merchants.length,
    active: merchants.filter((m) => m.status === "ACTIVE").length,
    inactive: merchants.filter((m) => m.status === "INACTIVE").length,
    internal: merchants.filter((m) => m.merchantType === "INTERNAL").length,
    external: merchants.filter((m) => m.merchantType === "EXTERNAL").length,
    partner: merchants.filter((m) => m.merchantType === "PARTNER").length,
    apiEnabled: merchants.filter((m) => m.apiEnabled === "YES").length,
    pendingKyc: merchants.filter((m) => m.kycStatus === "PENDING").length,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────

export function MerchantsProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const [merchants, setMerchants] = React.useState<MerchantOnboarding[]>(() =>
    MOCK_MERCHANTS.map((m) => ({ ...m }))
  );
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<string>(nowIso());
  const [isHydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = readStorage<MerchantOnboarding[] | null>(
      StorageKeys.adminMerchants,
      null
    );
    if (stored && stored.length > 0) {
      const merged = MOCK_MERCHANTS.map((seed) => {
        const override = stored.find((m) => m.merchantId === seed.merchantId);
        return override ? { ...seed, ...override } : seed;
      });
      const known = new Set(MOCK_MERCHANTS.map((m) => m.merchantId));
      const extras = stored
        .filter((m) => !known.has(m.merchantId))
        .map((m) => ({ ...m }));
      setMerchants([...merged, ...extras]);
    }
    const refreshed = readStorage<string | null>(
      StorageKeys.merchantsLastRefreshed,
      null
    );
    if (refreshed) setLastRefreshedAt(refreshed);
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.adminMerchants, merchants);
  }, [merchants, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.merchantsLastRefreshed, lastRefreshedAt);
  }, [lastRefreshedAt, isHydrated]);

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
      module: "Merchant Onboarding",
      action: "MERCHANT_REFRESH",
      status: "info",
      details: "Refreshed merchant roster.",
    });
  }, [appendAudit]);

  const exportMerchants = React.useCallback(
    (visible: MerchantOnboarding[]) => {
      const csv = buildMerchantsCsv(visible);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`merchants-${stamp}.csv`, csv);
      appendAudit({
        module: "Merchant Onboarding",
        action: "MERCHANT_EXPORT",
        status: "success",
        details: `Exported ${visible.length} merchant(s) as CSV.`,
        target: `merchants-${visible.length}`,
      });
    },
    [appendAudit]
  );

  const logMerchantView = React.useCallback(
    (id: string) => {
      appendAudit({
        module: "Merchant Onboarding",
        action: "MERCHANT_VIEWED",
        status: "info",
        details: "Opened merchant detail drawer.",
        target: id,
      });
    },
    [appendAudit]
  );

  const createMerchant = React.useCallback(
    (input: MerchantFormInput): MerchantMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can add merchants." };
      }
      const validation = validateInput(input, merchants);
      if (!validation.ok) {
        appendAudit({
          module: "Merchant Onboarding",
          action: "MERCHANT_VALIDATION_FAILED",
          status: "warning",
          details: `Validation failed for new merchant: ${validation.message}`,
        });
        return validation;
      }
      const merchant = buildMerchantFromInput(input, null);
      setMerchants((prev) => [merchant, ...prev]);
      appendAudit({
        module: "Merchant Onboarding",
        action: "MERCHANT_CREATED",
        status: "success",
        details: `Created merchant ${merchant.merchantName} (${merchant.merchantId}).`,
        target: merchant.merchantId,
      });
      return { ok: true, merchant };
    },
    [merchants, role, appendAudit]
  );

  const updateMerchant = React.useCallback(
    (id: string, input: MerchantFormInput): MerchantMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can edit merchants." };
      }
      const existing = merchants.find((m) => m.id === id);
      if (!existing) {
        return { ok: false, message: "Merchant not found." };
      }
      const validation = validateInput(input, merchants, id);
      if (!validation.ok) {
        appendAudit({
          module: "Merchant Onboarding",
          action: "MERCHANT_VALIDATION_FAILED",
          status: "warning",
          details: `Validation failed while updating ${existing.merchantName}: ${validation.message}`,
          target: existing.merchantId,
        });
        return validation;
      }
      const merchant = buildMerchantFromInput(input, existing);
      setMerchants((prev) =>
        prev.map((m) => (m.id === id ? merchant : m))
      );
      appendAudit({
        module: "Merchant Onboarding",
        action: "MERCHANT_UPDATED",
        status: "success",
        details: `Updated merchant ${merchant.merchantName} (${merchant.merchantId}).`,
        target: merchant.merchantId,
      });
      return { ok: true, merchant };
    },
    [merchants, role, appendAudit]
  );

  const activateMerchant = React.useCallback(
    (id: string, reason: string): MerchantMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change merchant status." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "A reason is required." };
      }
      const existing = merchants.find((m) => m.id === id);
      if (!existing) {
        return { ok: false, message: "Merchant not found." };
      }
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: "ACTIVE", updatedAt: nowIso() } : m
        )
      );
      appendAudit({
        module: "Merchant Onboarding",
        action: "MERCHANT_ACTIVATED",
        status: "success",
        details: `Activated ${existing.merchantName}. Reason: ${reason.trim()}.`,
        target: existing.merchantId,
      });
      return { ok: true, merchant: existing };
    },
    [merchants, role, appendAudit]
  );

  const deactivateMerchant = React.useCallback(
    (id: string, reason: string): MerchantMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change merchant status." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "A reason is required." };
      }
      const existing = merchants.find((m) => m.id === id);
      if (!existing) {
        return { ok: false, message: "Merchant not found." };
      }
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, status: "INACTIVE", updatedAt: nowIso() } : m
        )
      );
      appendAudit({
        module: "Merchant Onboarding",
        action: "MERCHANT_DEACTIVATED",
        status: "warning",
        details: `Deactivated ${existing.merchantName}. Reason: ${reason.trim()}.`,
        target: existing.merchantId,
      });
      return { ok: true, merchant: existing };
    },
    [merchants, role, appendAudit]
  );

  const approveKyc = React.useCallback(
    (id: string, remarks: string): MerchantMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can approve KYC." };
      }
      const existing = merchants.find((m) => m.id === id);
      if (!existing) {
        return { ok: false, message: "Merchant not found." };
      }
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                kycStatus: "APPROVED",
                kycRemarks: remarks.trim() || m.kycRemarks,
                approvedBy: actorForRole(role),
                approvedAt: nowIso(),
                rejectedBy: undefined,
                rejectedAt: undefined,
                updatedAt: nowIso(),
              }
            : m
        )
      );
      appendAudit({
        module: "Merchant Onboarding",
        action: "MERCHANT_KYC_APPROVED",
        status: "success",
        details: `Approved KYC for ${existing.merchantName}. Remarks: ${remarks.trim() || "(none)"}.`,
        target: existing.merchantId,
      });
      return { ok: true, merchant: existing };
    },
    [merchants, role, appendAudit]
  );

  const rejectKyc = React.useCallback(
    (id: string, reason: string): MerchantMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can reject KYC." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "A rejection reason is required." };
      }
      const existing = merchants.find((m) => m.id === id);
      if (!existing) {
        return { ok: false, message: "Merchant not found." };
      }
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                kycStatus: "REJECTED",
                kycRemarks: reason.trim(),
                rejectedBy: actorForRole(role),
                rejectedAt: nowIso(),
                approvedBy: undefined,
                approvedAt: undefined,
                updatedAt: nowIso(),
              }
            : m
        )
      );
      appendAudit({
        module: "Merchant Onboarding",
        action: "MERCHANT_KYC_REJECTED",
        status: "warning",
        details: `Rejected KYC for ${existing.merchantName}. Reason: ${reason.trim()}.`,
        target: existing.merchantId,
      });
      return { ok: true, merchant: existing };
    },
    [merchants, role, appendAudit]
  );

  const resetSession = React.useCallback(() => {
    setMerchants(MOCK_MERCHANTS.map((m) => ({ ...m })));
    setLastRefreshedAt(nowIso());
  }, []);

  const vouchersForMerchant = React.useCallback(
    (id: string) => {
      const merchant = merchants.find((m) => m.id === id);
      if (!merchant) return [];
      // We resolve by merchant name to align with the seeded voucher
      // catalogue that uses the friendly name as the join key.
      return MOCK_VOUCHERS.filter(
        (v) =>
          v.merchantId === merchant.id ||
          v.merchantName.toLowerCase() === merchant.merchantName.toLowerCase()
      );
    },
    [merchants]
  );

  const performanceForMerchant = React.useCallback(
    (id: string) => {
      const vouchers = vouchersForMerchant(id);
      const voucherIds = new Set(vouchers.map((v) => v.id));
      const redemptions = MOCK_TRANSACTIONS.filter(
        (t) => t.type === "redeem" && t.rewardId && voucherIds.has(t.rewardId)
      );
      const successful = redemptions.filter(
        (t) => t.status === "completed"
      ).length;
      const failed = redemptions.filter(
        (t) => t.status === "failed" || t.status === "reversed"
      ).length;
      const redemptionValue = vouchers.reduce(
        (sum, v) => sum + v.redeemed * v.value,
        0
      );
      const mostRedeemed =
        vouchers.length === 0
          ? null
          : [...vouchers].sort((a, b) => b.redeemed - a.redeemed)[0];
      return {
        totalRedemptions: redemptions.length,
        successful,
        failed,
        redemptionValue,
        mostRedeemed,
      };
    },
    [vouchersForMerchant]
  );

  const detectDuplicateName = React.useCallback(
    (name: string, excludeId?: string) => {
      const trimmed = name.trim().toLowerCase();
      if (!trimmed) return null;
      return (
        merchants.find(
          (m) =>
            m.id !== excludeId &&
            m.status === "ACTIVE" &&
            m.merchantName.toLowerCase() === trimmed
        ) ?? null
      );
    },
    [merchants]
  );

  const visibleMerchants = React.useMemo(
    () => [...merchants].sort((a, b) => a.merchantName.localeCompare(b.merchantName)),
    [merchants]
  );

  const kpis = React.useMemo(() => buildKpis(visibleMerchants), [visibleMerchants]);

  const canEdit = role === "admin";
  const canExport = role === "admin" || role === "merchant";
  const canApproveKyc = role === "admin";

  const value = React.useMemo<MerchantsContextValue>(
    () => ({
      merchants,
      lastRefreshedAt,
      isHydrated,
      visibleMerchants,
      kpis,
      canEdit,
      canExport,
      canApproveKyc,
      vouchersForMerchant,
      performanceForMerchant,
      detectDuplicateName,
      refresh,
      exportMerchants,
      createMerchant,
      updateMerchant,
      activateMerchant,
      deactivateMerchant,
      approveKyc,
      rejectKyc,
      logMerchantView,
      resetSession,
    }),
    [
      merchants,
      lastRefreshedAt,
      isHydrated,
      visibleMerchants,
      kpis,
      canEdit,
      canExport,
      canApproveKyc,
      vouchersForMerchant,
      performanceForMerchant,
      detectDuplicateName,
      refresh,
      exportMerchants,
      createMerchant,
      updateMerchant,
      activateMerchant,
      deactivateMerchant,
      approveKyc,
      rejectKyc,
      logMerchantView,
      resetSession,
    ]
  );

  return (
    <MerchantsContext.Provider value={value}>{children}</MerchantsContext.Provider>
  );
}

export function useMerchants(): MerchantsContextValue {
  const ctx = React.useContext(MerchantsContext);
  if (!ctx) {
    throw new Error("useMerchants must be used within a MerchantsProvider");
  }
  return ctx;
}

// Re-export the eligibility helpers so consumers can pull them from one place.
export {
  describeMerchantCapability,
  canCreateVoucher,
  canCreateApiVoucher,
  canCreateInventoryVoucher,
};
