"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardPaste,
  FileSpreadsheet,
  Plug,
  Save,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { MOCK_MERCHANTS } from "@/data/mockMerchants";
import {
  availableVoucherModes,
  computeVoucherEligibility,
  describeVoucherCapability,
} from "@/lib/voucherEligibility";
import { cn, formatDate, formatNumber } from "@/lib/utils";
import type {
  MerchantOnboarding,
  VoucherFormInput,
  VoucherManagement,
  VoucherManagementMode,
  VoucherManagementStatus,
} from "@/types/loyalty";

import { useVouchers } from "./VouchersProvider";

const MODE_OPTIONS: { value: VoucherManagementMode; label: string }[] = [
  { value: "INVENTORY", label: "Inventory" },
  { value: "API", label: "API" },
];

const STATUS_OPTIONS: { value: VoucherManagementStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const DEFAULT_FORM: VoucherFormInput = {
  merchantId: "",
  voucherTitle: "",
  voucherMode: "INVENTORY",
  voucherValue: 25,
  description: "",
  expiryDate: defaultFutureDate(),
  status: "ACTIVE",
  initialCouponCodes: [],
  apiConfigId: "",
};

function defaultFutureDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d.toISOString().slice(0, 10);
}

function formFromVoucher(voucher: VoucherManagement): VoucherFormInput {
  return {
    merchantId: voucher.merchantId,
    voucherTitle: voucher.voucherTitle,
    voucherMode: voucher.voucherMode,
    voucherValue: voucher.voucherValue,
    description: voucher.description,
    expiryDate: voucher.expiryDate.slice(0, 10),
    status: voucher.status,
    initialCouponCodes: [],
    apiConfigId: voucher.apiConfigId ?? "",
  };
}

function parseCodes(text: string): string[] {
  return text
    .split(/\r?\n|,/g)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

export interface VoucherFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingVoucher: VoucherManagement | null;
  onComplete?: (message: string) => void;
}

/**
 * Create/Edit drawer for the Voucher Management module. The form
 * dynamically reacts to the selected merchant's eligibility — KYC
 * status, active state, and API enablement all influence the mode
 * dropdown, the API configuration picker, and the live preview.
 */
