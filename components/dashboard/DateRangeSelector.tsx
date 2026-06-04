"use client";

import * as React from "react";
import { Calendar, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DateRange } from "@/types/loyalty";

const RANGES: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

export interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

/**
 * Segmented selector for the dashboard date range. The "Custom range"
 * option is a placeholder for a future date picker.
 */
export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const current = RANGES.find((r) => r.value === value) ?? RANGES[2];
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-secondary"
        )}
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {current.label}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-lg border border-border/60 bg-popover p-1 text-popover-foreground shadow-elevated">
          {RANGES.map((range) => {
            const active = range.value === value;
            const disabled = range.value === "custom";
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => {
                  if (disabled) return;
                  onChange(range.value);
                  setOpen(false);
                }}
                disabled={disabled}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                  active
                    ? "bg-navy-900 text-white"
                    : "hover:bg-secondary",
                  disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                )}
              >
                <span>{range.label}</span>
                {range.value === "custom" ? (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Soon
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
