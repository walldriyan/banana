// src/lib/actions/transaction.actions.ts
'use server';

import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { TransactionService } from '../services/transaction.service';

/**
 * A thin server action that acts as a bridge between the UI and the transaction service.
 * It's responsible for invoking the core business logic.
 *
 * @param transactionData - The complete, structured transaction object.
 */
export async function saveTransaction(
  transactionData: DatabaseReadyTransaction
): Promise<{ success: boolean; message: string; data: DatabaseReadyTransaction | null }> {
  try {
    const result = await TransactionService.save(transactionData);
    return {
      success: true,
      message: result.message,
      data: result.data,
    };
  } catch (error) {
    console.error('[SAVE_TRANSACTION_ACTION_ERROR]', error);
    // Re-throw the error to be caught by the UI component
    if (error instanceof Error) {
      throw new Error(`Action failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred while saving the transaction.');
  }
}
