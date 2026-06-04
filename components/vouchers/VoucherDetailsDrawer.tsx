"use client";

import * as React from "react";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  ExternalLink,
  History,
  Info,
  Lock,
  Package,
  Plug,
  Power,
  PlayCircle,
  ShieldCheck,
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
import { loadAuditLog } from "@/lib/audit";
import {
  computeStockHealth,
  computeVoucherEligibility,
  isVoucherExpired,
} from "@/lib/voucherEligibility";
import { cn, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import type {
  AdminAuditEntry,
  CouponCode,
  CouponCodeStatus,
  MerchantOnboarding,
  VoucherManagement,
  VoucherManagementMode,
  VoucherManagementStatus,
  VoucherStockHealth,
} from "@/types/loyalty";

import { useVouchers } from "./VouchersProvider";

const MODE_LABEL: Record<VoucherManagementMode, string> = {
  INVENTORY: "Inventory",
  API: "API",
};

const STATUS_TONE: Record<VoucherManagementStatus, "success" | "neutral"> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
};

const COUPON_TONE: Record<CouponCodeStatus, "success" | "info" | "neutral" | "danger"> = {
  AVAILABLE: "success",
  ASSIGNED: "info",
  REDEEMED: "neutral",
  EXPIRED: "danger",
};

const HEALTH_TONE: Record<
  VoucherStockHealth,
  "success" | "warning" | "danger" | "info"
> = {
  HEALTHY: "success",
  WATCH: "warning",
  CRITICAL: "danger",
  OUT_OF_STOCK: "danger",
  API: "info",
};

const HEALTH_LABEL: Record<VoucherStockHealth, string> = {
  HEALTHY: "Healthy",
  WATCH: "Watch",
  CRITICAL: "Critical",
  OUT_OF_STOCK: "Out of stock",
  API: "API based",
};

export interface VoucherDetailsDrawerProps {
  voucher: VoucherManagement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (voucher: VoucherManagement) => void;
  onToggleStatus: (voucher: VoucherManagement) => void;
  onManageInventory: (voucher: VoucherManagement) => void;
  onTestApi: (voucher: VoucherManagement) => void;
}

