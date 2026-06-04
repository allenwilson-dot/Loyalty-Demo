"use client";

import * as React from "react";

import { MOCK_USERS } from "@/data/mockUsers";
import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";
import { actorForRole, buildAuditEntry, loadAuditLog, nowIso, persistAuditLog } from "@/lib/audit";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import type {
  AdminAuditEntry,
  BulkAdjustmentPreviewRow,
  LedgerEntry,
  LoyaltyTransaction,
  RoleId,
  User,
  UserAccountStatus,
  UserAdminAction,
} from "@/types/loyalty";

import { useRole } from "@/components/layout/RoleProvider";

// ─── Types ────────────────────────────────────────────────────────────

export type AdjustmentKind = "add" | "reverse";

export interface AddPointsInput {
  userId: string;
  points: number;
  reason: string;
  note?: string;
  notifyUser: boolean;
}

export interface ReversePointsInput {
  userId: string;
  points: number;
  reason: string;
  note?: string;
  notifyUser: boolean;
}

export interface LockUserInput {
  userId: string;
  reason: string;
  note?: string;
}

export interface BulkAdjustmentInput {
  kind: AdjustmentKind;
  rows: BulkAdjustmentPreviewRow[];
  notifyUser: boolean;
}

export interface BulkAdjustmentResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  appliedUserIds: string[];
  details: string;
}

export type AdjustmentFailureReason =
  | "user_not_found"
  | "user_locked"
  | "user_inactive"
  | "insufficient_points"
  | "non_positive_points";

export interface AdjustmentResult {
  ok: boolean;
  reason?: AdjustmentFailureReason;
  message?: string;
  newBalance?: number;
  adminAction?: UserAdminAction;
}

export interface UsersState {
  users: User[];
  adminActions: UserAdminAction[];
  auditLog: AdminAuditEntry[];
  lastRefreshedAt: string;
  isHydrated: boolean;
}

export interface UsersActions {
  refresh: () => void;
  exportUsers: (visible: User[]) => void;
  logProfileView: (userId: string) => void;
  addPoints: (input: AddPointsInput) => AdjustmentResult;
  reversePoints: (input: ReversePointsInput) => AdjustmentResult;
  lockUser: (input: LockUserInput) => AdjustmentResult;
  unlockUser: (input: LockUserInput) => AdjustmentResult;
  applyBulk: (input: BulkAdjustmentInput) => BulkAdjustmentResult;
  resetSession: () => void;
}

export interface UsersContextValue extends UsersState, UsersActions {
  /** Filtered + sorted users for the table. */
  visibleUsers: User[];
  /** KPIs derived from the current user list. */
  kpis: UsersKpis;
  /** Whether the current role can perform write actions. */
  canEdit: boolean;
  /** Whether the current role can export the current view. */
  canExport: boolean;
  /** Whether the current role is the merchant persona. */
  isMerchantView: boolean;
  /** Computes the points ledger for a user. */
  getLedger: (userId: string) => LedgerEntry[];
  /** Returns the redemption history for a user. */
  getRedemptions: (userId: string) => Array<{
    id: string;
    rewardId: string;
    rewardTitle: string;
    rewardType: LoyaltyTransaction["type"] | "redeem";
    points: number;
    status: "completed" | "pending" | "failed";
    couponCode?: string;
    merchantName?: string;
    occurredAt: string;
    reference: string;
  }>;
}

export interface UsersKpis {
  total: number;
  active: number;
  locked: number;
  totalPointsBalance: number;
  manuallyAdded: number;
  manuallyReversed: number;
  goldPlatinum: number;
  failedRedemptions: number;
}

const UsersContext = React.createContext<UsersContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────

function buildAdminActionId() {
  return `adma_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function buildLedgerId() {
  return `led_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

/**
 * Returns true if the user status allows adding/reversing points.
 */
function canAdjustUser(user: User): boolean {
  return user.status === "active";
}

/**
 * Returns true if the user status allows locking/unlocking (any non-pending
 * non-churned user is eligible).
 */
function canLockUser(user: User): boolean {
  return user.status !== "pending" && user.status !== "churned";
}

function statusBadgeTone(status: UserAccountStatus): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "active":
      return "success";
    case "locked":
      return "warning";
    case "suspended":
      return "danger";
    case "inactive":
      return "neutral";
    default:
      return "neutral";
  }
}

