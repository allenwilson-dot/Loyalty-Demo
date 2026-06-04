"use client";

import * as React from "react";
import { MOCK_REDEMPTION_CAMPAIGNS } from "@/data/mockRedemptionCampaigns";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import type { RedemptionCampaign, RedemptionCampaignFormInput } from "@/types/loyalty";

function generateId(): string {
  return `rc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function deriveStatus(c: RedemptionCampaign): RedemptionCampaign["status"] {
  if (c.status === "INACTIVE") return "INACTIVE";
  const now = new Date();
  if (new Date(c.endDate) < now) return "EXPIRED";
  return "ACTIVE";
}

interface CtxValue {
  campaigns: RedemptionCampaign[];
  addCampaign: (input: RedemptionCampaignFormInput) => RedemptionCampaign;
  updateCampaign: (id: string, input: Partial<RedemptionCampaignFormInput>) => void;
  toggleStatus: (id: string) => void;
  activeCampaigns: RedemptionCampaign[];
}

const Ctx = React.createContext<CtxValue | null>(null);

export function RedemptionCampaignProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = React.useState<RedemptionCampaign[]>(() =>
    readStorage(StorageKeys.adminRedemptionCampaigns, MOCK_REDEMPTION_CAMPAIGNS)
      .map((c: RedemptionCampaign) => ({ ...c, status: deriveStatus(c) }))
  );

  const persist = React.useCallback((next: RedemptionCampaign[]) => {
    setCampaigns(next);
    writeStorage(StorageKeys.adminRedemptionCampaigns, next);
  }, []);

  const addCampaign = React.useCallback((input: RedemptionCampaignFormInput): RedemptionCampaign => {
    const now = new Date().toISOString();
    const c: RedemptionCampaign = { id: generateId(), ...input, createdAt: now, updatedAt: now };
    const withStatus = { ...c, status: deriveStatus(c) };
    persist([...campaigns, withStatus]);
    return withStatus;
  }, [campaigns, persist]);

  const updateCampaign = React.useCallback((id: string, input: Partial<RedemptionCampaignFormInput>) => {
    persist(campaigns.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, ...input, updatedAt: new Date().toISOString() };
      return { ...updated, status: deriveStatus(updated) };
    }));
  }, [campaigns, persist]);

  const toggleStatus = React.useCallback((id: string) => {
    persist(campaigns.map(c => {
      if (c.id !== id) return c;
      const next: RedemptionCampaign["status"] = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      return { ...c, status: next, updatedAt: new Date().toISOString() };
    }));
  }, [campaigns, persist]);

  const activeCampaigns = campaigns.filter(c => c.status === "ACTIVE");

  return (
    <Ctx.Provider value={{ campaigns, addCampaign, updateCampaign, toggleStatus, activeCampaigns }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRedemptionCampaigns(): CtxValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useRedemptionCampaigns must be inside RedemptionCampaignProvider");
  return ctx;
}
