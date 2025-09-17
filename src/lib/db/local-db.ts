// src/lib/db/local-db.ts
'use client';

/**
 * This file is now deprecated. All transaction storage logic has been moved 
 * to server actions that interact directly with the Prisma database.
 * The functions are kept here to prevent build errors from components that might
 * still import them, but they no longer use localStorage.
 */
import type { DatabaseReadyTransaction } from '../pos-data-transformer';

export async function getPendingTransactions(): Promise<DatabaseReadyTransaction[]> {
  console.warn("getPendingTransactions is deprecated and now returns an empty array. Data is fetched from the server.");
  return [];
}

export async function saveTransaction(transaction: DatabaseReadyTransaction) {
  console.warn("saveTransaction is deprecated. Use the `saveTransactionToDb` server action instead.");
  return;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
    console.warn("deleteTransaction is deprecated. Use the `deleteTransactionFromDb` server action instead.");
    return;
}

export async function clearPendingTransactions() {
    console.warn("clearPendingTransactions is deprecated and no longer has an effect.");
    return;
}
