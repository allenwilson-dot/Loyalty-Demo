"use client";

import * as React from "react";
import { ScrollText, Search, Download, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import { MOCK_AUDIT_LOG } from "@/data/mockReports";
import { useRoleAccess } from "@/lib/roleAccess";
import type { DashboardAuditEntry } from "@/types/loyalty";

// Seed additional audit entries from the richer mock audit logs
const EXTRA_SEED: DashboardAuditEntry[] = [
  { id: "aud_x001", occurredAt: "2026-05-31T22:14:00Z", actor: "amelia.chen@loyaltyco.com", role: "admin", module: "Tiers", action: "UPDATE", status: "success", details: "Updated user tier: Gold → Platinum for usr_01HZX7L" },
  { id: "aud_x002", occurredAt: "2026-05-31T00:00:12Z", actor: "system", role: "admin", module: "Vouchers", action: "EXPIRE", status: "info", details: "Voucher vch_008 (SUMMER10) auto-expired" },
  { id: "aud_x003", occurredAt: "2026-05-30T16:45:00Z", actor: "marcus.patel@loyaltyco.com", role: "admin", module: "Roles", action: "GRANT", status: "warning", details: "Granted Merchant role to diego.fernandez@loyaltyco.com" },
  { id: "aud_x004", occurredAt: "2026-05-30T11:09:00Z", actor: "system", role: "admin", module: "API", action: "RATE_LIMIT", status: "warning", details: "Rate limit tripped on api-key ak_live_***91c2" },
  { id: "aud_x005", occurredAt: "2026-05-29T09:22:00Z", actor: "amelia.chen@loyaltyco.com", role: "admin", module: "Earning Rules", action: "PUBLISH", status: "success", details: "Earning rule published: 2x points on travel (rule_er_104)" },
  { id: "aud_x006", occurredAt: "2026-05-29T03:11:00Z", actor: "system", role: "admin", module: "Auth", action: "LOGIN_FAILED", status: "warning", details: "Admin login failed 3 times for unknown@loyaltyco.com" },
  { id: "aud_x007", occurredAt: "2026-05-28T14:00:00Z", actor: "sofia.rossi@loyaltyco.com", role: "admin", module: "Merchants", action: "APPROVE", status: "success", details: "Merchant approved: Aurelia Audio (mch_003)" },
  { id: "aud_x008", occurredAt: "2026-05-27T18:30:00Z", actor: "aaliyah.carter@loyaltyco.com", role: "merchant", module: "Vouchers", action: "DEACTIVATE", status: "warning", details: "Voucher vch_005 (TOTE20) deactivated" },
  { id: "aud_x009", occurredAt: "2026-05-26T09:00:00Z", actor: "amelia.chen@loyaltyco.com", role: "admin", module: "Users", action: "POINTS_ADD", status: "success", details: "Manually added 500 pts to user usr_abc123 — Reason: Goodwill credit" },
  { id: "aud_x010", occurredAt: "2026-05-25T14:20:00Z", actor: "amelia.chen@loyaltyco.com", role: "admin", module: "Users", action: "LOCK", status: "success", details: "User usr_xyz789 locked — Reason: Suspected fraud activity" },
  { id: "aud_x011", occurredAt: "2026-05-24T11:05:00Z", actor: "marcus.patel@loyaltyco.com", role: "admin", module: "Vouchers", action: "CREATE", status: "success", details: "Created voucher: Summer50 for Bluewater Roasters" },
  { id: "aud_x012", occurredAt: "2026-05-23T08:45:00Z", actor: "system", role: "admin", module: "Reports", action: "EXPORT", status: "success", details: "Automated monthly report exported: earn_report_may2026.csv" },
  { id: "aud_x013", occurredAt: "2026-05-22T16:00:00Z", actor: "sofia.rossi@loyaltyco.com", role: "admin", module: "Merchants", action: "KYC_REJECT", status: "warning", details: "KYC rejected for merchant mch_007 — missing document" },
  { id: "aud_x014", occurredAt: "2026-05-21T10:30:00Z", actor: "amelia.chen@loyaltyco.com", role: "admin", module: "Tiers", action: "CREATE", status: "success", details: "New tier created: Diamond with 100,000 pts threshold" },
  { id: "aud_x015", occurredAt: "2026-05-20T09:15:00Z", actor: "aaliyah.carter@loyaltyco.com", role: "merchant", module: "Redemption Config", action: "CREATE", status: "success", details: "Campaign created: Summer Flash Voucher (rc_summer_01)" },
];

const STATUS_BADGE: Record<DashboardAuditEntry["status"], string> = {
  success: "bg-emerald-100 text-emerald-700",
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
};

const MODULES_LIST = ["All", "Dashboard", "Users", "Tiers", "Earning Rules", "Merchants", "Vouchers", "API", "Redemption Config", "Roles", "Reports", "Auth"];
const ROLES_LIST = ["all", "admin", "merchant", "viewer"] as const;

function getSeedLogs(): DashboardAuditEntry[] {
  const stored = readStorage<DashboardAuditEntry[] | null>(StorageKeys.adminAudit, null);
  if (stored && stored.length > 0) return stored;
  const combined = [...MOCK_AUDIT_LOG, ...EXTRA_SEED].sort((a, b) =>
    new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
  writeStorage(StorageKeys.adminAudit, combined);
  return combined;
}

function exportCsv(logs: DashboardAuditEntry[]) {
  const rows = [
    ["Timestamp", "Actor", "Role", "Module", "Action", "Status", "Details"],
    ...logs.map(l => [l.occurredAt, l.actor, l.role, l.module, l.action, l.status, l.details]),
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function AdminAuditPage() {
  const { can } = useRoleAccess();
  const [logs, setLogs] = React.useState<DashboardAuditEntry[]>([]);
  const [search, setSearch] = React.useState("");
  const [filterModule, setFilterModule] = React.useState("All");
  const [filterRole, setFilterRole] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  React.useEffect(() => { setLogs(getSeedLogs()); }, []);

  const filtered = React.useMemo(() => {
    return logs.filter(l => {
      if (filterModule !== "All" && !l.module.toLowerCase().includes(filterModule.toLowerCase())) return false;
      if (filterRole !== "all" && l.role !== filterRole) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (dateFrom && new Date(l.occurredAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(l.occurredAt) > new Date(dateTo + "T23:59:59Z")) return false;
      const q = search.toLowerCase();
      if (q && !l.actor.toLowerCase().includes(q) && !l.action.toLowerCase().includes(q) && !l.details.toLowerCase().includes(q) && !l.module.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [logs, search, filterModule, filterRole, filterStatus, dateFrom, dateTo]);

  const successCount = logs.filter(l => l.status === "success").length;
  const warningCount = logs.filter(l => l.status === "warning").length;

  function handleRefresh() {
    setLogs(getSeedLogs());
  }

  return (
    <>
      <PageHeader eyebrow="Governance" title="Audit Logs"
        description="A tamper-evident record of every administrative action across the loyalty platform."
        icon={ScrollText} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Events" value={String(logs.length)} />
        <StatCard label="Success" value={String(successCount)} accent="emerald" />
        <StatCard label="Warnings" value={String(warningCount)} accent="amber" />
        <StatCard label="Filtered" value={String(filtered.length)} accent="cyan" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search actor, action, details…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{MODULES_LIST.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="merchant">Merchant</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
        <Input type="date" className="w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
        <Button variant="outline" onClick={handleRefresh}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
        <Button variant="outline" onClick={() => exportCsv(filtered)} disabled={!can("export")} title={!can("export") ? "Export requires Admin or Merchant role" : undefined}>
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50/60">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Timestamp</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Actor</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Module</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No audit events match your filters</td></tr>
            )}
            {filtered.map(l => (
              <tr key={l.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(l.occurredAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-xs font-medium max-w-[160px] truncate">{l.actor}</td>
                <td className="px-4 py-3">
                  <Badge className={`border-0 text-xs capitalize ${l.role === "admin" ? "bg-blue-100 text-blue-700" : l.role === "merchant" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                    {l.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{l.module}</td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{l.action}</code>
                </td>
                <td className="px-4 py-3">
                  <Badge className={`border-0 text-xs capitalize ${STATUS_BADGE[l.status]}`}>{l.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[280px] truncate" title={l.details}>{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
