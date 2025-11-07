// src/components/transaction/TransactionDialogContent.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { saveTransactionToDb } from '@/lib/actions/database.actions';
import { getCompanyForReceiptAction } from '@/lib/actions/company.actions';
import { transactionFormSchema, type TransactionFormValues } from '@/lib/validation/transaction.schema';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { LanguageToggle } from '../LanguageToggle';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import type { Company } from '@prisma/client';

const PRINT_TOGGLE_STORAGE_KEY = 'shouldPrintBill';

const receiptStyles = `
  @page { size: auto; margin: 5px; }
  body { font-family: monospace; color: black; background-color: white; margin: 0; padding: 0; }
  .thermal-receipt-container { background-color: white; color: black; font-family: monospace; font-size: 10px; max-width: 300px; margin: 0 auto; padding: 8px; }
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
  .text-xs { font-size: 0.75rem; }
  .capitalize { text-transform: capitalize; }
`;

interface TransactionDialogContentProps {
  cart: SaleItem[];
  discountResult: any; 
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
  const [isSaving, setIsSaving] = useState(false);
  const [shouldPrintBill, setShouldPrintBill] = useState(true);
  const [isGiftReceipt, setIsGiftReceipt] = useState(false);
  const [finalTransactionData, setFinalTransactionData] = useState<DatabaseReadyTransaction | null>(null);
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const drawer = useDrawer();
  const { toast } = useToast();
  const { language } = useLanguage();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const finishButtonRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    const savedPreference = localStorage.getItem(PRINT_TOGGLE_STORAGE_KEY);
    if (savedPreference !== null) {
      setShouldPrintBill(JSON.parse(savedPreference));
    }
    // Fetch company details when the dialog opens
    getCompanyForReceiptAction().then(result => {
        if (result.success && result.data) {
            setCompanyDetails(result.data);
        } else {
            toast({ variant: 'destructive', title: 'Company Info Missing', description: result.error });
        }
    });
  }, [toast]);

  const handleShouldPrintChange = (checked: boolean) => {
    setShouldPrintBill(checked);
    localStorage.setItem(PRINT_TOGGLE_STORAGE_KEY, JSON.stringify(checked));
  };

  const methods = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      customer: { name: 'Walk-in Customer', phone: '', address: '' },
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
    if (step === 'details') {
        const finalTotal = discountResult.finalTotal || 0;
        reset({
            customer: { name: 'Walk-in Customer', phone: '', address: '' },
            payment: {
                paidAmount: finalTotal,
                paymentMethod: 'cash',
                outstandingAmount: 0,
                isInstallment: false,
                finalTotal: finalTotal,
            }
        });
    }
  }, [discountResult, reset, step]);

  const handlePreview = (data: TransactionFormValues) => {
    const preparedData = transformTransactionDataForDb({
      cart,
      discountResult,
      transactionId,
      customerData: data.customer,
      paymentData: data.payment,
      activeCampaign: activeCampaign,
      isGiftReceipt: isGiftReceipt, 
      company: companyDetails,
    });
    setFinalTransactionData(preparedData);
    setStep('print');
  };

  const handlePrintAndFinish = async (dataToSave: DatabaseReadyTransaction) => {
    const ReactDOMServer = (await import('react-dom/server')).default;
    const receiptHTML = ReactDOMServer.renderToString(
      <LanguageProvider initialLanguage={language}>
        <ThermalReceipt data={dataToSave} company={companyDetails} showAsGiftReceipt={isGiftReceipt} />
      </LanguageProvider>
    );

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <title>Print Receipt</title>
            <style>${receiptStyles}</style>
          </head>
          <body>
            ${receiptHTML}
          </body>
        </html>
      `);
      iframeDoc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };


  const processTransaction = async () => {
    if (!finalTransactionData) return;
    setIsSaving(true);
    try {
        const dataToSave = transformTransactionDataForDb({
          ...finalTransactionData,
          cart,
          discountResult,
          transactionId,
          customerData: finalTransactionData.customerDetails,
          paymentData: finalTransactionData.paymentDetails,
          activeCampaign,
          isGiftReceipt,
          company: companyDetails,
        });

        const result = await saveTransactionToDb(dataToSave);
        
        if (!result.success) {
            throw new Error(result.error);
        }

        toast({
            title: "Transaction Saved",
            description: `Transaction ${result.data.id} saved to the database.`,
        });

        if (shouldPrintBill) {
            await handlePrintAndFinish(dataToSave);
        }
        
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

  useEffect(() => {
    const handleDrawerKeyDown = (event: KeyboardEvent) => {
        if (!drawer.isOpen) return;

        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            if (step === 'details' && confirmButtonRef.current) {
                confirmButtonRef.current.click();
            } else if (step === 'print' && finishButtonRef.current) {
                finishButtonRef.current.click();
            }
        }

        if (event.ctrlKey && event.key === 'ArrowLeft') {
            event.preventDefault();
            if (step === 'print') {
                setStep('details');
            } else if (step === 'details') {
                drawer.closeDrawer();
            }
        }
    };
    
    document.addEventListener('keydown', handleDrawerKeyDown);
    return () => {
        document.removeEventListener('keydown', handleDrawerKeyDown);
    };
  }, [drawer, step]);

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col h-full no-print">
        {step === 'details' && (
          <form onSubmit={handleSubmit(handlePreview)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <CustomerInfoPanel />
              <PaymentPanel finalTotal={discountResult.finalTotal} />
            </div>
            <div className="flex-shrink-0 pt-4 mt-4 border-t flex items-center justify-end">
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => drawer.closeDrawer()}>Cancel</Button>
                    <Button ref={confirmButtonRef} type="submit" disabled={!isValid || isSubmitting}>
                        Confirm & Preview Receipt
                    </Button>
                </div>
            </div>
          </form>
        )}

        {step === 'print' && finalTransactionData && (
          <div className='py-4'>
            <div 
                className="bg-muted p-4 rounded-lg overflow-y-auto max-h-[60vh] printable-area focus:outline-none"
                style={{ boxShadow: 'none' }}
            >
              <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                <ThermalReceipt data={finalTransactionData} company={companyDetails} showAsGiftReceipt={isGiftReceipt} />
              </div>
            </div>
            <div className="flex-shrink-0 pt-4 mt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <LanguageToggle />
                     <div className="flex items-center space-x-2">
                        <Switch
                            id="billing-mode"
                            checked={isGiftReceipt}
                            onCheckedChange={setIsGiftReceipt}
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
                    <Button type="button" variant="outline" onClick={() => setStep('details')}>Back</Button>
                    <Button ref={finishButtonRef} onClick={processTransaction} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save & Finish"}
                    </Button>
                </div>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
