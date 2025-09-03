// src/components/history/HistoryClientPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { getPendingTransactions } from '@/lib/db/local-db';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { TransactionList } from './TransactionList';
import { Skeleton } from '../ui/skeleton';

export function HistoryClientPage() {
  const [transactions, setTransactions] = useState<DatabaseReadyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        const pendingTxs = await getPendingTransactions();
        // Sort by most recent first
        pendingTxs.sort((a, b) => 
          new Date(b.transactionHeader.transactionDate).getTime() - 
          new Date(a.transactionHeader.transactionDate).getTime()
        );
        setTransactions(pendingTxs);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
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
        <TransactionList transactions={transactions} />
    </div>
  );
}
