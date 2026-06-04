"use client";

import * as React from "react";
import { Plus, Download, Search, Gift, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { RedemptionCampaignProvider, useRedemptionCampaigns } from "@/components/redemption-config/RedemptionCampaignProvider";
import { RedemptionCampaignTable } from "@/components/redemption-config/RedemptionCampaignTable";
import { RedemptionCampaignFormDrawer } from "@/components/redemption-config/RedemptionCampaignFormDrawer";
import { RedemptionCampaignDetailsDrawer } from "@/components/redemption-config/RedemptionCampaignDetailsDrawer";
import { useRoleAccess } from "@/lib/roleAccess";
import type { RedemptionCampaign } from "@/types/loyalty";

function Content() {
  const { campaigns, toggleStatus } = useRedemptionCampaigns();
  const { can, guardProps } = useRoleAccess();

  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [filterType, setFilterType] = React.useState("all");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RedemptionCampaign | null>(null);
  const [viewTarget, setViewTarget] = React.useState<RedemptionCampaign | null>(null);

  const filtered = campaigns.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterType !== "all" && c.rewardType !== filterType) return false;
    if (search && !c.rewardName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const active = campaigns.filter(c => c.status === "ACTIVE").length;
  const expired = campaigns.filter(c => c.status === "EXPIRED").length;
  const inactive = campaigns.filter(c => c.status === "INACTIVE").length;
  const totalPts = campaigns.filter(c => c.status === "ACTIVE").reduce((s, c) => s + c.pointsRequired, 0);

  function handleExport() {
    const rows = [
      ["ID","Name","Type","Points","Start","End","Tiers","Status"],
      ...campaigns.map(c => [c.id, c.rewardName, c.rewardType, c.pointsRequired, c.startDate.slice(0,10), c.endDate.slice(0,10), c.eligibleTiers.join("|"), c.status]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "redemption-campaigns.csv"; a.click();
  }

  return (
    <>
      <PageHeader
        eyebrow="Redemptions"
        title="Redemption Configuration"
        description="Configure reward campaigns, eligibility rules, and member-facing offers. Active campaigns appear in the member rewards marketplace."
        icon={Gift}
      />

      {!can("write") && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-2">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Redemption configuration is read-only for your current role.</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Campaigns" value={String(campaigns.length)} />
        <StatCard label="Active" value={String(active)} accent="emerald" />
        <StatCard label="Inactive" value={String(inactive)} />
        <StatCard label="Expired" value={String(expired)} accent="amber" />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search campaigns…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="VOUCHER">Voucher</SelectItem>
            <SelectItem value="WALLET">Wallet Credit</SelectItem>
            <SelectItem value="DATA">Data Pack</SelectItem>
            <SelectItem value="ADDON">Add-On</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2"/>Export CSV
        </Button>
        <Button
          onClick={() => { setEditing(null); setDrawerOpen(true); }}
          {...guardProps("write")}
        >
          <Plus className="h-4 w-4 mr-2"/>New Campaign
        </Button>
      </div>

      <RedemptionCampaignTable
        campaigns={filtered}
        canWrite={can("write")}
        onEdit={c => { setEditing(c); setDrawerOpen(true); }}
        onView={c => setViewTarget(c)}
        onToggle={c => toggleStatus(c.id)}
      />

      <RedemptionCampaignFormDrawer
        open={drawerOpen && can("write")}
        editing={editing}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
      />
      <RedemptionCampaignDetailsDrawer
        open={!!viewTarget}
        campaign={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => { setEditing(viewTarget); setViewTarget(null); setDrawerOpen(true); }}
      />
    </>
  );
}

export default function AdminRedemptionConfigPage() {
  return <RedemptionCampaignProvider><Content /></RedemptionCampaignProvider>;
}
