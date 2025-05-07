import { useState, useEffect, useMemo, useCallback } from "react";
import { useTransactions } from "./useTransactions";
import { useFriendTransactions } from "./useFriendTransactions";
import { UserTransactions } from "@/lib/prisma_types";



export interface UseAllTransactionsResult {
  allTransactions: UserTransactions;
  loading: boolean;
  error: string;
  /**
   * Update a note (public or private) for a given transaction ID.
   * Throws on failure.
   */
  setTransactionNote: (
    id: string,
    type: "public" | "private",
    note: string
  ) => Promise<void>;
}

/**
 * Combines your own and friend transactions into one list,
 * sorted ascending by timestamp, and exposes a unified
 * setTransactionNote for updating your own notes.
 */
export function useAllTransactions(): UseAllTransactionsResult {
  const {
    transactions,
    setTransactions: setOwnTransactions,
    loading: loadingOwn,
    error: errorOwn,
  } = useTransactions();

  const {
    friendTransactions,
    loading: loadingFriend,
    error: errorFriend,
  } = useFriendTransactions();

  const loading = loadingOwn || loadingFriend;
  const error = errorOwn || errorFriend;

  const allTransactions = useMemo(() => {
    // tag each record to distinguish
    const own = transactions.map((tx) => ({ ...tx, isFriend: false }));
    const friends = friendTransactions.map((tx) => ({ ...tx, isFriend: true }));
    // merge and sort by timestamp
    return [...own, ...friends].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [transactions, friendTransactions]);

  const setTransactionNote = useCallback(
    async (id: string, type: "public" | "private", note: string) => {
      // PATCH to your existing note endpoint
      const res = await fetch(`/api/user/note?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type === "public" ? "publicNote" : "privateNote"]: note,
        }),
      });
      if (!res.ok) {
        throw new Error(
          `Failed to update ${type} note for transaction ${id}`
        );
      }
      // update local state for own transactions only
      setOwnTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id
            ? { ...tx, [type === "public" ? "publicNote" : "privateNote"]: note }
            : tx
        )
      );
    },
    [setOwnTransactions]
  );

  return {
    allTransactions,
    loading,
    error,
    setTransactionNote,
  };
}
