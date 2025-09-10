// src/components/history/TransactionDetailsDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { ThermalReceipt } from '../transaction/receipt-templates/ThermalReceipt';

interface TransactionDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: DatabaseReadyTransaction | null;
  originalTransaction?: DatabaseReadyTransaction | null; // Optional: for refund context
}

export function TransactionDetailsDialog({
  isOpen,
  onOpenChange,
  transaction,
  originalTransaction,
}: TransactionDetailsDialogProps) {
  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            A preview of the receipt for transaction ID: {transaction.transactionHeader.transactionId}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 bg-gray-100 p-4 rounded-lg overflow-y-auto max-h-[60vh]">
          <ThermalReceipt data={transaction} originalTransaction={originalTransaction} />
        </div>

        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={() => {
                // In a real app, this would trigger the system print dialog
                alert("Printing receipt...");
                console.log("Printing:", transaction);
            }}>
                Print Receipt
            </Button>
        </div>
        <DialogClose asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