export function VoucherFormDrawer({
  open,
  onOpenChange,
  editingVoucher,
  onComplete,
}: VoucherFormDrawerProps) {
  const {
    createVoucher,
    updateVoucher,
    canEdit,
    detectDuplicateTitle,
    apiConfigs,
    merchantFor,
  } = useVouchers();
  const [form, setForm] = React.useState<VoucherFormInput>(DEFAULT_FORM);
  const [codesText, setCodesText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [useFileUpload, setUseFileUpload] = React.useState(false);
  const [mockFileName, setMockFileName] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    setCodesText("");
    setMockFileName(null);
    setUseFileUpload(false);
    if (editingVoucher) {
      setForm(formFromVoucher(editingVoucher));
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [open, editingVoucher]);

  const update = <K extends keyof VoucherFormInput>(
    key: K,
    value: VoucherFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const merchant: MerchantOnboarding | null = React.useMemo(
    () => merchantFor(form.merchantId) ?? null,
    [form.merchantId, merchantFor]
  );

  const allowedModes: VoucherManagementMode[] = React.useMemo(
    () => (merchant ? availableVoucherModes(merchant) : []),
    [merchant]
  );

  // If the merchant changes and the current mode is no longer allowed, snap back.
  React.useEffect(() => {
    if (!merchant) return;
    if (allowedModes.length === 0) return;
    if (!allowedModes.includes(form.voucherMode)) {
      update("voucherMode", allowedModes[0]);
    }
  }, [merchant, allowedModes, form.voucherMode]);

  const capability = describeVoucherCapability(
    merchant ?? ({
      id: "",
      merchantId: "",
      merchantName: "",
      merchantType: "INTERNAL",
      contactPerson: "",
      contactEmail: "",
      contactNumber: "",
      apiEnabled: "NO",
      kycDocumentName: "",
      kycStatus: "PENDING",
      status: "INACTIVE",
      createdAt: "",
      updatedAt: "",
      voucherCount: 0,
    } as MerchantOnboarding),
    form.voucherMode
  );

  const previewVoucher: VoucherManagement = React.useMemo(() => {
    const codes = parseCodes(codesText);
    return {
      id: "preview",
      voucherId: editingVoucher?.voucherId ?? "PREVIEW",
      merchantId: form.merchantId || "preview",
      merchantName: merchant?.merchantName ?? "—",
      voucherTitle: form.voucherTitle || "—",
      voucherMode: form.voucherMode,
      voucherValue: Number.isFinite(form.voucherValue) ? form.voucherValue : 0,
      description: form.description,
      expiryDate: form.expiryDate,
      status: form.status,
      totalInventory: codes.length,
      remainingInventory: codes.length,
      couponCodes: [],
      apiConfigId:
        form.voucherMode === "API" ? form.apiConfigId || undefined : undefined,
      apiConfigName:
        form.voucherMode === "API"
          ? apiConfigs.find((c) => c.id === form.apiConfigId)?.name
          : undefined,
      apiEndpoint:
        form.voucherMode === "API"
          ? apiConfigs.find((c) => c.id === form.apiConfigId)?.endpoint
          : undefined,
      apiAuthType:
        form.voucherMode === "API"
          ? apiConfigs.find((c) => c.id === form.apiConfigId)?.authType
          : undefined,
      apiTimeoutMs:
        form.voucherMode === "API"
          ? apiConfigs.find((c) => c.id === form.apiConfigId)?.timeoutMs
          : undefined,
      apiRetryCount:
        form.voucherMode === "API"
          ? apiConfigs.find((c) => c.id === form.apiConfigId)?.retryCount
          : undefined,
      lastApiTestStatus: editingVoucher?.lastApiTestStatus,
      lastApiTestAt: editingVoucher?.lastApiTestAt,
      createdAt: editingVoucher?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [form, codesText, merchant, apiConfigs, editingVoucher]);

  const previewEligibility = computeVoucherEligibility(previewVoucher, merchant);
  const duplicate = React.useMemo(() => {
    if (!form.merchantId || !form.voucherTitle.trim()) return null;
    return detectDuplicateTitle(
      form.voucherTitle,
      form.merchantId,
      editingVoucher?.id
    );
  }, [form.merchantId, form.voucherTitle, editingVoucher?.id, detectDuplicateTitle]);

  const merchantOptions = React.useMemo(
    () =>
      [...MOCK_MERCHANTS].sort((a, b) =>
        a.merchantName.localeCompare(b.merchantName)
      ),
    []
  );

  const handleMockUpload = () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    setMockFileName(`voucher-codes-${stamp}.csv`);
    setUseFileUpload(true);
    // Seed the textarea with a few sample codes if it's empty.
    if (!codesText.trim()) {
      setCodesText(
        `VC-${Math.floor(Math.random() * 9000) + 1000}\nVC-${Math.floor(
          Math.random() * 9000
        ) + 1000}\nVC-${Math.floor(Math.random() * 9000) + 1000}`
      );
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!canEdit) {
      setError("You don't have permission to edit vouchers.");
      return;
    }
    setSubmitting(true);
    const submitInput: VoucherFormInput = {
      ...form,
      initialCouponCodes: parseCodes(codesText),
    };
    const result = editingVoucher
      ? updateVoucher(editingVoucher.id, submitInput)
      : createVoucher(submitInput);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not save voucher.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      editingVoucher
        ? `Updated ${result.voucher?.voucherTitle ?? form.voucherTitle}.`
        : `Created ${result.voucher?.voucherTitle ?? form.voucherTitle} (${result.voucher?.voucherId}).`
    );
  };

  const codes = parseCodes(codesText);
  const isInventory = form.voucherMode === "INVENTORY";
  const isApi = form.voucherMode === "API";
  const merchantInactive = merchant && merchant.status === "INACTIVE";
  const kycPending =
    merchant && (merchant.kycStatus === "PENDING" || merchant.kycStatus === "REJECTED");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              {editingVoucher ? <Save className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
            </span>
            <div>
              <SheetTitle>
                {editingVoucher
                  ? `Edit ${editingVoucher.voucherTitle}`
                  : "Create voucher"}
              </SheetTitle>
              <SheetDescription>
                Configure the voucher, link it to a merchant, and decide
                whether it is inventory-based or API-driven. The preview on
                the right shows live eligibility.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_minmax(0,280px)]">
            <div className="space-y-5 border-b border-border/60 px-6 py-5 md:border-b-0 md:border-r">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    Merchant <span className="text-rose-600">*</span>
                  </Label>
                  <Select
                    value={form.merchantId}
                    onValueChange={(v) => update("merchantId", v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a merchant" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchantOptions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.merchantName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {merchant ? (
                    <p className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
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
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Voucher mode <span className="text-rose-600">*</span>
                  </Label>
                  <Select
                    value={form.voucherMode}
                    onValueChange={(v) =>
                      update("voucherMode", v as VoucherManagementMode)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODE_OPTIONS.map((opt) => {
                        const disabled =
                          merchant != null &&
                          opt.value === "API" &&
                          merchant.apiEnabled !== "YES";
                        return (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            disabled={disabled}
                          >
                            {opt.label}
                            {disabled ? " · Merchant not API enabled" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {merchant && merchant.apiEnabled !== "YES" && isApi ? (
                    <p className="flex items-center gap-1 text-[11px] text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      This merchant is configured for inventory vouchers only.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="voucher-title">
                  Voucher title <span className="text-rose-600">*</span>
                </Label>
                <Input
                  id="voucher-title"
                  value={form.voucherTitle}
                  onChange={(e) => update("voucherTitle", e.target.value)}
                  placeholder="e.g. $25 Coffee Credit"
                  required
                  disabled={!canEdit}
                />
                {duplicate ? (
                  <p className="flex items-center gap-1 text-[11px] text-rose-600">
                    <AlertCircle className="h-3 w-3" />
                    An active voucher with this title already exists for the
                    selected merchant.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-value">Voucher value (USD)</Label>
                  <Input
                    id="voucher-value"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.voucherValue}
                    onChange={(e) =>
                      update("voucherValue", Number(e.target.value))
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-expiry">
                    Expiry date <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="voucher-expiry"
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => update("expiryDate", e.target.value)}
                    required
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="voucher-description">Description</Label>
                <Textarea
                  id="voucher-description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                  placeholder="Describe how the voucher can be redeemed."
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-1.5">
                <Label>
                  Status <span className="text-rose-600">*</span>
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    update("status", v as VoucherManagementStatus)
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.status === "ACTIVE" && merchant ? (
                  <p className="text-[11px] text-muted-foreground">
                    Active vouchers must clear the merchant eligibility checks
                    before they appear in redemption campaigns.
                  </p>
                ) : null}
              </div>

              {isInventory ? (
                <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Coupon codes
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Paste one code per line, or use a mock CSV upload.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Mock CSV
                      </span>
                      <Switch
                        checked={useFileUpload}
                        onCheckedChange={setUseFileUpload}
                        disabled={!canEdit}
                        aria-label="Use mock CSV upload"
                      />
                    </div>
                  </div>
                  {useFileUpload ? (
                    <div className="rounded-md border border-dashed border-border/70 bg-card p-3 text-center text-xs text-muted-foreground">
                      <FileSpreadsheet className="mx-auto mb-1 h-5 w-5 text-cyan-700" />
                      <p>
                        {mockFileName ?? "No file attached"}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={handleMockUpload}
                        disabled={!canEdit}
                      >
                        Mock upload .csv
                      </Button>
                    </div>
                  ) : null}
                  <div className="space-y-1.5">
                    <Label htmlFor="coupon-codes">Coupon codes (one per line)</Label>
                    <Textarea
                      id="coupon-codes"
                      value={codesText}
                      onChange={(e) => setCodesText(e.target.value)}
                      rows={5}
                      placeholder="VC-1000&#10;VC-1001&#10;VC-1002"
                      disabled={!canEdit}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      <ClipboardPaste className="mr-1 inline h-3 w-3" />
                      Detected {codes.length} code{codes.length === 1 ? "" : "s"}. Duplicates are
                      automatically detected and skipped.
                    </p>
                  </div>
                </div>
              ) : null}

              {isApi ? (
                <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
                  <p className="text-sm font-semibold text-foreground">
                    API configuration
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Pick the partner API that will issue voucher codes at
                    redemption time.
                  </p>
                  <div className="space-y-1.5">
                    <Label>
                      API config <span className="text-rose-600">*</span>
                    </Label>
                    <Select
                      value={form.apiConfigId}
                      onValueChange={(v) => update("apiConfigId", v)}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an API configuration" />
                      </SelectTrigger>
                      <SelectContent>
                        {apiConfigs.map((cfg) => (
                          <SelectItem key={cfg.id} value={cfg.id}>
                            {cfg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.apiConfigId ? (
                    <div className="rounded-md border border-border/60 bg-card p-3 text-xs">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Request template
                      </p>
                      <pre className="mt-1 overflow-x-auto rounded-md bg-navy-900/5 p-2 font-mono text-[11px] text-foreground">
{`POST ${apiConfigs.find((c) => c.id === form.apiConfigId)?.endpoint ?? ""}
Authorization: ${apiConfigs.find((c) => c.id === form.apiConfigId)?.authType ?? ""}
Content-Type: application/json

{
  "memberId": "<user_id>",
  "voucherId": "${editingVoucher?.voucherId ?? "<voucher_id>"}",
  "value": ${Number.isFinite(form.voucherValue) ? form.voucherValue : 0}
}`}
                      </pre>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Timeout{" "}
                        {apiConfigs.find((c) => c.id === form.apiConfigId)
                          ?.timeoutMs ?? 0}{" "}
                        ms · Retry{" "}
                        {apiConfigs.find((c) => c.id === form.apiConfigId)
                          ?.retryCount ?? 0}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {merchantInactive ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    This merchant is currently inactive. The voucher will be
                    saved but cannot be activated until the merchant is
                    reactivated and KYC is approved.
                  </p>
                </div>
              ) : null}
              {kycPending ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    Merchant KYC is {merchant?.kycStatus?.toLowerCase()}. Saving
                    as ACTIVE will be blocked — switch the status to INACTIVE
                    until KYC is approved.
                  </p>
                </div>
              ) : null}

              {error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="space-y-4 bg-secondary/30 px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Live voucher preview
              </p>

              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {form.voucherTitle || "Untitled voucher"}
                  </p>
                  <StatusBadge
                    label={form.status === "ACTIVE" ? "Active" : "Inactive"}
                    tone={form.status === "ACTIVE" ? "success" : "neutral"}
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {merchant?.merchantName ?? "Select a merchant"} ·{" "}
                  {form.voucherMode === "INVENTORY" ? "Inventory" : "API"}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  ${formatNumber(form.voucherValue)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Expires {form.expiryDate ? formatDate(form.expiryDate) : "—"}
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Inventory / API
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {isInventory ? (
                    <>
                      <Boxes className="mr-1 inline h-3.5 w-3.5 text-cyan-700" />
                      {codes.length} coupon code{codes.length === 1 ? "" : "s"} queued
                    </>
                  ) : (
                    <>
                      <Plug className="mr-1 inline h-3.5 w-3.5 text-violet-700" />
                      Issued through partner API on redemption
                    </>
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Campaign eligibility
                </p>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1 text-xs font-semibold",
                    previewEligibility.eligible
                      ? "text-emerald-700"
                      : "text-rose-700"
                  )}
                >
                  {previewEligibility.eligible ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {previewEligibility.eligible
                    ? "Eligible for redemption campaigns"
                    : "Not yet eligible"}
                </p>
                {!previewEligibility.eligible ? (
                  <ul className="mt-2 space-y-1 text-[11px] text-rose-600">
                    {previewEligibility.reasons.map((r) => (
                      <li key={r}>· {r}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {!capability.allowed ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
                  <p className="font-semibold">Eligibility notes</p>
                  <ul className="mt-1 space-y-0.5">
                    {capability.reasons.map((r) => (
                      <li key={r}>· {r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {capability.allowed ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800">
                  <p className="flex items-center gap-1 font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    Merchant is eligible
                  </p>
                  <p className="mt-1">
                    {form.voucherMode === "API"
                      ? "API and inventory modes both available."
                      : "Inventory mode only — merchant is not API-enabled."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <SheetFooter className="border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canEdit || submitting || !form.merchantId}
            >
              <Save className="h-3.5 w-3.5" />
              {editingVoucher ? "Save changes" : "Create voucher"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
