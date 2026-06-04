"use client";

import * as React from "react";
import {
  Award,
  BadgeCheck,
  Check,
  Clock,
  Coins,
  Crown,
  Edit3,
  Gem,
  Gift,
  History,
  Layers,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Unlock,
  Users as UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
import { TIER_BENEFITS } from "@/types/loyalty";
import { cn, formatCompact, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type { AdminAuditEntry, Tier, TierIconName } from "@/types/loyalty";

import { useTiers } from "./TiersProvider";

const ICONS: Record<TierIconName, LucideIcon> = {
  Shield,
  Sparkles,
  Award,
  Crown,
  Gem,
  Star,
  Trophy,
  BadgeCheck,
};

const UPGRADE_RULE_LABEL: Record<string, string> = {
  lifetime_points: "Lifetime points",
  lifetime_spend: "Lifetime spend",
  monthly_spend: "Monthly spend",
  manual: "Manual upgrade",
};

export interface TierDetailsDrawerProps {
  tier: Tier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (tier: Tier) => void;
  onToggleStatus: (tier: Tier) => void;
}

export function TierDetailsDrawer({
  tier,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
}: TierDetailsDrawerProps) {
  const {
    canEdit,
    countUsersInTier,
    rewardsEligibleFor,
    rewardsLockedFor,
    usersInTier,
    overrides,
  } = useTiers();

  // Pull the latest known audit log from localStorage so the audit panel
  // updates alongside other components without coupling the provider.
  const [auditEntries, setAuditEntries] = React.useState<AdminAuditEntry[]>([]);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("loyalty.adminAudit");
      if (raw) setAuditEntries(JSON.parse(raw) as AdminAuditEntry[]);
    } catch {
      setAuditEntries([]);
    }
  }, [open]);

  if (!tier) return null;

  const Icon = ICONS[tier.iconName ?? "Shield"];
  const isInactive = (tier.status ?? "ACTIVE") === "INACTIVE";
  const userCount = countUsersInTier(tier.id);
  const eligible = rewardsEligibleFor(tier.id);
  const locked = rewardsLockedFor(tier.id);
  const sampleUsers = usersInTier(tier.id, 4);
  const overrideCount = overrides.filter((o) => o.tierId === tier.id).length;
  const tierAudit = auditEntries.filter(
    (e) => e.target === tier.id || e.target?.includes(`->${tier.id}`)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-soft"
              style={{ backgroundColor: tier.color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{tier.name}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono">{tier.id}</span>
                <span aria-hidden>·</span>
                <StatusBadge
                  label={isInactive ? "Inactive" : "Active"}
                  tone={isInactive ? "neutral" : "success"}
                />
                <StatusBadge
                  label={`Rank ${tier.rank}`}
                  tone="accent"
                />
              </SheetDescription>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canEdit ? (
              <Button size="sm" variant="outline" onClick={() => onEdit(tier)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit tier
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                size="sm"
                variant={isInactive ? "default" : "destructive"}
                onClick={() => onToggleStatus(tier)}
              >
                {isInactive ? (
                  <>
                    <Unlock className="h-3.5 w-3.5" /> Activate
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
          <Section icon={ShieldCheck} title="Tier overview">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Threshold type" value={tier.thresholdType ?? "POINTS"} />
              <Item
                label="Threshold value"
                value={`${formatNumber(tier.threshold)} ${(tier.thresholdType ?? "POINTS").toLowerCase()}`}
              />
              <Item
                label="Upgrade rule"
                value={
                  UPGRADE_RULE_LABEL[tier.upgradeRule ?? "lifetime_points"] ??
                  "Lifetime points"
                }
              />
              <Item
                label="Earning multiplier"
                value={`${tier.multiplier.toFixed(2)}×`}
              />
              <Item label="Badge label" value={tier.badgeLabel ?? "—"} />
              <Item
                label="Last updated"
                value={tier.lastUpdated ? formatDateTime(tier.lastUpdated) : "—"}
              />
            </dl>
            {tier.notes ? (
              <p className="mt-3 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Notes · </span>
                {tier.notes}
              </p>
            ) : null}
          </Section>

          <Separator className="my-6" />

          <Section icon={Gift} title="Benefits">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(tier.benefits ?? []).map((id) => {
                const meta = TIER_BENEFITS.find((b) => b.id === id);
                if (!meta) return null;
                return (
                  <div
                    key={id}
                    className="rounded-lg border border-border/60 bg-card p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {meta.description}
                    </p>
                  </div>
                );
              })}
            </div>
            {tier.redemptionBenefit ? (
              <div className="mt-3 rounded-lg border border-navy-900/20 bg-navy-900/5 p-3 text-sm text-foreground">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Redemption benefit
                </p>
                <p className="mt-1 text-sm">{tier.redemptionBenefit}</p>
              </div>
            ) : null}
          </Section>

          <Separator className="my-6" />

          <Section
            icon={UsersIcon}
            title="User distribution"
            action={
              <span className="text-xs text-muted-foreground">
                {userCount} members
                {overrideCount > 0 ? ` · ${overrideCount} manual override${overrideCount > 1 ? "s" : ""}` : ""}
              </span>
            }
          >
            {sampleUsers.length === 0 ? (
              <EmptyState
                title="No members on this tier"
                description="No members are currently mapped to this tier. New assignments will appear here automatically."
              />
            ) : (
              <ul className="space-y-2">
                {sampleUsers.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900/5 text-xs font-semibold text-navy-900">
                      {u.fullName
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {u.fullName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.msisdn} ·{" "}
                        {formatCompact(u.lifetimePoints)} lifetime pts
                      </p>
                    </div>
                    <StatusBadge
                      label={u.status}
                      tone={
                        u.status === "active"
                          ? "success"
                          : u.status === "locked"
                          ? "warning"
                          : "neutral"
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Separator className="my-6" />

          <Section
            icon={Coins}
            title="Reward eligibility"
            action={
              <span className="text-xs text-muted-foreground">
                {eligible.length} eligible · {locked.length} locked
              </span>
            }
          >
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Eligible rewards
              </p>
              {eligible.length === 0 ? (
                <p className="rounded-md border border-dashed border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                  No rewards are currently configured for this tier.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {eligible.slice(0, 12).map((r) => (
                    <StatusBadge key={r.id} label={r.title} tone="success" />
                  ))}
                  {eligible.length > 12 ? (
                    <StatusBadge
                      label={`+${eligible.length - 12} more`}
                      tone="neutral"
                    />
                  ) : null}
                </div>
              )}
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Locked rewards
              </p>
              {locked.length === 0 ? (
                <p className="rounded-md border border-dashed border-border/60 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                  No higher-tier rewards to lock.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {locked.slice(0, 12).map((r) => (
                    <StatusBadge
                      key={r.id}
                      label={r.title}
                      tone="warning"
                      icon={<Lock className="h-3 w-3" />}
                    />
                  ))}
                  {locked.length > 12 ? (
                    <StatusBadge
                      label={`+${locked.length - 12} more`}
                      tone="neutral"
                    />
                  ) : null}
                </div>
              )}
            </div>
          </Section>

          <Separator className="my-6" />

          <Section
            icon={History}
            title="Recent changes"
            action={
              <span className="text-xs text-muted-foreground">
                {tierAudit.length} entries
              </span>
            }
          >
            {tierAudit.length === 0 ? (
              <EmptyState
                title="No audit history yet"
                description="Edits and status changes made to this tier will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {tierAudit.slice(0, 8).map((e) => (
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
  icon: LucideIcon;
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