// ─── Provider ─────────────────────────────────────────────────────────

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const { role } = useRole();

  const [users, setUsers] = React.useState<User[]>(MOCK_USERS);
  const [adminActions, setAdminActions] = React.useState<UserAdminAction[]>([]);
  const [auditLog, setAuditLog] = React.useState<AdminAuditEntry[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<string>(nowIso());
  const [isHydrated, setHydrated] = React.useState(false);

  // Hydrate persisted slices on mount.
  React.useEffect(() => {
    const storedUsers = readStorage<User[] | null>(StorageKeys.adminUsers, null);
    if (storedUsers && storedUsers.length > 0) setUsers(storedUsers);

    const storedActions = readStorage<UserAdminAction[] | null>(
      StorageKeys.adminUserActions,
      null
    );
    if (storedActions) setAdminActions(storedActions);

    setAuditLog(loadAuditLog());
    const storedRefreshed = readStorage<string | null>(
      StorageKeys.usersLastRefreshed,
      null
    );
    if (storedRefreshed) setLastRefreshedAt(storedRefreshed);

    setHydrated(true);
  }, []);

  // Persist user mutations.
  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.adminUsers, users);
  }, [users, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.adminUserActions, adminActions);
  }, [adminActions, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    persistAuditLog(auditLog);
  }, [auditLog, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.usersLastRefreshed, lastRefreshedAt);
  }, [lastRefreshedAt, isHydrated]);

  // ─── Audit helper ────────────────────────────────────────────────
  const appendAudit = React.useCallback(
    (input: Omit<AdminAuditEntry, "id" | "occurredAt" | "actor" | "role">) => {
      const entry = buildAuditEntry({ ...input, role });
      setAuditLog((prev) => [entry, ...prev]);
    },
    [role]
  );

  // ─── Actions ────────────────────────────────────────────────────
  const refresh = React.useCallback(() => {
    setLastRefreshedAt(nowIso());
    appendAudit({
      module: "User Management",
      action: "USER_REFRESH",
      status: "info",
      details: "Refreshed user management data.",
    });
  }, [appendAudit]);

  const exportUsers = React.useCallback(
    (visible: User[]) => {
      if (role === "viewer") return;
      const csv = buildUsersCsv(visible);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`loyalty-users-${stamp}.csv`, csv);
      appendAudit({
        module: "User Management",
        action: "USER_EXPORT",
        status: "success",
        details: `Exported ${visible.length} users as CSV.`,
        target: `users-${visible.length}`,
      });
    },
    [appendAudit, role]
  );

  const logProfileView = React.useCallback(
    (userId: string) => {
      appendAudit({
        module: "User Management",
        action: "USER_PROFILE_VIEWED",
        status: "info",
        details: `Opened user profile drawer.`,
        target: userId,
      });
    },
    [appendAudit]
  );

  const updateUser = React.useCallback(
    (userId: string, updater: (u: User) => User) => {
      setUsers((prev) => prev.map((u) => (u.id === userId ? updater(u) : u)));
    },
    []
  );

  const pushAdminAction = React.useCallback((action: UserAdminAction) => {
    setAdminActions((prev) => [action, ...prev]);
  }, []);

  const addPoints = React.useCallback(
    ({ userId, points, reason, note, notifyUser }: AddPointsInput): AdjustmentResult => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { ok: false, reason: "user_not_found", message: "User not found." };
      }
      if (!canAdjustUser(user)) {
        return {
          ok: false,
          reason: "user_locked",
          message: `Cannot add points to a ${user.status} user.`,
        };
      }
      if (!Number.isFinite(points) || points <= 0) {
        return { ok: false, reason: "non_positive_points", message: "Points must be greater than 0." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "Reason is required." };
      }

      const newBalance = user.pointsBalance + points;
      updateUser(userId, (u) => ({
        ...u,
        pointsBalance: newBalance,
        lifetimePoints: u.lifetimePoints + points,
        lastActivityAt: nowIso(),
      }));

      const action: UserAdminAction = {
        id: buildAdminActionId(),
        userId,
        action: "points_added",
        points,
        reason: reason.trim(),
        actor: actorForRole(role),
        role,
        occurredAt: nowIso(),
        note,
        notifyUser,
      };
      pushAdminAction(action);

      appendAudit({
        module: "User Management",
        action: "POINTS_ADDED",
        status: "success",
        details: `Added ${points} pts to ${user.fullName}. Reason: ${reason.trim()}.`,
        target: userId,
      });

      return { ok: true, newBalance, adminAction: action };
    },
    [users, role, updateUser, pushAdminAction, appendAudit]
  );

  const reversePoints = React.useCallback(
    ({ userId, points, reason, note, notifyUser }: ReversePointsInput): AdjustmentResult => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { ok: false, reason: "user_not_found", message: "User not found." };
      }
      if (!canAdjustUser(user)) {
        return {
          ok: false,
          reason: "user_locked",
          message: `Cannot reverse points from a ${user.status} user.`,
        };
      }
      if (!Number.isFinite(points) || points <= 0) {
        return { ok: false, reason: "non_positive_points", message: "Points must be greater than 0." };
      }
      if (points > user.pointsBalance) {
        return {
          ok: false,
          reason: "insufficient_points",
          message: `User only has ${user.pointsBalance} pts available.`,
        };
      }
      if (!reason.trim()) {
        return { ok: false, message: "Reason is required." };
      }

      const newBalance = user.pointsBalance - points;
      updateUser(userId, (u) => ({
        ...u,
        pointsBalance: newBalance,
        lastActivityAt: nowIso(),
      }));

      const action: UserAdminAction = {
        id: buildAdminActionId(),
        userId,
        action: "points_reversed",
        points,
        reason: reason.trim(),
        actor: actorForRole(role),
        role,
        occurredAt: nowIso(),
        note,
        notifyUser,
      };
      pushAdminAction(action);

      appendAudit({
        module: "User Management",
        action: "POINTS_REVERSED",
        status: "success",
        details: `Reversed ${points} pts from ${user.fullName}. Reason: ${reason.trim()}.`,
        target: userId,
      });

      return { ok: true, newBalance, adminAction: action };
    },
    [users, role, updateUser, pushAdminAction, appendAudit]
  );

  const lockUser = React.useCallback(
    ({ userId, reason, note }: LockUserInput): AdjustmentResult => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { ok: false, reason: "user_not_found", message: "User not found." };
      }
      if (!canLockUser(user)) {
        return {
          ok: false,
          reason: "user_inactive",
          message: `Cannot lock a ${user.status} user.`,
        };
      }
      if (!reason.trim()) {
        return { ok: false, message: "Reason is required." };
      }
      updateUser(userId, (u) => ({ ...u, status: "locked", lastActivityAt: nowIso() }));
      const action: UserAdminAction = {
        id: buildAdminActionId(),
        userId,
        action: "locked",
        reason: reason.trim(),
        actor: actorForRole(role),
        role,
        occurredAt: nowIso(),
        note,
      };
      pushAdminAction(action);
      appendAudit({
        module: "User Management",
        action: "USER_LOCKED",
        status: "success",
        details: `Locked ${user.fullName}. Reason: ${reason.trim()}.`,
        target: userId,
      });
      return { ok: true, adminAction: action };
    },
    [users, role, updateUser, pushAdminAction, appendAudit]
  );

  const unlockUser = React.useCallback(
    ({ userId, reason, note }: LockUserInput): AdjustmentResult => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return { ok: false, reason: "user_not_found", message: "User not found." };
      }
      if (user.status !== "locked") {
        return {
          ok: false,
          reason: "user_inactive",
          message: "Only locked users can be unlocked.",
        };
      }
      if (!reason.trim()) {
        return { ok: false, message: "Reason is required." };
      }
      updateUser(userId, (u) => ({ ...u, status: "active", lastActivityAt: nowIso() }));
      const action: UserAdminAction = {
        id: buildAdminActionId(),
        userId,
        action: "unlocked",
        reason: reason.trim(),
        actor: actorForRole(role),
        role,
        occurredAt: nowIso(),
        note,
      };
      pushAdminAction(action);
      appendAudit({
        module: "User Management",
        action: "USER_UNLOCKED",
        status: "success",
        details: `Unlocked ${user.fullName}. Reason: ${reason.trim()}.`,
        target: userId,
      });
      return { ok: true, adminAction: action };
    },
    [users, role, updateUser, pushAdminAction, appendAudit]
  );

  const applyBulk = React.useCallback(
    ({ kind, rows, notifyUser }: BulkAdjustmentInput): BulkAdjustmentResult => {
      let successful = 0;
      let failed = 0;
      let skipped = 0;
      const appliedUserIds: string[] = [];
      const accepted = rows.filter((r) => r.status === "valid" && r.userId);

      accepted.forEach((row) => {
        if (!row.userId) {
          failed += 1;
          return;
        }
        const result =
          kind === "add"
            ? addPoints({
                userId: row.userId,
                points: row.points,
                reason: row.reason,
                notifyUser,
              })
            : reversePoints({
                userId: row.userId,
                points: row.points,
                reason: row.reason,
                notifyUser,
              });
        if (result.ok) {
          successful += 1;
          appliedUserIds.push(row.userId);
        } else {
          failed += 1;
        }
      });

      const rejected = rows.filter((r) => r.status !== "valid");
      skipped = rejected.length;

      appendAudit({
        module: "User Management",
        action: "BULK_POINTS_ADJUSTMENT",
        status: failed > 0 ? "warning" : "success",
        details: `Bulk ${kind}: ${successful} applied, ${failed} failed, ${skipped} skipped.`,
        target: `bulk-${kind}-${accepted.length}`,
      });

      return {
        total: rows.length,
        successful,
        failed,
        skipped,
        appliedUserIds,
        details: `${kind === "add" ? "Added" : "Reversed"} ${successful} of ${rows.length} rows.`,
      };
    },
    [addPoints, reversePoints, appendAudit]
  );

  const resetSession = React.useCallback(() => {
    setUsers(MOCK_USERS);
    setAdminActions([]);
    setLastRefreshedAt(nowIso());
  }, []);

  // ─── Derived data ───────────────────────────────────────────────
  const getLedger = React.useCallback(
    (userId: string): LedgerEntry[] => {
      const userTxns = MOCK_TRANSACTIONS.filter((t) => t.userId === userId);
      const userAdmin = adminActions.filter((a) => a.userId === userId);

      // Map admin actions to pseudo-transactions for ledger purposes.
      const adminEntries: LoyaltyTransaction[] = userAdmin
        .filter((a) => a.action === "points_added" || a.action === "points_reversed")
        .map((a) => ({
          id: a.id,
          userId: a.userId,
          userName: "",
          type: a.action === "points_added" ? "adjust" : "adjust",
          status: "completed",
          points: a.action === "points_added" ? (a.points ?? 0) : -(a.points ?? 0),
          description: a.note ?? a.reason,
          reference: a.id,
          occurredAt: a.occurredAt,
          channel: "api",
        }));

      const combined: LoyaltyTransaction[] = [...userTxns, ...adminEntries].sort(
        (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
      );

      let running = 0;
      const entries: LedgerEntry[] = combined.map((t) => {
        const opening = running;
        running += t.points;
        const isAdmin = adminEntries.some((a) => a.id === t.id);
        const baseEntry: LedgerEntry = {
          id: isAdmin ? `led_admin_${t.id}` : `led_txn_${t.id}`,
          userId: t.userId,
          points: t.points,
          type: mapTxnType(t, isAdmin),
          openingBalance: opening,
          closingBalance: running,
          source: isAdmin ? "admin" : t.channel,
          reference: t.reference,
          description: t.description,
          occurredAt: t.occurredAt,
          status: t.status,
        };
        if (isAdmin) {
          const admin = userAdmin.find((a) => a.id === t.id);
          if (admin) {
            baseEntry.actor = admin.actor;
            baseEntry.reason = admin.reason;
          }
        }
        return baseEntry;
      });

      // Newest first for display.
      return entries.reverse();
    },
    [adminActions]
  );

  const getRedemptions = React.useCallback(
    (userId: string) => {
      return MOCK_TRANSACTIONS.filter(
        (t) => t.userId === userId && t.type === "redeem"
      ).map((t) => ({
        id: t.id,
        rewardId: t.rewardId ?? "",
        rewardTitle: t.description.replace(/^Redeemed\s+—\s+/i, ""),
        rewardType: "redeem" as const,
        points: Math.abs(t.points),
        status: t.status === "completed" ? ("completed" as const) : t.status === "pending" ? ("pending" as const) : ("failed" as const),
        couponCode: t.reference,
        occurredAt: t.occurredAt,
        reference: t.reference,
      }));
    },
    []
  );

  // ─── KPIs ───────────────────────────────────────────────────────
  const kpis = React.useMemo<UsersKpis>(() => {
    const totalPoints = users.reduce((sum, u) => sum + u.pointsBalance, 0);
    const manuallyAdded = adminActions
      .filter((a) => a.action === "points_added")
      .reduce((sum, a) => sum + (a.points ?? 0), 0);
    const manuallyReversed = adminActions
      .filter((a) => a.action === "points_reversed")
      .reduce((sum, a) => sum + (a.points ?? 0), 0);
    const goldPlatinum = users.filter(
      (u) => u.tierId === "gold" || u.tierId === "platinum" || u.tierId === "diamond"
    ).length;
    const failedRedemptions = MOCK_TRANSACTIONS.filter(
      (t) => t.type === "redeem" && (t.status === "failed" || t.status === "reversed")
    ).length;

    return {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      locked: users.filter((u) => u.status === "locked").length,
      totalPointsBalance: totalPoints,
      manuallyAdded,
      manuallyReversed,
      goldPlatinum,
      failedRedemptions,
    };
  }, [users, adminActions]);

  const canEdit = role === "admin";
  const canExport = role === "admin" || role === "merchant";
  const isMerchantView = role === "merchant";

  // The visible users list is filtered upstream in the page; here we just
  // expose the raw list so the page can run its own filter pipeline.
  const visibleUsers = users;

  const value = React.useMemo<UsersContextValue>(
    () => ({
      users,
      adminActions,
      auditLog,
      lastRefreshedAt,
      isHydrated,
      visibleUsers,
      kpis,
      canEdit,
      canExport,
      isMerchantView,
      getLedger,
      getRedemptions,
      refresh,
      exportUsers,
      logProfileView,
      addPoints,
      reversePoints,
      lockUser,
      unlockUser,
      applyBulk,
      resetSession,
    }),
    [
      users,
      adminActions,
      auditLog,
      lastRefreshedAt,
      isHydrated,
      visibleUsers,
      kpis,
      canEdit,
      canExport,
      isMerchantView,
      getLedger,
      getRedemptions,
      refresh,
      exportUsers,
      logProfileView,
      addPoints,
      reversePoints,
      lockUser,
      unlockUser,
      applyBulk,
      resetSession,
    ]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers(): UsersContextValue {
  const ctx = React.useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within a UsersProvider");
  return ctx;
}

// ─── Internal helpers ─────────────────────────────────────────────────

function mapTxnType(
  txn: LoyaltyTransaction,
  isAdmin: boolean
): LedgerEntry["type"] {
  if (isAdmin) {
    if (txn.points > 0) return "adjustment";
    return "reversal";
  }
  switch (txn.type) {
    case "earn":
      return "earn";
    case "redeem":
      return "redeem";
    case "adjust":
      return "adjustment";
    case "expire":
      return "expire";
    case "bonus":
      return "bonus";
    default:
      return "earn";
  }
}

function buildUsersCsv(users: User[]): string {
  const header = [
    "Name",
    "NID",
    "MSISDN",
    "Wallet ID",
    "Email",
    "Tier",
    "Points balance",
    "Lifetime points",
    "Status",
    "Customer type",
    "City",
    "Country",
    "Joined",
    "Last activity",
  ];
  const rows = users.map((u) =>
    [
      u.fullName,
      u.nid,
      u.msisdn,
      u.walletId,
      u.email,
      u.tierId,
      String(u.pointsBalance),
      String(u.lifetimePoints),
      u.status,
      u.customerType,
      u.city,
      u.country,
      u.joinedAt,
      u.lastActivityAt,
    ]
      .map((cell) => {
        const value = String(cell ?? "");
        return value.includes(",") || value.includes("\"") || value.includes("\n")
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

// Note: statusBadgeTone is exported so drawer / table / filter chips can
// keep their status -> tone mapping consistent.
export { statusBadgeTone };
