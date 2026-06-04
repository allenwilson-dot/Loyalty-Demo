"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/lib/utils";
import type { User } from "@/types/loyalty";

import { useUsers } from "./UsersProvider";

export interface ReversePointsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

/**
 * Manual points-reversal dialog. Validates that the value is positive and
 * does not exceed the available balance, then delegates to the provider.
 */
export function ReversePointsDialog({
  user,
  open,
  onOpenChange,
  onComplete,
}: ReversePointsDialogProps) {
  const { reversePoints, canEdit } = useUsers();
  const [points, setPoints] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [notify, setNotify] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPoints("");
      setReason("");
      setNote("");
      setNotify(true);
      setError(null);
      setSubmitting(false);
    }
  }, [open, user?.id]);

  if (!user) return null;

  const numeric = Number(points);
  const blocked = !canEdit || user.status !== "active";
  const overBalance = numeric > user.pointsBalance;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = reversePoints({
      userId: user.id,
      points: numeric,
      reason,
      note: note.trim() || undefined,
      notifyUser: notify,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not reverse points.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      `Reversed ${formatNumber(numeric)} pts from ${user.fullName}.`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-700 shadow-soft">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Reverse points from {user.fullName}</DialogTitle>
              <DialogDescription>
                Available balance · {formatNumber(user.pointsBalance)} pts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {blocked ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This user is currently <strong>{user.status}</strong>. Only active
              members can be adjusted.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reverse-points-amount">Points to reverse</Label>
            <Input
              id="reverse-points-amount"
              type="number"
              min={1}
              max={user.pointsBalance}
              inputMode="numeric"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder={`Up to ${formatNumber(user.pointsBalance)}`}
              required
              disabled={blocked}
            />
            {overBalance ? (
              <p className="text-xs text-rose-600">
                Cannot exceed the available balance of {formatNumber(user.pointsBalance)} pts.
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reverse-points-reason">
              Reason <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="reverse-points-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Promotion voided"
              required
              disabled={blocked}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reverse-points-note">Reference note (optional)</Label>
            <Input
              id="reverse-points-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Case id or audit reference"
              disabled={blocked}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Notify user</p>
              <p className="text-xs text-muted-foreground">
                Send an in-app notification about the reversal.
              </p>
            </div>
            <Switch
              checked={notify}
              onCheckedChange={setNotify}
              disabled={blocked}
              aria-label="Notify user"
            />
          </div>

          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={
                blocked ||
                submitting ||
                !points ||
                !reason.trim() ||
                numeric <= 0 ||
                overBalance
              }
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reverse points
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
