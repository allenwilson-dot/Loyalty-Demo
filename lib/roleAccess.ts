/**
 * Role-based access helpers for the admin shell.
 *
 * Usage in a page:
 *   const { can } = useRoleAccess();
 *   <Button disabled={!can("write")} title={!can("write") ? "Viewer access — read only" : undefined}>
 *     Create
 *   </Button>
 */

import { useRole } from "@/components/layout/RoleProvider";
import type { RoleId } from "@/types/loyalty";

type Permission = "write" | "approve" | "export" | "manage_users" | "manage_api";

const ROLE_PERMISSIONS: Record<RoleId, ReadonlySet<Permission>> = {
  admin: new Set(["write", "approve", "export", "manage_users", "manage_api"]),
  merchant: new Set(["write", "export"]),       // can create/edit own vouchers, export
  viewer: new Set([]),                           // read-only
};

export function useRoleAccess() {
  const { role } = useRole();

  function can(permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].has(permission);
  }

  /** Returns a tooltip string explaining why the action is blocked, or undefined if allowed. */
  function blockedReason(permission: Permission): string | undefined {
    if (can(permission)) return undefined;
    if (role === "viewer") return "Viewer access — read only";
    if (role === "merchant") {
      if (permission === "manage_users") return "Merchant role cannot manage users";
      if (permission === "manage_api") return "Merchant role cannot configure API integrations";
      if (permission === "approve") return "Merchant role cannot approve or reject";
    }
    return "Your current role does not have permission for this action";
  }

  /** Returns props to spread onto a Button: disabled + title */
  function guardProps(permission: Permission): { disabled?: boolean; title?: string } {
    const reason = blockedReason(permission);
    if (!reason) return {};
    return { disabled: true, title: reason };
  }

  return { can, blockedReason, guardProps, role };
}
