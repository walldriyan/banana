// src/components/refund/RefundCart.tsx
'use client';
import React from 'react';
import type { SaleItem } from '@/types';
import type { TransactionLine } from '@/lib/pos-data-transformer';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';

interface RefundCartProps {
  cart: SaleItem[];
  onUpdateQuantity: (saleItemId: string, change: number) => void;
  originalTransactionLines: TransactionLine[];
  discountResult: any; // Pass the full discount result to show applied discounts
}

export function RefundCart({ cart, onUpdateQuantity, originalTransactionLines, discountResult }: RefundCartProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Items to Keep</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {originalTransactionLines.length === 0 ? (
          <p className="text-gray-500">Original transaction has no items.</p>
        ) : cart.length === 0 ? (
          <p className="text-center py-4 px-2 bg-yellow-50 text-yellow-800 rounded-lg">
            All items removed. A full refund will be processed for all items in the original transaction.
          </p>
        ) : (
          <div className="space-y-4">
            {cart.map(item => {
              const originalLine = originalTransactionLines.find(l => l.batchId === item.id);
              const originalQty = originalLine?.quantity || 0;
              const lineItemResult = discountResult?.lineItems?.find((li: any) => li.saleItemId === item.saleItemId);
              
              const hasDiscounts = lineItemResult && lineItemResult.totalDiscount > 0;
              const originalLineTotal = item.price * item.quantity;
              const finalLineTotal = lineItemResult ? originalLineTotal - lineItemResult.totalDiscount : originalLineTotal;

              return (
                <div key={item.saleItemId} className="p-3 rounded-lg bg-muted/50 border border-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.product.name} {item.batchNumber && `(${item.batchNumber})`}</p>
                      <p className="text-sm text-gray-500">Rs. {item.price.toFixed(2)} / unit</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onUpdateQuantity(item.saleItemId, -1)}>-</Button>
                      <span className="font-bold w-12 text-center text-base">
                        {item.quantity} 
                        <span className="text-sm font-normal text-gray-500"> / {originalQty}</span>
                      </span>
                      <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8" 
                          onClick={() => onUpdateQuantity(item.saleItemId, 1)}
                          disabled={item.quantity >= originalQty}
                      >+</Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 border-t border-dashed pt-3">
                    {hasDiscounts && lineItemResult && (
                      <div className="mb-2 text-xs text-green-800 bg-green-50 p-2 rounded-md space-y-1">
                        <div className="font-bold text-green-900 mb-1">Recalculated Discounts:</div>
                        {lineItemResult.appliedRules.map((rule: any, i: number) => (
                          <p key={i} className="flex justify-between items-center">
                            <span className="truncate pr-2">{rule.appliedRuleInfo.sourceRuleName}</span>
                            <span className="font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">-Rs. {rule.discountAmount.toFixed(2)}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-baseline text-sm">
                      <span className={hasDiscounts ? "text-gray-500 line-through" : "text-gray-600 font-semibold"}>
                        New Total: Rs. {originalLineTotal.toFixed(2)}
                      </span>
                      {hasDiscounts && (
                        <span className="font-bold text-lg text-green-700">
                          Final Price: Rs. {finalLineTotal.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {cart.length > 0 && discountResult && (
        <>
          <Separator className="mt-auto" />
          <CardFooter className="p-4 bg-card">
            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">Rs. {discountResult.originalSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Discounts:</span>
                <span className="font-medium text-green-600">-Rs. {discountResult.totalDiscount.toFixed(2)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-foreground">New Total:</span>
                <span className="text-blue-700">Rs. {discountResult.finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}