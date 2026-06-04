"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm?: () => void;
  /**
   * Foundation placeholder. When true, the confirm button is disabled so the
   * component still renders cleanly before destructive actions are wired up.
   */
  placeholder?: boolean;
}

/**
 * Foundation confirm dialog. Surfaces a calm confirmation prompt and reserves
 * a slot for the real handler once feature work begins.
 */
export function ConfirmDialog({
  title,
  description,
  icon: Icon,
  trigger,
  open,
  onOpenChange,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  placeholder = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            {Icon ? (
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg shadow-soft",
                  tone === "danger"
                    ? "bg-rose-50 text-rose-600"
                    : "bg-navy-900 text-white"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <div>
              <DialogTitle>{title}</DialogTitle>
              {description ? (
                <DialogDescription className="mt-1.5">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button variant="outline" type="button">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === "danger" ? "destructive" : "default"}
            disabled={placeholder}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
