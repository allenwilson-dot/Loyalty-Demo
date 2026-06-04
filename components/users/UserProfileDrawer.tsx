"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Coins,
  Crown,
  Database,
  Gift,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Unlock,
  Wallet,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { EntrySourceBadge } from "@/components/loyalty/EntrySourceBadge";
import { Separator } from "@/components/ui/separator";
import { TIER_BY_ID, MOCK_TIERS } from "@/data/mockTiers";
import {
  cn,
  formatCompact,
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelative,
} from "@/lib/utils";
import type { LedgerEntry, User, UserAccountStatus } from "@/types/loyalty";

import { useUsers, statusBadgeTone } from "./UsersProvider";

export interface UserProfileDrawerProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPoints: (user: User) => void;
  onReversePoints: (user: User) => void;
  onToggleLock: (user: User) => void;
}

const STATUS_LABEL: Record<UserAccountStatus, string> = {
  active: "Active",
  locked: "Locked",
  suspended: "Suspended",
  inactive: "Inactive",
};

const LEDGER_TONE: Record<LedgerEntry["type"], "success" | "warning" | "danger" | "info" | "neutral"> = {
  earn: "success",
  redeem: "warning",
  adjustment: "info",
  reversal: "danger",
  rollback: "danger",
  bonus: "success",
  expire: "neutral",
};

