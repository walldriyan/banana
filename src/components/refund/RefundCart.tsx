// src/components/refund/RefundCart.tsx
'use client';
import React, { useEffect } from 'react';
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
  useEffect(() => {
    console.log("--- RefundCart Items ---");
    originalTransactionLines.forEach(item => {
      // const lineItemResult = discountResult?.lineItems?.find((li: any) => li.saleItemId === item.saleItemId);
      // const hasDiscounts = lineItemResult && lineItemResult.totalDiscount > 0;
      console.log(`Item: ${item.productName} `);
      console.log(`unitPrice: ${item.unitPrice} `);
      console.log(`quantity: ${item.quantity} `);
      console.log(`batchId: ${item.batchId} `);
      console.log(`batchNumber: ${item.batchNumber} `);
      console.log(`displayUnit: ${item.displayUnit} `);
      console.log(`saleItemId: ${item.saleItemId} `);
      console.log(`lineTotalAfterDiscount: ${item.lineTotalAfterDiscount} `);
      console.log(`lineTotalBeforeDiscount: ${item.lineTotalBeforeDiscount} `);
      console.log(`lineTotalBeforeDiscount: ${item.lineDiscount} `);
      console.log(`------------------------`);
      console.log(`------------------------`);
    });
    console.log("------------------------");
  }, [cart, discountResult, originalTransactionLines]);


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
              originalTransactionLines.map((originalLine, index) => {
                const keptItem = cart.find(l => l.saleItemId === originalLine.saleItemId);
                const keptQty = keptItem?.quantity || 0;

                const lineItemResult = discountResult?.lineItems?.find((li: any) => li.saleItemId === originalLine.saleItemId);

                // const originalLineTotal = originalLine.unitPrice * originalLine.quantity;
                // const newLineTotal = lineItemResult ? (lineItemResult.originalPrice * lineItemResult.quantity) : 0;
                // const newLineDiscount = lineItemResult ? lineItemResult.totalDiscount : 0;
                // const finalLineTotal = lineItemResult ? newLineTotal - newLineDiscount : 0;

                return (
                  <div key={`${originalLine.saleItemId}-${index}`} className="p-3 rounded-lg bg-muted/50 border border-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{originalLine.productName}</p>
                        <p className="text-sm text-gray-500">{originalLine.displayUnit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onUpdateQuantity(originalLine.saleItemId, -1)}>-</Button>
                        <span className="font-bold w-12 text-center text-base">
                          {/* {keptQty} */}
                          <span className="text-sm font-normal text-gray-500"> {originalLine.quantity}</span>
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(originalLine.saleItemId, 1)}
                          disabled={keptQty >= originalLine.quantity}
                        >+</Button>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-dashed pt-3">
                      {lineItemResult && keptQty > 0 && (
                        <div className="mb-2 text-xs text-green-800 bg-green-50 dark:bg-green-900/20 p-2 rounded-md space-y-1">
                          <div className="font-bold text-green-900 dark:text-green-200 mb-1">Recalculated Discounts:</div>
                          {lineItemResult.appliedRules.map((rule: any, i: number) => (
                            <p key={i} className="flex justify-between items-center">
                              <span className="truncate pr-2">{rule.appliedRuleInfo.sourceRuleName}</span>
                              <span className="font-semibold bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full">-Rs. {rule.discountAmount.toFixed(2)}</span>
                            </p>
                          ))}
                        </div>
                      )}
                      {keptQty > 0 && (
                        <div className="flex justify-between items-baseline text-sm">
                         <div className="flex flex-col ">
                          <span className="text-gray-400 ">
                            Original: Rs. {originalLine.lineTotalBeforeDiscount.toFixed(2)}
                          </span>
                          {originalLine.lineDiscount > 0 && (
                            <span className="font-bold text-blue-700 dark:text-blue-700">
                             Discount: Rs. {originalLine.lineDiscount.toFixed(2)}
                            </span>
                          )}

</div>

                          <span className="font-bold text-green-700 dark:text-green-400">
                            New Total: Rs. {originalLine.lineTotalAfterDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {keptQty === 0 && (
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
