"use client";

import * as React from "react";
import { Lock, Unlock } from "lucide-react";

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
import { StatusBadge } from "@/components/common/StatusBadge";
import type { User } from "@/types/loyalty";

import { useUsers, statusBadgeTone } from "./UsersProvider";

export interface LockUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (message: string) => void;
}

const LOCKED_DESCRIPTION =
  "This user will not be able to earn or redeem rewards while locked. Active sessions will be marked as restricted on the next sync.";

const UNLOCKED_DESCRIPTION =
  "This user will be allowed to earn and redeem rewards again. Locked-session flags will be cleared on the next sync.";

/**
 * Confirmation dialog that locks or unlocks a user. Two modes driven by
 * the current `user.status`. A reason is required and the action is
 * appended to the shared audit log.
 */
export function LockUserDialog({
  user,
  open,
  onOpenChange,
  onComplete,
}: LockUserDialogProps) {
  const { lockUser, unlockUser, canEdit } = useUsers();
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setNote("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, user?.id]);

  if (!user) return null;

  const isLocked = user.status === "locked";
  const title = isLocked ? "Unlock loyalty user" : "Lock loyalty user";
  const description = isLocked ? UNLOCKED_DESCRIPTION : LOCKED_DESCRIPTION;
  const Icon = isLocked ? Unlock : Lock;
  const tone: "emerald" | "rose" = isLocked ? "emerald" : "rose";
  const accent =
    isLocked
      ? "bg-emerald-50 text-emerald-700"
      : "bg-rose-50 text-rose-700";
  const btnLabel = isLocked ? "Unlock user" : "Lock user";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = isLocked
      ? unlockUser({ userId: user.id, reason, note: note.trim() || undefined })
      : lockUser({ userId: user.id, reason, note: note.trim() || undefined });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Could not update user status.");
      return;
    }
    onOpenChange(false);
    onComplete?.(
      isLocked
        ? `Unlocked ${user.fullName}.`
        : `Locked ${user.fullName}.`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-soft ${accent}`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900/5 text-xs font-semibold uppercase text-navy-900">
            {user.fullName
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.fullName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.msisdn} · {user.email}
            </p>
          </div>
          <StatusBadge
            label={user.status}
            tone={statusBadgeTone(
              (["active", "locked", "suspended", "inactive"] as const).find(
                (s) => s === user.status
              ) ?? "inactive"
            )}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lock-reason">
              Reason <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="lock-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isLocked
                  ? "e.g. Disputes resolved"
                  : "e.g. Suspicious activity detected"
              }
              required
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lock-note">Internal note (optional)</Label>
            <Input
              id="lock-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ticket id, escalation reference"
              disabled={!canEdit}
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
              variant={isLocked ? "default" : "destructive"}
              disabled={!canEdit || submitting || !reason.trim()}
            >
              <Icon className="h-3.5 w-3.5" /> {btnLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
