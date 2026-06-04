"use client";

import * as React from "react";

import { getActiveRole, setActiveRole } from "@/lib/rbac";
import type { RoleId } from "@/types/loyalty";

interface RoleContextValue {
  role: RoleId;
  setRole: (role: RoleId) => void;
}

const RoleContext = React.createContext<RoleContextValue | null>(null);

/**
 * Provides the active role to the admin shell. The role is read from
 * localStorage on mount and persisted on every update.
 */
export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<RoleId>("admin");
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setRoleState(getActiveRole());
    setHydrated(true);
  }, []);

  const setRole = React.useCallback((next: RoleId) => {
    setRoleState(next);
    setActiveRole(next);
  }, []);

  const value = React.useMemo(
    () => ({ role, setRole }),
    [role, setRole]
  );

  return (
    <RoleContext.Provider value={value}>
      <div data-hydrated={hydrated ? "true" : "false"}>{children}</div>
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = React.useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
