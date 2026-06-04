import { MOCK_AUDIT_LOG } from "@/data/mockReports";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import type { AdminAuditEntry, RoleId } from "@/types/loyalty";

/**
 * Shared admin audit log utility. Backed by a single `adminAudit` key in
 * localStorage so the dashboard and the user management module both write
 * to the same trail.
 *
 * The store is capped at 200 entries; older entries fall off the end.
 */
const MAX_ENTRIES = 200;

export function loadAuditLog(): AdminAuditEntry[] {
  const stored = readStorage<AdminAuditEntry[] | null>(StorageKeys.adminAudit, null);
  if (stored && stored.length > 0) return stored;
  return MOCK_AUDIT_LOG;
}

export function persistAuditLog(entries: AdminAuditEntry[]): void {
  const trimmed = entries.slice(0, MAX_ENTRIES);
  writeStorage(StorageKeys.adminAudit, trimmed);
}

let cachedCounter = 0;

function buildAuditId(): string {
  cachedCounter += 1;
  return `aud_${Date.now().toString(36)}_${cachedCounter
    .toString(36)
    .padStart(3, "0")
    .toUpperCase()}`;
}

/** Returns an ISO timestamp for new audit entries. */
export function nowIso(): string {
  return new Date().toISOString();
}

export interface AppendAuditInput {
  module: string;
  action: AdminAuditEntry["action"];
  status: AdminAuditEntry["status"];
  details: string;
  actor?: string;
  role: RoleId;
  target?: string;
}

const ACTOR_BY_ROLE: Record<RoleId, string> = {
  admin: "amelia.chen@loyaltyco.com",
  merchant: "marcus.patel@loyaltyco.com",
  viewer: "sofia.rossi@loyaltyco.com",
};

/**
 * Builds a fresh `AdminAuditEntry` from the supplied input. The caller is
 * responsible for inserting the entry into the persisted log.
 */
export function buildAuditEntry(input: AppendAuditInput): AdminAuditEntry {
  return {
    id: buildAuditId(),
    occurredAt: nowIso(),
    actor: input.actor ?? ACTOR_BY_ROLE[input.role],
    role: input.role,
    module: input.module,
    action: input.action,
    status: input.status,
    details: input.details,
    target: input.target,
  };
}

export function actorForRole(role: RoleId): string {
  return ACTOR_BY_ROLE[role];
}
