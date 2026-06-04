"use client";

import * as React from "react";
import {
  Download,
  FileUp,
  Lock,
  Plus,
  RefreshCcw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { UsersProvider, useUsers } from "@/components/users/UsersProvider";
import { UsersKpiBar } from "@/components/users/UsersKpiBar";
import { UserFilterBar } from "@/components/users/UserFilterBar";
import { UsersTable } from "@/components/users/UsersTable";
import { AddPointsDialog } from "@/components/users/AddPointsDialog";
import { ReversePointsDialog } from "@/components/users/ReversePointsDialog";
import { LockUserDialog } from "@/components/users/LockUserDialog";
import { BulkPointsDialog } from "@/components/users/BulkPointsDialog";
import { UserProfileDrawer } from "@/components/users/UserProfileDrawer";
import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";
import { formatRelative } from "@/lib/utils";
import type {
  TierId,
  User,
  UserAccountStatus,
  UserFilters,
  UserSortField,
} from "@/types/loyalty";

export default function AdminUsersPage() {
  return (
    <UsersProvider>
      <UsersPageContent />
    </UsersProvider>
  );
}

const DEFAULT_FILTERS: UserFilters = {
  query: "",
  tier: "all",
  status: "all",
  channel: "all",
  sortField: "activity",
  sortDirection: "desc",
  page: 1,
  pageSize: 8,
};

const REDEEMING_USER_IDS = new Set(
  MOCK_TRANSACTIONS.filter((t) => t.type === "redeem").map((t) => t.userId)
);

function UsersPageContent() {
  const {
    users,
    isMerchantView,
    canEdit,
    canExport,
    refresh,
    exportUsers,
    lockUser,
    unlockUser,
    lastRefreshedAt,
  } = useUsers();

  const [filters, setFilters] = React.useState<UserFilters>(DEFAULT_FILTERS);
  const [drawerUser, setDrawerUser] = React.useState<User | null>(null);
  const [addTarget, setAddTarget] = React.useState<User | null>(null);
  const [reverseTarget, setReverseTarget] = React.useState<User | null>(null);
  const [lockTarget, setLockTarget] = React.useState<User | null>(null);
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [toast, setToast] = React.useState<{
    message: string;
    tone: "success" | "info" | "warning" | "error";
  } | null>(null);

  const visibleUsers = React.useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    let list = users;
    if (isMerchantView) {
      list = list.filter((u) => REDEEMING_USER_IDS.has(u.id));
    }
    if (query) {
      list = list.filter((u) =>
        [u.fullName, u.nid, u.msisdn, u.walletId, u.email]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }
    if (filters.tier !== "all") {
      list = list.filter((u) => u.tierId === (filters.tier as TierId));
    }
    if (filters.status !== "all") {
      list = list.filter((u) => u.status === (filters.status as UserAccountStatus));
    }
    if (filters.channel !== "all") {
      list = list.filter(
        (u) => u.channels[filters.channel as "selfcare" | "moolee" | "mfaisaa"]
      );
    }
    const sorted = [...list].sort((a, b) => {
      const dir = filters.sortDirection === "asc" ? 1 : -1;
      switch (filters.sortField) {
        case "name":
          return a.fullName.localeCompare(b.fullName) * dir;
        case "tier":
          return a.tierId.localeCompare(b.tierId) * dir;
        case "balance":
          return (a.pointsBalance - b.pointsBalance) * dir;
        case "activity":
        default:
          return (
            (new Date(a.lastActivityAt).getTime() -
              new Date(b.lastActivityAt).getTime()) *
            dir
          );
      }
    });
    return sorted;
  }, [users, filters, isMerchantView]);

  const showToast = React.useCallback(
    (message: string, tone: "success" | "info" | "warning" | "error" = "success") => {
      setToast({ message, tone });
      window.setTimeout(() => setToast(null), 4000);
    },
    []
  );

  const handleSort = (field: UserSortField) => {
    if (filters.sortField === field) {
      setFilters({
        ...filters,
        sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
        page: 1,
      });
    } else {
      setFilters({ ...filters, sortField: field, sortDirection: "asc", page: 1 });
    }
  };

  const handleToggleLock = (target: User) => {
    if (target.status === "locked") {
      unlockUser({ userId: target.id, reason: "Manual unlock from table" });
      showToast(`Unlocked ${target.fullName}.`, "info");
    } else {
      lockUser({ userId: target.id, reason: "Manual lock from table" });
      showToast(`Locked ${target.fullName}.`, "info");
    }
  };

  const handleExport = () => {
    exportUsers(visibleUsers);
    showToast(`Exported ${visibleUsers.length} users.`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Members"
        title="User management"
        description="Search, monitor, and manage loyalty users, points balance, tier status, ledger activity, and account controls."
        icon={Users}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-muted-foreground md:inline">
              Last refreshed {formatRelative(lastRefreshedAt)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refresh();
                showToast("User data refreshed.");
              }}
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </Button>
            {canEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkOpen(true)}
              >
                <FileUp className="h-3.5 w-3.5" /> Bulk points adjustment
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!canExport}
              aria-label="Export users as CSV"
            >
              <Download className="h-3.5 w-3.5" /> Export users
            </Button>
          </div>
        }
      />

      <UsersKpiBar />

      <div className="space-y-4">
        <UserFilterBar
          filters={filters}
          onChange={setFilters}
          total={users.length}
          visible={visibleUsers.length}
        />
        <UsersTable
          users={visibleUsers}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => setFilters({ ...filters, page })}
          onSort={handleSort}
          sortField={filters.sortField}
          sortDirection={filters.sortDirection}
          onView={(u) => setDrawerUser(u)}
          onAddPoints={(u) => setAddTarget(u)}
          onReversePoints={(u) => setReverseTarget(u)}
          onToggleLock={handleToggleLock}
        />
      </div>

      <AddPointsDialog
        user={addTarget}
        open={addTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAddTarget(null);
        }}
        onComplete={(m) => showToast(m)}
      />
      <ReversePointsDialog
        user={reverseTarget}
        open={reverseTarget !== null}
        onOpenChange={(open) => {
          if (!open) setReverseTarget(null);
        }}
        onComplete={(m) => showToast(m, "info")}
      />
      <LockUserDialog
        user={lockTarget}
        open={lockTarget !== null}
        onOpenChange={(open) => {
          if (!open) setLockTarget(null);
        }}
        onComplete={(m) => showToast(m, "info")}
      />
      <BulkPointsDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onComplete={(m) => showToast(m)}
      />
      <UserProfileDrawer
        user={drawerUser}
        open={drawerUser !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerUser(null);
        }}
        onAddPoints={(u) => setAddTarget(u)}
        onReversePoints={(u) => setReverseTarget(u)}
        onToggleLock={(u) => {
          if (u.status === "locked") {
            unlockUser({ userId: u.id, reason: "Manual unlock from drawer" });
            showToast(`Unlocked ${u.fullName}.`, "info");
          } else {
            lockUser({ userId: u.id, reason: "Manual lock from drawer" });
            showToast(`Locked ${u.fullName}.`, "info");
          }
        }}
      />

      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}

function Toast({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "info" | "warning" | "error";
}) {
  const toneStyles: Record<typeof tone, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-navy-900/20 bg-navy-900/5 text-navy-900",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
  };
  const Icon: LucideIcon =
    tone === "success" ? RefreshCcw : tone === "info" ? Plus : tone === "warning" ? Lock : RefreshCcw;
  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-elevated ${toneStyles[tone]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
