"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  FileBarChart2,
  Gift,
  KeyRound,
  Layers,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  Store,
  Tag,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { canAccess, MODULE_META, type ModuleId } from "@/lib/rbac";

import { useRole } from "./RoleProvider";

interface NavItem {
  module: ModuleId;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { module: "dashboard", icon: LayoutDashboard },
  { module: "users", icon: Users },
  { module: "tiers", icon: Layers },
  { module: "earning-rules", icon: Coins },
  { module: "merchants", icon: Store },
  { module: "vouchers", icon: Tag },
  { module: "api-config", icon: KeyRound },
  { module: "redemption-config", icon: Gift },
  { module: "reports", icon: FileBarChart2 },
  { module: "audit", icon: ScrollText },
  { module: "roles", icon: ShieldCheck },
];

export interface AdminSidebarProps {
  onNavigate?: () => void;
}

/**
 * Persistent left navigation for the back office. Hides modules the active
 * role cannot access so the experience always matches RBAC policy.
 */
export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const { role } = useRole();

  const accessible = NAV_ITEMS.filter((item) => canAccess(role, item.module));

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border/60 bg-white">
      <div className="flex items-center gap-3 border-b border-border/60 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
          <span className="text-sm font-semibold">LM</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            Loyalty Co.
          </span>
          <span className="text-xs text-muted-foreground">Back Office v0.1</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Workspace
        </p>
        <ul className="space-y-1">
          {accessible.map(({ module, icon: Icon }) => {
            const meta = MODULE_META[module];
            const active =
              pathname === meta.href || pathname?.startsWith(`${meta.href}/`);

            return (
              <li key={module}>
                <Link
                  href={meta.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-navy-900 text-white shadow-soft"
                      : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      active
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="flex-1 truncate">{meta.label}</span>
                  {active ? (
                    <Badge
                      variant="accent"
                      className="bg-white/10 text-white"
                    >
                      Active
                    </Badge>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border/60 px-4 py-4">
        <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Loyalty Management</p>
          <p className="mt-1">All data is persisted in localStorage. Role changes apply immediately.</p>
        </div>
      </div>
    </aside>
  );
}
