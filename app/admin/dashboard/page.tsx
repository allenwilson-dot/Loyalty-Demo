"use client";

import * as React from "react";
import {
  Download,
  Megaphone,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DashboardProvider, useDashboard } from "@/components/dashboard/DashboardProvider";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { EarnRedeemChart } from "@/components/dashboard/EarnRedeemChart";
import { ChannelContributionChart } from "@/components/dashboard/ChannelContributionChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OperationalAlertsPanel } from "@/components/dashboard/OperationalAlertsPanel";
import { PendingActionsPanel } from "@/components/dashboard/PendingActionsPanel";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { RedemptionTypeBreakdown } from "@/components/dashboard/RedemptionTypeBreakdown";
import { VoucherInventoryCard } from "@/components/dashboard/VoucherInventoryCard";
import { ActiveCampaignsCard } from "@/components/dashboard/ActiveCampaignsCard";
import { useRole } from "@/components/layout/RoleProvider";
import { DATE_RANGE_LABEL } from "@/lib/dashboard";
import { formatRelative } from "@/lib/utils";

export default function AdminDashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

function DashboardContent() {
  const { role } = useRole();
  const {
    range,
    setRange,
    lastRefreshedAt,
    refresh,
    exportCsv,
    canExport,
    visibleKpis,
    trend,
    channels,
    redemptionTypes,
    voucherInventory,
    campaigns,
    activity,
    activeAlerts,
    pendingActions,
    resolveAlert,
    ignoreAlert,
    canManage,
  } = useDashboard();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Back office"
        title="Loyalty Operations Dashboard"
        description="Monitor earning, redemption, vouchers, campaigns, tiers, and user activity across Selfcare, Moolee, and M Faisaa."
        icon={Sparkles}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeSelector value={range} onChange={setRange} />
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={!canExport}
              aria-label="Export dashboard summary as CSV"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={refresh}
              aria-label="Refresh dashboard data"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        }
      />

      <p className="-mt-4 text-xs text-muted-foreground">
        Viewing as <span className="font-medium text-foreground capitalize">{role}</span>{" "}
        · range <span className="font-medium text-foreground">{DATE_RANGE_LABEL[range]}</span>{" "}
        · last refreshed {formatRelative(lastRefreshedAt)}
      </p>

      {/* KPI grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleKpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </section>

      {/* Trend + Channel */}
      <section className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Earn vs redeem"
          description="Daily points issued against points redeemed."
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          <EarnRedeemChart data={trend} />
        </SectionCard>
        <SectionCard
          title="Channel contribution"
          description="Points earned by entry source."
          icon={Wallet}
        >
          <ChannelContributionChart data={channels} />
        </SectionCard>
      </section>

      {/* Redemption type + Voucher inventory */}
      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Redemption by type"
          description="How members spend their points — vouchers, wallet credits, data packs, and add-ons."
          icon={Wallet}
        >
          <RedemptionTypeBreakdown data={redemptionTypes} />
        </SectionCard>
        <SectionCard
          title="Voucher inventory health"
          description="Remaining stock, API success, and replenishment signals."
          icon={Megaphone}
          actions={
            <span className="text-xs text-muted-foreground">
              {voucherInventory.length} vouchers
            </span>
          }
        >
          <VoucherInventoryCard rows={voucherInventory} />
        </SectionCard>
      </section>

      {/* Active campaigns */}
      <SectionCard
        title="Active campaign snapshot"
        description="Currently running and upcoming redemption campaigns."
        icon={Megaphone}
        actions={
          <span className="text-xs text-muted-foreground">
            {campaigns.length} campaigns
          </span>
        }
      >
        <ActiveCampaignsCard campaigns={campaigns} />
      </SectionCard>

      {/* Recent activity + Operational alerts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Recent user activity"
          description="The latest member transactions across the three entry sources."
          icon={TrendingUp}
        >
          <RecentActivityFeed entries={activity} />
        </SectionCard>
        <SectionCard
          title="Operational alerts"
          description="Issues that need eyes-on. Resolve or dismiss to keep the queue clean."
          icon={Megaphone}
          actions={
            <span className="text-xs text-muted-foreground">
              {activeAlerts.length} active
            </span>
          }
        >
          <OperationalAlertsPanel
            alerts={activeAlerts}
            canManage={canManage}
            onResolve={resolveAlert}
            onIgnore={ignoreAlert}
          />
        </SectionCard>
      </section>

      {/* Pending actions */}
      <SectionCard
        title="Pending actions"
        description="Queued tasks for the team. Each card links into the relevant module."
        icon={Sparkles}
      >
        <PendingActionsPanel actions={pendingActions} role={role} />
      </SectionCard>

      {!canExport ? (
        <p className="text-center text-[11px] text-muted-foreground">
          Export is disabled for the {role} role. Switch to Administrator or
          Merchant to enable it.
        </p>
      ) : null}
    </div>
  );
}
