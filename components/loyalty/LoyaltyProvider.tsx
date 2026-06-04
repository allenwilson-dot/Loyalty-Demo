"use client";

import * as React from "react";

import { DEMO_MEMBER_ID, MOCK_USERS } from "@/data/mockUsers";
import { MOCK_REWARDS, REWARD_BY_ID } from "@/data/mockRewards";
import { MOCK_TRANSACTIONS } from "@/data/mockTransactions";
import { MOCK_VOUCHERS } from "@/data/mockVouchers";
import {
  buildOwnedVoucher,
  computeExpiringPoints,
  computeLifetimeEarned,
  computeLifetimeRedeemed,
  generateCouponCode,
  generateTransactionId,
  isRewardExpired,
  isTierLocked,
} from "@/lib/loyalty";
import { readStorage, writeStorage, StorageKeys } from "@/lib/storage";
import type {
  LoyaltyTransaction,
  OwnedVoucher,
  RedemptionResult,
  Reward,
  TransactionChannel,
  User,
  Voucher,
} from "@/types/loyalty";

interface LoyaltySession {
  user: User;
  transactions: LoyaltyTransaction[];
  ownedVouchers: OwnedVoucher[];
  vouchers: Voucher[];
  /** Demo control: forces the next redemption to fail. */
  simulateFailure: boolean;
  isHydrated: boolean;
}

interface LoyaltyContextValue extends LoyaltySession {
  setSimulateFailure: (value: boolean) => void;
  redeem: (rewardId: string) => Promise<RedemptionResult>;
  resetSession: () => void;
}

const LoyaltyContext = React.createContext<LoyaltyContextValue | null>(null);

const DEFAULT_USER: User =
  MOCK_USERS.find((u) => u.id === DEMO_MEMBER_ID) ?? MOCK_USERS[0];

function pickChannelForReward(reward: Reward): TransactionChannel {
  switch (reward.type) {
    case "voucher":
      return "selfcare";
    case "wallet":
      return "moolee";
    case "data":
    case "addon":
      return "selfcare";
    default:
      return "selfcare";
  }
}

