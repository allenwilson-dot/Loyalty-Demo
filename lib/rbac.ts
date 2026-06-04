import type { Role, RoleId } from "@/types/loyalty";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";

/**
 * Modules in the back-office sidebar. Keeping them in one place ensures the
 * sidebar, routing, and access checks all stay in lockstep.
 */
export const MODULES = [
  "dashboard",
  "users",
  "tiers",
  "earning-rules",
  "merchants",
  "vouchers",
  "api-config",
  "redemption-config",
  "reports",
  "audit",
  "roles",
] as const;

export type ModuleId = (typeof MODULES)[number];

export const MODULE_META: Record<ModuleId, { label: string; href: string; description: string }> = {
  dashboard: {
    label: "Dashboard",
    href: "/admin/dashboard",
    description: "Operational health, KPIs, and recent activity.",
  },
  users: {
    label: "User Management",
    href: "/admin/users",
    description: "Search, view, and manage loyalty members.",
  },
  tiers: {
    label: "Tier Management",
    href: "/admin/tiers",
    description: "Configure tier thresholds, multipliers, and perks.",
  },
  "earning-rules": {
    label: "Earning Rules",
    href: "/admin/earning-rules",
    description: "Define how members earn points across channels.",
  },
  merchants: {
    label: "Merchant Onboarding",
    href: "/admin/merchants",
    description: "Onboard and verify partner merchants.",
  },
  vouchers: {
    label: "Voucher Management",
    href: "/admin/vouchers",
    description: "Issue, track, and retire reward vouchers.",
  },
  "api-config": {
    label: "API Configuration",
    href: "/admin/api-config",
    description: "API keys, webhooks, and partner integrations.",
  },
  "redemption-config": {
    label: "Redemption Configuration",
    href: "/admin/redemption-config",
    description: "Configure redemption campaigns and eligibility rules.",
  },
  reports: {
    label: "Reports",
    href: "/admin/reports",
    description: "Exports and analytics across the program.",
  },
  audit: {
    label: "Audit Logs",
    href: "/admin/audit",
    description: "Tamper-evident log of administrative actions.",
  },
  roles: {
    label: "Roles & Access",
    href: "/admin/roles",
    description: "Manage roles, permissions, and access policies.",
  },
};

export const ROLES: Role[] = [
  {
    id: "admin",
    label: "Administrator",
    description: "Full access to all loyalty modules and configuration.",
  },
  {
    id: "merchant",
    label: "Merchant",
    description: "Read-only program data plus voucher and audit access.",
  },
  {
    id: "viewer",
    label: "Viewer",
    description: "Limited read access to dashboard and reports.",
  },
];

/**
 * Module allow-list per role. Anything not listed is denied.
 */
const ACCESS_MATRIX: Record<RoleId, ReadonlyArray<ModuleId>> = {
  admin: MODULES,
  merchant: ["dashboard", "vouchers", "reports", "audit"],
  viewer: ["dashboard", "reports"],
};

export function canAccess(role: RoleId, module: ModuleId): boolean {
  return ACCESS_MATRIX[role].includes(module);
}

export function getAccessibleModules(role: RoleId): ModuleId[] {
  return [...ACCESS_MATRIX[role]];
}

export function getRole(roleId: RoleId): Role {
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) {
    throw new Error(`Unknown role "${roleId}"`);
  }
  return role;
}

export function getActiveRole(): RoleId {
  const stored = readStorage<RoleId | null>(StorageKeys.activeRole, null);
  if (stored && ROLES.some((r) => r.id === stored)) return stored;
  return "admin";
}

export function setActiveRole(role: RoleId): void {
  writeStorage(StorageKeys.activeRole, role);
}
