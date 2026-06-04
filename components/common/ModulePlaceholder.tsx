import * as React from "react";
import { Clock, ListChecks, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ModulePlaceholderProps {
  title?: string;
  description?: string;
  features: string[];
  meta?: { label: string; value: string }[];
  className?: string;
}

/**
 * Foundation placeholder used by every in-progress module. Communicates
 * scope and intent without shipping lorem-ipsum filler.
 */
export function ModulePlaceholder({
  title = "Module is on the roadmap",
  description = "This workspace is fully scaffolded — data, state, and forms will be wired up in the next iteration.",
  features,
  meta,
  className,
}: ModulePlaceholderProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card",
        className
      )}
    >
      <div className="relative bg-mesh px-6 py-10 md:px-10 md:py-12">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent" className="uppercase tracking-wide">
            <Rocket className="h-3 w-3" /> Coming next
          </Badge>
          <Badge variant="muted">Foundation build</Badge>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      </div>

      <div className="grid gap-0 border-t border-border/60 md:grid-cols-2">
        <div className="border-b border-border/60 p-6 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks className="h-4 w-4 text-accent" /> Planned capabilities
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-accent" /> Build status
          </div>
          {meta && meta.length > 0 ? (
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {meta.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border/60 bg-secondary/40 p-3"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              No build metadata available for this module yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
