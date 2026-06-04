"use client";

import * as React from "react";
import { Plus, Download, Search, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ApiConfigProvider, useApiConfig } from "@/components/api-config/ApiConfigProvider";
import { ApiConfigTable } from "@/components/api-config/ApiConfigTable";
import { ApiConfigFormDrawer } from "@/components/api-config/ApiConfigFormDrawer";
import { ApiConfigTestModal } from "@/components/api-config/ApiConfigTestModal";
import { ApiConfigDetailsDrawer } from "@/components/api-config/ApiConfigDetailsDrawer";
import { useRoleAccess } from "@/lib/roleAccess";
import type { ApiConfig } from "@/types/loyalty";

function ApiConfigContent() {
  const { configs, toggleStatus, cloneConfig } = useApiConfig();
  const { can, guardProps } = useRoleAccess();

  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiConfig | null>(null);
  const [testTarget, setTestTarget] = React.useState<ApiConfig | null>(null);
  const [viewTarget, setViewTarget] = React.useState<ApiConfig | null>(null);

  const filtered = configs.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterCategory !== "all" && c.apiCategory !== filterCategory) return false;
    const q = search.toLowerCase();
    if (q && !c.partnerName.toLowerCase().includes(q) && !c.endpointUrl.toLowerCase().includes(q)) return false;
    return true;
  });

  const active = configs.filter(c => c.status === "ACTIVE").length;
  const passed = configs.filter(c => c.lastTestStatus === "SUCCESS").length;
  const failed = configs.filter(c => c.lastTestStatus === "FAILURE" || c.lastTestStatus === "TIMEOUT").length;
  const successRate = configs.length > 0
    ? Math.round((passed / configs.filter(c => c.lastTestStatus).length) * 100) || 0
    : 0;

  function handleExport() {
    const rows = [
      ["ID","Partner","Category","Method","Auth","Status","Last Test","Endpoint"],
      ...configs.map(c => [c.id,c.partnerName,c.apiCategory,c.httpMethod,c.authType,c.status,c.lastTestStatus??"",c.endpointUrl]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "api-configs.csv"; a.click();
  }

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="API Configuration"
        description="Manage partner API connections for voucher issuance, wallet credits, and data add-ons."
        icon={KeyRound}
      />

      {/* Role notice for non-admin */}
      {!can("manage_api") && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-2">
          <Lock className="h-4 w-4 shrink-0" />
          <span>API configuration is read-only for your current role. Contact an Admin to make changes.</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Configs" value={String(configs.length)} />
        <StatCard label="Active" value={String(active)} accent="emerald" />
        <StatCard label="Tests Passed" value={String(passed)} accent="cyan" />
        <StatCard label="API Success Rate" value={`${successRate}%`} accent="amber" />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search partner or endpoint URL…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="VMS">VMS</SelectItem>
            <SelectItem value="THIRD_PARTY_VOUCHER">3rd Party Voucher</SelectItem>
            <SelectItem value="WALLET_CREDIT">Wallet Credit</SelectItem>
            <SelectItem value="DATA_ADDON">Data Add-On</SelectItem>
            <SelectItem value="ADDON_SERVICE">Add-On Service</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2"/>Export CSV
        </Button>
        <Button
          onClick={() => { setEditing(null); setDrawerOpen(true); }}
          {...guardProps("manage_api")}
        >
          <Plus className="h-4 w-4 mr-2"/>New Config
        </Button>
      </div>

      <ApiConfigTable
        configs={filtered}
        canWrite={can("manage_api")}
        onEdit={c => { setEditing(c); setDrawerOpen(true); }}
        onTest={c => setTestTarget(c)}
        onClone={c => cloneConfig(c.id)}
        onToggle={c => toggleStatus(c.id)}
        onView={c => setViewTarget(c)}
      />

      <ApiConfigFormDrawer
        open={drawerOpen && can("manage_api")}
        editing={editing}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
      />
      <ApiConfigTestModal open={!!testTarget} config={testTarget} onClose={() => setTestTarget(null)} />
      <ApiConfigDetailsDrawer
        open={!!viewTarget}
        config={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => { setEditing(viewTarget); setViewTarget(null); setDrawerOpen(true); }}
        onTest={() => { setTestTarget(viewTarget); setViewTarget(null); }}
      />
    </>
  );
}

export default function AdminApiConfigPage() {
  return <ApiConfigProvider><ApiConfigContent /></ApiConfigProvider>;
}
