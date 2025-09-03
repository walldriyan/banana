// src/components/history/TransactionList.tsx
'use client';

import React, { useState } from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { TransactionCard } from './TransactionCard';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';
import { useDrawer } from '@/hooks/use-drawer';
import { RefundDialogContent } from '../refund/RefundDialogContent';

interface TransactionListProps {
  transactions: DatabaseReadyTransaction[];
  onRefresh: () => void;
}

export function TransactionList({ transactions, onRefresh }: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<DatabaseReadyTransaction | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const drawer = useDrawer();

  const handleViewDetails = (transaction: DatabaseReadyTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsDialogOpen(true);
  };

  const handleDetailsDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setTimeout(() => setSelectedTransaction(null), 150);
  };
  
  const handleRefund = (transaction: DatabaseReadyTransaction) => {
    drawer.openDrawer({
        title: "Process Refund",
        description: `Refunding transaction: ${transaction.transactionHeader.transactionId}`,
        content: (
            <RefundDialogContent 
                originalTransaction={transaction} 
                onRefundComplete={() => {
                    drawer.closeDrawer();
                    onRefresh();
                }}
            />
        ),
        drawerClassName: "sm:max-w-5xl",
        closeOnOverlayClick: false,
    });
  };

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
                onRefund={handleRefund}
                />
            ))}
        </div>

        <TransactionDetailsDialog
            isOpen={isDetailsDialogOpen}
            onOpenChange={handleDetailsDialogClose}
            transaction={selectedTransaction}
        />
    </>
  );
}
