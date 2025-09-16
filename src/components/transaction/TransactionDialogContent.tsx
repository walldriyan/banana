// src/components/transaction/TransactionDialogContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { CustomerInfoPanel } from './CustomerInfoPanel';
import { PaymentPanel } from './PaymentPanel';
import { ThermalReceipt } from './receipt-templates/ThermalReceipt';
import type { SaleItem, DiscountSet } from '@/types';
import { transformTransactionDataForDb } from '@/lib/pos-data-transformer';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { useDrawer } from '@/hooks/use-drawer';
import { useToast } from '@/hooks/use-toast';
import { saveTransaction } from '@/lib/db/local-db';
import { transactionFormSchema, type TransactionFormValues } from '@/lib/validation/transaction.schema';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';


const PRINT_TOGGLE_STORAGE_KEY = 'shouldPrintBill';

interface TransactionDialogContentProps {
  cart: SaleItem[];
  discountResult: any; // Using any for plain object from server
  transactionId: string;
  activeCampaign: DiscountSet;
  onTransactionComplete: () => void;
}

// Define the styles for the receipt directly. This ensures they are self-contained.
const receiptStyles = `
  body { font-family: monospace; color: black; background-color: white; margin: 0; padding: 5px; }
  .thermal-receipt-container { background-color: white; color: black; font-family: monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 8px; }
  .text-center { text-align: center; }
  .space-y-1 > * + * { margin-top: 4px; }
  .text-lg { font-size: 1.125rem; }
  .font-bold { font-weight: 700; }
  .border-t { border-top-width: 1px; }
  .border-dashed { border-style: dashed; }
  .border-black { border-color: black; }
  .my-1 { margin-top: 4px; margin-bottom: 4px; }
  .w-full { width: 100%; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .text-base { font-size: 1rem; }
  .italic { font-style: italic; }
  .text-gray-600 { color: #555; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .font-bold { font-weight: bold; }
  .text-green-700 { color: #047857; }
  .text-blue-700 { color: #1d4ed8; }
  .text-red-600 { color: #dc2626; }
  .mt-2 { margin-top: 8px; }
`;

export function TransactionDialogContent({
  cart,
  discountResult,
  transactionId,
  activeCampaign,
  onTransactionComplete,
}: TransactionDialogContentProps) {
  const [showFullPrice, setShowFullPrice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shouldPrintBill, setShouldPrintBill] = useState(true);
  const drawer = useDrawer();
  const { toast } = useToast();

  useEffect(() => {
    const savedPreference = localStorage.getItem(PRINT_TOGGLE_STORAGE_KEY);
    if (savedPreference !== null) {
      setShouldPrintBill(JSON.parse(savedPreference));
    }
  }, []);

  const handleShouldPrintChange = (checked: boolean) => {
    setShouldPrintBill(checked);
    localStorage.setItem(PRINT_TOGGLE_STORAGE_KEY, JSON.stringify(checked));
  }

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
        finalTotal: 0,
      },
    },
    mode: 'onChange',
  });
  
  const { handleSubmit, reset, formState: { isValid, isSubmitting } } = methods;

  useEffect(() => {
    const finalTotal = discountResult.finalTotal || 0;
    reset({
        customer: {
            name: 'Walk-in Customer',
            phone: '',
            address: '',
        },
        payment: {
            paidAmount: finalTotal,
            paymentMethod: 'cash',
            outstandingAmount: 0,
            isInstallment: false,
            finalTotal: finalTotal,
        }
    });
  }, [discountResult, reset]);


  const handlePrintAndFinish = async (dataToSave: DatabaseReadyTransaction) => {
    if (shouldPrintBill) {
        // Step 1: Get the HTML content of the receipt
        const receiptContainer = document.createElement('div');
        // Temporarily render the component to get its HTML
        const ReactDOMServer = (await import('react-dom/server')).default;
        const receiptHTML = ReactDOMServer.renderToString(
            <ThermalReceipt data={dataToSave} showAsGiftReceipt={showFullPrice} />
        );
        
        // Step 2: Create an invisible iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Step 3: Write the HTML and styles into the iframe
        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`<html><head><title>Print Receipt</title><style>${receiptStyles}</style></head><body>${receiptHTML}</body></html>`);
            iframeDoc.close();

            // Step 4: Print the iframe content
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }

        // Step 5: Clean up by removing the iframe
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 500); // Small delay to ensure print dialog is handled
    }
  };

  const processTransaction = async (data: TransactionFormValues) => {
    setIsSaving(true);
    const preparedData = transformTransactionDataForDb({
      cart,
      discountResult,
      transactionId,
      customerData: data.customer,
      paymentData: data.payment,
      activeCampaign: activeCampaign,
      isGiftReceipt: showFullPrice,
    });
    
    try {
        await saveTransaction(preparedData);
        toast({
            title: "Transaction Saved",
            description: `Transaction ${preparedData.transactionHeader.transactionId} saved locally.`,
        });

        await handlePrintAndFinish(preparedData);
        
        // After saving and printing, close the drawer and complete the flow.
        drawer.closeDrawer();
        onTransactionComplete();

    } catch (error) {
        console.error("Failed to save or print transaction:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
    } finally {
        setIsSaving(false);
    }
  };


  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(processTransaction)} className="flex flex-col no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-grow">
          <CustomerInfoPanel />
          <PaymentPanel finalTotal={discountResult.finalTotal} />
        </div>
         <div className="flex-shrink-0 pt-4 mt-4 border-t flex items-center justify-between no-print">
            <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <Switch
                id="billing-mode"
                checked={showFullPrice}
                onCheckedChange={setShowFullPrice}
                />
                <Label htmlFor="billing-mode">Gift Receipt</Label>
            </div>
            <div className="flex items-center space-x-2">
                <Switch
                id="print-mode"
                checked={shouldPrintBill}
                onCheckedChange={handleShouldPrintChange}
                />
                <Label htmlFor="print-mode">Print Bill</Label>
            </div>
            </div>
            <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => drawer.closeDrawer()}>Cancel</Button>
            <Button type="submit" disabled={isSaving || !isValid || isSubmitting}>
                {isSaving ? "Saving..." : "Save & Finish"}
            </Button>
            </div>
      </div>
      </form>
    </FormProvider>
  );
}
