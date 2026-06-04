"use client";

import * as React from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useApiConfig } from "./ApiConfigProvider";
import type { ApiConfig, ApiConfigFormInput, ApiCategory, HttpMethod, ApiAuthType, ApiConfigStatus } from "@/types/loyalty";

const CATEGORIES: { value: ApiCategory; label: string; description: string }[] = [
  { value: "VMS", label: "VMS", description: "Voucher Management System" },
  { value: "THIRD_PARTY_VOUCHER", label: "3rd Party Voucher", description: "External voucher provider API" },
  { value: "WALLET_CREDIT", label: "Wallet Credit", description: "M Faisaa wallet credit API" },
  { value: "DATA_ADDON", label: "Data Add-On", description: "Telco data pack activation" },
  { value: "ADDON_SERVICE", label: "Add-On Service", description: "Generic service add-on" },
  { value: "OTHER", label: "Other", description: "Custom integration" },
];

const HTTP_METHODS: HttpMethod[] = ["POST", "GET", "PUT"];
const AUTH_TYPES: { value: ApiAuthType; label: string }[] = [
  { value: "NONE", label: "None (no auth)" },
  { value: "BASIC", label: "Basic Auth (username/password)" },
  { value: "BEARER", label: "Bearer Token (JWT)" },
  { value: "API_KEY", label: "API Key (header/query)" },
  { value: "OAUTH", label: "OAuth 2.0 (client credentials)" },
];

function isValidJson(str: string): boolean {
  if (!str.trim()) return true;
  try { JSON.parse(str); return true; } catch { return false; }
}

function isValidUrl(str: string): boolean {
  if (!str.trim()) return false;
  try { new URL(str); return true; } catch { return false; }
}

function Req() { return <span className="text-red-500 ml-0.5">*</span>; }

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle className="h-3 w-3 shrink-0" />{msg}
    </p>
  );
}

interface Props {
  open: boolean;
  editing?: ApiConfig | null;
  onClose: () => void;
}

const EMPTY: ApiConfigFormInput = {
  partnerName: "", apiCategory: "VMS", endpointUrl: "", httpMethod: "POST",
  authType: "NONE", credentialsJson: "{}", headersJson: "{}",
  requestTemplateJson: JSON.stringify({ user_id: "{{userId}}", msisdn: "{{msisdn}}", reward_id: "{{rewardId}}", reference_id: "{{referenceId}}" }, null, 2),
  responseMappingJson: JSON.stringify({ voucherCode: "data.code", expiryDate: "data.expiry", status: "status" }, null, 2),
  timeoutMs: 5000, retryCount: 2, status: "INACTIVE",
  sandboxBaseUrl: "", productionBaseUrl: "", slaNotes: "",
};

