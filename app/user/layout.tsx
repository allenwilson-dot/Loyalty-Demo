import type { Metadata } from "next";
import Link from "next/link";
import * as React from "react";
import { ArrowLeft } from "lucide-react";

import { LoyaltyProvider } from "@/components/loyalty/LoyaltyProvider";
import { UserNav } from "@/components/loyalty/UserNav";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Member experience",
};

/**
 * Lightweight shell for the member-facing experience. Stays out of the
 * admin shell so the two surfaces remain visually distinct.
 */
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LoyaltyProvider>
      <div className="flex min-h-screen flex-col bg-mesh">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <UserNav />
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/dashboard">Admin view</Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          <div className="space-y-6">{children}</div>
        </main>

        <footer className="border-t border-border/60 bg-white/60">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-xs text-muted-foreground">
            <span>Member experience · prototype</span>
            <span>© 2026 Loyalty Co.</span>
          </div>
        </footer>
      </div>
    </LoyaltyProvider>
  );
}
