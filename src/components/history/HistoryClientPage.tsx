{// src/components/history/HistoryClientPage.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getPendingTransactions } from '@/lib/db/local-db';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { TransactionList } from './TransactionList';
import { Skeleton } from '../ui/skeleton';
import { TransactionSearchBar } from './TransactionSearchBar';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function HistoryClientPage() {
  const [transactions, setTransactions] = useState<DatabaseReadyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const allTxs = await getPendingTransactions();
      
      const uniqueTransactionsMap = allTxs.reduce((acc, current) => {
        const existingTx = acc.get(current.transactionHeader.transactionId);
        // If a transaction with the same ID already exists, the newer one replaces the older one.
        if (!existingTx || new Date(current.transactionHeader.transactionDate) > new Date(existingTx.transactionHeader.transactionDate)) {
             acc.set(current.transactionHeader.transactionId, current);
        }
        return acc;
      }, new Map<string, DatabaseReadyTransaction>());
      
      const uniqueTransactions = Array.from(uniqueTransactionsMap.values());

      uniqueTransactions.sort((a, b) => 
        new Date(b.transactionHeader.transactionDate).getTime() - 
        new Date(a.transactionHeader.transactionDate).getTime()
      );
      setTransactions(uniqueTransactions);
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

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) {
        return transactions;
    }
    const query = searchQuery.toLowerCase();
    return transactions.filter(tx => {
        const txIdMatch = tx.transactionHeader.transactionId.toLowerCase().includes(query);
        const customerNameMatch = tx.customerDetails.name.toLowerCase().includes(query);
        return txIdMatch || customerNameMatch;
    });
  }, [transactions, searchQuery]);


  // Memoize the separation of original and refund transactions to avoid re-calculation on every render
  const { originalTransactions, refundMap } = useMemo(() => {
    const originalTxs: DatabaseReadyTransaction[] = [];
    const refundMap = new Map<string, DatabaseReadyTransaction>();

    filteredTransactions.forEach(tx => {
      if (tx.transactionHeader.status === 'refund' && tx.transactionHeader.originalTransactionId) {
        refundMap.set(tx.transactionHeader.originalTransactionId, tx);
      } else {
        originalTxs.push(tx);
      }
    });

    return { originalTransactions: originalTxs, refundMap };
  }, [filteredTransactions]);


  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
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
    <>
      <header className="bg-white shadow-sm sticky top-0 z-10 rounded-lg mb-6">
        <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
                <Link href="/" passHref>
                <Button variant="outline" size="icon">
                    <ArrowLeft />
                </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 hidden sm:block">
                Transaction History
                </h1>
            </div>
            <div className="flex-1 max-w-sm md:max-w-md">
                <TransactionSearchBar 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    allTransactions={transactions}
                />
            </div>
        </div>
      </header>
      
      <TransactionList 
          originalTransactions={originalTransactions}
          refundMap={refundMap}
          onRefresh={fetchTransactions} 
      />
    </>
  );
}
