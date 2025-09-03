// src/lib/services/transaction.service.ts

/**
 * This service encapsulates all business logic related to handling a transaction.
 * It can be used by server actions, API routes, or any other part of the app,
 * ensuring consistent logic across the board.
 */
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { insertTransaction } from '../db/local-db';
// import { Zod schema will go here } from './transaction.schema';

// A simple mock to check network status on the server.
// In a real app, this would be more complex. For now, we assume it's always "offline"
// to force local saves.
const isServerOnline = () => false;

export class TransactionService {
  /**
   * The core logic to save a transaction.
   * 1. Validates the data (TODO).
   * 2. Checks network status.
   * 3. Saves to the appropriate database (local or remote).
   *
   * @param transactionData The transaction object to save.
   * @returns A result object with a success message and the saved data.
   */
  static async save(transactionData: DatabaseReadyTransaction): Promise<{
    message: string;
    data: DatabaseReadyTransaction;
  }> {
    // TODO: Step 1 - Validate transactionData with a Zod schema
    // const validationResult = TransactionSchema.safeParse(transactionData);
    // if (!validationResult.success) {
    //   throw new Error(`Invalid transaction data: ${validationResult.error.message}`);
    // }

    const isOnline = isServerOnline();

    if (isOnline) {
      // TODO: Step 2a - Implement server-side saving logic (e.g., call Prisma to save to PostgreSQL)
      // For now, we'll log and save locally as a fallback.
      console.log('Network is online. Would attempt to save to remote server.');
      await insertTransaction(transactionData); // Fallback to local save for now
      return {
        message: 'Transaction saved to remote server (simulated).',
        data: transactionData,
      };
    } else {
      // Step 2b - Save to local SQLite database
      console.log('Network is offline. Saving transaction to local DB.');
      await insertTransaction(transactionData);
      return {
        message: 'Transaction saved locally. Will sync when online.',
        data: transactionData,
      };
    }
  }

  /**
   * Placeholder for future function to sync pending transactions.
   * This would be triggered by a cron job or when the app comes back online.
   */
  static async syncPendingTransactions() {
    // 1. Get all pending transactions from local DB.
    // 2. Loop through and send each to the server via Prisma client.
    // 3. On successful server save, mark them as 'synced' in the local DB.
    console.log('Syncing pending transactions...');
  }
}
