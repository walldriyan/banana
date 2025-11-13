// src/components/history/HistoryClientPage.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { TransactionList } from './TransactionList';
import { Skeleton } from '../ui/skeleton';
import { TransactionSearchBar } from './TransactionSearchBar';
import { Button } from '../ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getTransactionsFromDb } from '@/lib/actions/database.actions';

const ITEMS_PER_PAGE = 10;

export function HistoryClientPage() {
  const [allTransactions, setAllTransactions] = useState<DatabaseReadyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getTransactionsFromDb();
      
      if (result.success && result.data) {
        setAllTransactions(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch transactions from database.');
      }

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
        return allTransactions;
    }
    setCurrentPage(1); // Reset to first page on new search
    const query = searchQuery.toLowerCase();
    
    return allTransactions.filter(tx => {
        const header = tx.transactionHeader;
        const customer = tx.customerDetails;
        
        // Check main transaction ID
        if (header.transactionId.toLowerCase().includes(query)) return true;
        // Check customer name
        if (customer.name.toLowerCase().includes(query)) return true;
        // If it's a refund, also check the original transaction ID
        if (header.originalTransactionId?.toLowerCase().includes(query)) return true;

        return false;
    });
}, [allTransactions, searchQuery]);


  // Memoize the separation of original and refund transactions to avoid re-calculation on every render
  const { originalTransactions, refundMap } = useMemo(() => {
    const originalTxs: DatabaseReadyTransaction[] = [];
    const refundMap = new Map<string, DatabaseReadyTransaction>();

    // This logic correctly populates the refundMap
    allTransactions.forEach(tx => {
        if (tx.transactionHeader.status === 'refund' && tx.transactionHeader.originalTransactionId) {
            refundMap.set(tx.transactionHeader.originalTransactionId, tx);
        }
    });

    // The list to be displayed should be the filtered list, sorted.
    // It will contain BOTH original and refund transactions if the filter matches them.
    const sortedFilteredTxs = [...filteredTransactions].sort((a, b) => 
        new Date(b.transactionHeader.transactionDate).getTime() - 
        new Date(a.transactionHeader.transactionDate).getTime()
    );

    return { originalTransactions: sortedFilteredTxs, refundMap };
}, [allTransactions, filteredTransactions]);

  // Pagination logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return originalTransactions.slice(startIndex, endIndex);
  }, [originalTransactions, currentPage]);

  const totalPages = Math.ceil(originalTransactions.length / ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
    }
  };

  if (isLoading) {
    return (
        <div className="space-y-4 p-6">
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
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 bg-card/95 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
                <Link href="/" passHref>
                <Button variant="outline" size="icon">
                    <ArrowLeft />
                </Button>
                </Link>
                <h1 className="text-2xl font-bold text-foreground hidden sm:block">
                Transaction History
                </h1>
            </div>
            <div className="flex-1 max-w-sm md:max-w-md">
                <TransactionSearchBar 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    allTransactions={allTransactions}
                />
            </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
            <TransactionList 
                originalTransactions={paginatedTransactions}
                refundMap={refundMap}
                onRefresh={fetchTransactions} 
            />

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button 
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
