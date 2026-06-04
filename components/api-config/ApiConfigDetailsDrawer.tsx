"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRoleAccess } from "@/lib/roleAccess";
import type { ApiConfig } from "@/types/loyalty";

const CATEGORY_LABEL: Record<ApiConfig["apiCategory"], string> = {
  VMS: "VMS",
  THIRD_PARTY_VOUCHER: "3rd Party Voucher",
  WALLET_CREDIT: "Wallet Credit",
  DATA_ADDON: "Data Add-On",
  ADDON_SERVICE: "Add-On Service",
  OTHER: "Other",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right font-medium break-all">{value}</span>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <pre className="text-xs bg-slate-50 border rounded-lg p-3 overflow-auto max-h-40 font-mono">{value}</pre>
    </div>
  );
}

interface Props {
  open: boolean;
  config: ApiConfig | null;
  onClose: () => void;
  onEdit: () => void;
  onTest: () => void;
}

export function ApiConfigDetailsDrawer({ open, config, onClose, onEdit, onTest }: Props) {
  const { can } = useRoleAccess();
  if (!config) return null;

  const testBadge = config.lastTestStatus ? {
    SUCCESS: "bg-emerald-100 text-emerald-700",
    FAILURE: "bg-red-100 text-red-700",
    TIMEOUT: "bg-amber-100 text-amber-700",
    INVALID_MAPPING: "bg-orange-100 text-orange-700",
  }[config.lastTestStatus] : "";

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>{config.partnerName}</SheetTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{CATEGORY_LABEL[config.apiCategory]}</Badge>
            <Badge className={`border-0 ${config.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{config.status}</Badge>
            {config.lastTestStatus && (
              <Badge className={`border-0 ${testBadge}`}>Last test: {config.lastTestStatus}</Badge>
            )}
          </div>
        </SheetHeader>

        <div className="divide-y">
          <Row label="Config ID" value={<span className="font-mono text-xs">{config.id}</span>} />
          <Row label="Endpoint URL" value={<span className="font-mono text-xs break-all">{config.endpointUrl}</span>} />
          <Row label="HTTP Method" value={config.httpMethod} />
          <Row label="Auth Type" value={config.authType} />
          <Row label="Timeout" value={`${config.timeoutMs} ms`} />
          <Row label="Retry Count" value={config.retryCount} />
          <Row label="Sandbox URL" value={config.sandboxBaseUrl || "—"} />
          <Row label="Production URL" value={config.productionBaseUrl || "—"} />
          <Row label="SLA Notes" value={config.slaNotes || "—"} />
          {config.lastTestedAt && (
            <Row label="Last Tested" value={new Date(config.lastTestedAt).toLocaleString()} />
          )}
          {config.lastTestMessage && (
            <Row label="Test Message" value={config.lastTestMessage} />
          )}
          {config.linkedVoucherIds && config.linkedVoucherIds.length > 0 && (
            <Row label="Linked Vouchers" value={config.linkedVoucherIds.join(", ")} />
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <JsonBlock label="Credentials" value={config.credentialsJson} />
          <JsonBlock label="Headers" value={config.headersJson} />
          <JsonBlock label="Request Template" value={config.requestTemplateJson} />
          <JsonBlock label="Response Mapping" value={config.responseMappingJson} />
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onEdit}
            variant="outline"
            className="flex-1"
            disabled={!can("manage_api")}
            title={!can("manage_api") ? "Your role cannot edit API configurations" : undefined}
          >
            Edit
          </Button>
          <Button onClick={onTest} className="flex-1">Test API</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
