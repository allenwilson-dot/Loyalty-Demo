import * as React from "react";
import { Coins, CreditCard, Database, Plug, Smartphone, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EntrySource, TransactionChannel } from "@/types/loyalty";

interface ChannelMeta {
  label: string;
  icon: LucideIcon;
  className: string;
}

const META: Record<TransactionChannel, ChannelMeta> = {
  selfcare: {
    label: "Selfcare",
    icon: Smartphone,
    className: "bg-navy-900/5 text-navy-900",
  },
  moolee: {
    label: "Moolee",
    icon: CreditCard,
    className: "bg-cyan-50 text-cyan-700",
  },
  mfaisaa: {
    label: "M Faisaa",
    icon: Coins,
    className: "bg-amber-50 text-amber-700",
  },
  store: {
    label: "In-store",
    icon: Tag,
    className: "bg-emerald-50 text-emerald-700",
  },
  api: {
    label: "API",
    icon: Plug,
    className: "bg-violet-50 text-violet-700",
  },
  campaign: {
    label: "Campaign",
    icon: Database,
    className: "bg-rose-50 text-rose-700",
  },
};

const ENTRY_SOURCES: ReadonlyArray<EntrySource> = [
  "selfcare",
  "moolee",
  "mfaisaa",
];

/**
 * Compact badge for the channel of a transaction. Renders any of the
 * six `TransactionChannel` values, with the three telecom entry sources
 * (Selfcare, Moolee, M-Faisaa) labelled prominently.
 */
export function EntrySourceBadge({
  source,
  className,
  showIcon = true,
}: {
  source: TransactionChannel;
  className?: string;
  showIcon?: boolean;
}) {
  const meta = META[source];
  const Icon = meta.icon;
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", meta.className, className)}
    >
      {showIcon ? <Icon className="h-3 w-3" /> : null}
      {meta.label}
    </Badge>
  );
}

export function isEntrySource(channel: TransactionChannel): channel is EntrySource {
  return (ENTRY_SOURCES as readonly TransactionChannel[]).includes(channel);
}

export function getEntrySourceMeta(source: TransactionChannel): ChannelMeta {
  return META[source];
}
