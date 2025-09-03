// src/components/refund/RefundSummary.tsx
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RefundSummaryProps {
  originalTotal: number;
  newTotal: number;
  refundAmount: number;
  isProcessing: boolean;
}

export function RefundSummary({ originalTotal, newTotal, refundAmount, isProcessing }: RefundSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund Calculation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Original Bill Total:</span>
          <span className="font-semibold">Rs. {originalTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">New Bill Total (Kept Items):</span>
          <span className="font-semibold">Rs. {newTotal.toFixed(2)}</span>
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center text-2xl font-bold text-red-600">
            <span>Amount to Refund:</span>
            <span>Rs. {refundAmount.toFixed(2)}</span>
          </div>
        </div>
        {isProcessing && <p className="text-blue-500 animate-pulse text-center">Recalculating discounts...</p>}
      </CardContent>
    </Card>
  );
}
