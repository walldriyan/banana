// src/components/history/TransactionList.tsx
'use client';

import React, { useState } from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { TransactionCard } from './TransactionCard';
import { TransactionDetailsDialog } from './TransactionDetailsDialog';
import { useDrawer } from '@/hooks/use-drawer';
import { RefundDialogContent } from '../refund/RefundDialogContent';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { deleteTransactionFromDb } from '@/lib/actions/database.actions';

interface TransactionListProps {
  originalTransactions: DatabaseReadyTransaction[];
  refundMap: Map<string, DatabaseReadyTransaction>;
  onRefresh: () => void;
}

export function TransactionList({ originalTransactions, refundMap, onRefresh }: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<DatabaseReadyTransaction | null>(null);
  const [originalTransactionForRefundView, setOriginalTransactionForRefundView] = useState<DatabaseReadyTransaction | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const drawer = useDrawer();
  const { toast } = useToast();

  const handleViewDetails = (transaction: DatabaseReadyTransaction, originalTxForRefundContext?: DatabaseReadyTransaction) => {
    if (!transaction) return;
    setSelectedTransaction(transaction);
    setOriginalTransactionForRefundView(originalTxForRefundContext || null);
    setIsDetailsDialogOpen(true);
  };

  const handleDetailsDialogClose = () => {
    setIsDetailsDialogOpen(false);
    setTimeout(() => {
        setSelectedTransaction(null)
        setOriginalTransactionForRefundView(null);
    }, 150);
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

  const handleDeleteRefund = (refundTransactionId: string) => {
    setTransactionToDelete(refundTransactionId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRefund = async () => {
    if (!transactionToDelete) return;
    try {
        const result = await deleteTransactionFromDb(transactionToDelete);
        if (!result.success) {
            throw new Error(result.error);
        }
        toast({
            title: "Refund Deleted",
            description: `The refund transaction has been successfully removed.`,
        });
        onRefresh();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Delete Failed",
            description: error instanceof Error ? error.message : "Could not delete the refund transaction.",
        });
    } finally {
        setIsDeleteDialogOpen(false);
        setTransactionToDelete(null);
    }
  };

  if (originalTransactions.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-xl font-semibold text-gray-700">No Transactions Found</h3>
        <p className="text-gray-500 mt-2">
          It looks like there are no transactions saved in the database yet.
        </p>
      </div>
    );
  }

  return (
    <>
        <div className="space-y-4">
            {originalTransactions.map((tx, index) => {
                const refundTx = refundMap.get(tx.transactionHeader.transactionId);
                return (
                    <TransactionCard
                        key={`${tx.transactionHeader.transactionId}-${index}`}
                        transaction={tx}
                        refundTransaction={refundTx}
                        onViewDetails={(transactionToView) => handleViewDetails(transactionToView, tx)}
                        onRefund={handleRefund}
                        onDeleteRefund={handleDeleteRefund}
                    />
                );
            })}
        </div>

        <TransactionDetailsDialog
            isOpen={isDetailsDialogOpen}
            onOpenChange={handleDetailsDialogClose}
            transaction={selectedTransaction}
            originalTransaction={originalTransactionForRefundView}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete the refund transaction. The original
                        transaction will become refundable again. You cannot undo this action.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteRefund} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
