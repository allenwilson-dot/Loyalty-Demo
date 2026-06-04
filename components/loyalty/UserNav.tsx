"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Sparkles, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { label: "Loyalty", href: "/user/loyalty", icon: Sparkles },
  { label: "Rewards", href: "/user/rewards", icon: Wallet },
  { label: "History", href: "/user/history", icon: History },
];

/**
 * Member-experience top nav. Highlights the active route via `usePathname`.
 */
export function UserNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "";
  return (
    <nav className={cn("hidden items-center gap-1 md:flex", className)}>
      {ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-navy-900 text-white shadow-soft"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
