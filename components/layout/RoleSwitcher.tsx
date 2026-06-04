"use client";

import * as React from "react";
import { Check, ChevronsUpDown, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLES, getRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

import { useRole } from "./RoleProvider";

/**
 * Compact role switcher used in the admin top bar. Updates the active role
 * via the RoleProvider so the sidebar and access checks stay in sync.
 */
export function RoleSwitcher({ className }: { className?: string }) {
  const { role, setRole } = useRole();
  const current = getRole(role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-between gap-2 px-3 text-sm font-medium",
            className
          )}
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="hidden sm:inline text-muted-foreground">View as</span>
            <span className="text-foreground">{current.label}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Switch role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((r) => {
          const active = r.id === role;
          return (
            <DropdownMenuItem
              key={r.id}
              onSelect={() => setRole(r.id)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className="flex w-full items-center justify-between">
                <span className="text-sm font-medium">{r.label}</span>
                {active ? <Check className="h-4 w-4 text-accent" /> : null}
              </span>
              <span className="text-xs text-muted-foreground">
                {r.description}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
