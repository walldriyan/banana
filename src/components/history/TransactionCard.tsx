// src/components/history/TransactionCard.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { ReceiptText, RefreshCw, FileText, FileBadge, Trash2, MoreVertical } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AuthorizationGuard } from '../auth/AuthorizationGuard';


interface TransactionCardProps {
  transaction: DatabaseReadyTransaction;
  refundTransaction?: DatabaseReadyTransaction;
  onViewDetails: (transaction: DatabaseReadyTransaction, originalTx?: DatabaseReadyTransaction) => void;
  onRefund: (transaction: DatabaseReadyTransaction) => void;
  onDeleteRefund: (refundTransactionId: string) => void;
}

export function TransactionCard({ 
    transaction, 
    refundTransaction, 
    onViewDetails, 
    onRefund,
    onDeleteRefund,
}: TransactionCardProps) {
  const { transactionHeader, customerDetails } = transaction;
  const isRefunded = transaction.isRefunded;

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
        {isRefunded && refundTransaction?.transactionHeader.transactionId && (
            <p className="text-xs text-gray-500">
                Refund Txn: {refundTransaction.transactionHeader.transactionId}
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
        {isRefunded && refundTransaction ? (
            <>
                <Button variant="secondary" onClick={() => onViewDetails(transaction)}>
                    <FileText className="mr-2 h-4 w-4"/>
                    View Original Bill
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <FileBadge className="mr-2 h-4 w-4"/>
                      Refund Bill
                      <MoreVertical className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(refundTransaction, transaction)}>
                      <ReceiptText className="mr-2 h-4 w-4" />
                      <span>View Refund Bill</span>
                    </DropdownMenuItem>
                    <AuthorizationGuard permissionKey='bills.delete'>
                        <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => onDeleteRefund(refundTransaction.transactionHeader.transactionId)}
                        >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Refund Bill</span>
                        </DropdownMenuItem>
                    </AuthorizationGuard>
                  </DropdownMenuContent>
                </DropdownMenu>
            </>
        ) : (
            <>
                <Button variant="outline" onClick={() => onViewDetails(transaction)}>
                    <ReceiptText className="mr-2 h-4 w-4"/>
                    View Details
                </Button>
                <AuthorizationGuard permissionKey='refund.process'>
                    <Button variant="destructive" onClick={() => onRefund(transaction)} disabled={isRefunded}>
                        <RefreshCw className="mr-2 h-4 w-4"/>
                        Refund
                    </Button>
                </AuthorizationGuard>
            </>
        )}
      </CardFooter>
    </Card>
  );
}
