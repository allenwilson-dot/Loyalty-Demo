"use client";

import * as React from "react";
import { FileBarChart2, Download, Search, TrendingUp, TrendingDown, Gift, Users, Layers } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readStorage, StorageKeys } from "@/lib/storage";
import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";
import { MOCK_USERS } from "@/data/mockUsers";
import { MOCK_VOUCHER_MANAGEMENT } from "@/data/mockVoucherManagement";
import { MOCK_REDEMPTION_CAMPAIGNS } from "@/data/mockRedemptionCampaigns";
import { useRoleAccess } from "@/lib/roleAccess";
import type { LoyaltyTransaction, TransactionChannel, VoucherManagement, RedemptionCampaign } from "@/types/loyalty";

const CHANNEL_LABEL: Record<TransactionChannel, string> = {
  selfcare: "Selfcare", moolee: "Moolee", mfaisaa: "M Faisaa",
  store: "Store", api: "API", campaign: "Campaign",
};

function exportCsv(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = filename; a.click();
}

function useTxns(): LoyaltyTransaction[] {
  return React.useMemo(() => {
    const stored = readStorage<LoyaltyTransaction[] | null>(StorageKeys.transactions, null);
    return stored ?? MOCK_TRANSACTIONS;
  }, []);
}

/* ── Earn Report ─────────────────────────────────────────── */
function EarnReport() {
  const { can: canExport } = useRoleAccess();
  const txns = useTxns();
  const [search, setSearch] = React.useState("");
  const [channel, setChannel] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const earns = txns.filter(t => t.type === "earn" || t.type === "bonus");
  const filtered = earns.filter(t => {
    if (channel !== "all" && t.channel !== channel) return false;
    if (status !== "all" && t.status !== status) return false;
    if (dateFrom && new Date(t.occurredAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(t.occurredAt) > new Date(dateTo + "T23:59:59Z")) return false;
    if (search && !t.userName.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPts = filtered.reduce((s, t) => s + t.points, 0);
  const channelBreakdown = (["selfcare","moolee","mfaisaa","campaign"] as TransactionChannel[]).map(c => ({
    label: CHANNEL_LABEL[c], pts: earns.filter(t => t.channel === c).reduce((s,t) => s+t.points, 0)
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Earn Events" value={String(filtered.length)} accent="cyan" />
        <StatCard label="Points Issued" value={totalPts.toLocaleString()} accent="emerald" />
        <StatCard label="Selfcare" value={channelBreakdown[0].pts.toLocaleString()} />
        <StatCard label="M Faisaa" value={channelBreakdown[2].pts.toLocaleString()} />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-9" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <Select value={channel} onValueChange={setChannel}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All channels</SelectItem>{(["selfcare","moolee","mfaisaa","campaign","api"] as TransactionChannel[]).map(c=><SelectItem key={c} value={c}>{CHANNEL_LABEL[c]}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select>
        <Input type="date" className="w-36" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
        <Input type="date" className="w-36" value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
        <Button variant="outline" disabled={!canExport("export")} title={!canExport("export") ? "Export requires Admin or Merchant role" : undefined} onClick={()=>exportCsv([["ID","User","Channel","Points","Status","Date","Description"],...filtered.map(t=>[t.id,t.userName,t.channel,String(t.points),t.status,t.occurredAt,t.description])],"earn-report.csv")}><Download className="h-4 w-4 mr-2"/>Export</Button>
      </div>
      <ReportTable rows={filtered.map(t=>([t.id, t.userName, CHANNEL_LABEL[t.channel], `+${t.points}`, t.status, new Date(t.occurredAt).toLocaleString(), t.description]))} headers={["ID","User","Channel","Points","Status","Date","Description"]} />
    </div>
  );
}

/* ── Redemption Report ───────────────────────────────────── */
function RedemptionReport() {
  const { can: canExport } = useRoleAccess();
  const txns = useTxns();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const redeems = txns.filter(t => t.type === "redeem" || t.type === "expire");
  const filtered = redeems.filter(t => {
    if (status !== "all" && t.status !== status) return false;
    if (search && !t.userName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPts = filtered.reduce((s, t) => s + t.points, 0);
  const success = filtered.filter(t => t.status === "completed").length;
  const failed = filtered.filter(t => t.status === "failed").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Redemptions" value={String(filtered.length)} />
        <StatCard label="Points Redeemed" value={totalPts.toLocaleString()} accent="violet" />
        <StatCard label="Successful" value={String(success)} accent="emerald" />
        <StatCard label="Failed" value={String(failed)} accent="amber" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-9" placeholder="Search user…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="reversed">Reversed</SelectItem></SelectContent></Select>
        <Button variant="outline" disabled={!canExport("export")} title={!canExport("export") ? "Export requires Admin or Merchant role" : undefined} onClick={()=>exportCsv([["ID","User","Points","Status","Date","Description"],...filtered.map(t=>[t.id,t.userName,String(t.points),t.status,t.occurredAt,t.description])],"redemption-report.csv")}><Download className="h-4 w-4 mr-2"/>Export</Button>
      </div>
      <ReportTable rows={filtered.map(t=>([t.id, t.userName, CHANNEL_LABEL[t.channel] ?? t.channel, `${t.points}`, t.status, new Date(t.occurredAt).toLocaleString(), t.description]))} headers={["ID","User","Channel","Points","Status","Date","Description"]} />
    </div>
  );
}

/* ── Voucher Inventory Report ────────────────────────────── */
function VoucherInventoryReport() {
  const { can: canExport } = useRoleAccess();
  const vouchers: VoucherManagement[] = readStorage(StorageKeys.adminVouchers, MOCK_VOUCHER_MANAGEMENT);
  const [search, setSearch] = React.useState("");
  const filtered = vouchers.filter((v: VoucherManagement) => !search || v.voucherTitle.toLowerCase().includes(search.toLowerCase()) || v.merchantName.toLowerCase().includes(search.toLowerCase()));

  const total = filtered.reduce((s: number, v: VoucherManagement) => s + v.totalInventory, 0);
  const remaining = filtered.reduce((s: number, v: VoucherManagement) => s + v.remainingInventory, 0);
  const lowStock = filtered.filter((v: VoucherManagement) => v.voucherMode === "INVENTORY" && v.remainingInventory > 0 && v.remainingInventory / v.totalInventory < 0.1).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Vouchers" value={String(filtered.length)} />
        <StatCard label="Total Inventory" value={total.toLocaleString()} />
        <StatCard label="Remaining" value={remaining.toLocaleString()} accent="emerald" />
        <StatCard label="Low Stock" value={String(lowStock)} accent="amber" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-9" placeholder="Search voucher…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <Button variant="outline" disabled={!canExport("export")} title={!canExport("export") ? "Export requires Admin or Merchant role" : undefined} onClick={()=>exportCsv([["ID","Title","Merchant","Mode","Total","Remaining","Status","Expiry"],...filtered.map((v: VoucherManagement)=>[v.id,v.voucherTitle,v.merchantName,v.voucherMode,String(v.totalInventory),String(v.remainingInventory),v.status,v.expiryDate])],"voucher-inventory.csv")}><Download className="h-4 w-4 mr-2"/>Export</Button>
      </div>
      <ReportTable
        headers={["ID","Title","Merchant","Mode","Total","Remaining","Status","Health"]}
        rows={filtered.map((v: VoucherManagement) => {
          const pct = v.voucherMode === "INVENTORY" && v.totalInventory > 0 ? v.remainingInventory / v.totalInventory : 1;
          const health = v.voucherMode === "API" ? "API" : pct === 0 ? "Out of Stock" : pct < 0.1 ? "Critical" : pct < 0.3 ? "Watch" : "Healthy";
          return [v.id, v.voucherTitle, v.merchantName, v.voucherMode, String(v.totalInventory), String(v.remainingInventory), v.status, health];
        })}
      />
    </div>
  );
}

/* ── User Ledger Report ──────────────────────────────────── */
function UserLedgerReport() {
  const { can: canExport } = useRoleAccess();
  const users = MOCK_USERS;
  const [search, setSearch] = React.useState("");
  const filtered = users.filter(u => !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.msisdn.includes(search));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Members" value={String(filtered.length)} />
        <StatCard label="Total Balance" value={filtered.reduce((s,u)=>s+u.pointsBalance,0).toLocaleString()} accent="cyan" />
        <StatCard label="Lifetime Earned" value={filtered.reduce((s,u)=>s+u.lifetimePoints,0).toLocaleString()} accent="emerald" />
        <StatCard label="Active" value={String(filtered.filter(u=>u.status==="active").length)} accent="violet" />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input className="pl-9" placeholder="Search by name or MSISDN…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <Button variant="outline" disabled={!canExport("export")} title={!canExport("export") ? "Export requires Admin or Merchant role" : undefined} onClick={()=>exportCsv([["ID","Name","MSISDN","Tier","Balance","Lifetime","Status"],...filtered.map(u=>[u.id,u.fullName,u.msisdn,u.tierId,String(u.pointsBalance),String(u.lifetimePoints),u.status])],"user-ledger.csv")}><Download className="h-4 w-4 mr-2"/>Export</Button>
      </div>
      <ReportTable
        headers={["Name","MSISDN","Tier","Balance","Lifetime Earned","Status"]}
        rows={filtered.map(u=>[u.fullName, u.msisdn, u.tierId, u.pointsBalance.toLocaleString(), u.lifetimePoints.toLocaleString(), u.status])}
      />
    </div>
  );
}

/* ── Campaign Performance ────────────────────────────────── */
function CampaignPerformanceReport() {
  const { can: canExport } = useRoleAccess();
  const campaigns: RedemptionCampaign[] = readStorage(StorageKeys.adminRedemptionCampaigns, MOCK_REDEMPTION_CAMPAIGNS);
  const txns = useTxns();
  const redeems = txns.filter(t => t.type === "redeem");

  const rows = campaigns.map((c: RedemptionCampaign) => {
    const count = redeems.filter(t => t.description.toLowerCase().includes(c.rewardName.toLowerCase())).length;
    return {
      name: c.rewardName, type: c.rewardType, pts: c.pointsRequired,
      start: c.startDate.slice(0,10), end: c.endDate.slice(0,10),
      status: c.status, redemptions: count, tiers: c.eligibleTiers.join(", "),
    };
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Campaigns" value={String(campaigns.length)} />
        <StatCard label="Active" value={String(campaigns.filter((c: RedemptionCampaign) => c.status === "ACTIVE").length)} accent="emerald" />
        <StatCard label="Expired" value={String(campaigns.filter((c: RedemptionCampaign) => c.status === "EXPIRED").length)} accent="amber" />
        <StatCard label="Total Redemptions" value={String(redeems.length)} accent="cyan" />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" disabled={!canExport("export")} title={!canExport("export") ? "Export requires Admin or Merchant role" : undefined} onClick={()=>exportCsv([["Name","Type","Pts","Start","End","Tiers","Status","Redemptions"],...rows.map(r=>[r.name,r.type,String(r.pts),r.start,r.end,r.tiers,r.status,String(r.redemptions)])],"campaign-performance.csv")}><Download className="h-4 w-4 mr-2"/>Export</Button>
      </div>
      <ReportTable
        headers={["Campaign","Type","Points","Period","Tiers","Status","Redemptions"]}
        rows={rows.map(r=>[r.name, r.type, r.pts.toLocaleString(), `${r.start} – ${r.end}`, r.tiers, r.status, String(r.redemptions)])}
      />
    </div>
  );
}

/* ── Shared table component ──────────────────────────────── */
function ReportTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50/60">
            {headers.map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} className="text-center py-10 text-muted-foreground">No data available</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-slate-50/40 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-xs text-slate-700 max-w-[200px] truncate">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function AdminReportsPage() {
  return (
    <>
      <PageHeader eyebrow="Insights" title="Reports"
        description="Earn activity, redemptions, voucher inventory, user ledgers, and campaign performance."
        icon={FileBarChart2} />

      <Tabs defaultValue="earn" className="space-y-5">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="earn" className="flex items-center gap-1.5 text-xs"><TrendingUp className="h-3.5 w-3.5"/>Earn Report</TabsTrigger>
          <TabsTrigger value="redemption" className="flex items-center gap-1.5 text-xs"><TrendingDown className="h-3.5 w-3.5"/>Redemption Report</TabsTrigger>
          <TabsTrigger value="voucher" className="flex items-center gap-1.5 text-xs"><Layers className="h-3.5 w-3.5"/>Voucher Inventory</TabsTrigger>
          <TabsTrigger value="ledger" className="flex items-center gap-1.5 text-xs"><Users className="h-3.5 w-3.5"/>User Ledger</TabsTrigger>
          <TabsTrigger value="campaign" className="flex items-center gap-1.5 text-xs"><Gift className="h-3.5 w-3.5"/>Campaign Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="earn"><EarnReport /></TabsContent>
        <TabsContent value="redemption"><RedemptionReport /></TabsContent>
        <TabsContent value="voucher"><VoucherInventoryReport /></TabsContent>
        <TabsContent value="ledger"><UserLedgerReport /></TabsContent>
        <TabsContent value="campaign"><CampaignPerformanceReport /></TabsContent>
      </Tabs>
    </>
  );
}
