"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface FormDrawerProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "left";
  className?: string;
  /**
   * Renders the body content as a foundation placeholder. Future iterations
   * will replace this with a real form powered by react-hook-form + zod.
   */
  placeholder?: boolean;
}

/**
 * Foundation drawer used by create/edit flows. When `placeholder` is true the
 * body shows a calm "coming next" notice so the layout still feels finished
 * before the form is wired up in a later step.
 */
export function FormDrawer({
  title,
  description,
  icon: Icon,
  trigger,
  open,
  onOpenChange,
  children,
  footer,
  side = "right",
  className,
  placeholder = true,
}: FormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
      <SheetContent side={side} className={cn("flex flex-col", className)}>
        <SheetHeader>
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white shadow-soft">
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <div>
              <SheetTitle>{title}</SheetTitle>
              {description ? (
                <SheetDescription className="mt-1">{description}</SheetDescription>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {placeholder ? (
            <div className="rounded-lg border border-dashed border-border/80 bg-secondary/40 p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Form fields coming next</p>
              <p className="mt-1">
                The drawer is wired up and ready. Detailed form fields and
                validation will land in a follow-up step.
              </p>
              <div className="mt-4">{children}</div>
            </div>
          ) : (
            <div className="space-y-4">{children}</div>
          )}
        </div>

        <SheetFooter>
          {footer ?? (
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" type="button">
                Cancel
              </Button>
              <Button type="button" disabled>
                Save changes
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
