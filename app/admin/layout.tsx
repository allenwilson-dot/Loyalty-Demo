import type { Metadata } from "next";
import * as React from "react";

import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Back Office",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
