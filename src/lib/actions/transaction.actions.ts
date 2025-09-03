// src/lib/actions/transaction.actions.ts
'use server';

import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { insertTransaction } from '../db/local-db';

/**
 * Main action to save a transaction.
 * It will eventually handle network status to decide whether to save locally
 * or send to the remote server.
 * 
 * @param transactionData - The complete, structured transaction object.
 */
export async function saveTransaction(
  transactionData: DatabaseReadyTransaction
): Promise<{ success: boolean; message: string; data: DatabaseReadyTransaction | null }> {
  try {
    // For now, we always save to the local SQLite database.
    // In the future, we'll check for network connection here.
    // const isOnline = navigator.onLine;
    const isOnline = false; // Forcing offline mode for demonstration

    if (isOnline) {
      // TODO: Implement server-side saving logic
      // e.g., await saveTransactionToServer(transactionData);
      console.log('Network is online. Would attempt to save to server.');
      // For now, we will still save locally
      await insertTransaction(transactionData);
    } else {
      console.log('Network is offline. Saving transaction to local SQLite DB.');
      await insertTransaction(transactionData);
    }

    return {
      success: true,
      message: 'Transaction saved successfully (locally).',
      data: transactionData,
    };
  } catch (error) {
    console.error('[SAVE_TRANSACTION_ACTION_ERROR]', error);
    // This allows the error to be caught in the component
    throw new Error('Failed to save the transaction.');
  }
}

/**
 * Placeholder for future function to sync pending transactions.
 * This would be triggered when the app comes back online.
 */
export async function syncPendingTransactions() {
  // 1. Get all pending transactions from local DB.
  // 2. Loop through and send each to the server.
  // 3. On successful server save, mark them as 'synced' in the local DB.
  console.log('Syncing pending transactions...');
}