export function VoucherDetailsDrawer({
  voucher,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
  onManageInventory,
  onTestApi,
}: VoucherDetailsDrawerProps) {
  const { canEdit, canManageInventory, canTestApi, merchantFor } = useVouchers();
  const [auditEntries, setAuditEntries] = React.useState<AdminAuditEntry[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setAuditEntries(loadAuditLog());
  }, [open, voucher?.id]);

  if (!voucher) return null;
  const isInactive = voucher.status === "INACTIVE";
  const isInventory = voucher.voucherMode === "INVENTORY";
  const isApi = voucher.voucherMode === "API";
  const merchant: MerchantOnboarding | null = merchantFor(voucher.merchantId) ?? null;
  const health = computeStockHealth(voucher);
  const eligibility = computeVoucherEligibility(voucher, merchant);
  const expired = isVoucherExpired(voucher.expiryDate);

  const totalAvailable = voucher.couponCodes.filter(
    (c) => c.status === "AVAILABLE"
  ).length;
  const totalAssigned = voucher.couponCodes.filter(
    (c) => c.status === "ASSIGNED"
  ).length;
  const totalRedeemed = voucher.couponCodes.filter(
    (c) => c.status === "REDEEMED"
  ).length;
  const totalExpired = voucher.couponCodes.filter(
    (c) => c.status === "EXPIRED"
  ).length;
  const usagePct =
    voucher.totalInventory > 0
      ? Math.round(
          ((voucher.totalInventory - voucher.remainingInventory) /
            voucher.totalInventory) *
            100
        )
      : 0;

  const recentCodes: CouponCode[] = voucher.couponCodes
    .slice()
    .sort((a, b) => {
      const at = a.redeemedAt ?? a.assignedAt ?? "";
      const bt = b.redeemedAt ?? b.assignedAt ?? "";
      return new Date(bt).getTime() - new Date(at).getTime();
    })
    .slice(0, 8);

  const voucherAudit = auditEntries
    .filter(
      (e) =>
        e.target === voucher.voucherId ||
        (e.target && e.target.includes(voucher.voucherId))
    )
    .slice(0, 12);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              <Ticket className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{voucher.voucherTitle}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono">{voucher.voucherId}</span>
                <span aria-hidden>·</span>
                <span>{voucher.merchantName}</span>
                <span aria-hidden>·</span>
                <span>{MODE_LABEL[voucher.voucherMode]}</span>
                <span aria-hidden>·</span>
                <StatusBadge
                  label={isInactive ? "Inactive" : "Active"}
                  tone={STATUS_TONE[voucher.status]}
                />
              </SheetDescription>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canEdit ? (
              <Button size="sm" variant="outline" onClick={() => onEdit(voucher)}>
                <Edit3 className="h-3.5 w-3.5" /> Edit voucher
              </Button>
            ) : null}
            {isInventory && canManageInventory ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onManageInventory(voucher)}
              >
                <Boxes className="h-3.5 w-3.5" /> Manage inventory
              </Button>
            ) : null}
            {isApi && canTestApi ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTestApi(voucher)}
              >
                <PlayCircle className="h-3.5 w-3.5" /> Test API
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                size="sm"
                variant={isInactive ? "default" : "destructive"}
                onClick={() => onToggleStatus(voucher)}
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
            title="Voucher overview"
            action={
              <span className="text-[11px] text-muted-foreground">
                Updated {formatDate(voucher.updatedAt)}
              </span>
            }
          >
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Item label="Voucher ID" value={voucher.voucherId} mono />
              <Item label="Voucher title" value={voucher.voucherTitle} />
              <Item label="Merchant" value={voucher.merchantName} />
              <Item
                label="Merchant type"
                value={merchant?.merchantType ?? "Unknown"}
              />
              <Item label="Mode" value={MODE_LABEL[voucher.voucherMode]} />
              <Item
                label="Value"
                value={`$${formatNumber(voucher.voucherValue)}`}
              />
              <Item label="Expiry" value={formatDate(voucher.expiryDate)} />
              <Item
                label="Status"
                value={
                  <StatusBadge
                    label={isInactive ? "Inactive" : "Active"}
                    tone={STATUS_TONE[voucher.status]}
                  />
                }
              />
              <Item label="Created" value={formatDate(voucher.createdAt)} />
              <Item label="Last updated" value={formatDate(voucher.updatedAt)} />
            </dl>
            {voucher.description ? (
              <p className="mt-3 rounded-md border border-border/60 bg-secondary/30 px-3 py-2 text-xs text-foreground">
                {voucher.description}
              </p>
            ) : null}
          </Section>

          <Separator className="my-6" />

          <Section icon={ShieldCheck} title="Merchant eligibility">
            {!merchant ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                Linked merchant not found in the directory.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={merchant.status}
                    tone={merchant.status === "ACTIVE" ? "success" : "neutral"}
                  />
                  <StatusBadge
                    label={`KYC · ${merchant.kycStatus}`}
                    tone={
                      merchant.kycStatus === "APPROVED"
                        ? "success"
                        : merchant.kycStatus === "REJECTED"
                        ? "danger"
                        : "warning"
                    }
                  />
                  <StatusBadge
                    label={`API · ${merchant.apiEnabled}`}
                    tone={merchant.apiEnabled === "YES" ? "info" : "neutral"}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <CapabilityCard
                    label="Inventory voucher"
                    enabled={merchant.status === "ACTIVE" && merchant.kycStatus === "APPROVED"}
                    description="Stocks the marketplace with a fixed inventory pool."
                  />
                  <CapabilityCard
                    label="API voucher"
                    enabled={
                      merchant.status === "ACTIVE" &&
                      merchant.kycStatus === "APPROVED" &&
                      merchant.apiEnabled === "YES"
                    }
                    description="Issues codes through a partner API endpoint."
                    icon={<Plug className="h-3.5 w-3.5" />}
                  />
                </div>
              </div>
            )}
          </Section>

          {isInventory ? (
            <>
              <Separator className="my-6" />
              <Section
                icon={Boxes}
                title="Inventory details"
                action={
                  <span className="text-xs text-muted-foreground">
                    {voucher.totalInventory} codes on file
                  </span>
                }
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Total" value={voucher.totalInventory} tone="navy" />
                  <Stat label="Available" value={totalAvailable} tone="emerald" />
                  <Stat label="Assigned" value={totalAssigned} tone="info" />
                  <Stat label="Redeemed" value={totalRedeemed} tone="rose" />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-border/60 bg-card p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Stock health
                    </p>
                    <p className="mt-1">
                      <StatusBadge
                        label={HEALTH_LABEL[health]}
                        tone={HEALTH_TONE[health]}
                      />
                    </p>
                    {expired ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-rose-600">
                        <XCircle className="h-3 w-3" /> Expired
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-md border border-border/60 bg-card p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Usage
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {usagePct}% consumed
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatNumber(voucher.remainingInventory)} codes remaining
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Recent coupon activity
                  </p>
                  {recentCodes.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title="No coupon codes yet"
                      description="Use the Manage inventory action to upload codes."
                    />
                  ) : (
                    <ul className="space-y-1.5">
                      {recentCodes.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5"
                        >
                          <span className="font-mono text-[12px] text-foreground">
                            {c.code}
                          </span>
                          <StatusBadge
                            label={c.status}
                            tone={COUPON_TONE[c.status]}
                          />
                          {c.redeemedAt ? (
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(c.redeemedAt)}
                            </span>
                          ) : c.assignedAt ? (
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(c.assignedAt)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Section>
            </>
          ) : null}

          {isApi ? (
            <>
              <Separator className="my-6" />
              <Section icon={Plug} title="API details">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Item
                    label="API config"
                    value={voucher.apiConfigName ?? "—"}
                  />
                  <Item
                    label="Auth type"
                    value={voucher.apiAuthType ?? "—"}
                  />
                  <Item
                    label="Timeout"
                    value={
                      voucher.apiTimeoutMs ? `${voucher.apiTimeoutMs} ms` : "—"
                    }
                  />
                  <Item
                    label="Retry count"
                    value={voucher.apiRetryCount != null ? String(voucher.apiRetryCount) : "—"}
                  />
                  <Item
                    label="Last test"
                    value={
                      voucher.lastApiTestStatus ? (
                        <StatusBadge
                          label={voucher.lastApiTestStatus}
                          tone={
                            voucher.lastApiTestStatus === "SUCCESS"
                              ? "success"
                              : "danger"
                          }
                          icon={
                            voucher.lastApiTestStatus === "SUCCESS" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )
                          }
                        />
                      ) : (
                        "Never tested"
                      )
                    }
                  />
                  <Item
                    label="Last test at"
                    value={
                      voucher.lastApiTestAt
                        ? formatDateTime(voucher.lastApiTestAt)
                        : "—"
                    }
                  />
                </dl>
                {voucher.apiEndpoint ? (
                  <p className="mt-3 flex items-center gap-1 rounded-md border border-border/60 bg-card px-3 py-2 text-xs text-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <span className="font-mono">{voucher.apiEndpoint}</span>
                  </p>
                ) : null}
                {voucher.lastApiTestMessage ? (
                  <div className="mt-3 rounded-md border border-border/60 bg-secondary/30 p-3 text-xs text-foreground">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Mock response
                    </p>
                    <p className="mt-1">{voucher.lastApiTestMessage}</p>
                  </div>
                ) : null}
              </Section>
            </>
          ) : null}

          <Separator className="my-6" />

          <Section
            icon={TrendingUp}
            title="Redemption performance"
            action={
              eligibility.eligible ? (
                <StatusBadge label="Campaign ready" tone="success" />
              ) : (
                <StatusBadge label="Not eligible" tone="danger" />
              )
            }
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Total assignments" value={totalAssigned} tone="navy" />
              <Stat label="Successful" value={totalRedeemed} tone="emerald" />
              <Stat label="Failed" value={0} tone="rose" />
              <Stat label="Pending" value={0} tone="cyan" />
            </div>
            {!eligibility.eligible ? (
              <ul className="mt-3 space-y-1 text-[11px] text-rose-600">
                {eligibility.reasons.map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-[11px] text-muted-foreground">
              {totalExpired > 0
                ? `${formatNumber(totalExpired)} coupon code(s) marked as EXPIRED.`
                : "No expired codes on file."}
            </p>
          </Section>

          <Separator className="my-6" />

          <Section
            icon={History}
            title="Recent changes"
            action={
              <span className="text-xs text-muted-foreground">
                {voucherAudit.length} entries
              </span>
            }
          >
            {voucherAudit.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No audit history yet"
                description="Edits, status changes, inventory updates, and API tests will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {voucherAudit.map((entry) => (
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

          {merchant ? (
            <>
              <Separator className="my-6" />
              <Section icon={Store} title="Merchant summary">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Item label="Merchant" value={merchant.merchantName} />
                  <Item label="Merchant ID" value={merchant.merchantId} mono />
                  <Item
                    label="Contact"
                    value={merchant.contactEmail || merchant.contactPerson || "—"}
                  />
                  <Item label="City" value={merchant.city ?? "—"} />
                </dl>
              </Section>
            </>
          ) : null}
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
}: {
  label: string;
  value: number;
  tone: "navy" | "emerald" | "rose" | "cyan" | "info";
}) {
  const toneStyles: Record<typeof tone, string> = {
    navy: "bg-navy-900/5 text-navy-900",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    cyan: "bg-cyan-50 text-cyan-700",
    info: "bg-sky-50 text-sky-700",
  };
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
      <div
        className={cn(
          "mx-auto mb-1 inline-flex h-7 min-w-[2rem] items-center justify-center rounded-md px-2 text-xs font-semibold",
          toneStyles[tone]
        )}
      >
        {value}
      </div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
