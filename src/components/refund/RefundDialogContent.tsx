// src/components/refund/RefundDialogContent.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import type { SaleItem, Product, ProductBatch, DiscountSet } from '@/types';
import { transactionLinesToSaleItems } from '@/lib/pos-data-transformer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { calculateDiscountsAction } from '@/lib/actions/transaction.actions';
import { processRefundAction } from '@/lib/actions/refund.actions';
import { findCampaignById } from '@/lib/my-campaigns';
import { RefundCart } from './RefundCart';
import { RefundSummary } from './RefundSummary';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

// Mock product data for mapping transaction lines back to products.
// In a real app, this would come from a database or a shared context.
const oldBatch: ProductBatch = {
    id: 't-shirt-batch-old', batchNumber: 'OLD-2023', sellingPrice: 2000,
    costPrice: 1500, quantity: 100, productId: 't-shirt-01'
};
const newBatch: ProductBatch = {
    id: 't-shirt-batch-new', batchNumber: 'NEW-2024', sellingPrice: 2500,
    costPrice: 1800, quantity: 100, productId: 't-shirt-01'
};
const jeansOldBatch: ProductBatch = {
    id: 'jeans-batch-old', batchNumber: 'JEANS-OLD-2023', sellingPrice: 7000,
    costPrice: 4000, quantity: 50, productId: 'jeans-01'
};
const jeansNewBatch: ProductBatch = {
    id: 'jeans-batch-new', batchNumber: 'JEANS-NEW-2024', sellingPrice: 8000,
    costPrice: 5000, quantity: 30, productId: 'jeans-01'
};
const sampleProducts: Product[] = [
    { id: 't-shirt-01', name: 'T-Shirt', sellingPrice: 2500, batches: [oldBatch, newBatch], category: 'Apparel', units: { baseUnit: 'pcs' }, stock: 200, defaultQuantity: 1, isActive: true, isService: false },
    { id: 'jeans-01', name: 'Jeans', sellingPrice: 8000, batches: [jeansOldBatch, jeansNewBatch], category: 'Apparel', units: { baseUnit: 'pcs' }, stock: 80, defaultQuantity: 1, isActive: true, isService: false },
];


interface RefundDialogContentProps {
  originalTransaction: DatabaseReadyTransaction;
  onRefundComplete: () => void;
}

const initialDiscountResult = {
  lineItems: [], totalItemDiscount: 0, totalCartDiscount: 0,
  appliedCartRules: [], originalSubtotal: 0, totalDiscount: 0, finalTotal: 0,
  getLineItem: (saleItemId: string) => undefined, getAppliedRulesSummary: () => [],
};

