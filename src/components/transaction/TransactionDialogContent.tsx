// src/components/transaction/TransactionDialogContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { PaymentPanel } from './PaymentPanel';
import { PrintPreview } from './PrintPreview';
import type { SaleItem, DiscountSet } from '@/types';
import type { DiscountResult } from '@/discount-engine/core/result';
import { transformTransactionDataForDb } from '@/lib/pos-data-transformer';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useDrawer } from '@/hooks/use-drawer';
import { useToast } from '@/hooks/use-toast';
import { saveTransaction } from '@/lib/db/local-db';
import { transactionFormSchema, type TransactionFormValues } from '@/lib/validation/transaction.schema';

interface TransactionDialogContentProps {
  cart: SaleItem[];
  discountResult: any; // Using any for plain object from server
  transactionId: string;
  activeCampaign: DiscountSet;
  onTransactionComplete: () => void;
}

export function TransactionDialogContent({
  cart,
  discountResult,
  transactionId,
  activeCampaign,
  onTransactionComplete,
}: TransactionDialogContentProps) {
  const [step, setStep] = useState<'details' | 'print'>('details');
  const [showFullPrice, setShowFullPrice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [finalTransactionData, setFinalTransactionData] = useState<DatabaseReadyTransaction | null>(null);
  const drawer = useDrawer();
  const { toast } = useToast();

  const methods = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      customer: {
        name: 'Walk-in Customer',
        phone: '',
        address: '',
      },
      payment: {
        paidAmount: 0,
        paymentMethod: 'cash',
        outstandingAmount: 0,
        isInstallment: false,
        finalTotal: 0, // Initialize finalTotal
      },
    },
    mode: 'onChange',
  });
  
  const { handleSubmit, reset, formState: { isValid } } = methods;

  useEffect(() => {
    // Reset form with new totals when discountResult changes
    const finalTotal = discountResult.finalTotal || 0;
    reset({
        customer: {
            name: 'Walk-in Customer',
            phone: '',
            address: '',
        },
        payment: {
            paidAmount: finalTotal, // Default paid amount to the final total
            paymentMethod: 'cash',
            outstandingAmount: 0,
            isInstallment: false,
            finalTotal: finalTotal, // Pass finalTotal to the form context
        }
    });
  }, [discountResult, reset]);


  const processTransaction = async (data: TransactionFormValues) => {
    setIsSaving(true);
    const preparedData = transformTransactionDataForDb({
      cart,
      discountResult,
      transactionId,
      customerData: data.customer,
      paymentData: data.payment,
      activeCampaign: activeCampaign,
      isGiftReceipt: showFullPrice, // Pass the current state of the toggle
    });
    
    setFinalTransactionData(preparedData); // Set the prepared data for the print preview
    setStep('print');
    setIsSaving(false);
    
  };

  const handlePrintAndFinish = async () => {
    if (!finalTransactionData) {
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Transaction data is not available to save.",
        });
        return;
    };

    setIsSaving(true);
    try {
      // Create the final version of the data right before saving,
      // ensuring it captures the latest toggle state.
      const dataToSave: DatabaseReadyTransaction = {
        ...finalTransactionData,
        transactionHeader: {
            ...finalTransactionData.transactionHeader,
            isGiftReceipt: showFullPrice
        }
      };

      await saveTransaction(dataToSave);
      toast({
        title: "Transaction Saved",
        description: `Transaction ${dataToSave.transactionHeader.transactionId} saved.`,
      });
      console.log("Printing receipt...");
      onTransactionComplete();

    } catch (error) {
      console.error("Failed to save transaction:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
        setIsSaving(false);
    }
  };


  if (step === 'print' && finalTransactionData) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-grow overflow-y-auto bg-gray-100 p-4 rounded-md">
          <PrintPreview data={finalTransactionData} showFullPrice={showFullPrice} />
        </div>
        <div className="flex-shrink-0 pt-4 mt-4 border-t flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Switch
                    id="billing-mode"
                    checked={showFullPrice}
                    onCheckedChange={setShowFullPrice}
                />
                <Label htmlFor="billing-mode">Show Full Price (Gift Discount)</Label>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('details')}>Back to Details</Button>
                <Button onClick={handlePrintAndFinish} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save, Finish & Print"}
                </Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(processTransaction)} className="flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-grow">
          <CustomerInfoPanel />
          <PaymentPanel finalTotal={discountResult.finalTotal} />
        </div>
        <div className="flex-shrink-0 pt-4 mt-4 border-t flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => drawer.closeDrawer()}>Cancel</Button>
          <Button type="submit" disabled={isSaving || !isValid}>
            {isSaving ? "Processing..." : "Confirm & Preview Receipt"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
