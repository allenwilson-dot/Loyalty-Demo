"use client";

import * as React from "react";

import { MOCK_TIERS } from "@/data/mockTiers";
import { MOCK_USERS } from "@/data/mockUsers";
import { MOCK_REWARDS } from "@/data/mockRewards";
import { actorForRole, buildAuditEntry, loadAuditLog, nowIso, persistAuditLog } from "@/lib/audit";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import type {
  AdminAuditEntry,
  Reward,
  RoleId,
  Tier,
  TierId,
  TierStatus,
  User,
} from "@/types/loyalty";

import { useRole } from "@/components/layout/RoleProvider";

// ─── Types ────────────────────────────────────────────────────────────

export interface TierFormInput {
  name: string;
  thresholdType: "POINTS" | "AMOUNT";
  thresholdValue: number;
  upgradeRule: Tier["upgradeRule"];
  benefits: NonNullable<Tier["benefits"]>;
  earningMultiplier: number;
  redemptionBenefit: string;
  badgeLabel: string;
  badgeColor: string;
  iconName: NonNullable<Tier["iconName"]>;
  status: TierStatus;
  notes?: string;
}

export type CreateTierInput = TierFormInput;
export type UpdateTierInput = TierFormInput;

export interface TierMutationResult {
  ok: boolean;
  message?: string;
  tier?: Tier;
}

export interface TiersKpis {
  total: number;
  active: number;
  inactive: number;
  highestTier: Tier | null;
  averageThreshold: number;
  usersInGoldOrAbove: number;
  rewardsLockedByTier: number;
  usersNearUpgrade: number;
}

export interface UserTierOverride {
  userId: string;
  tierId: TierId;
  reason: string;
  occurredAt: string;
  actor: string;
}

export interface TiersState {
  tiers: Tier[];
  overrides: UserTierOverride[];
  lastRefreshedAt: string;
  isHydrated: boolean;
}

export interface TiersActions {
  refresh: () => void;
  exportTiers: (visible: Tier[]) => void;
  createTier: (input: CreateTierInput) => TierMutationResult;
  updateTier: (id: TierId, input: UpdateTierInput) => TierMutationResult;
  activateTier: (id: TierId, reason: string) => TierMutationResult;
  deactivateTier: (id: TierId, reason: string) => TierMutationResult;
  applyUserTier: (userId: string, newTierId: TierId, reason: string) => TierMutationResult;
  logTierView: (id: TierId) => void;
  resetSession: () => void;
}

export interface TiersContextValue extends TiersState, TiersActions {
  visibleTiers: Tier[];
  kpis: TiersKpis;
  canEdit: boolean;
  canExport: boolean;
  countUsersInTier: (tierId: TierId, users?: User[]) => number;
  rewardsEligibleFor: (tierId: TierId, rewards?: Reward[]) => Reward[];
  rewardsLockedFor: (tierId: TierId, rewards?: Reward[]) => Reward[];
  usersInTier: (tierId: TierId, limit?: number) => User[];
  usersNearUpgrade: () => User[];
  simulateTier: (userId: string, lifetimePoints: number) => {
    current: Tier;
    simulated: Tier;
    next: Tier | null;
    pointsToNext: number;
    thresholdMet: boolean;
  };
}

const TiersContext = React.createContext<TiersContextValue | null>(null);

const KNOWN_TIER_IDS: TierId[] = ["bronze", "silver", "gold", "platinum", "diamond"];

function buildTierIdFromName(name: string): TierId {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24) || `tier_${Date.now().toString(36)}`;
  if ((KNOWN_TIER_IDS as string[]).includes(slug)) return slug as TierId;
  return slug as TierId;
}

function benefitsToPerks(benefits: NonNullable<Tier["benefits"]>): string[] {
  const labels: Record<string, string> = {
    birthday_pack: "Birthday data or voucher pack",
    data_addon_eligibility: "Eligible to redeem data add-ons",
    wallet_credit_eligibility: "Eligible to redeem wallet credits",
    better_redemption_rate: "Bonus value on redemptions",
    exclusive_vouchers: "Exclusive partner voucher catalogue",
    early_campaign_access: "Early access to redemption campaigns",
    higher_earning_multiplier: "Higher earning multiplier",
    priority_support: "Priority customer support",
  };
  return benefits.map((b) => labels[b] ?? b);
}