function TxnRow({ entry }: { entry: LedgerEntry }) {
  const isCredit = entry.points > 0;
  return (
    <li className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge
            label={entry.type}
            tone={LEDGER_TONE[entry.type]}
            className="uppercase"
          />
          {entry.source !== "admin" ? (
            <EntrySourceBadge source={entry.source} />
          ) : (
            <StatusBadge label="Admin" tone="info" />
          )}
        </div>
        <span
          className={cn(
            "text-sm font-semibold",
            isCredit ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {isCredit ? "+" : ""}
          {formatNumber(entry.points)} pts
        </span>
      </div>
      <p className="mt-1 text-sm text-foreground">{entry.description}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>Opening · {formatNumber(entry.openingBalance)}</span>
        <span aria-hidden>→</span>
        <span>Closing · {formatNumber(entry.closingBalance)}</span>
        <span aria-hidden>·</span>
        <span>{formatDateTime(entry.occurredAt)}</span>
        {entry.reference ? (
          <>
            <span aria-hidden>·</span>
            <span className="font-mono">{entry.reference}</span>
          </>
        ) : null}
        {entry.actor ? (
          <>
            <span aria-hidden>·</span>
            <span>by {entry.actor}</span>
          </>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Right-side drawer showing identity, loyalty snapshot, tier progress,
 * points ledger, redemption history, and admin action history for a user.
 */
export function UserProfileDrawer({
  user,
  open,
  onOpenChange,
  onAddPoints,
  onReversePoints,
  onToggleLock,
}: UserProfileDrawerProps) {
  const { getLedger, getRedemptions, adminActions, canEdit } = useUsers();
  const [tab, setTab] = React.useState<"ledger" | "redemptions" | "actions">(
    "ledger"
  );

  if (!user) return null;

  const accountStatus = (
    ["active", "locked", "suspended", "inactive"] as UserAccountStatus[]
  ).includes(user.status as UserAccountStatus)
    ? (user.status as UserAccountStatus)
    : "inactive";

  const ledger = getLedger(user.id);
  const redemptions = getRedemptions(user.id);
  const userActions = adminActions
    .filter((a) => a.userId === user.id)
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

  const tier = TIER_BY_ID[user.tierId];
  const sortedTiers = [...MOCK_TIERS].sort((a, b) => a.rank - b.rank);
  const currentRank = tier.rank;
  const nextTier = sortedTiers.find((t) => t.rank === currentRank + 1);
  const tierProgress = nextTier
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((user.lifetimePoints - tier.threshold) /
              Math.max(1, nextTier.threshold - tier.threshold)) *
              100
          )
        )
      )
    : 100;

  const activeChannels = [
    user.channels.selfcare && ("selfcare" as const),
    user.channels.moolee && ("moolee" as const),
    user.channels.mfaisaa && ("mfaisaa" as const),
  ].filter(Boolean) as Array<"selfcare" | "moolee" | "mfaisaa">;

  const isLocked = user.status === "locked";
  const isSuspendedOrInactive =
    user.status === "suspended" || user.status === "inactive";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white shadow-soft">
              {user.fullName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{user.fullName}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono">{user.id}</span>
                <span aria-hidden>·</span>
                <StatusBadge
                  label={STATUS_LABEL[accountStatus]}
                  tone={statusBadgeTone(accountStatus)}
                />
                <StatusBadge label={tier.name} tone="accent" />
              </SheetDescription>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {canEdit && !isSuspendedOrInactive ? (
              <Button
                size="sm"
                onClick={() => onAddPoints(user)}
                disabled={user.status !== "active"}
              >
                <Plus className="h-3.5 w-3.5" /> Add points
              </Button>
            ) : null}
            {canEdit && !isSuspendedOrInactive ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReversePoints(user)}
                disabled={user.status !== "active"}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reverse points
              </Button>
            ) : null}
            {canEdit && !isSuspendedOrInactive ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleLock(user)}
              >
                {isLocked ? (
                  <>
                    <Unlock className="h-3.5 w-3.5" /> Unlock user
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" /> Lock user
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section className="space-y-4">
            <SectionHeading icon={ShieldCheck} title="Identity" />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item label="NID" value={user.nid} mono />
              <Item label="MSISDN" value={user.msisdn} mono />
              <Item label="Wallet ID" value={user.walletId} mono />
              <Item label="Customer type" value={user.customerType} />
              <Item label="Email" value={user.email} icon={Mail} />
              <Item label="Phone" value={user.phone} icon={Phone} />
              <Item
                label="Location"
                value={`${user.city}, ${user.country}`}
                icon={MapPin}
              />
              <Item label="Joined" value={formatDate(user.joinedAt)} />
            </dl>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Active sources
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeChannels.length > 0 ? (
                  activeChannels.map((ch) => (
                    <EntrySourceBadge key={ch} source={ch} />
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No source channels mapped.
                  </span>
                )}
              </div>
            </div>
          </section>

          <Separator className="my-6" />

          <section className="space-y-4">
            <SectionHeading icon={Sparkles} title="Loyalty snapshot" />
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={Wallet}
                accent="navy"
                label="Points balance"
                value={formatNumber(user.pointsBalance)}
                hint="pts available right now"
              />
              <StatTile
                icon={Coins}
                accent="amber"
                label="Lifetime earned"
                value={formatNumber(user.lifetimePoints)}
                hint="cumulative earn"
              />
              <StatTile
                icon={Gift}
                accent="cyan"
                label="Lifetime redeemed"
                value={formatNumber(
                  Math.max(0, user.lifetimePoints - user.pointsBalance - 1000)
                )}
                hint="redeemed across rewards"
              />
              <StatTile
                icon={Activity}
                accent="emerald"
                label="Last activity"
                value={formatRelative(user.lastActivityAt)}
                hint={formatDateTime(user.lastActivityAt)}
              />
            </div>
          </section>

          <Separator className="my-6" />

          <section className="space-y-4">
            <SectionHeading icon={Crown} title="Tier progress" />
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Current tier
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {tier.name} · {tier.multiplier}× points
                  </p>
                </div>
                {nextTier ? (
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Next tier
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {nextTier.name}
                    </p>
                  </div>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    Top tier
                  </span>
                )}
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-navy-900 to-cyan-500"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>{formatCompact(tier.threshold)} pts</span>
                <span>{tierProgress}%</span>
                <span>
                  {nextTier
                    ? `${formatCompact(nextTier.threshold)} pts`
                    : "Max"}
                </span>
              </div>
            </div>
          </section>

          <Separator className="my-6" />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <SectionHeading icon={Database} title="Activity" inline />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "ledger", label: "Points ledger", count: ledger.length },
                  {
                    id: "redemptions",
                    label: "Redemption history",
                    count: redemptions.length,
                  },
                  {
                    id: "actions",
                    label: "Admin actions",
                    count: userActions.length,
                  },
                ] as const
              ).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setTab(entry.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    tab === entry.id
                      ? "border-navy-900 bg-navy-900 text-white"
                      : "border-border/60 bg-card text-foreground hover:bg-secondary"
                  )}
                >
                  {entry.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] font-semibold",
                      tab === entry.id
                        ? "bg-white/20 text-white"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {entry.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {tab === "ledger" &&
                (ledger.length === 0 ? (
                  <EmptyState
                    title="No ledger entries"
                    description="There are no earn, redeem, or adjustment events for this user yet."
                  />
                ) : (
                  <ul className="space-y-2">
                    {ledger.map((entry) => (
                      <TxnRow key={entry.id} entry={entry} />
                    ))}
                  </ul>
                ))}

              {tab === "redemptions" &&
                (redemptions.length === 0 ? (
                  <EmptyState
                    title="No redemptions yet"
                    description="The user hasn't redeemed any rewards in the mock history."
                  />
                ) : (
                  <ul className="space-y-2">
                    {redemptions.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-lg border border-border/60 bg-card p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">
                            {r.rewardTitle}
                          </p>
                          <StatusBadge
                            label={r.status}
                            tone={
                              r.status === "completed"
                                ? "success"
                                : r.status === "pending"
                                ? "warning"
                                : "danger"
                            }
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>{formatNumber(r.points)} pts</span>
                          <span aria-hidden>·</span>
                          <span>{formatDateTime(r.occurredAt)}</span>
                          {r.couponCode ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="font-mono">
                                {r.couponCode}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ))}

              {tab === "actions" &&
                (userActions.length === 0 ? (
                  <EmptyState
                    title="No admin actions yet"
                    description="Manual adjustments, locks, and unlocks you perform will be recorded here."
                  />
                ) : (
                  <ul className="space-y-2">
                    {userActions.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-border/60 bg-card p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">
                            {a.action === "points_added"
                              ? "Added points"
                              : a.action === "points_reversed"
                              ? "Reversed points"
                              : a.action === "locked"
                              ? "Locked user"
                              : "Unlocked user"}
                          </p>
                          {typeof a.points === "number" ? (
                            <span className="text-sm font-semibold text-foreground">
                              {a.points > 0 ? "+" : ""}
                              {formatNumber(a.points)} pts
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reason: {a.reason}
                          {a.note ? ` · ${a.note}` : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>by {a.actor}</span>
                          <span aria-hidden>·</span>
                          <span>{formatDateTime(a.occurredAt)}</span>
                          {a.notifyUser ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Notified
                              </span>
                            </>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  inline = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-900/5 text-navy-900">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        {title}
      </h3>
    </div>
  );
}

function Item({
  label,
  value,
  mono = false,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground",
          mono && "font-mono"
        )}
      >
        {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
        {value}
      </dd>
    </div>
  );
}

function StatTile({
  icon: Icon,
  accent,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: "navy" | "cyan" | "amber" | "emerald" | "rose" | "violet";
  label: string;
  value: string;
  hint?: string;
}) {
  const accentMap: Record<typeof accent, string> = {
    navy: "bg-navy-900/5 text-navy-900",
    cyan: "bg-cyan-50 text-cyan-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            accentMap[accent]
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-base font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
