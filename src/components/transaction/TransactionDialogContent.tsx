// src/components/transaction/TransactionDialogContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { PaymentPanel } from './PaymentPanel';
import { PrintPreview } from './PrintPreview';
import type { SaleItem } from '@/types';
import type { DiscountResult } from '@/discount-engine/core/result';
import { transformTransactionDataForDb } from '@/lib/pos-data-transformer';
import type { CustomerData, PaymentData, DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useDrawer } from '@/hooks/use-drawer';
import { useToast } from '@/hooks/use-toast';
import { saveTransaction } from '@/lib/db/local-db';
import { transactionFormSchema, type TransactionFormValues } from '@/lib/validation/transaction.schema';

interface TransactionDialogContentProps {
  cart: SaleItem[];
  discountResult: DiscountResult;
  transactionId: string;
  onTransactionComplete: () => void;
}

export function TransactionDialogContent({
  cart,
  discountResult,
  transactionId,
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
      },
    },
    mode: 'onChange', 
  });
  
  const { handleSubmit, reset, formState: { isValid } } = methods;

  useEffect(() => {
    // Reset form with new totals when discountResult changes
    reset({
        customer: {
            name: 'Walk-in Customer',
            phone: '',
            address: '',
        },
        payment: {
            paidAmount: discountResult.finalTotal,
            paymentMethod: 'cash',
            outstandingAmount: 0,
            isInstallment: false,
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
    });
    
    try {
      await saveTransaction(preparedData);
      setFinalTransactionData(preparedData);
      setStep('print');
      toast({
        title: "Transaction Saved Locally",
        description: "The transaction has been saved to the local offline database.",
      });
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

  const handlePrintAndFinish = () => {
    console.log("Printing receipt...");
    onTransactionComplete();
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
                <Button onClick={handlePrintAndFinish}>Finish & Print</Button>
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
            {isSaving ? "Saving..." : "Confirm & Preview Receipt"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
