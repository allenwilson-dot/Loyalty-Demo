import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Container for in-page content blocks. Provides a consistent title row,
 * optional description, and a right-aligned actions slot.
 */
export function SectionCard({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-card shadow-soft",
        className
      )}
    >
      <header className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-navy-900">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <div>
            <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className={cn("p-6", contentClassName)}>{children}</div>
    </section>
  );
}
