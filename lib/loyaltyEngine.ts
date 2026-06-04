import type {
  EarningEventName,
  EarningRule,
  EarnEvent,
  EarnEventResult,
  EarnEventResultStatus,
} from "@/types/loyalty";

// ─── Pure rule evaluation helpers ──────────────────────────────────────

/**
 * Returns true when a rule's configuration matches the supplied event.
 * Honours service source, transaction type, event name, and the SELFCARE
 * user-type guard. Custom events require the customEventName to match.
 */
export function ruleMatchesEvent(rule: EarningRule, event: EarnEvent): boolean {
  if (rule.serviceSource !== event.serviceSource) return false;
  if (rule.transactionType !== event.transactionType) return false;
  if (rule.eventName !== event.eventName) return false;
  if (event.eventName === "Custom Event") {
    if (
      !event.customEventName ||
      !rule.customEventName ||
      event.customEventName.toLowerCase() !== rule.customEventName.toLowerCase()
    ) {
      return false;
    }
  }
  if (event.serviceSource === "SELFCARE") {
    if (rule.userType !== "ALL" && rule.userType !== event.userType) {
      return false;
    }
    if (event.userType === "ALL" && rule.userType !== "ALL") {
      return false;
    }
  }
  return true;
}

/**
 * Calculates the loyalty points a rule would award for the supplied
 * transaction amount. Returns 0 for inactive rules or rules that don't
 * match the event.
 */
export function calculateEarnPoints(
  rule: EarningRule,
  event: EarnEvent
): number {
  if (rule.status !== "ACTIVE") return 0;
  if (!ruleMatchesEvent(rule, event)) return 0;
  if (rule.rewardType === "POINT") {
    return Math.max(0, Math.round(rule.rewardValue));
  }
  // PERCENT
  const amountCap = rule.maximumTransactionAmount ?? event.amount;
  const effective = Math.max(0, Math.min(event.amount, amountCap));
  return Math.max(0, Math.round((effective * rule.rewardValue) / 100));
}

/**
 * Returns the first ACTIVE rule matching the supplied event. Falls back
 * to null when no rule applies. Other rules with the same shape but
 * different reward values are ignored — the first match wins.
 */
export function findMatchingEarningRule(
  rules: EarningRule[],
  event: EarnEvent
): EarningRule | null {
  for (const rule of rules) {
    if (rule.status !== "ACTIVE") continue;
    if (ruleMatchesEvent(rule, event)) return rule;
  }
  return null;
}

/**
 * Detects whether an event would be a duplicate of any already-processed
 * reference id. The processedRefs array is the runtime state of the
 * earning rules module.
 */
export function isDuplicateReference(
  referenceId: string,
  processedRefs: string[]
): boolean {
  if (!referenceId.trim()) return false;
  return processedRefs.includes(referenceId.trim());
}

/**
 * Adds days to an ISO date and returns the new ISO timestamp.
 */
export function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Returns the displayed event label — uses the customEventName override
 * for custom events, otherwise returns the canonical event name.
 */
export function eventDisplayName(
  eventName: EarningEventName,
  customName?: string
): string {
  if (eventName === "Custom Event" && customName) return customName;
  return eventName;
}

// ─── Higher-level result helpers ───────────────────────────────────────

/**
 * Wraps calculateEarnPoints and findMatchingEarningRule into a single
 * pure call. Use this when the caller already has the rules list and
 * the event payload. processEarnEvent wraps this with persistence and
 * audit writes.
 */
export interface EarnEventMatch {
  status: EarnEventResultStatus;
  message: string;
  points: number;
  rule: EarningRule | null;
  expiryDate?: string;
}

export function evaluateEarnEvent(
  event: EarnEvent,
  rules: EarningRule[],
  processedRefs: string[]
): EarnEventMatch {
  if (isDuplicateReference(event.referenceId, processedRefs)) {
    return {
      status: "duplicate",
      message:
        "Duplicate event ignored. Points were not credited again for this reference id.",
      points: 0,
      rule: null,
    };
  }
  const rule = findMatchingEarningRule(rules, event);
  if (!rule) {
    return {
      status: "no_rule",
      message: "No active matching rule found for this event.",
      points: 0,
      rule: null,
    };
  }
  const points = calculateEarnPoints(rule, event);
  if (points <= 0) {
    return {
      status: "invalid",
      message: "Rule matched but produced zero points for this event.",
      points: 0,
      rule,
    };
  }
  return {
    status: "applied",
    message: "Event matches an active rule.",
    points,
    rule,
    expiryDate: rule.expiryDays ? addDays(event.occurredAt, rule.expiryDays) : undefined,
  };
}

/**
 * Used by the back-office test simulator to project how a transaction
 * would be processed without mutating any state.
 */
export function projectEarnEvent(
  event: EarnEvent,
  rules: EarningRule[],
  processedRefs: string[]
): EarnEventResult {
  const result = evaluateEarnEvent(event, rules, processedRefs);
  return {
    status: result.status,
    message: result.message,
    points: result.points,
    rule: result.rule ?? undefined,
    expiryDate: result.expiryDate,
  };
}
