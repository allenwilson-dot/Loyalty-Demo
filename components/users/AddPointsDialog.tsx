"use client";

import * as React from "react";
import { AlertCircle, Plus } from "lucide-react";

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

export interface AddPointsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

/**
 * Manual points-addition dialog. Validates input, calls the provider,
 * surfaces server-side errors (locked user, invalid points), and reports
 * the new balance on success.
 */
export function AddPointsDialog({
  user,
  open,
  onOpenChange,
  onComplete,
}: AddPointsDialogProps) {
  const { addPoints, canEdit } = useUsers();
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = addPoints({
      userId: user.id,
      points: numeric,
      reason,
      note: note.trim() || undefined,
      notifyUser: notify,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not add points.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      `Added ${formatNumber(result.newBalance ?? numeric - numeric)} pts to ${user.fullName}.`
    );
  };

  const blocked = !canEdit || user.status !== "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shadow-soft">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>Add points to {user.fullName}</DialogTitle>
              <DialogDescription>
                Current balance · {formatNumber(user.pointsBalance)} pts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {blocked ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This user is currently <strong>{user.status}</strong>. Only active
              members can receive manual points adjustments.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-points-amount">Points to add</Label>
            <Input
              id="add-points-amount"
              type="number"
              min={1}
              inputMode="numeric"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g. 500"
              required
              disabled={blocked}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-points-reason">
              Reason <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="add-points-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Service recovery"
              required
              disabled={blocked}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-points-note">Reference note (optional)</Label>
            <Input
              id="add-points-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ticket id or internal reference"
              disabled={blocked}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-foreground">Notify user</p>
              <p className="text-xs text-muted-foreground">
                Send an in-app notification when points are credited.
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
              disabled={blocked || submitting || !points || !reason.trim() || numeric <= 0}
            >
              <Plus className="h-3.5 w-3.5" /> Add points
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