function buildTierFromInput(input: CreateTierInput, existing: Tier[]): Tier {
  const rank = existing.length
    ? Math.max(...existing.map((t) => t.rank)) + 1
    : 0;
  const id = buildTierIdFromName(input.name);
  return {
    id,
    name: input.name.trim(),
    threshold: input.thresholdValue,
    rank,
    multiplier: input.earningMultiplier,
    color: input.badgeColor,
    perks: benefitsToPerks(input.benefits),
    thresholdType: input.thresholdType,
    upgradeRule: input.upgradeRule,
    benefits: input.benefits,
    redemptionBenefit: input.redemptionBenefit,
    badgeLabel: input.badgeLabel,
    iconName: input.iconName,
    status: input.status,
    lastUpdated: nowIso(),
    notes: input.notes,
  };
}

function buildTiersCsv(tiers: Tier[]): string {
  const header = [
    "Tier ID",
    "Name",
    "Rank",
    "Threshold type",
    "Threshold value",
    "Upgrade rule",
    "Earning multiplier",
    "Status",
    "Users in tier",
    "Eligible rewards",
    "Benefits",
    "Redemption benefit",
    "Badge label",
    "Last updated",
  ];
  const rows = tiers.map((t) => {
    const users = MOCK_USERS.filter((u) => u.tierId === t.id).length;
    const rewards = MOCK_REWARDS.filter((r) => r.minTier === t.id).length;
    return [
      t.id,
      t.name,
      String(t.rank),
      t.thresholdType ?? "POINTS",
      String(t.threshold),
      t.upgradeRule ?? "lifetime_points",
      String(t.multiplier),
      t.status ?? "ACTIVE",
      String(users),
      String(rewards),
      (t.benefits ?? []).join(" | "),
      t.redemptionBenefit ?? "",
      t.badgeLabel ?? "",
      t.lastUpdated ?? "",
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

function validateThresholdOrder(
  id: TierId | undefined,
  value: number,
  tiers: Tier[]
): { ok: true } | { ok: false; message: string } {
  const sorted = [...tiers].sort((a, b) => a.rank - b.rank);
  if (!id) {
    const higher = sorted.find((t) => t.threshold > value);
    if (higher && value >= higher.threshold) {
      return {
        ok: false,
        message: `Threshold must be lower than ${higher.name} (${higher.threshold}).`,
      };
    }
  } else {
    const idx = sorted.findIndex((t) => t.id === id);
    if (idx > 0) {
      const prev = sorted[idx - 1];
      if (prev && value <= prev.threshold) {
        return {
          ok: false,
          message: `Threshold must be higher than ${prev.name} (${prev.threshold}).`,
        };
      }
    }
    const next = sorted[idx + 1];
    if (next && value >= next.threshold) {
      return {
        ok: false,
        message: `Threshold must be lower than ${next.name} (${next.threshold}).`,
      };
    }
  }
  return { ok: true };
}

export function TiersProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();

  const [tiers, setTiers] = React.useState<Tier[]>(() =>
    MOCK_TIERS.map((t) => ({ ...t }))
  );
  const [overrides, setOverrides] = React.useState<UserTierOverride[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<string>(nowIso());
  const [isHydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const storedTiers = readStorage<Tier[] | null>(StorageKeys.adminTiers, null);
    if (storedTiers && storedTiers.length > 0) {
      const merged = MOCK_TIERS.map((seed) => {
        const override = storedTiers.find((t) => t.id === seed.id);
        return override ? { ...seed, ...override } : seed;
      });
      const known = new Set(MOCK_TIERS.map((t) => t.id));
      const extras = storedTiers
        .filter((t) => !known.has(t.id))
        .map((t) => ({ ...t }));
      setTiers([...merged, ...extras]);
    }
    const storedOverrides = readStorage<UserTierOverride[] | null>(
      StorageKeys.adminUserTiers,
      null
    );
    if (storedOverrides) setOverrides(storedOverrides);
    const refreshed = readStorage<string | null>(
      StorageKeys.tiersLastRefreshed,
      null
    );
    if (refreshed) setLastRefreshedAt(refreshed);
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.adminTiers, tiers);
  }, [tiers, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.adminUserTiers, overrides);
  }, [overrides, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.tiersLastRefreshed, lastRefreshedAt);
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
      module: "Tier Management",
      action: "TIER_REFRESH",
      status: "info",
      details: "Refreshed tier configuration.",
    });
  }, [appendAudit]);

  const exportTiers = React.useCallback(
    (visible: Tier[]) => {
      const csv = buildTiersCsv(visible);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`loyalty-tiers-${stamp}.csv`, csv);
      appendAudit({
        module: "Tier Management",
        action: "TIER_EXPORT",
        status: "success",
        details: `Exported ${visible.length} tier(s) as CSV.`,
        target: `tiers-${visible.length}`,
      });
    },
    [appendAudit]
  );

  const logTierView = React.useCallback(
    (id: TierId) => {
      appendAudit({
        module: "Tier Management",
        action: "TIER_VIEWED",
        status: "info",
        details: "Opened tier detail drawer.",
        target: id,
      });
    },
    [appendAudit]
  );

  const createTier = React.useCallback(
    (input: CreateTierInput): TierMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can create tiers." };
      }
      if (!input.name.trim()) {
        return { ok: false, message: "Tier name is required." };
      }
      const nameConflict = tiers.some(
        (t) => t.name.toLowerCase() === input.name.trim().toLowerCase()
      );
      if (nameConflict) {
        return { ok: false, message: "A tier with this name already exists." };
      }
      if (!Number.isFinite(input.thresholdValue) || input.thresholdValue < 0) {
        return { ok: false, message: "Threshold must be a positive number." };
      }
      if (
        !Number.isFinite(input.earningMultiplier) ||
        input.earningMultiplier < 1
      ) {
        return { ok: false, message: "Earning multiplier must be 1.0 or higher." };
      }
      const order = validateThresholdOrder(undefined, input.thresholdValue, tiers);
      if (!order.ok) return order;
      if (input.benefits.length === 0) {
        return { ok: false, message: "Select at least one benefit." };
      }

      const tier = buildTierFromInput(input, tiers);
      setTiers((prev) => [...prev, tier]);
      appendAudit({
        module: "Tier Management",
        action: "TIER_CREATED",
        status: "success",
        details: `Created tier ${tier.name} (${tier.id}) at ${tier.threshold} ${tier.thresholdType}.`,
        target: tier.id,
      });
      return { ok: true, tier };
    },
    [tiers, role, appendAudit]
  );

  const updateTier = React.useCallback(
    (id: TierId, input: UpdateTierInput): TierMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can edit tiers." };
      }
      const existing = tiers.find((t) => t.id === id);
      if (!existing) return { ok: false, message: "Tier not found." };
      if (!input.name.trim()) {
        return { ok: false, message: "Tier name is required." };
      }
      const nameConflict = tiers.some(
        (t) => t.id !== id && t.name.toLowerCase() === input.name.trim().toLowerCase()
      );
      if (nameConflict) {
        return { ok: false, message: "Another tier is already using this name." };
      }
      if (!Number.isFinite(input.thresholdValue) || input.thresholdValue < 0) {
        return { ok: false, message: "Threshold must be a positive number." };
      }
      if (
        !Number.isFinite(input.earningMultiplier) ||
        input.earningMultiplier < 1
      ) {
        return { ok: false, message: "Earning multiplier must be 1.0 or higher." };
      }
      const order = validateThresholdOrder(id, input.thresholdValue, tiers);
      if (!order.ok) return order;
      if (input.benefits.length === 0) {
        return { ok: false, message: "Select at least one benefit." };
      }

      const updated: Tier = {
        ...existing,
        name: input.name.trim(),
        threshold: input.thresholdValue,
        thresholdType: input.thresholdType,
        upgradeRule: input.upgradeRule,
        benefits: input.benefits,
        redemptionBenefit: input.redemptionBenefit,
        badgeLabel: input.badgeLabel,
        color: input.badgeColor,
        iconName: input.iconName,
        multiplier: input.earningMultiplier,
        status: input.status,
        notes: input.notes,
        perks: benefitsToPerks(input.benefits),
        lastUpdated: nowIso(),
      };
      setTiers((prev) => prev.map((t) => (t.id === id ? updated : t)));
      appendAudit({
        module: "Tier Management",
        action: "TIER_UPDATED",
        status: "success",
        details: `Updated tier ${updated.name} (${updated.id}).`,
        target: id,
      });
      return { ok: true, tier: updated };
    },
    [tiers, role, appendAudit]
  );

  const activateTier = React.useCallback(
    (id: TierId, reason: string): TierMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change tier status." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "A reason is required." };
      }
      const existing = tiers.find((t) => t.id === id);
      if (!existing) return { ok: false, message: "Tier not found." };
      setTiers((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "ACTIVE", lastUpdated: nowIso() } : t
        )
      );
      appendAudit({
        module: "Tier Management",
        action: "TIER_ACTIVATED",
        status: "success",
        details: `Activated ${existing.name}. Reason: ${reason.trim()}.`,
        target: id,
      });
      return { ok: true };
    },
    [tiers, role, appendAudit]
  );

  const deactivateTier = React.useCallback(
    (id: TierId, reason: string): TierMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change tier status." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "A reason is required." };
      }
      const existing = tiers.find((t) => t.id === id);
      if (!existing) return { ok: false, message: "Tier not found." };
      const activeCount = tiers.filter(
        (t) => (t.status ?? "ACTIVE") === "ACTIVE"
      ).length;
      if (activeCount <= 1 && (existing.status ?? "ACTIVE") === "ACTIVE") {
        return {
          ok: false,
          message: "At least one tier must remain active.",
        };
      }
      setTiers((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "INACTIVE", lastUpdated: nowIso() } : t
        )
      );
      appendAudit({
        module: "Tier Management",
        action: "TIER_DEACTIVATED",
        status: "warning",
        details: `Deactivated ${existing.name}. Reason: ${reason.trim()}.`,
        target: id,
      });
      return { ok: true };
    },
    [tiers, role, appendAudit]
  );

  const applyUserTier = React.useCallback(
    (userId: string, newTierId: TierId, reason: string): TierMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change user tiers." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "A reason is required." };
      }
      const tier = tiers.find((t) => t.id === newTierId);
      if (!tier) return { ok: false, message: "Tier not found." };
      if ((tier.status ?? "ACTIVE") !== "ACTIVE") {
        return { ok: false, message: "Cannot assign an inactive tier." };
      }
      setOverrides((prev) => [
        {
          userId,
          tierId: newTierId,
          reason: reason.trim(),
          occurredAt: nowIso(),
          actor: actorForRole(role),
        },
        ...prev.filter((o) => o.userId !== userId),
      ]);
      appendAudit({
        module: "Tier Management",
        action: "USER_TIER_UPDATED",
        status: "success",
        details: `Set user ${userId} to tier ${tier.name}. Reason: ${reason.trim()}.`,
        target: `${userId}->${newTierId}`,
      });
      return { ok: true, tier };
    },
    [tiers, role, appendAudit]
  );

  const resetSession = React.useCallback(() => {
    setTiers(MOCK_TIERS.map((t) => ({ ...t })));
    setOverrides([]);
    setLastRefreshedAt(nowIso());
  }, []);

  const countUsersInTier = React.useCallback(
    (tierId: TierId, users: User[] = MOCK_USERS) =>
      users.filter((u) => u.tierId === tierId).length,
    []
  );

  const rewardsEligibleFor = React.useCallback(
    (tierId: TierId, rewards: Reward[] = MOCK_REWARDS) => {
      const tier = tiers.find((t) => t.id === tierId);
      if (!tier) return [];
      return rewards.filter((r) => {
        const required = tiers.find((t) => t.id === r.minTier);
        return required ? required.rank <= tier.rank : false;
      });
    },
    [tiers]
  );

  const rewardsLockedFor = React.useCallback(
    (tierId: TierId, rewards: Reward[] = MOCK_REWARDS) => {
      const tier = tiers.find((t) => t.id === tierId);
      if (!tier) return [];
      return rewards.filter((r) => {
        const required = tiers.find((t) => t.id === r.minTier);
        return required ? required.rank > tier.rank : false;
      });
    },
    [tiers]
  );

  const usersInTier = React.useCallback(
    (tierId: TierId, limit = 4) =>
      MOCK_USERS.filter((u) => u.tierId === tierId).slice(0, limit),
    []
  );

  const usersNearUpgrade = React.useCallback(() => {
    const sorted = [...tiers].sort((a, b) => a.rank - b.rank);
    return MOCK_USERS.filter((u) => {
      const current = sorted.find((t) => t.id === u.tierId);
      if (!current) return false;
      const next = sorted.find((t) => t.rank === current.rank + 1);
      if (!next) return false;
      const span = next.threshold - current.threshold;
      if (span <= 0) return false;
      const ratio = (u.lifetimePoints - current.threshold) / span;
      return ratio >= 0.6 && ratio < 1;
    });
  }, [tiers]);

  const simulateTier = React.useCallback(
    (userId: string, lifetimePoints: number) => {
      const sorted = [...tiers].sort((a, b) => a.rank - b.rank);
      const user = MOCK_USERS.find((u) => u.id === userId);
      const current = sorted.find((t) => t.id === user?.tierId) ?? sorted[0];
      let simulated: Tier = current;
      for (const t of sorted) {
        if (lifetimePoints >= t.threshold) simulated = t;
      }
      const next = sorted.find((t) => t.rank === simulated.rank + 1) ?? null;
      const pointsToNext = next
        ? Math.max(0, next.threshold - lifetimePoints)
        : 0;
      return {
        current,
        simulated,
        next,
        pointsToNext,
        thresholdMet: next ? lifetimePoints >= next.threshold : true,
      };
    },
    [tiers]
  );

  const visibleTiers = React.useMemo(
    () => [...tiers].sort((a, b) => a.rank - b.rank),
    [tiers]
  );

  const kpis = React.useMemo(
    () => computeKpis(visibleTiers, MOCK_USERS, MOCK_REWARDS),
    [visibleTiers]
  );

  const canEdit = role === "admin";
  const canExport = role === "admin" || role === "merchant";

  const value = React.useMemo<TiersContextValue>(
    () => ({
      tiers,
      overrides,
      lastRefreshedAt,
      isHydrated,
      visibleTiers,
      kpis,
      canEdit,
      canExport,
      countUsersInTier,
      rewardsEligibleFor,
      rewardsLockedFor,
      usersInTier,
      usersNearUpgrade,
      simulateTier,
      refresh,
      exportTiers,
      createTier,
      updateTier,
      activateTier,
      deactivateTier,
      applyUserTier,
      logTierView,
      resetSession,
    }),
    [
      tiers,
      overrides,
      lastRefreshedAt,
      isHydrated,
      visibleTiers,
      kpis,
      canEdit,
      canExport,
      countUsersInTier,
      rewardsEligibleFor,
      rewardsLockedFor,
      usersInTier,
      usersNearUpgrade,
      simulateTier,
      refresh,
      exportTiers,
      createTier,
      updateTier,
      activateTier,
      deactivateTier,
      applyUserTier,
      logTierView,
      resetSession,
    ]
  );

  return <TiersContext.Provider value={value}>{children}</TiersContext.Provider>;
}

