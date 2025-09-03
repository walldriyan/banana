// src/components/history/TransactionCard.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { ReceiptText } from 'lucide-react';

interface TransactionCardProps {
  transaction: DatabaseReadyTransaction;
  onViewDetails: (transaction: DatabaseReadyTransaction) => void;
}

export function TransactionCard({ transaction, onViewDetails }: TransactionCardProps) {
  const { transactionHeader, customerDetails } = transaction;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{customerDetails.name}</span>
          <span className="text-sm font-medium text-gray-500">
            {transactionHeader.transactionId}
          </span>
        </CardTitle>
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
      <CardFooter className="flex justify-end">
        <Button onClick={() => onViewDetails(transaction)}>
            <ReceiptText className="mr-2 h-4 w-4"/>
            View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
