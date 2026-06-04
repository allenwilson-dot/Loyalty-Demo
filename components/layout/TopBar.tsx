"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, humanize } from "@/lib/utils";
import { MODULE_META } from "@/lib/rbac";

import { RoleSwitcher } from "./RoleSwitcher";

export interface TopBarProps {
  onToggleSidebar?: () => void;
}

function useBreadcrumbs() {
  const pathname = usePathname() ?? "/";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return [{ label: "Home", href: "/" }];

  const crumbs: { label: string; href: string }[] = [];
  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    const label =
      MODULE_META[segment as keyof typeof MODULE_META]?.label ??
      humanize(segment);
    crumbs.push({ label, href });
  }
  return crumbs;
}

/**
 * Top bar for the admin shell. Houses the mobile menu trigger, breadcrumb
 * trail, search affordance, and the role switcher.
 */
export function TopBar({ onToggleSidebar }: TopBarProps) {
  const breadcrumbs = useBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-white/80 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onToggleSidebar}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground md:flex"
      >
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.href}>
              {idx > 0 ? (
                <span aria-hidden className="text-border">/</span>
              ) : null}
              {isLast ? (
                <span className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <div className="relative hidden md:block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search members, vouchers…"
            className={cn("h-9 w-64 pl-9")}
          />
        </div>
        <Button variant="ghost" size="icon" aria-label="What's new">
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <RoleSwitcher />
      </div>
    </header>
  );
}
