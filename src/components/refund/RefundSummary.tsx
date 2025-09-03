// src/components/refund/RefundSummary.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { Badge } from '../ui/badge';

interface RefundSummaryProps {
  originalTransaction: DatabaseReadyTransaction;
  newDiscountResult: any; // Recalculated result for kept items
  finalRefundAmount: number;
  isProcessing: boolean;
}

export function RefundSummary({ originalTransaction, newDiscountResult, finalRefundAmount, isProcessing }: RefundSummaryProps) {
  const { transactionHeader, paymentDetails } = originalTransaction;

  const originalTotal = transactionHeader.finalTotal;
  const originalPaid = paymentDetails.paidAmount;
  const originalOutstanding = paymentDetails.outstandingAmount;
  const originalIsInstallment = paymentDetails.isInstallment;

  const newSubtotal = newDiscountResult.originalSubtotal;
  const newTotalDiscount = newDiscountResult.totalDiscount;
  const newFinalTotal = newDiscountResult.finalTotal;
  const hasDiscounts = newTotalDiscount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund Calculation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Original Bill Info */}
        <div className="p-3 bg-gray-100 rounded-lg space-y-2">
            <h4 className="font-semibold text-gray-700 mb-1">Original Bill</h4>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Original Bill Total:</span>
                <span className="font-semibold">Rs. {originalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-700">Rs. {originalPaid.toFixed(2)}</span>
            </div>
            {originalOutstanding > 0 && (
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Outstanding:</span>
                    <span className="font-semibold text-red-600">Rs. {originalOutstanding.toFixed(2)}</span>
                </div>
            )}
            {originalIsInstallment && (
                <div className='pt-1'>
                    <Badge variant="outline">Installment Payment</Badge>
                </div>
            )}
        </div>

        {/* New Bill (Kept Items) Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1">
            <h4 className="font-semibold text-blue-800 mb-1">New Bill (Kept Items)</h4>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className={hasDiscounts ? "line-through text-gray-400" : "font-semibold"}>
                Rs. {newSubtotal.toFixed(2)}
              </span>
            </div>

            {hasDiscounts && (
              <>
                {newDiscountResult.lineItems
                  .flatMap((li: any) => li.appliedRules.map((rule: any) => ({ ...rule, lineItem: li })))
                  .map((rule: any, i: number) => (
                    <div key={`item-disc-${i}`} className="flex justify-between text-xs pl-2">
                      <span className="text-gray-500 truncate pr-2">(Item) {rule.appliedRuleInfo.sourceRuleName}</span>
                      <span className="font-medium text-green-600">-Rs. {rule.discountAmount.toFixed(2)}</span>
                    </div>
                  ))}
                {newDiscountResult.appliedCartRules.map((rule: any, i: number) => (
                  <div key={`cart-disc-${i}`} className="flex justify-between text-xs pl-2">
                    <span className="text-gray-500">(Cart) {rule.appliedRuleInfo.sourceRuleName}</span>
                    <span className="font-medium text-green-600">-Rs. {rule.discountAmount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-blue-100 pt-1 mt-1 flex justify-between font-semibold text-sm">
                  <span className="text-gray-600">Total Recalculated Discounts:</span>
                  <span className="text-green-700">
                    -Rs. {newTotalDiscount.toFixed(2)}
                  </span>
                </div>
              </>
            )}

             <div className="flex justify-between items-center text-base font-bold mt-2 pt-2 border-t-2 border-blue-200">
                <span className="text-blue-900">New Total to Pay:</span>
                <span className="">Rs. {newFinalTotal.toFixed(2)}</span>
            </div>
        </div>

        {/* Final Refund Amount */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-2xl font-bold">
            {finalRefundAmount > 0 ? (
                <>
                    <span className='text-green-600'>Amount to Refund:</span>
                    <span className='text-green-600'>Rs. {finalRefundAmount.toFixed(2)}</span>
                </>
            ) : finalRefundAmount < 0 ? (
                <>
                    <span className='text-red-600'>Amount to Collect:</span>
                    <span className='text-red-600'>Rs. {(-finalRefundAmount).toFixed(2)}</span>
                </>
            ) : (
                <>
                    <span>No Change:</span>
                    <span>Rs. 0.00</span>
                </>
            )}
            
          </div>
        </div>
        
        {isProcessing && <p className="text-blue-500 animate-pulse text-center mt-2">Recalculating...</p>}
      </CardContent>
    </Card>
  );
}
