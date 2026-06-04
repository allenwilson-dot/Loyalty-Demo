"use client";

import * as React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useApiConfig } from "./ApiConfigProvider";
import type { ApiConfig } from "@/types/loyalty";

type Scenario = "SUCCESS" | "FAILURE" | "TIMEOUT" | "INVALID_MAPPING";

const SCENARIOS: { value: Scenario; label: string; description: string; color: string }[] = [
  { value: "SUCCESS", label: "Simulate Success", description: "API returns a valid voucher code / credit confirmation.", color: "text-emerald-600" },
  { value: "FAILURE", label: "Simulate Failure", description: "API returns a 4xx/5xx error. Points will be rolled back.", color: "text-red-600" },
  { value: "TIMEOUT", label: "Simulate Timeout", description: "API does not respond within the configured timeout window.", color: "text-amber-600" },
  { value: "INVALID_MAPPING", label: "Simulate Invalid Mapping", description: "Response received but fields do not match the response mapping.", color: "text-orange-600" },
];

const MOCK_RESPONSES: Record<Scenario, { message: string; payload: object }> = {
  SUCCESS: {
    message: "Request completed. Voucher/credit issued successfully.",
    payload: { status: "success", data: { code: "VC-DEMO-8823", expiry: "2027-01-01" } },
  },
  FAILURE: {
    message: "API returned HTTP 500 – Internal Server Error.",
    payload: { status: "error", error: { code: "INTERNAL_ERROR", message: "Upstream provider unavailable" } },
  },
  TIMEOUT: {
    message: "Request timed out. No response received within the timeout window.",
    payload: { status: "timeout", elapsed_ms: "{{timeout}}" },
  },
  INVALID_MAPPING: {
    message: "Response received but mapped fields are missing or null.",
    payload: { ok: true, result: { voucher: null, validity: null } },
  },
};

interface Props {
  open: boolean;
  config: ApiConfig | null;
  onClose: () => void;
}

export function ApiConfigTestModal({ open, config, onClose }: Props) {
  const { recordTestResult } = useApiConfig();
  const [selected, setSelected] = React.useState<Scenario>("SUCCESS");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<{ scenario: Scenario; message: string; payload: object } | null>(null);

  React.useEffect(() => {
    if (!open) { setResult(null); setRunning(false); setSelected("SUCCESS"); }
  }, [open]);

  async function runTest() {
    if (!config) return;
    setRunning(true);
    setResult(null);
    const delay = selected === "TIMEOUT" ? 1800 : 900;
    await new Promise(r => setTimeout(r, delay));
    const res = MOCK_RESPONSES[selected];
    const payload = selected === "TIMEOUT"
      ? { ...res.payload, elapsed_ms: config.timeoutMs }
      : res.payload;
    setResult({ scenario: selected, message: res.message, payload });
    recordTestResult(config.id, selected, res.message);
    setRunning(false);
  }

  const icon = result ? {
    SUCCESS: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    FAILURE: <XCircle className="h-5 w-5 text-red-500" />,
    TIMEOUT: <Clock className="h-5 w-5 text-amber-500" />,
    INVALID_MAPPING: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  }[result.scenario] : null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-500" />
            Test API — {config?.partnerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <p className="text-sm text-muted-foreground">
            Select a scenario to simulate. No real API call is made.
          </p>

          <div className="space-y-2">
            {SCENARIOS.map(s => (
              <button
                key={s.value}
                onClick={() => setSelected(s.value)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selected === s.value ? "border-blue-500 bg-blue-50" : "border-border hover:bg-muted/50"}`}
              >
                <p className={`text-sm font-medium ${selected === s.value ? "text-blue-700" : s.color}`}>{s.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </button>
            ))}
          </div>

          {result && (
            <div className={`rounded-lg border p-4 ${result.scenario === "SUCCESS" ? "border-emerald-200 bg-emerald-50" : result.scenario === "FAILURE" ? "border-red-200 bg-red-50" : result.scenario === "TIMEOUT" ? "border-amber-200 bg-amber-50" : "border-orange-200 bg-orange-50"}`}>
              <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-sm font-medium">{result.message}</span>
              </div>
              <pre className="text-xs bg-white/70 rounded p-2 overflow-auto max-h-32 font-mono">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={runTest} disabled={running} className="flex-1">
              {running ? "Running…" : "Run Test"}
            </Button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
