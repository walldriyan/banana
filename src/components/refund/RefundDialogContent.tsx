// src/components/refund/RefundDialogContent.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import type { SaleItem, ProductBatch, DiscountSet } from '@/types';
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
import { saveTransactionToDb } from '@/lib/actions/database.actions';
import { getProductBatchesAction } from '@/lib/actions/product.actions';


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
  const [allBatches, setAllBatches] = useState<ProductBatch[]>([]);

  // Find the original campaign and map transaction lines to sale items
  useEffect(() => {
    const initialize = async () => {
        setIsProcessing(true);
        const campaignId = originalTransaction.transactionHeader.campaignId;
        if (campaignId) {
            const foundCampaign = findCampaignById(campaignId);
            if (foundCampaign) {
                setActiveCampaign(foundCampaign);
            } else {
                console.error(`Campaign with ID "${campaignId}" not found!`);
            }
        }
        
        // Fetch all product batches to correctly map transaction lines to SaleItems
        const batchesResult = await getProductBatchesAction();
        if (batchesResult.success && batchesResult.data) {
            setAllBatches(batchesResult.data);
            const items = transactionLinesToSaleItems(originalTransaction.transactionLines, batchesResult.data);
            setRefundCart(items);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load product batch data for refund.' });
        }
        setIsProcessing(false);
    }
    initialize();
  }, [originalTransaction, toast]);

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

      const originalLine = originalTransaction.transactionLines.find(line => line.batchId === currentItem.id);
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
            // Now save the returned transaction object to the database
            const saveResult = await saveTransactionToDb(result.data);
            if (!saveResult.success) {
                throw new Error(saveResult.error);
            }
            
            toast({
                title: "Refund Processed Successfully",
                description: `New transaction ${saveResult.data.id} created and saved to the database.`,
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