export function RefundDialogContent({
  originalTransaction,
  onRefundComplete,
}: RefundDialogContentProps) {
  const [refundCart, setRefundCart] = useState<SaleItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [discountResult, setDiscountResult] = useState<any>(initialDiscountResult);
  const [activeCampaign, setActiveCampaign] = useState<DiscountSet | null>(null);
  const { toast } = useToast();

  // Find the original campaign when the component mounts
  useEffect(() => {
    const campaignId = originalTransaction.transactionHeader.campaignId;
    if (campaignId) {
      const foundCampaign = findCampaignById(campaignId);
      if (foundCampaign) {
        setActiveCampaign(foundCampaign);
      } else {
        console.error(`Campaign with ID "${campaignId}" not found!`);
        // Handle error, maybe show a message to the user
      }
    }
    // Initialize the refund cart with items from the original transaction
    const items = transactionLinesToSaleItems(originalTransaction.transactionLines, sampleProducts);
    setRefundCart(items);
  }, [originalTransaction]);

  // Recalculate discounts whenever the refund cart or the campaign changes
  useEffect(() => {
    if (!activeCampaign) {
      // Don't calculate until campaign is loaded
      return;
    }

    const recalculate = async () => {
      setIsProcessing(true);

      if (refundCart.length === 0) {
        // If cart is empty, full refund, so new bill total is 0
        setDiscountResult({ ...initialDiscountResult, finalTotal: 0, originalSubtotal: 0 });
        setIsProcessing(false);
        return;
      }
      
      const result = await calculateDiscountsAction(refundCart, activeCampaign);
      if (result.success && result.data) {
        setDiscountResult({
          ...result.data,
          getLineItem: (saleItemId: string) => result.data.lineItems.find((li: any) => li.saleItemId === saleItemId),
          getAppliedRulesSummary: () => result.data.appliedRulesSummary || []
        });
      } else {
        toast({
          variant: "destructive", title: "Discount Error",
          description: result.error,
        });
        setDiscountResult(initialDiscountResult);
      }
      setIsProcessing(false);
    };
    
    recalculate();

  }, [refundCart, activeCampaign, toast]);

  const updateRefundQuantity = useCallback((saleItemId: string, change: number) => {
    setRefundCart(currentCart => {
      const itemIndex = currentCart.findIndex(item => item.saleItemId === saleItemId);
      if (itemIndex === -1) return currentCart;
      
      const updatedCart = [...currentCart];
      const currentItem = updatedCart[itemIndex];

      const originalLine = originalTransaction.transactionLines.find(line => line.productId === currentItem.id && line.batchId === currentItem.selectedBatchId);
      const maxQty = originalLine?.quantity || 0;

      let newQuantity = Number(currentItem.quantity) + Number(change);

      if (newQuantity < 0) {
        newQuantity = 0;
      }
      
      if (newQuantity > maxQty) {
        newQuantity = maxQty;
      }

      if (newQuantity === 0) {
         // Filter out the item if its quantity becomes zero
        return updatedCart.filter(item => item.saleItemId !== saleItemId);
      } else {
        updatedCart[itemIndex] = { ...currentItem, quantity: newQuantity };
        return updatedCart;
      }
    });
  }, [originalTransaction.transactionLines]);

  const handleProcessRefund = async () => {
    if (!activeCampaign) {
        toast({ variant: "destructive", title: "Refund Error", description: "Original discount campaign could not be loaded." });
        return;
    }
    setIsProcessing(true);
    try {
        // This object only contains plain data, safe to pass to a Server Action.
        const payload = {
            originalTransaction,
            refundCart,
            activeCampaign,
        };

        const result = await processRefundAction(payload);

        if (result.success && result.data) {
            toast({
                title: "Refund Processed Successfully",
                description: `New transaction ${result.data.transactionHeader.transactionId} created.`,
            });
            onRefundComplete();
        } else {
            throw new Error(result.error || "An unknown error occurred during refund processing.");
        }
    } catch (error) {
        console.error("Refund failed:", error);
        toast({
            variant: "destructive",
            title: "Refund Failed",
            description: error instanceof Error ? error.message : "Could not process refund.",
        });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const refundAmount = originalTransaction.transactionHeader.finalTotal - discountResult.finalTotal;

  if (!activeCampaign) {
    return (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Campaign Error!</AlertTitle>
            <AlertDescription>
                The original discount campaign for this transaction could not be found. 
                Cannot proceed with an accurate refund calculation.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow py-4">
        <RefundCart
          cart={refundCart}
          onUpdateQuantity={updateRefundQuantity}
          originalTransactionLines={originalTransaction.transactionLines}
          discountResult={discountResult}
        />
        <RefundSummary
          originalTransaction={originalTransaction}
          newDiscountResult={discountResult}
          refundAmount={refundAmount}
          isProcessing={isProcessing}
        />
      </div>
      <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-end gap-2">
        <Button 
            type="button" 
            variant="destructive" 
            onClick={handleProcessRefund}
            disabled={isProcessing || refundAmount < 0}
        >
          {isProcessing ? "Processing..." : `Confirm & Refund Rs. ${refundAmount.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
