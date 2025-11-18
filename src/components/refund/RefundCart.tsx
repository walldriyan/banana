// src/components/refund/RefundCart.tsx
'use client';
import React, { useMemo } from 'react';
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
        ) : (
          <div className="space-y-4">
            {
              originalTransactionLines.map((originalLine) => {
                const keptItem = cart.find(l => l.saleItemId === originalLine.id);
                const keptQty = keptItem?.quantity || 0;

                const lineItemResult = discountResult?.lineItems?.find((li: any) => li.lineId === originalLine.id);
                
                const newLineTotal = lineItemResult ? (lineItemResult.originalPrice * lineItemResult.quantity) : 0;
                const newLineDiscount = lineItemResult ? lineItemResult.totalDiscount : 0;
                const finalLineTotal = lineItemResult ? (newLineTotal - newLineDiscount) : 0;

                return (
                  <div key={originalLine.id} className="p-3 rounded-lg bg-muted/50 border border-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{originalLine.productName}</p>
                        <p className="text-sm text-gray-500">{originalLine.displayUnit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onUpdateQuantity(originalLine.id, -1)} disabled={keptQty <= 0}>-</Button>
                        <span className="font-bold w-12 text-center text-base">
                          {keptQty}
                          <span className="text-sm font-normal text-gray-500"> / {originalLine.quantity}</span>
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(originalLine.id, 1)}
                          disabled={keptQty >= originalLine.quantity}
                        >+</Button>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-dashed pt-3">
                      {keptQty > 0 ? (
                        <div className="space-y-1 text-sm">
                           <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Original Item Total:</span>
                            <span className=" text-muted-foreground">
                              Rs. {originalLine.lineTotalBeforeDiscount.toFixed(2)}
                            </span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-700 dark:text-blue-500">
                                Discount:
                              </span>
                               <span className="font-bold text-blue-700 dark:text-blue-500">
                                -Rs. {newLineDiscount.toFixed(2)}
                               </span>
                           </div>
                           <div className="flex justify-between items-center font-bold text-green-700 dark:text-green-400">
                              <span>New Total:</span>
                              <span>Rs. {finalLineTotal.toFixed(2)}</span>
                           </div>
                        </div>
                      ) : (
                        <p className="text-center text-sm font-semibold text-destructive">Item fully removed for refund.</p>
                      )}
                    </div>
                  </div>
                );
              })
            }
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
                <span className="text-blue-700 dark:text-blue-400">Rs. {discountResult.finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
