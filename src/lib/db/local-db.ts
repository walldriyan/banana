// src/lib/db/local-db.ts
'use client';

import type { DatabaseReadyTransaction } from '../pos-data-transformer';

const LOCAL_STORAGE_KEY = 'pending-transactions';

/**
 * Retrieves all pending transactions from localStorage.
 */
export async function getPendingTransactions(): Promise<DatabaseReadyTransaction[]> {
  try {
    if (typeof window === 'undefined') return [];
    const storedData = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!storedData) {
      return [];
    }
    const transactions = JSON.parse(storedData) as DatabaseReadyTransaction[];
    // Ensure we always return an array
    return Array.isArray(transactions) ? transactions : [];
  } catch (error) {
    console.error('LocalStorage Error fetching pending transactions:', error);
    // Return empty array on error to prevent app crash
    return [];
  }
}

/**
 * Saves a complete transaction object to localStorage.
 * It reads the existing transactions, adds the new one, and saves the array back.
 * 
 * @param transaction - The transaction object to be saved.
 */
export async function saveTransaction(transaction: DatabaseReadyTransaction) {
  try {
    if (typeof window === 'undefined') {
        console.warn("Cannot save transaction, window is not available.");
        return;
    };
    // Get existing transactions
    const existingTransactions = await getPendingTransactions();
    
    // Add the new transaction
    const newTransactions = [...existingTransactions, transaction];

    // Save back to localStorage
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTransactions));
    
    console.log(
      `Transaction ${transaction.transactionHeader.transactionId} saved to localStorage.`
    );

  } catch (error) {
    console.error('LocalStorage Error saving transaction:', error);
    throw new Error('Could not save transaction to local storage.');
  }
}


/**
 * Deletes a specific transaction from localStorage by its ID.
 * @param transactionId - The ID of the transaction to delete.
 */
export async function deleteTransaction(transactionId: string): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        console.warn("Cannot delete transaction, window is not available.");
        return;
      }
      const existingTransactions = await getPendingTransactions();
      const newTransactions = existingTransactions.filter(
        (tx) => tx.transactionHeader.transactionId !== transactionId
      );
  
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTransactions));
      console.log(`Transaction ${transactionId} deleted from localStorage.`);

    } catch (error) {
      console.error('LocalStorage Error deleting transaction:', error);
      throw new Error('Could not delete transaction from local storage.');
    }
}


/**
 * Clears all pending transactions from localStorage.
 * This would be called after successfully syncing with a server.
 */
export async function clearPendingTransactions() {
    try {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        console.log("All pending transactions cleared from localStorage.");
    } catch (error) {
        console.error('LocalStorage Error clearing transactions:', error);
        throw new Error('Could not clear transactions from local storage.');
    }
}
