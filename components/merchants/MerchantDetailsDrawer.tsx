"use client";

import * as React from "react";
import {
  AlertCircle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  Edit3,
  History,
  Info,
  Mail,
  Phone,
  Plug,
  Power,
  Lock,
  ShieldCheck,
  ShieldX,
  Store,
  Ticket,
  TrendingUp,
  XCircle,
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
import { describeMerchantCapability } from "@/lib/merchantEligibility";
import { cn, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type {
  AdminAuditEntry,
  MerchantApiEnabled,
  MerchantKycStatus,
  MerchantOnboarding,
  MerchantOnboardingStatus,
  MerchantType,
} from "@/types/loyalty";

import { useMerchants } from "./MerchantsProvider";

const TYPE_LABEL: Record<MerchantType, string> = {
  INTERNAL: "Internal",
  EXTERNAL: "External",
  PARTNER: "Partner",
};

const KYC_TONE: Record<MerchantKycStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const STATUS_TONE: Record<MerchantOnboardingStatus, "success" | "neutral"> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
};

export interface MerchantDetailsDrawerProps {
  merchant: MerchantOnboarding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (merchant: MerchantOnboarding) => void;
  onToggleStatus: (merchant: MerchantOnboarding) => void;
  onKycAction: (merchant: MerchantOnboarding) => void;
}

export function MerchantDetailsDrawer({
  merchant,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
  onKycAction,
}: MerchantDetailsDrawerProps) {
  const {
    canEdit,
    canApproveKyc,
    vouchersForMerchant,
    performanceForMerchant,
  } = useMerchants();
  const [auditEntries, setAuditEntries] = React.useState<AdminAuditEntry[]>([]);

  React.useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("loyalty.adminAudit");
      if (raw) {
        setAuditEntries(JSON.parse(raw) as AdminAuditEntry[]);
      } else {
        setAuditEntries([]);
      }
    } catch {
      setAuditEntries([]);
    }
  }, [open, merchant?.id]);

  if (!merchant) return null;

  const capability = describeMerchantCapability(merchant);
  const vouchers = vouchersForMerchant(merchant.id);
  const performance = performanceForMerchant(merchant.id);
  const merchantAudit = auditEntries
    .filter(
      (e) =>
        e.target === merchant.merchantId ||
        (e.target && e.target.includes(merchant.merchantId))
    )
    .slice(0, 12);

  const isInactive = merchant.status === "INACTIVE";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              <Store className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">
                {merchant.merchantName}
              </SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono">{merchant.merchantId}</span>
                <span aria-hidden>·</span>
                <span>{TYPE_LABEL[merchant.merchantType]}</span>
                <span aria-hidden>·</span>
                <StatusBadge
                  label={isInactive ? "Inactive" : "Active"}
                  tone={STATUS_TONE[merchant.status]}
                />
              </SheetDescription>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canEdit ? (
              <Button size="sm" variant="outline" onClick={() => onEdit(merchant)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit merchant
              </Button>
            ) : null}
            {canApproveKyc ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onKycAction(merchant)}
              >
                {merchant.kycStatus === "APPROVED" ? (
                  <>
                    <ShieldX className="h-3.5 w-3.5" /> Update KYC
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" /> Review KYC
                  </>
                )}
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                size="sm"
                variant={isInactive ? "default" : "destructive"}
                onClick={() => onToggleStatus(merchant)}
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
          <Section
            icon={Info}
            title="Merchant overview"
            action={
              <span className="text-[11px] text-muted-foreground">
                Updated {formatDate(merchant.updatedAt)}
              </span>
            }
          >
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Merchant ID" value={merchant.merchantId} mono />
              <Item label="Merchant type" value={TYPE_LABEL[merchant.merchantType]} />
              <Item label="API enabled" value={merchant.apiEnabled} />
              <Item
                label="KYC status"
                value={
                  <StatusBadge
                    label={merchant.kycStatus}
                    tone={KYC_TONE[merchant.kycStatus]}
                    icon={
                      merchant.kycStatus === "APPROVED" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : merchant.kycStatus === "REJECTED" ? (
                        <XCircle className="h-3 w-3" />
                      ) : undefined
                    }
                  />
                }
              />
              <Item label="Status" value={isInactive ? "Inactive" : "Active"} />
              <Item label="Created" value={formatDate(merchant.createdAt)} />
            </dl>
          </Section>

          <Separator className="my-6" />

          <Section icon={Building2} title="Contact details">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-navy-900">
                  <Award className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact person
                  </p>
                  <p className="font-medium text-foreground">
                    {merchant.contactPerson || "—"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-navy-900">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact email
                  </p>
                  <p className="font-medium text-foreground">
                    {merchant.contactEmail || "—"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-navy-900">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Contact number
                  </p>
                  <p className="font-medium text-foreground">
                    {merchant.contactNumber || "—"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-navy-900">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Location
                  </p>
                  <p className="font-medium text-foreground">
                    {merchant.city ?? "—"}
                  </p>
                </div>
              </li>
            </ul>
          </Section>

          <Separator className="my-6" />

          <Section icon={Plug} title="Voucher capability">
            <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  label={merchant.apiEnabled === "YES" ? "API enabled" : "API disabled"}
                  tone={merchant.apiEnabled === "YES" ? "info" : "neutral"}
                  icon={
                    merchant.apiEnabled === "YES" ? (
                      <Plug className="h-3 w-3" />
                    ) : undefined
                  }
                />
                <StatusBadge
                  label={`KYC · ${merchant.kycStatus}`}
                  tone={KYC_TONE[merchant.kycStatus]}
                />
                <StatusBadge
                  label={isInactive ? "Inactive" : "Active"}
                  tone={STATUS_TONE[merchant.status]}
                />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <CapabilityCard
                  label="Inventory voucher"
                  enabled={capability.canCreateInventoryVoucher}
                  description="Stocks the marketplace with a fixed inventory pool."
                />
                <CapabilityCard
                  label="API voucher"
                  enabled={capability.canCreateApiVoucher}
                  description="Issues vouchers through a partner API endpoint."
                  icon={<Plug className="h-3.5 w-3.5" />}
                />
              </div>
              {capability.reasons.length > 0 ? (
                <ul className="mt-3 space-y-1 text-[11px] text-rose-600">
                  {capability.reasons.map((r) => (
                    <li key={r}>· {r}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Section>

          <Separator className="my-6" />

          <Section
            icon={Ticket}
            title="Linked vouchers"
            action={
              <span className="text-xs text-muted-foreground">
                {vouchers.length} voucher{vouchers.length === 1 ? "" : "s"}
              </span>
            }
          >
            {vouchers.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No linked vouchers"
                description="Once a voucher is created against this merchant, it will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {vouchers.map((v) => {
                  const usage =
                    v.issued > 0
                      ? Math.round((v.redeemed / v.issued) * 100)
                      : 0;
                  return (
                    <li
                      key={v.id}
                      className="rounded-lg border border-border/60 bg-card p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {v.name}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {v.code}
                          </p>
                        </div>
                        <StatusBadge
                          label={v.status}
                          tone={
                            v.status === "active"
                              ? "success"
                              : v.status === "expired"
                              ? "danger"
                              : v.status === "disabled"
                              ? "neutral"
                              : "warning"
                          }
                        />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span>
                          {formatNumber(v.redeemed)} / {formatNumber(v.issued)}{" "}
                          redeemed
                        </span>
                        <span aria-hidden>·</span>
                        <span>Usage {usage}%</span>
                        <span aria-hidden>·</span>
                        <span>Cost {formatNumber(v.pointsCost)} pts</span>
                        <span aria-hidden>·</span>
                        <span>Expires {formatDate(v.expiresAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Separator className="my-6" />

          <Section icon={TrendingUp} title="Redemption performance">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                label="Total"
                value={performance.totalRedemptions}
                tone="navy"
              />
              <Stat
                label="Successful"
                value={performance.successful}
                tone="emerald"
              />
              <Stat label="Failed" value={performance.failed} tone="rose" />
              <Stat
                label="Value"
                value={performance.redemptionValue}
                tone="cyan"
              />
            </div>
            {performance.mostRedeemed ? (
              <div className="mt-3 rounded-md border border-border/60 bg-card p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Most redeemed voucher
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {performance.mostRedeemed.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatNumber(performance.mostRedeemed.redeemed)} redemptions ·{" "}
                  {formatNumber(performance.mostRedeemed.pointsCost)} pts cost
                </p>
              </div>
            ) : null}
          </Section>

          <Separator className="my-6" />

          <Section icon={ShieldCheck} title="KYC details">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item
                label="Document on file"
                value={merchant.kycDocumentName || "Not submitted"}
                mono={!!merchant.kycDocumentName}
              />
              <Item
                label="KYC status"
                value={
                  <StatusBadge
                    label={merchant.kycStatus}
                    tone={KYC_TONE[merchant.kycStatus]}
                  />
                }
              />
              <Item
                label="Approved by"
                value={merchant.approvedBy ?? "—"}
              />
              <Item
                label="Approved at"
                value={
                  merchant.approvedAt ? formatDateTime(merchant.approvedAt) : "—"
                }
              />
              <Item
                label="Rejected by"
                value={merchant.rejectedBy ?? "—"}
              />
              <Item
                label="Rejected at"
                value={
                  merchant.rejectedAt ? formatDateTime(merchant.rejectedAt) : "—"
                }
              />
            </dl>
            {merchant.kycRemarks ? (
              <div className="mt-3 rounded-md border border-border/60 bg-secondary/30 p-3 text-xs text-foreground">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  KYC remarks
                </p>
                <p className="mt-0.5">{merchant.kycRemarks}</p>
              </div>
            ) : null}
          </Section>

          <Separator className="my-6" />

          <Section
            icon={History}
            title="Recent changes"
            action={
              <span className="text-xs text-muted-foreground">
                {merchantAudit.length} entries
              </span>
            }
          >
            {merchantAudit.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No audit history yet"
                description="Edits, KYC changes, and status updates made to this merchant will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {merchantAudit.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {entry.action.replace(/_/g, " ")}
                      </p>
                      <StatusBadge
                        label={entry.status}
                        tone={
                          entry.status === "success"
                            ? "success"
                            : entry.status === "warning"
                            ? "warning"
                            : entry.status === "error"
                            ? "danger"
                            : "info"
                        }
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.details}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {entry.actor} · {formatDateTime(entry.occurredAt)}
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

function Item({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-sm font-medium text-foreground",
          mono && "font-mono"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function CapabilityCard({
  label,
  enabled,
  description,
  icon,
}: {
  label: string;
  enabled: boolean;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        enabled
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-rose-200 bg-rose-50/40"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <StatusBadge
          label={enabled ? "Allowed" : "Blocked"}
          tone={enabled ? "success" : "danger"}
        />
      </div>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        {icon}
        {description}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  tone: "navy" | "emerald" | "rose" | "cyan";
  suffix?: string;
}) {
  const toneStyles: Record<typeof tone, string> = {
    navy: "bg-navy-900/5 text-navy-900",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    cyan: "bg-cyan-50 text-cyan-700",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
      <div
        className={cn(
          "mx-auto mb-1 inline-flex h-7 items-center justify-center rounded-md px-2 text-xs font-semibold",
          toneStyles[tone]
        )}
      >
        {value}
        {suffix ? <span className="ml-0.5 text-[10px]">{suffix}</span> : null}
      </div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
