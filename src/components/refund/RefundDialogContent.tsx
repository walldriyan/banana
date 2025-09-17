// src/components/refund/RefundDialogContent.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import type { SaleItem, Product, DiscountSet } from '@/types';
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
import { saveTransaction } from '@/lib/db/local-db';

// Mock product data for mapping transaction lines back to products.
// In a real app, this would come from a database or a shared context.
const sampleProducts: Product[] = [
    { 
        id: 't-shirt-old-batch', 
        productId: 't-shirt-01', 
        name: 'T-Shirt', 
        batchNumber: 'OLD-2023',
        sellingPrice: 2000,
        costPrice: 1500,
        quantity: 100, 
        stock: 100,
        category: 'Apparel', 
        units: { baseUnit: 'pcs' }, 
        isActive: true, 
        isService: false,
        defaultQuantity: 1,
    },
    { 
        id: 't-shirt-new-batch', 
        productId: 't-shirt-01', 
        name: 'T-Shirt', 
        batchNumber: 'NEW-2024',
        sellingPrice: 2500,
        costPrice: 1800,
        quantity: 100, 
        stock: 100,
        category: 'Apparel', 
        units: { baseUnit: 'pcs' }, 
        isActive: true, 
        isService: false,
        defaultQuantity: 1,
    },
    { 
        id: 'jeans-old-batch', 
        productId: 'jeans-01', 
        name: 'Jeans', 
        batchNumber: 'JEANS-OLD-2023',
        sellingPrice: 7000,
        costPrice: 4000,
        quantity: 50, 
        stock: 50,
        category: 'Apparel', 
        units: { baseUnit: 'pcs' }, 
        isActive: true, 
        isService: false,
        defaultQuantity: 1,
    },
    { 
        id: 'jeans-new-batch', 
        productId: 'jeans-01', 
        name: 'Jeans', 
        batchNumber: 'JEANS-NEW-2024',
        sellingPrice: 8000,
        costPrice: 5000,
        quantity: 30, 
        stock: 30,
        category: 'Apparel', 
        units: { baseUnit: 'pcs' }, 
        isActive: true, 
        isService: false,
        defaultQuantity: 1,
    },
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
      }
    }
    // Use the updated transactionLinesToSaleItems which now restores custom discounts
    const items = transactionLinesToSaleItems(originalTransaction.transactionLines, sampleProducts);
    setRefundCart(items);
  }, [originalTransaction]);

  // Recalculate discounts whenever the refund cart or the campaign changes
  useEffect(() => {
    if (!activeCampaign) {
      return;
    }

    const recalculate = async () => {
      setIsProcessing(true);

      if (refundCart.length === 0) {
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

      const originalLine = originalTransaction.transactionLines.find(line => line.productId === currentItem.productId && line.batchNumber === currentItem.batchNumber);
      const maxQty = originalLine?.quantity || 0;

      let newQuantity = Number(currentItem.quantity) + Number(change);

      if (newQuantity < 0) {
        newQuantity = 0;
      }
      
      if (newQuantity > maxQty) {
        newQuantity = maxQty;
      }

      if (newQuantity === 0) {
        return updatedCart.filter(item => item.saleItemId !== saleItemId);
      } else {
        updatedCart[itemIndex] = { ...currentItem, quantity: newQuantity, displayQuantity: newQuantity }; // Assuming base unit for simplicity in refunds
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
        const payload = {
            originalTransaction,
            refundCart, // this is the list of items being KEPT
            activeCampaign,
        };

        const result = await processRefundAction(payload);

        if (result.success && result.data) {
            await saveTransaction(result.data);
            
            toast({
                title: "Refund Processed Successfully",
                description: `New transaction ${result.data.transactionHeader.transactionId} created and saved locally.`,
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
  
  const originalPaidAmount = originalTransaction.paymentDetails.paidAmount;
  const newTotalToPay = discountResult.finalTotal;
  const finalRefundAmount = originalPaidAmount - newTotalToPay;


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
          finalRefundAmount={finalRefundAmount}
          isProcessing={isProcessing}
        />
      </div>
      <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-end gap-2">
        <Button 
            type="button" 
            variant="destructive" 
            onClick={handleProcessRefund}
            disabled={isProcessing || finalRefundAmount === 0}
        >
          {isProcessing ? "Processing..." : 
           finalRefundAmount > 0 ? `Refund Rs. ${finalRefundAmount.toFixed(2)}` :
           finalRefundAmount < 0 ? `Collect Rs. ${(-finalRefundAmount).toFixed(2)}` :
           `Confirm Refund (No Charge)`
          }
        </Button>
      </div>
    </div>
  );
}