export function LoyaltyProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User>(DEFAULT_USER);
  const [transactions, setTransactions] =
    React.useState<LoyaltyTransaction[]>(MOCK_TRANSACTIONS);
  const [ownedVouchers, setOwnedVouchers] = React.useState<OwnedVoucher[]>([]);
  const [vouchers, setVouchers] = React.useState<Voucher[]>(MOCK_VOUCHERS);
  const [simulateFailure, setSimulateFailure] = React.useState(false);
  const [isHydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage exactly once on mount.
  React.useEffect(() => {
    const storedUser = readStorage<User | null>(StorageKeys.sessionUser, null);
    if (storedUser) setUser(storedUser);

    const storedTxns = readStorage<LoyaltyTransaction[] | null>(
      StorageKeys.transactions,
      null
    );
    if (storedTxns && storedTxns.length > 0) setTransactions(storedTxns);

    const storedOwned = readStorage<OwnedVoucher[] | null>(
      StorageKeys.ownedVouchers,
      null
    );
    if (storedOwned) setOwnedVouchers(storedOwned);

    const storedVouchers = readStorage<Voucher[] | null>(
      StorageKeys.vouchers,
      null
    );
    if (storedVouchers && storedVouchers.length > 0) setVouchers(storedVouchers);

    const storedFlag = readStorage<boolean>(StorageKeys.simulateFailure, false);
    if (storedFlag) setSimulateFailure(storedFlag);

    setHydrated(true);
  }, []);

  // Persist to localStorage whenever the relevant slices change.
  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.sessionUser, user);
  }, [user, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.transactions, transactions);
  }, [transactions, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.ownedVouchers, ownedVouchers);
  }, [ownedVouchers, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.vouchers, vouchers);
  }, [vouchers, isHydrated]);

  React.useEffect(() => {
    if (!isHydrated) return;
    writeStorage(StorageKeys.simulateFailure, simulateFailure);
  }, [simulateFailure, isHydrated]);

  const redeem = React.useCallback(
    async (rewardId: string): Promise<RedemptionResult> => {
      const reward = REWARD_BY_ID[rewardId] ?? MOCK_REWARDS.find((r) => r.id === rewardId);
      if (!reward) {
        return {
          ok: false,
          reason: "expired",
          message: "Reward not found.",
        };
      }

      // Eligibility checks (run in a stable order; tier first because it's
      // the most common block in the demo).
      if (isTierLocked(reward, user)) {
        return {
          ok: false,
          reason: "tier_locked",
          message: "Your tier doesn't include this reward.",
        };
      }
      if (isRewardExpired(reward)) {
        return {
          ok: false,
          reason: "expired",
          message: "This reward is no longer available.",
        };
      }
      if (reward.stock <= 0) {
        return {
          ok: false,
          reason: "out_of_stock",
          message: "This reward is out of stock.",
        };
      }
      if (user.pointsBalance < reward.pointsCost) {
        return {
          ok: false,
          reason: "insufficient_points",
          message: "Not enough points for this reward.",
        };
      }
      if (simulateFailure) {
        return {
          ok: false,
          reason: "simulated_failure",
          message: "Simulated failure — your points have been rolled back.",
        };
      }

      // Simulated network latency so the UI can show its processing state.
      await new Promise((resolve) => setTimeout(resolve, 900));

      // Coupon / voucher payload.
      const code = generateCouponCode();
      const channel = pickChannelForReward(reward);
      const transactionId = generateTransactionId();
      const newBalance = user.pointsBalance - reward.pointsCost;

      const newTxn: LoyaltyTransaction = {
        id: transactionId,
        userId: user.id,
        userName: user.fullName,
        type: "redeem",
        status: "completed",
        points: -reward.pointsCost,
        description: `Redeemed — ${reward.title}`,
        reference: code,
        occurredAt: new Date().toISOString(),
        channel,
        rewardId: reward.id,
      };

      let ownedVoucher: OwnedVoucher | undefined;
      if (reward.type === "voucher") {
        ownedVoucher = buildOwnedVoucher(reward, code, user);
      }

      // Apply all state changes atomically.
      setUser((prev) => ({
        ...prev,
        pointsBalance: newBalance,
        lifetimePoints:
          reward.type === "voucher" || reward.type === "data" || reward.type === "addon"
            ? prev.lifetimePoints
            : prev.lifetimePoints,
        lastActivityAt: new Date().toISOString(),
      }));
      setTransactions((prev) => [newTxn, ...prev]);
      if (ownedVoucher) {
        setOwnedVouchers((prev) => [ownedVoucher!, ...prev]);
      }
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === reward.id
            ? { ...v, issued: v.issued + 1, redeemed: v.redeemed + 1 }
            : v
        )
      );

      return {
        ok: true,
        transactionId,
        voucher: ownedVoucher,
        reward,
        newPointsBalance: newBalance,
      };
    },
    [simulateFailure, user]
  );

  const resetSession = React.useCallback(() => {
    setUser(DEFAULT_USER);
    setTransactions(MOCK_TRANSACTIONS);
    setOwnedVouchers([]);
    setVouchers(MOCK_VOUCHERS);
    setSimulateFailure(false);
  }, []);

  const value = React.useMemo<LoyaltyContextValue>(
    () => ({
      user,
      transactions,
      ownedVouchers,
      vouchers,
      simulateFailure,
      isHydrated,
      setSimulateFailure,
      redeem,
      resetSession,
    }),
    [
      user,
      transactions,
      ownedVouchers,
      vouchers,
      simulateFailure,
      isHydrated,
      redeem,
      resetSession,
    ]
  );

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyaltySession(): LoyaltyContextValue {
  const ctx = React.useContext(LoyaltyContext);
  if (!ctx) {
    throw new Error("useLoyaltySession must be used within a LoyaltyProvider");
  }
  return ctx;
}

// Exposed for pages that want quick read-only derived numbers.
export function useLoyaltyDerived() {
  const { user, transactions } = useLoyaltySession();
  return {
    user,
    transactions,
    lifetimeEarned: computeLifetimeEarned(transactions),
    lifetimeRedeemed: computeLifetimeRedeemed(transactions),
    expiringPoints: computeExpiringPoints(user),
  };
}
