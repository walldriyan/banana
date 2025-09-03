// src/components/refund/RefundSummary.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';

interface RefundSummaryProps {
  originalTransaction: DatabaseReadyTransaction;
  newDiscountResult: any; // Recalculated result for kept items
  refundAmount: number;
  isProcessing: boolean;
}

export function RefundSummary({ originalTransaction, newDiscountResult, refundAmount, isProcessing }: RefundSummaryProps) {
  const originalTotal = originalTransaction.transactionHeader.finalTotal;
  const newTotal = newDiscountResult.finalTotal;
  const newTotalDiscount = newDiscountResult.totalDiscount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund Calculation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Original Bill Info */}
        <div className="p-3 bg-gray-100 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Original Bill</h4>
            <div className="flex justify-between items-center text-base">
                <span className="text-gray-600">Original Paid Amount:</span>
                <span className="font-semibold">Rs. {originalTotal.toFixed(2)}</span>
            </div>
        </div>

        {/* New Bill (Kept Items) Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">New Bill (Kept Items)</h4>
             <div className="flex justify-between items-center text-base">
                <span className="text-gray-600">Subtotal for Kept Items:</span>
                <span className={newTotalDiscount > 0 ? "line-through text-gray-500" : "font-semibold"}>
                    Rs. {newDiscountResult.originalSubtotal.toFixed(2)}
                </span>
            </div>
            {newTotalDiscount > 0 && (
                <div className="flex justify-between items-center text-base">
                    <span className="text-green-600">Recalculated Discount:</span>
                    <span className="font-semibold text-green-700">-Rs. {newTotalDiscount.toFixed(2)}</span>
                </div>
            )}
             <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-blue-200">
                <span className="text-blue-900">New Total to Pay:</span>
                <span className="">Rs. {newTotal.toFixed(2)}</span>
            </div>
        </div>

        {/* Final Refund Amount */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-2xl font-bold text-red-600">
            <span>Amount to Refund:</span>
            <span>Rs. {refundAmount.toFixed(2)}</span>
          </div>
        </div>
        
        {isProcessing && <p className="text-blue-500 animate-pulse text-center mt-2">Recalculating discounts...</p>}
      </CardContent>
    </Card>
  );
}