export function ApiConfigFormDrawer({ open, editing, onClose }: Props) {
  const { addConfig, updateConfig, defaultTemplateForCategory } = useApiConfig();
  const [form, setForm] = React.useState<ApiConfigFormInput>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof ApiConfigFormInput, string>>>({});

  React.useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        partnerName: editing.partnerName, apiCategory: editing.apiCategory,
        endpointUrl: editing.endpointUrl, httpMethod: editing.httpMethod,
        authType: editing.authType, credentialsJson: editing.credentialsJson,
        headersJson: editing.headersJson, requestTemplateJson: editing.requestTemplateJson,
        responseMappingJson: editing.responseMappingJson, timeoutMs: editing.timeoutMs,
        retryCount: editing.retryCount, status: editing.status,
        sandboxBaseUrl: editing.sandboxBaseUrl, productionBaseUrl: editing.productionBaseUrl,
        slaNotes: editing.slaNotes,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, editing]);

  function set<K extends keyof ApiConfigFormInput>(k: K, v: ApiConfigFormInput[K]) {
    if (k === "apiCategory") {
      const tpl = defaultTemplateForCategory(v as ApiCategory);
      setForm(f => ({ ...f, [k]: v, ...tpl }));
    } else {
      setForm(f => ({ ...f, [k]: v }));
    }
    setErrors(e => { const next = { ...e }; delete next[k]; return next; });
  }

  function validate(): boolean {
    const e: Partial<Record<keyof ApiConfigFormInput, string>> = {};
    if (!form.partnerName.trim()) e.partnerName = "Partner name is required";
    if (!isValidUrl(form.endpointUrl)) e.endpointUrl = "A valid URL is required (include https://)";
    if (!isValidJson(form.credentialsJson)) e.credentialsJson = "Must be valid JSON";
    if (!isValidJson(form.headersJson)) e.headersJson = "Must be valid JSON";
    if (!isValidJson(form.requestTemplateJson)) e.requestTemplateJson = "Must be valid JSON";
    if (!isValidJson(form.responseMappingJson)) e.responseMappingJson = "Must be valid JSON";
    if (form.timeoutMs <= 0) e.timeoutMs = "Timeout must be greater than 0";
    if (form.retryCount < 0) e.retryCount = "Retry count must be 0 or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) updateConfig(editing.id, form);
    else addConfig(form);
    onClose();
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-1">
          <SheetTitle>{editing ? "Edit API Configuration" : "New API Configuration"}</SheetTitle>
          <SheetDescription>
            Fields marked with <span className="text-red-500">*</span> are required.
          </SheetDescription>
        </SheetHeader>

        {hasErrors && (
          <div className="mb-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Please fix the highlighted fields before saving.
          </div>
        )}

        <div className="space-y-4 mt-4">

          {/* Partner Name */}
          <div className="space-y-1.5">
            <Label>Partner Name <Req /></Label>
            <Input
              placeholder="e.g. Giftify Vouchers, M Faisaa Wallet…"
              value={form.partnerName}
              onChange={e => set("partnerName", e.target.value)}
              className={errors.partnerName ? "border-red-400" : ""}
            />
            <FieldError msg={errors.partnerName} />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>API Category <Req /></Label>
            <Select value={form.apiCategory} onValueChange={v => set("apiCategory", v as ApiCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>
                    <div>
                      <p className="font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Changing category auto-fills the request/response templates.</p>
          </div>

          {/* Endpoint + Method */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Endpoint URL <Req /></Label>
              <Input
                placeholder="https://api.partner.com/v1/redeem"
                value={form.endpointUrl}
                onChange={e => set("endpointUrl", e.target.value)}
                className={errors.endpointUrl ? "border-red-400" : ""}
              />
              <FieldError msg={errors.endpointUrl} />
            </div>
            <div className="space-y-1.5">
              <Label>Method <Req /></Label>
              <Select value={form.httpMethod} onValueChange={v => set("httpMethod", v as HttpMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{HTTP_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Auth Type */}
          <div className="space-y-1.5">
            <Label>Auth Type <Req /></Label>
            <Select value={form.authType} onValueChange={v => set("authType", v as ApiAuthType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{AUTH_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* JSON fields */}
          <div className="rounded-lg border border-border/60 bg-slate-50/50 p-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Request / Response Configuration</p>
            {[
              { label: "Credentials JSON", key: "credentialsJson" as const },
              { label: "Headers JSON", key: "headersJson" as const },
              { label: "Request Template JSON", key: "requestTemplateJson" as const },
              { label: "Response Mapping JSON", key: "responseMappingJson" as const },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Textarea
                  rows={3}
                  value={String(form[key])}
                  onChange={e => set(key, e.target.value as ApiConfigFormInput[typeof key])}
                  className={`font-mono text-xs ${errors[key] ? "border-red-400" : ""}`}
                />
                <FieldError msg={errors[key]} />
              </div>
            ))}
          </div>

          {/* Timeout + Retry */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Timeout <Req /> <span className="text-muted-foreground font-normal text-xs">(ms)</span></Label>
              <Input
                type="number" min={1}
                value={form.timeoutMs}
                onChange={e => set("timeoutMs", Number(e.target.value))}
                className={errors.timeoutMs ? "border-red-400" : ""}
              />
              <FieldError msg={errors.timeoutMs} />
            </div>
            <div className="space-y-1.5">
              <Label>Retry Count</Label>
              <Input
                type="number" min={0}
                value={form.retryCount}
                onChange={e => set("retryCount", Number(e.target.value))}
                className={errors.retryCount ? "border-red-400" : ""}
              />
              <FieldError msg={errors.retryCount} />
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Sandbox Base URL</Label>
              <Input
                placeholder="https://sandbox.partner.com"
                value={form.sandboxBaseUrl}
                onChange={e => set("sandboxBaseUrl", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Production Base URL</Label>
              <Input
                placeholder="https://api.partner.com"
                value={form.productionBaseUrl}
                onChange={e => set("productionBaseUrl", e.target.value)}
              />
            </div>
          </div>

          {/* SLA Notes */}
          <div className="space-y-1.5">
            <Label>SLA Notes <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <Textarea
              rows={2}
              placeholder="e.g. P99 < 500ms. Contact: support@partner.com"
              value={form.slaNotes}
              onChange={e => set("slaNotes", e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status <Req /></Label>
            <Select value={form.status} onValueChange={v => set("status", v as ApiConfigStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <div><p className="font-medium text-emerald-700">Active</p><p className="text-xs text-muted-foreground">Available for use in voucher and redemption flows</p></div>
                </SelectItem>
                <SelectItem value="INACTIVE">
                  <div><p className="font-medium">Inactive</p><p className="text-xs text-muted-foreground">Disabled — not used in any flow</p></div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-4 border-t border-border/60">
          <Button onClick={handleSave} className="flex-1">
            {editing ? "Save changes" : "Create config"}
          </Button>
          <Button variant="outline" onClick={onClose} className="gap-1.5">
            <X className="h-4 w-4" />Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
