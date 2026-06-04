"use client";

import * as React from "react";

import { MOCK_EARNING_RULES } from "@/data/mockEarningRules";
import { MOCK_USERS } from "@/data/mockUsers";
import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";
import { actorForRole, buildAuditEntry, loadAuditLog, nowIso, persistAuditLog } from "@/lib/audit";
import {
  evaluateEarnEvent,
  isDuplicateReference,
  projectEarnEvent,
  ruleMatchesEvent,
} from "@/lib/loyaltyEngine";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import {
  cn,
  formatCompact,
  formatNumber,
  formatDate,
  formatDateTime,
} from "@/lib/utils";
import type {
  AdminAuditEntry,
  EarnEvent,
  EarnEventResult,
  EarningEventName,
  EarningRule,
  EarningRuleStatus,
  EarningServiceSource,
  EarningTransactionType,
  EarningUserType,
  LoyaltyTransaction,
  RoleId,
} from "@/types/loyalty";

import { useRole } from "@/components/layout/RoleProvider";

// ─── Types ────────────────────────────────────────────────────────────

export interface EarningRuleFormInput {
  serviceSource: EarningServiceSource;
  userType: EarningUserType;
  transactionType: EarningTransactionType;
  eventName: EarningEventName;
  customEventName: string;
  rewardType: "POINT" | "PERCENT";
  rewardValue: number;
  maximumTransactionAmount: number;
  expiryDays: number;
  pushNotification: boolean;
  notificationMessage: string;
  status: EarningRuleStatus;
  notes: string;
}

export interface EarningRuleMutationResult {
  ok: boolean;
  message?: string;
  rule?: EarningRule;
}

export interface ApplyEarnEventResult extends EarnEventResult {
  userId: string;
  userName: string;
  ruleId?: string;
  newBalance?: number;
}

export interface EarningRulesState {
  rules: EarningRule[];
  processedRefs: string[];
  testEvents: EarnEvent[];
  testUserBalances: Record<string, number>;
  lastRefreshedAt: string;
  isHydrated: boolean;
}

export interface EarningRulesActions {
  refresh: () => void;
  exportRules: (visible: EarningRule[]) => void;
  createRule: (input: EarningRuleFormInput) => EarningRuleMutationResult;
  updateRule: (id: string, input: EarningRuleFormInput) => EarningRuleMutationResult;
  activateRule: (id: string, reason: string) => EarningRuleMutationResult;
  deactivateRule: (id: string, reason: string) => EarningRuleMutationResult;
  logRuleView: (id: string) => void;
  /**
   * Pure projection: returns the result without mutating state.
   */
  testEarnEvent: (event: EarnEvent) => EarnEventResult;
  /**
   * Applies the event, credits the user, and writes audit + transaction
   * records. Returns a richer result for the UI.
   */
  applyEarnEvent: (event: EarnEvent) => ApplyEarnEventResult;
  resetSession: () => void;
}

export interface EarningRulesContextValue extends EarningRulesState, EarningRulesActions {
  visibleRules: EarningRule[];
  kpis: EarningRulesKpis;
  canEdit: boolean;
  canExport: boolean;
  canApplyEvents: boolean;
  /** Returns the earn events matched by the supplied rule. */
  eventsForRule: (id: string) => Array<{
    transaction: LoyaltyTransaction;
    points: number;
    matchedAt: string;
  }>;
  /** Returns the total points issued through a given rule. */
  totalPointsForRule: (id: string) => number;
  /** Returns true if creating/updating a rule with the supplied values would duplicate another active rule. */
  detectDuplicate: (input: EarningRuleFormInput, excludeId?: string) => EarningRule | null;
}

export interface EarningRulesKpis {
  total: number;
  active: number;
  inactive: number;
  transactional: number;
  nonTransactional: number;
  selfcare: number;
  moolee: number;
  mfaisaa: number;
  withExpiry: number;
}

const EarningRulesContext = React.createContext<EarningRulesContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────

