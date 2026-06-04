"use client";

import * as React from "react";
import {
  Activity,
  Bell,
  BellOff,
  CalendarClock,
  Check,
  Coins,
  Edit3,
  History,
  Lock,
  PlayCircle,
  Power,
  Sparkles,
  Unlock,
  Users as UsersIcon,
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
import { Separator } from "@/components/ui/separator";
import { EntrySourceBadge } from "@/components/loyalty/EntrySourceBadge";
import { cn, formatCompact, formatDateTime, formatNumber } from "@/lib/utils";
import type { AdminAuditEntry, EarningRule } from "@/types/loyalty";

import { useEarningRules } from "./EarningRulesProvider";

export interface EarningRuleDetailsDrawerProps {
  rule: EarningRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (rule: EarningRule) => void;
  onToggleStatus: (rule: EarningRule) => void;
  onTest: (rule: EarningRule) => void;
}

const SERVICE_LABEL: Record<EarningRule["serviceSource"], string> = {
  SELFCARE: "Selfcare",
  MOOLEE: "Moolee",
  MFAISAA: "M Faisaa",
  OTHER: "Other",
};

const USER_TYPE_LABEL: Record<EarningRule["userType"], string> = {
  PREPAID: "Prepaid",
  POSTPAID: "Postpaid",
  HYBRID: "Hybrid",
  ALL: "All",
};

export function EarningRuleDetailsDrawer({
  rule,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
  onTest,
}: EarningRuleDetailsDrawerProps) {
  const {
    canEdit,
    canApplyEvents,
    eventsForRule,
    totalPointsForRule,
  } = useEarningRules();

  const [auditEntries, setAuditEntries] = React.useState<AdminAuditEntry[]>([]);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("loyalty.adminAudit");
      if (raw) setAuditEntries(JSON.parse(raw) as AdminAuditEntry[]);
    } catch {
      setAuditEntries([]);
    }
  }, [open, rule?.id]);

  if (!rule) return null;

  const isInactive = rule.status === "INACTIVE";
  const matches = eventsForRule(rule.id);
  const totalPoints = totalPointsForRule(rule.id);
  const succeeded = matches.filter(
    (m) => m.transaction.status === "completed"
  ).length;
  const failed = matches.filter(
    (m) => m.transaction.status === "failed" || m.transaction.status === "reversed"
  ).length;
  const lastMatched = matches[0]?.matchedAt;
  const ruleAudit = auditEntries.filter(
    (e) => e.target === rule.id || (e.target && e.target.includes(`->${rule.id}`))
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              <Coins className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate font-mono text-sm">
                {rule.id}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 text-xs">
                <span>
                  {SERVICE_LABEL[rule.serviceSource]} ·{" "}
                  {USER_TYPE_LABEL[rule.userType]}
                </span>
                <span aria-hidden>·</span>
                <StatusBadge
                  label={isInactive ? "Inactive" : "Active"}
                  tone={isInactive ? "neutral" : "success"}
                />
              </SheetDescription>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canEdit ? (
              <Button size="sm" variant="outline" onClick={() => onEdit(rule)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit rule
              </Button>
            ) : null}
            {canApplyEvents ? (
              <Button size="sm" variant="outline" onClick={() => onTest(rule)}>
                <PlayCircle className="h-3.5 w-3.5" /> Test rule
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                size="sm"
                variant={isInactive ? "default" : "destructive"}
                onClick={() => onToggleStatus(rule)}
              >
                {isInactive ? (
                  <>
                    <Power className="h-3.5 w-3.5" /> Activate
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" /> Deactivate
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Section icon={Sparkles} title="Rule overview">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Service source" value={SERVICE_LABEL[rule.serviceSource]} />
              <Item label="User type" value={USER_TYPE_LABEL[rule.userType]} />
              <Item
                label="Transaction type"
                value={
                  rule.transactionType === "TRANSACTIONAL"
                    ? "Transactional"
                    : "Non-transactional"
                }
              />
              <Item
                label="Event name"
                value={
                  rule.eventName === "Custom Event" && rule.customEventName
                    ? rule.customEventName
                    : rule.eventName
                }
              />
              <Item
                label="Reward type"
                value={rule.rewardType === "POINT" ? "Fixed points" : "Percent"}
              />
              <Item
                label="Reward value"
                value={
                  rule.rewardType === "POINT"
                    ? `${formatNumber(rule.rewardValue)} pts`
                    : `${rule.rewardValue}%`
                }
              />
              <Item
                label="Max transaction amount"
                value={
                  rule.maximumTransactionAmount
                    ? formatNumber(rule.maximumTransactionAmount)
                    : "—"
                }
              />
              <Item
                label="Expiry"
                value={rule.expiryDays ? `${rule.expiryDays} days` : "No expiry"}
              />
            </dl>
          </Section>

          <Separator className="my-6" />

          <Section icon={Activity} title="Calculation logic">
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm text-foreground">
              {rule.rewardType === "POINT" ? (
                <p>
                  Award <span className="font-semibold">{formatNumber(rule.rewardValue)}</span>{" "}
                  fixed loyalty points whenever the event matches.
                </p>
              ) : (
                <p>
                  Award <span className="font-semibold">{rule.rewardValue}%</span> of the
                  qualifying transaction amount.{" "}
                  {rule.maximumTransactionAmount
                    ? `Calculated up to a maximum of ${formatNumber(rule.maximumTransactionAmount)}.`
                    : "No transaction cap configured."}
                </p>
              )}
              {rule.expiryDays ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Earned points will expire after {rule.expiryDays} days.
                </p>
              ) : null}
            </div>
          </Section>

          <Separator className="my-6" />

          <Section
            icon={rule.pushNotification ? Bell : BellOff}
            title="Notification setup"
            action={
              <StatusBadge
                label={rule.pushNotification ? "Enabled" : "Disabled"}
                tone={rule.pushNotification ? "success" : "neutral"}
              />
            }
          >
            {rule.pushNotification ? (
              <p className="rounded-lg border border-border/60 bg-card p-3 text-sm text-foreground">
                {rule.notificationMessage ?? "No message configured."}
              </p>
            ) : (
              <p className="rounded-md border border-dashed border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                Push notifications are disabled for this rule.
              </p>
            )}
          </Section>

          <Separator className="my-6" />

          <Section
            icon={UsersIcon}
            title="Usage summary"
            action={
              <span className="text-xs text-muted-foreground">
                {matches.length} matched events
              </span>
            }
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat
                label="Matched"
                value={matches.length}
                tone="navy"
              />
              <Stat label="Succeeded" value={succeeded} tone="emerald" />
              <Stat label="Failed" value={failed} tone="rose" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-border/60 bg-card p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Total points issued
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {formatNumber(totalPoints)} pts
                </p>
              </div>
              <div className="rounded-md border border-border/60 bg-card p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Last matched
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {lastMatched ? formatDateTime(lastMatched) : "—"}
                </p>
              </div>
            </div>
          </Section>

          <Separator className="my-6" />

          <Section icon={Activity} title="Recent earn events">
            {matches.length === 0 ? (
              <EmptyState
                title="No earn events yet"
                description="Once members trigger this rule, the matched earn events will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {matches.slice(0, 6).map((m) => (
                  <li
                    key={`${m.transaction.id}-${m.matchedAt}`}
                    className="rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {m.transaction.userName}
                      </p>
                      <span className="text-sm font-semibold text-emerald-600">
                        +{formatNumber(m.points)} pts
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <EntrySourceBadge source={m.transaction.channel} />
                      <span>{m.transaction.description}</span>
                      <span aria-hidden>·</span>
                      <span>{formatDateTime(m.matchedAt)}</span>
                    </div>
                    {m.transaction.reference ? (
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        Ref: {m.transaction.reference}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Separator className="my-6" />

          <Section
            icon={History}
            title="Recent changes"
            action={
              <span className="text-xs text-muted-foreground">
                {ruleAudit.length} entries
              </span>
            }
          >
            {ruleAudit.length === 0 ? (
              <EmptyState
                title="No audit history yet"
                description="Edits and status changes made to this rule will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {ruleAudit.slice(0, 8).map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {e.action.replace(/_/g, " ")}
                      </p>
                      <StatusBadge
                        label={e.status}
                        tone={
                          e.status === "success"
                            ? "success"
                            : e.status === "warning"
                            ? "warning"
                            : "info"
                        }
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {e.details}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {e.actor} · {formatDateTime(e.occurredAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-navy-900/5 text-navy-900">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "navy" | "emerald" | "rose";
}) {
  const toneStyles: Record<typeof tone, string> = {
    navy: "bg-navy-900/5 text-navy-900",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div
        className={cn(
          "mx-auto mb-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold",
          toneStyles[tone]
        )}
      >
        {value}
      </div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
