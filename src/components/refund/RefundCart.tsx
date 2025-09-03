// src/components/refund/RefundCart.tsx
'use client';
import React from 'react';
import type { SaleItem } from '@/types';
import type { TransactionLine } from '@/lib/pos-data-transformer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RefundCartProps {
  cart: SaleItem[];
  onUpdateQuantity: (saleItemId: string, change: number) => void;
  originalTransactionLines: TransactionLine[];
}

export function RefundCart({ cart, onUpdateQuantity, originalTransactionLines }: RefundCartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items to Refund/Keep</CardTitle>
      </CardHeader>
      <CardContent>
        {originalTransactionLines.length === 0 ? (
          <p className="text-gray-500">Original transaction has no items.</p>
        ) : cart.length === 0 ? (
          <p className="text-center py-4 px-2 bg-yellow-50 text-yellow-800 rounded-lg">
            All items removed. A full refund will be processed for all items in the original transaction.
          </p>
        ) : (
          <div className="space-y-4">
            {cart.map(item => {
              const originalLine = originalTransactionLines.find(l => l.productId === item.id && l.batchId === item.selectedBatchId);
              const originalQty = originalLine?.quantity || 0;
              return (
                <div key={item.saleItemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">{item.name} {item.selectedBatch?.batchNumber && `(${item.selectedBatch.batchNumber})`}</p>
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