function newRuleId(): string {
  return `ern_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function buildRuleFromInput(
  input: EarningRuleFormInput,
  existing: EarningRule | null
): EarningRule {
  return {
    id: existing?.id ?? newRuleId(),
    serviceSource: input.serviceSource,
    userType: input.userType,
    transactionType: input.transactionType,
    eventName: input.eventName,
    customEventName:
      input.eventName === "Custom Event" && input.customEventName.trim()
        ? input.customEventName.trim()
        : undefined,
    rewardType: input.rewardType,
    rewardValue: input.rewardValue,
    maximumTransactionAmount:
      input.maximumTransactionAmount > 0
        ? input.maximumTransactionAmount
        : undefined,
    expiryDays: input.expiryDays > 0 ? input.expiryDays : undefined,
    pushNotification: input.pushNotification,
    notificationMessage: input.pushNotification
      ? input.notificationMessage
      : undefined,
    status: input.status,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    notes: input.notes.trim() || undefined,
  };
}

function validateInput(
  input: EarningRuleFormInput,
  rules: EarningRule[],
  excludeId?: string
): { ok: true } | { ok: false; message: string } {
  if (!input.serviceSource) {
    return { ok: false, message: "Service source is required." };
  }
  if (input.serviceSource === "SELFCARE" && !input.userType) {
    return { ok: false, message: "User type is required for SELFCARE rules." };
  }
  if (!input.transactionType) {
    return { ok: false, message: "Transaction type is required." };
  }
  if (!input.eventName) {
    return { ok: false, message: "Event name is required." };
  }
  if (input.eventName === "Custom Event" && !input.customEventName.trim()) {
    return { ok: false, message: "Custom event name is required." };
  }
  if (!input.rewardType) {
    return { ok: false, message: "Reward type is required." };
  }
  if (!Number.isFinite(input.rewardValue) || input.rewardValue <= 0) {
    return { ok: false, message: "Reward value must be greater than 0." };
  }
  if (input.rewardType === "PERCENT" && input.rewardValue > 100) {
    return { ok: false, message: "Percent reward cannot exceed 100." };
  }
  if (
    input.maximumTransactionAmount &&
    (!Number.isFinite(input.maximumTransactionAmount) ||
      input.maximumTransactionAmount < 0)
  ) {
    return { ok: false, message: "Maximum transaction amount must be 0 or higher." };
  }
  if (input.expiryDays && (!Number.isFinite(input.expiryDays) || input.expiryDays < 0)) {
    return { ok: false, message: "Expiry days must be 0 or higher." };
  }
  if (input.pushNotification && !input.notificationMessage.trim()) {
    return {
      ok: false,
      message: "Notification message is required when push notifications are enabled.",
    };
  }
  // Duplicate active rule guard.
  const duplicate = rules.find((r) => {
    if (excludeId && r.id === excludeId) return false;
    if (r.status !== "ACTIVE") return false;
    if (r.serviceSource !== input.serviceSource) return false;
    const effectiveUserType = input.serviceSource === "SELFCARE" ? input.userType : "ALL";
    if (r.userType !== effectiveUserType) return false;
    if (r.transactionType !== input.transactionType) return false;
    if (r.eventName !== input.eventName) return false;
    if (input.eventName === "Custom Event") {
      const left = (r.customEventName ?? "").toLowerCase();
      const right = input.customEventName.trim().toLowerCase();
      if (left !== right) return false;
    }
    return true;
  });
  if (duplicate) {
    return {
      ok: false,
      message: `An active rule already exists for this combination (${duplicate.id}).`,
    };
  }
  return { ok: true };
}

function buildRulesCsv(rules: EarningRule[]): string {
  const header = [
    "Rule ID",
    "Service source",
    "User type",
    "Transaction type",
    "Event name",
    "Custom event name",
    "Reward type",
    "Reward value",
    "Max transaction amount",
    "Expiry days",
    "Push notification",
    "Notification message",
    "Status",
    "Created at",
    "Updated at",
  ];
  const rows = rules.map((r) =>
    [
      r.id,
      r.serviceSource,
      r.userType,
      r.transactionType,
      r.eventName,
      r.customEventName ?? "",
      r.rewardType,
      String(r.rewardValue),
      r.maximumTransactionAmount !== undefined ? String(r.maximumTransactionAmount) : "",
      r.expiryDays !== undefined ? String(r.expiryDays) : "",
      r.pushNotification ? "ENABLED" : "DISABLED",
      r.notificationMessage ?? "",
      r.status,
      r.createdAt,
      r.updatedAt,
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

function eventMatchesRule(rule: EarningRule, txn: LoyaltyTransaction): boolean {
  if (txn.type !== "earn" && txn.type !== "bonus") return false;
  if (txn.status !== "completed") return false;
  const sourceMap: Record<string, EarningServiceSource> = {
    selfcare: "SELFCARE",
    moolee: "MOOLEE",
    mfaisaa: "MFAISAA",
  };
  const expectedSource = sourceMap[txn.channel];
  if (!expectedSource) return false;
  if (expectedSource !== rule.serviceSource) return false;
  // Build an EarnEvent-shaped object so ruleMatchesEvent can apply the
  // event-name logic.
  const description = txn.description.toLowerCase();
  const nameMap: Array<[EarningEventName, RegExp]> = [
    ["Recharge", /recharge|top-?up|topup/],
    ["Data Pack Purchase", /data pack/],
    ["Moolee Purchase", /moolee/],
    ["Wallet Payment", /wallet payment|bill payment/],
    ["Wallet Top-Up", /wallet top|top-?up/],
    ["Bill Payment", /bill payment|electricity|water/],
    ["First Transaction", /first transaction/],
    ["Login Streak", /login streak/],
    ["Campaign Bonus", /campaign|bonus/],
    ["Referral Bonus", /referral/],
    ["Profile Completion", /profile/],
  ];
  const matchedName = nameMap.find(([, re]) => re.test(description))?.[0];
  if (!matchedName) return false;
  if (matchedName !== rule.eventName) return false;
  if (rule.eventName === "Custom Event" && rule.customEventName) {
    if (!description.includes(rule.customEventName.toLowerCase())) return false;
  }
  return true;
}

function buildKpis(rules: EarningRule[]): EarningRulesKpis {
  return {
    total: rules.length,
    active: rules.filter((r) => r.status === "ACTIVE").length,
    inactive: rules.filter((r) => r.status === "INACTIVE").length,
    transactional: rules.filter((r) => r.transactionType === "TRANSACTIONAL").length,
    nonTransactional: rules.filter((r) => r.transactionType === "NON_TRANSACTIONAL").length,
    selfcare: rules.filter((r) => r.serviceSource === "SELFCARE").length,
    moolee: rules.filter((r) => r.serviceSource === "MOOLEE").length,
    mfaisaa: rules.filter((r) => r.serviceSource === "MFAISAA").length,
    withExpiry: rules.filter((r) => typeof r.expiryDays === "number").length,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────

export function EarningRulesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useRole();
  const [rules, setRules] = React.useState<EarningRule[]>(() =>
    MOCK_EARNING_RULES.map((r) => ({ ...r }))
  );
  const [processedRefs, setProcessedRefs] = React.useState<string[]>([]);
  const [testEvents, setTestEvents] = React.useState<EarnEvent[]>([]);
  const [testUserBalances, setTestUserBalances] = React.useState<Record<string, number>>({});
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<string>(nowIso());
  const [isHydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = readStorage<EarningRule[] | null>(
      StorageKeys.adminEarningRules,
      null
    );
    if (stored && stored.length > 0) {
      const merged = MOCK_EARNING_RULES.map((seed) => {
        const override = stored.find((r) => r.id === seed.id);
        return override ? { ...seed, ...override } : seed;
      });
      const known = new Set(MOCK_EARNING_RULES.map((r) => r.id));
      const extras = stored.filter((r) => !known.has(r.id)).map((r) => ({ ...r }));
      setRules([...merged, ...extras]);
    }
    setProcessedRefs(
      readStorage<string[] | null>(StorageKeys.processedEarnReferences, null) ?? []
    );
    setTestEvents(readStorage<EarnEvent[] | null>(StorageKeys.testEarnEvents, null) ?? []);
    setTestUserBalances(
      readStorage<Record<string, number> | null>(StorageKeys.testEarnUserBalances, null) ?? {}
    );
    const refreshed = readStorage<string | null>(
      StorageKeys.earningRulesLastRefreshed,
      null
    );
    if (refreshed) setLastRefreshedAt(refreshed);
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.adminEarningRules, rules);
  }, [rules, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.processedEarnReferences, processedRefs);
  }, [processedRefs, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.testEarnEvents, testEvents);
  }, [testEvents, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.testEarnUserBalances, testUserBalances);
  }, [testUserBalances, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.earningRulesLastRefreshed, lastRefreshedAt);
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
      module: "Earning Rules",
      action: "EARNING_RULE_REFRESH",
      status: "info",
      details: "Refreshed earning rule configuration.",
    });
  }, [appendAudit]);

  const exportRules = React.useCallback(
    (visible: EarningRule[]) => {
      const csv = buildRulesCsv(visible);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`earning-rules-${stamp}.csv`, csv);
      appendAudit({
        module: "Earning Rules",
        action: "EARNING_RULE_EXPORT",
        status: "success",
        details: `Exported ${visible.length} earning rule(s) as CSV.`,
        target: `earning-rules-${visible.length}`,
      });
    },
    [appendAudit]
  );

  const logRuleView = React.useCallback(
    (id: string) => {
      appendAudit({
        module: "Earning Rules",
        action: "EARNING_RULE_VIEWED",
        status: "info",
        details: "Opened earning rule detail drawer.",
        target: id,
      });
    },
    [appendAudit]
  );

  const createRule = React.useCallback(
    (input: EarningRuleFormInput): EarningRuleMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can create earning rules." };
      }
      const validation = validateInput(input, rules);
      if (!validation.ok) return validation;
      const rule = buildRuleFromInput(input, null);
      setRules((prev) => [rule, ...prev]);
      appendAudit({
        module: "Earning Rules",
        action: "EARNING_RULE_CREATED",
        status: "success",
        details: `Created earning rule ${rule.id} (${rule.serviceSource} · ${rule.eventName}).`,
        target: rule.id,
      });
      return { ok: true, rule };
    },
    [rules, role, appendAudit]
  );

  const updateRule = React.useCallback(
    (id: string, input: EarningRuleFormInput): EarningRuleMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can edit earning rules." };
      }
      const existing = rules.find((r) => r.id === id);
      if (!existing) {
        return { ok: false, message: "Rule not found." };
      }
      const validation = validateInput(input, rules, id);
      if (!validation.ok) return validation;
      const rule = buildRuleFromInput(input, existing);
      setRules((prev) => prev.map((r) => (r.id === id ? rule : r)));
      appendAudit({
        module: "Earning Rules",
        action: "EARNING_RULE_UPDATED",
        status: "success",
        details: `Updated earning rule ${rule.id}.`,
        target: rule.id,
      });
      return { ok: true, rule };
    },
    [rules, role, appendAudit]
  );

  const activateRule = React.useCallback(
    (id: string, reason: string): EarningRuleMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change rule status." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "A reason is required." };
      }
      const existing = rules.find((r) => r.id === id);
      if (!existing) {
        return { ok: false, message: "Rule not found." };
      }
      // Reuse validation but as a duplicate check on the new active state.
      const probe: EarningRuleFormInput = {
        serviceSource: existing.serviceSource,
        userType: existing.userType,
        transactionType: existing.transactionType,
        eventName: existing.eventName,
        customEventName: existing.customEventName ?? "",
        rewardType: existing.rewardType,
        rewardValue: existing.rewardValue,
        maximumTransactionAmount: existing.maximumTransactionAmount ?? 0,
        expiryDays: existing.expiryDays ?? 0,
        pushNotification: existing.pushNotification,
        notificationMessage: existing.notificationMessage ?? "",
        status: "ACTIVE",
        notes: existing.notes ?? "",
      };
      const validation = validateInput(probe, rules, id);
      if (!validation.ok) return validation;
      setRules((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "ACTIVE", updatedAt: nowIso() } : r
        )
      );
      appendAudit({
        module: "Earning Rules",
        action: "EARNING_RULE_ACTIVATED",
        status: "success",
        details: `Activated ${existing.id}. Reason: ${reason.trim()}.`,
        target: id,
      });
      return { ok: true, rule: existing };
    },
    [rules, role, appendAudit]
  );

  const deactivateRule = React.useCallback(
    (id: string, reason: string): EarningRuleMutationResult => {
      if (role !== "admin") {
        return { ok: false, message: "Only admins can change rule status." };
      }
      if (!reason.trim()) {
        return { ok: false, message: "A reason is required." };
      }
      const existing = rules.find((r) => r.id === id);
      if (!existing) {
        return { ok: false, message: "Rule not found." };
      }
      setRules((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "INACTIVE", updatedAt: nowIso() } : r
        )
      );
      appendAudit({
        module: "Earning Rules",
        action: "EARNING_RULE_DEACTIVATED",
        status: "warning",
        details: `Deactivated ${existing.id}. Reason: ${reason.trim()}.`,
        target: id,
      });
      return { ok: true, rule: existing };
    },
    [rules, role, appendAudit]
  );

  const testEarnEvent = React.useCallback(
    (event: EarnEvent): EarnEventResult => {
      const result = projectEarnEvent(event, rules, processedRefs);
      appendAudit({
        module: "Earning Rules",
        action: "EARNING_RULE_TESTED",
        status: result.status === "applied" ? "success" : "info",
        details: `Tested earn event for ${event.serviceSource} · ${event.eventName} (${event.referenceId}). Result: ${result.status}.`,
        target: event.referenceId,
      });
      return result;
    },
    [rules, processedRefs, appendAudit]
  );

  const applyEarnEvent = React.useCallback(
    (event: EarnEvent): ApplyEarnEventResult => {
      if (role !== "admin") {
        return {
          status: "invalid",
          message: "Only admins can apply earn events.",
          points: 0,
          userId: event.userId,
          userName: "",
        };
      }
      if (isDuplicateReference(event.referenceId, processedRefs)) {
        appendAudit({
          module: "Earning Rules",
          action: "EARN_EVENT_DUPLICATE_BLOCKED",
          status: "warning",
          details: `Duplicate event reference ${event.referenceId} blocked.`,
          target: event.referenceId,
        });
        return {
          status: "duplicate",
          message: "Duplicate event ignored. Points were not credited again.",
          points: 0,
          userId: event.userId,
          userName:
            MOCK_USERS.find((u) => u.id === event.userId)?.fullName ?? "",
        };
      }
      const match = evaluateEarnEvent(event, rules, processedRefs);
      if (match.status === "no_rule" || !match.rule) {
        appendAudit({
          module: "Earning Rules",
          action: "EARN_EVENT_NO_RULE_FOUND",
          status: "warning",
          details: `No active rule found for ${event.serviceSource} · ${event.eventName} (${event.referenceId}).`,
          target: event.referenceId,
        });
        return {
          status: "no_rule",
          message: "No active matching rule found for this event.",
          points: 0,
          userId: event.userId,
          userName:
            MOCK_USERS.find((u) => u.id === event.userId)?.fullName ?? "",
        };
      }
      if (match.status === "invalid" || match.points <= 0) {
        return {
          status: "invalid",
          message: "Rule matched but produced zero points for this event.",
          points: 0,
          userId: event.userId,
          userName:
            MOCK_USERS.find((u) => u.id === event.userId)?.fullName ?? "",
          rule: match.rule,
        };
      }
      // Apply: credit points, record transaction + audit, mark ref processed.
      const user = MOCK_USERS.find((u) => u.id === event.userId);
      if (!user) {
        return {
          status: "invalid",
          message: "Selected user not found.",
          points: 0,
          userId: event.userId,
          userName: "",
        };
      }
      const previousBalance =
        testUserBalances[user.id] !== undefined
          ? testUserBalances[user.id]
          : user.pointsBalance;
      const newBalance = previousBalance + match.points;
      setTestUserBalances((prev) => ({ ...prev, [user.id]: newBalance }));
      setProcessedRefs((prev) =>
        prev.includes(event.referenceId) ? prev : [...prev, event.referenceId]
      );
      const storedEvent: EarnEvent = {
        ...event,
        id: `tev_${Date.now().toString(36)}_${Math.random()
          .toString(36)
          .slice(2, 5)
          .toUpperCase()}`,
        occurredAt: nowIso(),
      };
      setTestEvents((prev) => [storedEvent, ...prev].slice(0, 60));
      appendAudit({
        module: "Earning Rules",
        action: "EARN_EVENT_APPLIED",
        status: "success",
        details: `Applied earn event for ${user.fullName}: +${match.points} pts via rule ${match.rule.id} (${event.referenceId}).`,
        target: `${user.id}->${match.rule.id}`,
      });
      return {
        status: "applied",
        message: `Credited ${formatNumber(match.points)} pts to ${user.fullName}.`,
        points: match.points,
        userId: user.id,
        userName: user.fullName,
        rule: match.rule,
        ruleId: match.rule.id,
        newBalance,
        expiryDate: match.expiryDate,
      };
    },
    [rules, processedRefs, testUserBalances, role, appendAudit]
  );

  const resetSession = React.useCallback(() => {
    setRules(MOCK_EARNING_RULES.map((r) => ({ ...r })));
    setProcessedRefs([]);
    setTestEvents([]);
    setTestUserBalances({});
    setLastRefreshedAt(nowIso());
  }, []);

  const eventsForRule = React.useCallback(
    (id: string) => {
      const rule = rules.find((r) => r.id === id);
      if (!rule) return [];
      const matches = MOCK_TRANSACTIONS.filter((t) => eventMatchesRule(rule, t));
      const testMatches = testEvents
        .filter((e) => ruleMatchesEvent(rule, e))
        .map((e) => {
          const transaction: LoyaltyTransaction = {
            id: e.id,
            userId: e.userId,
            userName:
              MOCK_USERS.find((u) => u.id === e.userId)?.fullName ?? "",
            type: "earn",
            status: "completed",
            points: 0,
            description: e.customEventName ?? e.eventName,
            reference: e.referenceId,
            occurredAt: e.occurredAt,
            channel:
              e.serviceSource === "SELFCARE"
                ? "selfcare"
                : e.serviceSource === "MOOLEE"
                ? "moolee"
                : e.serviceSource === "MFAISAA"
                ? "mfaisaa"
                : "api",
          };
          // Look up the points from the matching test event's stored
          // record by reading the latest applied event in the testEvents
          // list — applyEarnEvent doesn't push LoyaltyTransactions
          // directly, so the points come from the projection.
          const projectedPoints = (() => {
            const probe: EarnEvent = e;
            const points = rule.rewardType === "POINT"
              ? rule.rewardValue
              : Math.round(
                  (Math.min(e.amount, rule.maximumTransactionAmount ?? e.amount) *
                    rule.rewardValue) /
                    100
                );
            return points;
          })();
          return {
            transaction: { ...transaction, points: projectedPoints },
            points: projectedPoints,
            matchedAt: e.occurredAt,
          };
        });
      return [
        ...matches.map((t) => ({
          transaction: t,
          points: t.points,
          matchedAt: t.occurredAt,
        })),
        ...testMatches,
      ]
        .sort(
          (a, b) =>
            new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
        )
        .slice(0, 12);
    },
    [rules, testEvents]
  );

  const totalPointsForRule = React.useCallback(
    (id: string) => {
      return eventsForRule(id).reduce((sum, e) => sum + e.points, 0);
    },
    [eventsForRule]
  );

  const detectDuplicate = React.useCallback(
    (input: EarningRuleFormInput, excludeId?: string) => {
      const validation = validateInput(input, rules, excludeId);
      if (validation.ok) return null;
      const match = rules.find((r) => r.id !== excludeId && r.status === "ACTIVE");
      return match ?? null;
    },
    [rules]
  );

  const visibleRules = React.useMemo(
    () => [...rules].sort((a, b) => a.id.localeCompare(b.id)),
    [rules]
  );

  const kpis = React.useMemo(() => buildKpis(visibleRules), [visibleRules]);

  const canEdit = role === "admin";
  const canExport = role === "admin" || role === "merchant";
  const canApplyEvents = role === "admin";

  const value = React.useMemo<EarningRulesContextValue>(
    () => ({
      rules,
      processedRefs,
      testEvents,
      testUserBalances,
      lastRefreshedAt,
      isHydrated,
      visibleRules,
      kpis,
      canEdit,
      canExport,
      canApplyEvents,
      eventsForRule,
      totalPointsForRule,
      detectDuplicate,
      refresh,
      exportRules,
      createRule,
      updateRule,
      activateRule,
      deactivateRule,
      logRuleView,
      testEarnEvent,
      applyEarnEvent,
      resetSession,
    }),
    [
      rules,
      processedRefs,
      testEvents,
      testUserBalances,
      lastRefreshedAt,
      isHydrated,
      visibleRules,
      kpis,
      canEdit,
      canExport,
      canApplyEvents,
      eventsForRule,
      totalPointsForRule,
      detectDuplicate,
      refresh,
      exportRules,
      createRule,
      updateRule,
      activateRule,
      deactivateRule,
      logRuleView,
      testEarnEvent,
      applyEarnEvent,
      resetSession,
    ]
  );

  return (
    <EarningRulesContext.Provider value={value}>
      {children}
    </EarningRulesContext.Provider>
  );
}

export function useEarningRules(): EarningRulesContextValue {
  const ctx = React.useContext(EarningRulesContext);
  if (!ctx) {
    throw new Error("useEarningRules must be used within an EarningRulesProvider");
  }
  return ctx;
}