export function useTiers(): TiersContextValue {
  const ctx = React.useContext(TiersContext);
  if (!ctx) throw new Error("useTiers must be used within a TiersProvider");
  return ctx;
}

function computeKpis(
  tiers: Tier[],
  users: User[],
  rewards: Reward[]
): TiersKpis {
  const sorted = [...tiers].sort((a, b) => a.rank - b.rank);
  const highest = sorted[sorted.length - 1] ?? null;
  const active = tiers.filter((t) => (t.status ?? "ACTIVE") === "ACTIVE");
  const inactive = tiers.filter((t) => (t.status ?? "ACTIVE") === "INACTIVE");
  const totalThreshold = active.reduce((sum, t) => sum + t.threshold, 0);
  const averageThreshold = active.length
    ? Math.round(totalThreshold / active.length)
    : 0;
  const goldIdx = sorted.findIndex((t) => t.id === "gold");
  const platinumIdx = sorted.findIndex((t) => t.id === "platinum");
  const diamondIdx = sorted.findIndex((t) => t.id === "diamond");
  const upperRanks = [goldIdx, platinumIdx, diamondIdx].filter((i) => i >= 0);
  const usersInGoldOrAbove = users.filter((u) => {
    const idx = sorted.findIndex((t) => t.id === u.tierId);
    return upperRanks.includes(idx);
  }).length;
  const lockedRewards = rewards.filter((r) => {
    const required = sorted.find((t) => t.id === r.minTier);
    if (!required) return false;
    return required.status === "INACTIVE";
  }).length;
  const near = users.filter((u) => {
    const current = sorted.find((t) => t.id === u.tierId);
    if (!current) return false;
    const next = sorted.find((t) => t.rank === current.rank + 1);
    if (!next || next.threshold <= current.threshold) return false;
    const ratio = (u.lifetimePoints - current.threshold) / (next.threshold - current.threshold);
    return ratio >= 0.6 && ratio < 1;
  }).length;

  return {
    total: tiers.length,
    active: active.length,
    inactive: inactive.length,
    highestTier: highest,
    averageThreshold,
    usersInGoldOrAbove,
    rewardsLockedByTier: lockedRewards,
    usersNearUpgrade: near,
  };
}
