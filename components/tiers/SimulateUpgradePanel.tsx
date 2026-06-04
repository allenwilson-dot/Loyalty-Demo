"use client";

import * as React from "react";
import { Calculator, Play, Save, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import { MOCK_USERS } from "@/data/mockUsers";
import type { TierId } from "@/types/loyalty";

import { useTiers } from "./TiersProvider";

export interface SimulateUpgradePanelProps {
  className?: string;
  onApply?: (message: string) => void;
}

/**
 * Allows admins to test how a user would land on a tier given new lifetime
 * points. Optionally applies the change to the user (with reason capture).
 */
export function SimulateUpgradePanel({
  className,
  onApply,
}: SimulateUpgradePanelProps) {
  const {
    visibleTiers,
    simulateTier,
    applyUserTier,
    canEdit,
  } = useTiers();

  const [userId, setUserId] = React.useState<string>(MOCK_USERS[0]?.id ?? "");
  const [lifetime, setLifetime] = React.useState<number>(
    MOCK_USERS[0]?.lifetimePoints ?? 0
  );
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [simulated, setSimulated] = React.useState<{
    currentId: TierId;
    currentName: string;
    simulatedId: TierId;
    simulatedName: string;
    nextName: string | null;
    pointsToNext: number;
    thresholdMet: boolean;
  } | null>(null);

  const user = MOCK_USERS.find((u) => u.id === userId);

  const handleSimulate = () => {
    if (!user) return;
    const result = simulateTier(user.id, Number(lifetime));
    setSimulated({
      currentId: result.current.id,
      currentName: result.current.name,
      simulatedId: result.simulated.id,
      simulatedName: result.simulated.name,
      nextName: result.next?.name ?? null,
      pointsToNext: result.pointsToNext,
      thresholdMet: result.thresholdMet,
    });
  };

  const handleApply = () => {
    if (!user || !simulated) return;
    if (!reason.trim()) {
      setError("Reason is required to apply the update.");
      return;
    }
    if (simulated.simulatedId === user.tierId) {
      setError("Simulated tier matches the user's current tier — nothing to apply.");
      return;
    }
    const res = applyUserTier(user.id, simulated.simulatedId, reason.trim());
    if (!res.ok) {
      setError(res.message ?? "Could not apply tier update.");
      return;
    }
    setError(null);
    setReason("");
    onApply?.(
      `Moved ${user.fullName} to ${simulated.simulatedName}.`
    );
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-6 shadow-card md:p-8",
        className
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Simulate upgrade
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Test how a member would qualify for a new tier
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a user, enter projected lifetime points, and see which tier
            they would land on. Optionally apply the change with a reason.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Member</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_USERS.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="simulate-points">Projected lifetime points</Label>
          <Input
            id="simulate-points"
            type="number"
            min={0}
            value={lifetime}
            onChange={(e) => setLifetime(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            className="w-full"
            onClick={handleSimulate}
            disabled={!user}
          >
            <Play className="h-3.5 w-3.5" /> Simulate
          </Button>
        </div>
      </div>

      {simulated && user ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ResultTile
            label="Current tier"
            value={simulated.currentName}
            color={
              visibleTiers.find((t) => t.id === simulated.currentId)?.color
            }
            helper={`${formatNumber(user.lifetimePoints)} lifetime points`}
          />
          <ResultTile
            label="New tier"
            value={simulated.simulatedName}
            color={
              visibleTiers.find((t) => t.id === simulated.simulatedId)?.color
            }
            highlight
            helper={`At ${formatNumber(Number(lifetime))} lifetime points`}
          />
          <ResultTile
            label="Next tier"
            value={simulated.nextName ?? "Top tier reached"}
            color={
              simulated.nextName
                ? visibleTiers.find(
                    (t) => t.name === simulated.nextName
                  )?.color
                : "#16A34A"
            }
            helper={
              simulated.nextName
                ? `${formatCompact(simulated.pointsToNext)} points to go`
                : "No further tiers"
            }
          />
        </div>
      ) : null}

      {simulated && canEdit ? (
        <div className="mt-4 space-y-2 rounded-xl border border-border/60 bg-secondary/30 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="apply-reason">Apply reason (optional until you click Apply)</Label>
            <Input
              id="apply-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Manual promotion after special campaign"
            />
          </div>
          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Apply will set the user’s tier to{" "}
              <span className="font-semibold text-foreground">
                {simulated.simulatedName}
              </span>{" "}
              and write an audit log entry.
            </p>
            <Button onClick={handleApply}>
              <Save className="h-3.5 w-3.5" /> Apply tier update
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultTile({
  label,
  value,
  color,
  helper,
  highlight = false,
}: {
  label: string;
  value: string;
  color?: string;
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-soft",
        highlight ? "border-accent ring-1 ring-accent/30" : "border-border/60"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
        {color ? (
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        ) : null}
        {value}
      </p>
      {helper ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
