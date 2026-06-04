"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AdminSidebar } from "./AdminSidebar";
import { TopBar } from "./TopBar";
import { RoleProvider } from "./RoleProvider";

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Application shell used by every admin route. Renders the role provider,
 * persistent sidebar, top bar, and a scrollable main content area.
 *
 * On mobile the sidebar collapses behind a sheet-like overlay to preserve
 * the polished desktop feel without sacrificing usability.
 */
export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <RoleProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 flex md:hidden"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full">
              <AdminSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-10 bg-white shadow-soft"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onToggleSidebar={() => setMobileOpen(true)} />
          <main
            className={cn(
              "flex-1 overflow-x-hidden bg-background px-4 py-8 md:px-8"
            )}
          >
            <div className="mx-auto w-full max-w-7xl space-y-8">
              {children}
            </div>
          </main>
          <footer className="border-t border-border/60 bg-white/60 px-6 py-4 text-xs text-muted-foreground">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <span>© 2026 Loyalty Co. — Back Office</span>
              <span className="flex items-center gap-3">
                <Link href="/" className="hover:text-foreground">
                  Landing
                </Link>
                <span aria-hidden>·</span>
                <Link
                  href="/user/loyalty"
                  className="hover:text-foreground"
                >
                  Member view
                </Link>
              </span>
            </div>
          </footer>
        </div>
      </div>
    </RoleProvider>
  );
}
