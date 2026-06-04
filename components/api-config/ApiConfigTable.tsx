"use client";

import * as React from "react";
import { MoreHorizontal, Edit2, Copy, FlaskConical, Power, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApiConfig } from "@/types/loyalty";

const CATEGORY_LABEL: Record<ApiConfig["apiCategory"], string> = {
  VMS: "VMS",
  THIRD_PARTY_VOUCHER: "3rd Party Voucher",
  WALLET_CREDIT: "Wallet Credit",
  DATA_ADDON: "Data Add-On",
  ADDON_SERVICE: "Add-On Service",
  OTHER: "Other",
};

const TEST_STATUS_BADGE: Record<NonNullable<ApiConfig["lastTestStatus"]>, { label: string; className: string }> = {
  SUCCESS: { label: "Passed", className: "bg-emerald-100 text-emerald-700" },
  FAILURE: { label: "Failed", className: "bg-red-100 text-red-700" },
  TIMEOUT: { label: "Timeout", className: "bg-amber-100 text-amber-700" },
  INVALID_MAPPING: { label: "Bad Mapping", className: "bg-orange-100 text-orange-700" },
};

interface Props {
  configs: ApiConfig[];
  canWrite?: boolean;
  onEdit: (c: ApiConfig) => void;
  onTest: (c: ApiConfig) => void;
  onClone: (c: ApiConfig) => void;
  onToggle: (c: ApiConfig) => void;
  onView: (c: ApiConfig) => void;
}

export function ApiConfigTable({ configs, canWrite = true, onEdit, onTest, onClone, onToggle, onView }: Props) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50/60">
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Partner</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Method</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Auth</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Test</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {configs.length === 0 && (
            <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No API configurations found</td></tr>
          )}
          {configs.map(c => (
            <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3">
                <button onClick={() => onView(c)} className="font-medium text-blue-700 hover:underline text-left">
                  {c.partnerName}
                </button>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{c.endpointUrl}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="text-xs">{CATEGORY_LABEL[c.apiCategory]}</Badge>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{c.httpMethod}</span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{c.authType}</td>
              <td className="px-4 py-3">
                {c.lastTestStatus ? (
                  <Badge className={`text-xs border-0 ${TEST_STATUS_BADGE[c.lastTestStatus].className}`}>
                    {TEST_STATUS_BADGE[c.lastTestStatus].label}
                  </Badge>
                ) : <span className="text-xs text-muted-foreground">Never</span>}
              </td>
              <td className="px-4 py-3">
                <Badge className={`text-xs border-0 ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {c.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(c)}><Eye className="h-4 w-4 mr-2" />View details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(c)} disabled={!canWrite}><Edit2 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTest(c)}><FlaskConical className="h-4 w-4 mr-2" />Test API</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onClone(c)} disabled={!canWrite}><Copy className="h-4 w-4 mr-2" />Clone</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onToggle(c)} disabled={!canWrite} className={canWrite ? (c.status === "ACTIVE" ? "text-red-600" : "text-emerald-600") : ""}>
                      <Power className="h-4 w-4 mr-2" />{c.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
