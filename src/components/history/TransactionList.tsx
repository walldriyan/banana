// src/components/history/TransactionList.tsx
'use client';

import React, { useState } from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { TransactionCard } from './TransactionCard';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';

interface TransactionListProps {
  transactions: DatabaseReadyTransaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<DatabaseReadyTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewDetails = (transaction: DatabaseReadyTransaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    // Add a small delay to prevent seeing the content change before the dialog closes
    setTimeout(() => {
        setSelectedTransaction(null);
    }, 150)
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-xl font-semibold text-gray-700">No Transactions Found</h3>
        <p className="text-gray-500 mt-2">
          It looks like there are no transactions saved in the local database yet.
        </p>
      </div>
    );
  }

  return (
    <>
        <div className="space-y-4">
            {transactions.map((tx) => (
                <TransactionCard
                key={tx.transactionHeader.transactionId}
                transaction={tx}
                onViewDetails={handleViewDetails}
                />
            ))}
        </div>

        <TransactionDetailsDialog
            isOpen={isDialogOpen}
            onOpenChange={handleDialogClose}
            transaction={selectedTransaction}
        />
    </>
  );
}
