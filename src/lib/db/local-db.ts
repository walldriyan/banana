// src/lib/db/local-db.ts
'use client';

// import { open } from 'sqlite-wasm-http';
import type { DatabaseReadyTransaction } from '../pos-data-transformer';

let db: any;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

/**
 * Initializes the client-side SQLite database.
 * Creates the necessary tables if they don't exist.
 */
export async function initDb() {
  // if (db) {
  //   return db;
  // }
  // try {
  //   console.log('Initializing local SQLite database...');
  //   db = await open({
  //     filename: 'local-pos.db',
  //     vfs: 'indexeddb', // Persist the database in IndexedDB
  //   });
  //   await db.exec(SCHEMA);
  //   console.log('Local database initialized and schema verified.');
  //   return db;
  // } catch (error) {
  //   console.error('Failed to initialize local database:', error);
  //   throw error;
  // }
  console.warn("Local DB functionality is currently disabled.");
  return null;
}

/**
 * Inserts a complete transaction object into the local SQLite database.
 * The transaction object is stringified and stored as JSON text.
 * 
 * @param transaction - The transaction object to be saved.
 */
export async function insertTransaction(transaction: DatabaseReadyTransaction) {
  const localDb = await initDb();
  if (!localDb) {
    console.log('Local DB not available. Skipping transaction insert.');
    return;
  }
  try {
    await localDb.run(
      'INSERT INTO transactions (id, data, status) VALUES (?, ?, ?)',
      [
        transaction.transactionHeader.transactionId,
        JSON.stringify(transaction),
        'pending', // All transactions are 'pending' until synced
      ]
    );
    console.log(
      `Transaction ${transaction.transactionHeader.transactionId} inserted into local DB.`
    );
  } catch (error) {
    console.error('SQLite Error inserting transaction:', error);
    throw new Error('Could not save transaction to local database.');
  }
}

/**
 * Retrieves all pending transactions from the local database.
 * This will be used for syncing with the server.
 */
export async function getPendingTransactions(): Promise<DatabaseReadyTransaction[]> {
  const localDb = await initDb();
  if (!localDb) {
    console.log('Local DB not available. Returning empty array for pending transactions.');
    return [];
  }
  try {
    const rows = await localDb.exec(
      "SELECT data FROM transactions WHERE status = 'pending'"
    );
    if (!rows || rows.length === 0 || !rows[0].values) {
        return [];
    }
    // The result is nested, so we need to extract the stringified JSON
    return rows[0].values.map((row: any) => JSON.parse(row[0]));
  } catch (error) {
    console.error('SQLite Error fetching pending transactions:', error);
    throw new Error('Could not retrieve pending transactions.');
  }
}

/**
 * A client-side service to handle saving a transaction.
 * It will attempt to save to the local database.
 * In the future, this will also handle syncing with the server.
 * @param transaction - The transaction data to save.
 */
export async function saveTransaction(transaction: DatabaseReadyTransaction) {
  try {
    // For now, we only save to the local DB.
    // The SQLite package is disabled, so this will currently just log a message.
    await insertTransaction(transaction);
    console.log(`Transaction ${transaction.transactionHeader.transactionId} queued for saving.`);
    
    // TODO: Add logic here to check for network status and sync with a server API.
    // const isOnline = navigator.onLine;
    // if (isOnline) {
    //   await syncPendingTransactions();
    // }

  } catch (error) {
    console.error('Error in saveTransaction service:', error);
    // Re-throw the error so the UI can catch it and display a message.
    if (error instanceof Error) {
        throw new Error(`Service failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred in the transaction service.');
  }
}
