"use client";

import * as React from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  Plug,
  Save,
  Upload,
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
import { Separator } from "@/components/ui/separator";
import { describeCapabilityLine, describeMerchantCapability } from "@/lib/merchantEligibility";
import { cn } from "@/lib/utils";
import type {
  MerchantApiEnabled,
  MerchantFormInput,
  MerchantKycStatus,
  MerchantOnboarding,
  MerchantOnboardingStatus,
  MerchantType,
} from "@/types/loyalty";

import { useMerchants } from "./MerchantsProvider";

const MERCHANT_TYPES: { value: MerchantType; label: string }[] = [
  { value: "INTERNAL", label: "Internal" },
  { value: "EXTERNAL", label: "External" },
  { value: "PARTNER", label: "Partner" },
];

const API_OPTIONS: { value: MerchantApiEnabled; label: string }[] = [
  { value: "YES", label: "Enabled" },
  { value: "NO", label: "Disabled" },
];

const KYC_OPTIONS: { value: MerchantKycStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_OPTIONS: { value: MerchantOnboardingStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const DEFAULT_FORM: MerchantFormInput = {
  merchantName: "",
  merchantType: "INTERNAL",
  contactPerson: "",
  contactEmail: "",
  contactNumber: "",
  apiEnabled: "NO",
  kycDocumentName: "",
  kycStatus: "PENDING",
  status: "ACTIVE",
  notes: "",
  city: "",
};

function formFromMerchant(merchant: MerchantOnboarding): MerchantFormInput {
  return {
    merchantName: merchant.merchantName,
    merchantType: merchant.merchantType,
    contactPerson: merchant.contactPerson,
    contactEmail: merchant.contactEmail,
    contactNumber: merchant.contactNumber,
    apiEnabled: merchant.apiEnabled,
    kycDocumentName: merchant.kycDocumentName,
    kycStatus: merchant.kycStatus,
    status: merchant.status,
    notes: merchant.notes ?? "",
    city: merchant.city ?? "",
  };
}

export interface MerchantFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingMerchant: MerchantOnboarding | null;
  onComplete?: (message: string) => void;
}

/**
 * Create/Edit drawer for the Merchant Onboarding module. Mirrors the
 * pattern used by the Earning Rules form: a left-hand form column and a
 * right-hand live capability preview column.
 */
export function MerchantFormDrawer({
  open,
  onOpenChange,
  editingMerchant,
  onComplete,
}: MerchantFormDrawerProps) {
  const { createMerchant, updateMerchant, canEdit, detectDuplicateName } =
    useMerchants();
  const [form, setForm] = React.useState<MerchantFormInput>(DEFAULT_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);
    if (editingMerchant) {
      setForm(formFromMerchant(editingMerchant));
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [open, editingMerchant]);

  const update = <K extends keyof MerchantFormInput>(
    key: K,
    value: MerchantFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const requiresKyc =
    form.merchantType === "EXTERNAL" || form.merchantType === "PARTNER";

  const duplicate = React.useMemo(() => {
    if (!form.merchantName.trim()) return null;
    return detectDuplicateName(
      form.merchantName,
      editingMerchant?.id
    );
  }, [form.merchantName, editingMerchant?.id, detectDuplicateName]);

  const previewMerchant: MerchantOnboarding = React.useMemo(() => {
    if (editingMerchant) {
      return {
        ...editingMerchant,
        merchantName: form.merchantName.trim() || "—",
        merchantType: form.merchantType,
        apiEnabled: form.apiEnabled,
        kycStatus: form.kycStatus,
        kycDocumentName: form.kycDocumentName,
        status: form.status,
        city: form.city.trim() || undefined,
        notes: form.notes.trim() || undefined,
        contactPerson: form.contactPerson,
        contactEmail: form.contactEmail,
        contactNumber: form.contactNumber,
      };
    }
    return {
      id: "preview",
      merchantId: "PREVIEW",
      merchantName: form.merchantName.trim() || "—",
      merchantType: form.merchantType,
      contactPerson: form.contactPerson,
      contactEmail: form.contactEmail,
      contactNumber: form.contactNumber,
      apiEnabled: form.apiEnabled,
      kycDocumentName: form.kycDocumentName,
      kycStatus: form.kycStatus,
      status: form.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: form.notes.trim() || undefined,
      city: form.city.trim() || undefined,
      voucherCount: 0,
    };
  }, [form, editingMerchant]);

  const capability = describeMerchantCapability(previewMerchant);
  const capabilityLine = describeCapabilityLine(previewMerchant);

  const handleMockUpload = () => {
    const slug =
      (form.merchantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "merchant") + `-kyc-${new Date()
        .getFullYear()
        .toString()}.pdf`;
    update("kycDocumentName", slug);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = editingMerchant
      ? updateMerchant(editingMerchant.id, form)
      : createMerchant(form);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not save merchant.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      editingMerchant
        ? `Updated ${result.merchant?.merchantName ?? form.merchantName}.`
        : `Added ${result.merchant?.merchantName ?? form.merchantName} to the directory.`
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
              {editingMerchant ? (
                <Save className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
            </span>
            <div>
              <SheetTitle>
                {editingMerchant
                  ? `Edit ${editingMerchant.merchantName}`
                  : "Add new merchant"}
              </SheetTitle>
              <SheetDescription>
                Capture merchant details, contact information, KYC status, and
                API enablement. The preview on the right reflects live
                eligibility changes.
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
                  <Label htmlFor="merchant-name">
                    Merchant name <span className="text-rose-600">*</span>
                  </Label>
                  <Input
                    id="merchant-name"
                    value={form.merchantName}
                    onChange={(e) => update("merchantName", e.target.value)}
                    placeholder="e.g. Maldives Café Partner"
                    required
                    disabled={!canEdit}
                  />
                  {duplicate ? (
                    <p className="flex items-center gap-1 text-[11px] text-rose-600">
                      <AlertTriangle className="h-3 w-3" />
                      Active merchant with this name already exists.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Merchant type <span className="text-rose-600">*</span>
                  </Label>
                  <Select
                    value={form.merchantType}
                    onValueChange={(v) =>
                      update("merchantType", v as MerchantType)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MERCHANT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-person">Contact person</Label>
                  <Input
                    id="contact-person"
                    value={form.contactPerson}
                    onChange={(e) => update("contactPerson", e.target.value)}
                    placeholder="e.g. Ibrahim Hassan"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email">Contact email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => update("contactEmail", e.target.value)}
                    placeholder="partners@merchant.example"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-number">Contact number</Label>
                  <Input
                    id="contact-number"
                    value={form.contactNumber}
                    onChange={(e) => update("contactNumber", e.target.value)}
                    placeholder="+960 777 1234"
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="e.g. Malé"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <Separator className="my-2" />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    API enabled <span className="text-rose-600">*</span>
                  </Label>
                  <Select
                    value={form.apiEnabled}
                    onValueChange={(v) =>
                      update("apiEnabled", v as MerchantApiEnabled)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {API_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    KYC status <span className="text-rose-600">*</span>
                  </Label>
                  <Select
                    value={form.kycStatus}
                    onValueChange={(v) =>
                      update("kycStatus", v as MerchantKycStatus)
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KYC_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kyc-document">
                  KYC document{" "}
                  {requiresKyc ? (
                    <span className="text-rose-600">*</span>
                  ) : (
                    <span className="font-normal text-muted-foreground">
                      (optional for internal merchants)
                    </span>
                  )}
                </Label>
                <div className="flex items-stretch gap-2">
                  <Input
                    id="kyc-document"
                    value={form.kycDocumentName}
                    onChange={(e) =>
                      update("kycDocumentName", e.target.value)
                    }
                    placeholder="merchant-kyc-2026.pdf"
                    disabled={!canEdit}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleMockUpload}
                    disabled={!canEdit}
                    aria-label="Mock upload KYC document"
                  >
                    <Upload className="h-3.5 w-3.5" /> Mock upload
                  </Button>
                </div>
                {form.kycDocumentName ? (
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {form.kycDocumentName}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Drag-and-drop not enabled in this prototype. Use the mock
                    upload to attach a file name.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Status <span className="text-rose-600">*</span>
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    update("status", v as MerchantOnboardingStatus)
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Internal notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="e.g. Reviewed by Amelia in Q2 finance sync"
                  rows={3}
                  disabled={!canEdit}
                />
              </div>

              {error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="space-y-4 bg-secondary/30 px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Live capability preview
              </p>

              <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      capability.canCreateVoucher
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    )}
                  >
                    {capability.canCreateVoucher ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {capability.canCreateVoucher
                        ? "Eligible for voucher creation"
                        : "Not yet eligible"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {capabilityLine}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <CapabilityRow
                    label="Inventory voucher"
                    enabled={capability.canCreateInventoryVoucher}
                  />
                  <CapabilityRow
                    label="API voucher"
                    enabled={capability.canCreateApiVoucher}
                    accent={<Plug className="h-3 w-3" />}
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

              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status snapshot
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={form.status === "ACTIVE" ? "Active" : "Inactive"}
                    tone={form.status === "ACTIVE" ? "success" : "neutral"}
                  />
                  <StatusBadge
                    label={`KYC · ${form.kycStatus}`}
                    tone={
                      form.kycStatus === "APPROVED"
                        ? "success"
                        : form.kycStatus === "REJECTED"
                        ? "danger"
                        : "warning"
                    }
                  />
                  <StatusBadge
                    label={`API · ${form.apiEnabled}`}
                    tone={form.apiEnabled === "YES" ? "info" : "neutral"}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-card p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Catalog impact
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {form.apiEnabled === "YES"
                    ? "Merchant may publish inventory and API-backed voucher catalogues once active and KYC approved."
                    : "Merchant is limited to inventory-only voucher catalogues."}
                </p>
              </div>
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
              disabled={!canEdit || submitting}
            >
              <Save className="h-3.5 w-3.5" />
              {editingMerchant ? "Save changes" : "Add merchant"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CapabilityRow({
  label,
  enabled,
  accent,
}: {
  label: string;
  enabled: boolean;
  accent?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-secondary/30 px-2.5 py-1.5 text-xs">
      <span className="flex items-center gap-1.5 font-medium text-foreground">
        {accent}
        {label}
      </span>
      <StatusBadge
        label={enabled ? "Allowed" : "Blocked"}
        tone={enabled ? "success" : "danger"}
      />
    </div>
  );
}
