import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

/**
 * Friendly placeholder used in tables, lists, and "coming soon" panels.
 * Renders an icon medallion, copy, and a single optional CTA.
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-secondary/40 px-6 py-12 text-center",
        className
      )}
    >
      {Icon ? (
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-card text-navy-900 shadow-soft">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? (
        action.href ? (
          <Button asChild className="mt-5">
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : (
          <Button onClick={action.onClick} className="mt-5">
            {action.label}
          </Button>
        )
      ) : null}
    </div>
  );
}
