// src/components/history/HistoryClientPage.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getPendingTransactions } from '@/lib/db/local-db';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { TransactionList } from './TransactionList';
import { Skeleton } from '../ui/skeleton';

export function HistoryClientPage() {
  const [transactions, setTransactions] = useState<DatabaseReadyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const allTxs = await getPendingTransactions();
      allTxs.sort((a, b) => 
        new Date(b.transactionHeader.transactionDate).getTime() - 
        new Date(a.transactionHeader.transactionDate).getTime()
      );
      setTransactions(allTxs);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Memoize the separation of original and refund transactions to avoid re-calculation on every render
  const { originalTransactions, refundMap } = useMemo(() => {
    const originalTxs: DatabaseReadyTransaction[] = [];
    const refundMap = new Map<string, DatabaseReadyTransaction>();

    transactions.forEach(tx => {
      if (tx.transactionHeader.status === 'refund' && tx.transactionHeader.originalTransactionId) {
        refundMap.set(tx.transactionHeader.originalTransactionId, tx);
      } else {
        originalTxs.push(tx);
      }
    });

    return { originalTransactions: originalTxs, refundMap };
  }, [transactions]);


  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-xl font-semibold text-red-600">Error loading transactions</h3>
        <p className="text-red-500 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div>
        <TransactionList 
            originalTransactions={originalTransactions}
            refundMap={refundMap}
            onRefresh={fetchTransactions} 
        />
    </div>
  );
}
