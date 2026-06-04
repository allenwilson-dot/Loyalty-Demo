"use client";

import * as React from "react";
import { MOCK_API_CONFIGS } from "@/data/mockApiConfigs";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import type { ApiConfig, ApiConfigFormInput } from "@/types/loyalty";

function generateId(): string {
  return `api_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function defaultTemplateForCategory(category: ApiConfig["apiCategory"]): Pick<ApiConfig, "requestTemplateJson" | "responseMappingJson"> {
  if (category === "VMS" || category === "THIRD_PARTY_VOUCHER") {
    return {
      requestTemplateJson: JSON.stringify({ user_id: "{{userId}}", msisdn: "{{msisdn}}", reward_id: "{{rewardId}}", reference_id: "{{referenceId}}" }, null, 2),
      responseMappingJson: JSON.stringify({ voucherCode: "data.code", expiryDate: "data.expiry", status: "status" }, null, 2),
    };
  }
  if (category === "WALLET_CREDIT") {
    return {
      requestTemplateJson: JSON.stringify({ wallet_id: "{{walletId}}", amount: "{{amount}}", reference_id: "{{referenceId}}" }, null, 2),
      responseMappingJson: JSON.stringify({ transactionId: "data.txn_id", balance: "data.new_balance", status: "status" }, null, 2),
    };
  }
  if (category === "DATA_ADDON") {
    return {
      requestTemplateJson: JSON.stringify({ msisdn: "{{msisdn}}", pack_id: "{{packId}}", reference_id: "{{referenceId}}" }, null, 2),
      responseMappingJson: JSON.stringify({ activationId: "data.activation_id", status: "status" }, null, 2),
    };
  }
  return {
    requestTemplateJson: JSON.stringify({ reference_id: "{{referenceId}}" }, null, 2),
    responseMappingJson: JSON.stringify({ status: "status" }, null, 2),
  };
}

interface ApiConfigContextValue {
  configs: ApiConfig[];
  addConfig: (input: ApiConfigFormInput) => ApiConfig;
  updateConfig: (id: string, input: Partial<ApiConfigFormInput>) => void;
  toggleStatus: (id: string) => void;
  cloneConfig: (id: string) => ApiConfig;
  recordTestResult: (id: string, status: ApiConfig["lastTestStatus"], message: string) => void;
  defaultTemplateForCategory: typeof defaultTemplateForCategory;
}

const ApiConfigContext = React.createContext<ApiConfigContextValue | null>(null);

export function ApiConfigProvider({ children }: { children: React.ReactNode }) {
  const [configs, setConfigs] = React.useState<ApiConfig[]>(() =>
    readStorage(StorageKeys.adminApiConfigs, MOCK_API_CONFIGS)
  );

  const persist = React.useCallback((next: ApiConfig[]) => {
    setConfigs(next);
    writeStorage(StorageKeys.adminApiConfigs, next);
  }, []);

  const addConfig = React.useCallback((input: ApiConfigFormInput): ApiConfig => {
    const now = new Date().toISOString();
    const config: ApiConfig = {
      id: generateId(),
      ...input,
      linkedVoucherIds: [],
      createdAt: now,
      updatedAt: now,
    };
    persist([...configs, config]);
    return config;
  }, [configs, persist]);

  const updateConfig = React.useCallback((id: string, input: Partial<ApiConfigFormInput>) => {
    persist(configs.map(c => c.id === id ? { ...c, ...input, updatedAt: new Date().toISOString() } : c));
  }, [configs, persist]);

  const toggleStatus = React.useCallback((id: string) => {
    persist(configs.map(c => c.id === id ? { ...c, status: c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE", updatedAt: new Date().toISOString() } : c));
  }, [configs, persist]);

  const cloneConfig = React.useCallback((id: string): ApiConfig => {
    const src = configs.find(c => c.id === id);
    if (!src) throw new Error("Config not found");
    const now = new Date().toISOString();
    const clone: ApiConfig = { ...src, id: generateId(), partnerName: `${src.partnerName} (copy)`, status: "INACTIVE", lastTestedAt: undefined, lastTestStatus: undefined, lastTestMessage: undefined, linkedVoucherIds: [], createdAt: now, updatedAt: now };
    persist([...configs, clone]);
    return clone;
  }, [configs, persist]);

  const recordTestResult = React.useCallback((id: string, status: ApiConfig["lastTestStatus"], message: string) => {
    persist(configs.map(c => c.id === id ? { ...c, lastTestedAt: new Date().toISOString(), lastTestStatus: status, lastTestMessage: message, updatedAt: new Date().toISOString() } : c));
  }, [configs, persist]);

  return (
    <ApiConfigContext.Provider value={{ configs, addConfig, updateConfig, toggleStatus, cloneConfig, recordTestResult, defaultTemplateForCategory }}>
      {children}
    </ApiConfigContext.Provider>
  );
}

export function useApiConfig(): ApiConfigContextValue {
  const ctx = React.useContext(ApiConfigContext);
  if (!ctx) throw new Error("useApiConfig must be used inside ApiConfigProvider");
  return ctx;
}
