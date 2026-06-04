"use client";

import * as React from "react";
import {
  ShieldCheck, Check, X, Eye, Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { ROLES, MODULES, MODULE_META, canAccess } from "@/lib/rbac";
import { useRole } from "@/components/layout/RoleProvider";
import type { ModuleId } from "@/lib/rbac";
import type { RoleId } from "@/types/loyalty";

const ROLE_ICONS: Record<RoleId, React.ReactNode> = {
  admin: <ShieldCheck className="h-5 w-5 text-blue-600" />,
  merchant: <Store className="h-5 w-5 text-violet-600" />,
  viewer: <Eye className="h-5 w-5 text-slate-500" />,
};

const ROLE_COLORS: Record<RoleId, string> = {
  admin: "border-blue-200 bg-blue-50",
  merchant: "border-violet-200 bg-violet-50",
  viewer: "border-slate-200 bg-slate-50",
};

const ROLE_BADGE: Record<RoleId, string> = {
  admin: "bg-blue-100 text-blue-700",
  merchant: "bg-violet-100 text-violet-700",
  viewer: "bg-slate-100 text-slate-600",
};

const ROLE_DESCRIPTIONS: Record<RoleId, { headline: string; capabilities: string[] }> = {
  admin: {
    headline: "Full access to all modules and configuration.",
    capabilities: [
      "Configure earning rules, tiers, and campaigns",
      "Onboard and manage merchants",
      "Manage API configurations",
      "Add, reverse, or lock user points",
      "Export all reports and audit logs",
      "Manage roles and access policies",
    ],
  },
  merchant: {
    headline: "Voucher and reporting access scoped to own merchant.",
    capabilities: [
      "View loyalty dashboard (read-only)",
      "Create and manage own vouchers",
      "View own redemption reports",
      "Read audit logs",
    ],
  },
  viewer: {
    headline: "Read-only access to dashboard and reports.",
    capabilities: [
      "View loyalty dashboard (read-only)",
      "View reports (no export)",
    ],
  },
};

export default function AdminRolesPage() {
  const { role: activeRole, setRole } = useRole();

  return (
    <>
      <PageHeader
        eyebrow="Governance"
        title="Roles & Access"
        description="Review role permissions and switch the active back-office view for demos."
        icon={ShieldCheck}
      />

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {ROLES.map(r => {
          const isActive = r.id === activeRole;
          const info = ROLE_DESCRIPTIONS[r.id as RoleId];
          return (
            <div key={r.id}
              className={`rounded-xl border-2 p-5 transition-shadow ${ROLE_COLORS[r.id as RoleId]} ${isActive ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-sm"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {ROLE_ICONS[r.id as RoleId]}
                  <span className="font-semibold text-sm">{r.label}</span>
                </div>
                {isActive && (
                  <Badge className="border-0 text-xs bg-blue-600 text-white">Active</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">{info.headline}</p>
              <ul className="space-y-1.5 mb-5">
                {info.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="w-full text-xs"
                onClick={() => setRole(r.id as RoleId)}
                disabled={isActive}
              >
                {isActive ? "Currently active" : `Switch to ${r.label}`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50/60 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-sm">Permission Matrix</h2>
          <span className="text-xs text-muted-foreground ml-1">— module access per role</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/30">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 w-64">Module</th>
                {ROLES.map(r => (
                  <th key={r.id} className="px-5 py-3 text-center font-semibold text-slate-600">
                    <div className="flex flex-col items-center gap-1">
                      <Badge className={`border-0 text-xs ${ROLE_BADGE[r.id as RoleId]}`}>{r.label}</Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(mod => (
                <tr key={mod} className="border-b last:border-0 hover:bg-slate-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-sm">{MODULE_META[mod].label}</p>
                    <p className="text-xs text-muted-foreground">{MODULE_META[mod].description}</p>
                  </td>
                  {ROLES.map(r => {
                    const allowed = canAccess(r.id as RoleId, mod);
                    return (
                      <td key={r.id} className="px-5 py-3 text-center">
                        {allowed
                          ? <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                          : <X className="h-4 w-4 text-slate-300 mx-auto" />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-amber-50 border-amber-200 p-4 text-sm text-amber-800">
        <strong>Demo note:</strong> Role switching above updates the sidebar navigation and disables restricted actions in real-time.
        The role switcher in the top bar also controls this. All changes persist in localStorage.
      </div>
    </>
  );
}
