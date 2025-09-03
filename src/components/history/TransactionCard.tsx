// src/components/history/TransactionCard.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { ReceiptText, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';

interface TransactionCardProps {
  transaction: DatabaseReadyTransaction;
  onViewDetails: (transaction: DatabaseReadyTransaction) => void;
  onRefund: (transaction: DatabaseReadyTransaction) => void;
}

export function TransactionCard({ transaction, onViewDetails, onRefund }: TransactionCardProps) {
  const { transactionHeader, customerDetails } = transaction;
  const isRefunded = transactionHeader.status === 'refund';

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", isRefunded && "bg-orange-50 border-orange-200")}>
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span>{customerDetails.name}</span>
            {isRefunded && (
                <Badge variant="destructive" className="w-fit">REFUNDED</Badge>
            )}
          </div>
          <span className="text-sm font-medium text-gray-500">
            {transactionHeader.transactionId}
          </span>
        </CardTitle>
        {isRefunded && transactionHeader.originalTransactionId && (
            <p className="text-xs text-gray-500">
                Original Txn: {transactionHeader.originalTransactionId}
            </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-semibold">{format(new Date(transactionHeader.transactionDate), 'PPpp')}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Items</p>
            <p className="font-semibold">{transactionHeader.totalItems}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Quantity</p>
            <p className="font-semibold">{transactionHeader.totalQuantity}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Final Total</p>
            <p className="text-xl font-bold text-blue-600">Rs. {transactionHeader.finalTotal.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onViewDetails(transaction)}>
            <ReceiptText className="mr-2 h-4 w-4"/>
            View Details
        </Button>
        {!isRefunded && (
          <Button variant="destructive" onClick={() => onRefund(transaction)}>
            <RefreshCw className="mr-2 h-4 w-4"/>
            Refund
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
