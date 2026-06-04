"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/common/StatCard";
import { TransactionList } from "@/components/loyalty/TransactionList";
import { useLoyaltySession } from "@/components/loyalty/LoyaltyProvider";
import { computeLifetimeEarned, computeLifetimeRedeemed, formatPoints } from "@/lib/loyalty";
import { cn } from "@/lib/utils";
import type { TransactionChannel, TransactionStatus } from "@/types/loyalty";

const CHANNELS: { value: TransactionChannel | "all"; label: string }[] = [
  { value: "all", label: "All channels" },
  { value: "selfcare", label: "Selfcare" },
  { value: "moolee", label: "Moolee" },
  { value: "mfaisaa", label: "M Faisaa" },
  { value: "store", label: "In-store" },
  { value: "api", label: "API" },
  { value: "campaign", label: "Campaign" },
];

const STATUSES: { value: TransactionStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Success" },
  { value: "pending", label: "Pending" },
  { value: "reversed", label: "Reversed" },
  { value: "failed", label: "Failed" },
];

const DATE_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

type DateRange = (typeof DATE_RANGES)[number]["value"];

const DAY_MS = 86_400_000;

export default function UserHistoryPage() {
  const { transactions } = useLoyaltySession();

  const [tab, setTab] = React.useState<"all" | "earn" | "redeem">("all");
  const [channel, setChannel] = React.useState<TransactionChannel | "all">(
    "all"
  );
  const [status, setStatus] = React.useState<TransactionStatus | "all">("all");
  const [range, setRange] = React.useState<DateRange>("all");

  const cutoff = React.useMemo(() => {
    if (range === "all") return 0;
    return Date.now() - Number(range) * DAY_MS;
  }, [range]);

  const filtered = React.useMemo(() => {
    return transactions.filter((txn) => {
      if (tab === "earn" && txn.type !== "earn" && txn.type !== "bonus") {
        return false;
      }
      if (tab === "redeem" && txn.type !== "redeem") return false;
      if (channel !== "all" && txn.channel !== channel) return false;
      if (status !== "all" && txn.status !== status) return false;
      if (cutoff > 0 && new Date(txn.occurredAt).getTime() < cutoff) {
        return false;
      }
      return true;
    });
  }, [transactions, tab, channel, status, cutoff]);

  const earned = computeLifetimeEarned(filtered);
  const redeemed = computeLifetimeRedeemed(filtered);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Transaction history
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Every point, accounted for
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A complete ledger of your earnings, redemptions, and adjustments.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Filtered earned"
          value={`+${formatPoints(earned)}`}
          hint={`${filtered.length} transactions`}
          accent="cyan"
        />
        <StatCard
          label="Filtered redeemed"
          value={`-${formatPoints(redeemed)}`}
          hint="In the selected window"
          accent="navy"
        />
        <StatCard
          label="Net change"
          value={`${earned - redeemed >= 0 ? "+" : ""}${formatPoints(
            earned - redeemed
          )}`}
          hint="Earned minus redeemed"
          accent="emerald"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="space-y-4"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="earn">Earn</TabsTrigger>
            <TabsTrigger value="redeem">Redeem</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <DateRangeChips value={range} onChange={setRange} />
          </div>
        </div>

        {/* Filter row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            label="Channel"
            value={channel}
            onChange={(v) => setChannel(v as TransactionChannel | "all")}
            options={CHANNELS}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as TransactionStatus | "all")}
            options={STATUSES}
          />
          <FilterSelect
            label="Date"
            value={range}
            onChange={(v) => setRange(v as DateRange)}
            options={DATE_RANGES.map((d) => ({ value: d.value, label: d.label }))}
          />
        </div>

        <TabsContent value={tab} className="mt-2">
          <TransactionList
            transactions={filtered}
            emptyState={
              <div>
                <p className="font-medium text-foreground">No transactions</p>
                <p className="mt-1 text-sm">
                  Try clearing the filters or widening the date range.
                </p>
              </div>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DateRangeChips({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1 shadow-soft">
      {DATE_RANGES.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-navy-900 text-white shadow-soft"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
