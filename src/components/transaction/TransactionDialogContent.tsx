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
import { getCustomersAction } from '@/lib/actions/customer.actions';
import { transactionFormSchema, type TransactionFormValues } from '@/lib/validation/transaction.schema';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { LanguageToggle } from '../LanguageToggle';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import type { Company, Customer } from '@prisma/client';
import { printReceipt } from '@/lib/services/print.service';

const PRINT_TOGGLE_STORAGE_KEY = 'shouldPrintBill';

const receiptStyles = `
  @page { size: 240px auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 265px; height: auto; }
  body { font-family: monospace; background-color: transparent; color: black; }
  .thermal-receipt-container { background-color: transparent; font-family: monospace; font-size: 10px; width: 230px; margin: 0 auto; padding: 0; box-sizing: border-box; overflow-x: hidden; }
  
  html.dark body, html.dark .thermal-receipt-container { 
    background-color: #111827 !important; /* gray-900 */
    color: white !important;
  }
  html.dark .border-black { border-color: #f4f4f5; }
  html.dark .text-gray-600 { color: #a1a1aa; } /* zinc-400 */
  html.dark .text-green-700 { color: #86efac; } /* green-300 */
  html.dark .text-blue-700 { color: #93c5fd; } /* blue-300 */
  html.dark .text-red-600 { color: #fca5a5; } /* red-300 */

  .text-center { text-align: center; }
  .space-y-1 > * + * { margin-top: 4px; }
  .text-lg { font-size: 1.125rem; }
  .font-bold { font-weight: 700; }
  .border-t { border-top-width: 1px; }
  .border-dashed { border-style: dashed; }
  .border-black { border-color: black; }
  .my-1 { margin-top: 4px; margin-bottom: 4px; }
  .w-full { width: 100%; table-layout: fixed; }
  .text-left { text-align: left; word-wrap: break-word; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .text-base { font-size: 1rem; }
  .italic { font-style: italic; }
  .text-gray-600 { color: #555; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .text-green-700 { color: #047857; }
  .text-blue-700 { color: #1d4ed8; }
  .text-red-600 { color: #dc2626; }
  .mt-2 { margin-top: 8px; }
  .text-xs { font-size: 0.75rem; }
  .capitalize { text-transform: capitalize; }
  
  table { width: 100%; table-layout: fixed; border-collapse: collapse; margin: 5px 0; }
  table th, table td { word-wrap: break-word; overflow-wrap: break-word; padding: 2px 0; vertical-align: top; max-width: 0; }
  table th:nth-child(1), table td:nth-child(1) { width: 100px; }
  table th:nth-child(2), table td:nth-child(2) { width: 45px; }
  table th:nth-child(3), table td:nth-child(3) { width: 60px; }
  table th:nth-child(4), table td:nth-child(4) { width: 60px; }
  
  .thermal-receipt-container > * { padding: 0 5px; }
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
  const [customers, setCustomers] = useState<Customer[]>([]);
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
    // Fetch company and customer details when the dialog opens
    async function fetchInitialData() {
      const [companyResult, customersResult] = await Promise.all([
        getCompanyForReceiptAction(),
        getCustomersAction()
      ]);

      if (companyResult.success && companyResult.data) {
        setCompanyDetails(companyResult.data);
      } else {
        toast({ variant: 'destructive', title: 'Company Info Missing', description: companyResult.error });
      }

      if (customersResult.success && customersResult.data) {
        setCustomers(customersResult.data);
      } else {
        toast({ variant: 'destructive', title: 'Customer List Error', description: customersResult.error });
      }
    }

    fetchInitialData();
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
    const isDarkMode = document.documentElement.classList.contains('dark');
    const ReactDOMServer = (await import('react-dom/server')).default;
    const receiptHTML = ReactDOMServer.renderToString(
      <LanguageProvider initialLanguage={language}>
        <ThermalReceipt data={dataToSave} company={companyDetails} showAsGiftReceipt={isGiftReceipt} />
      </LanguageProvider>
    );

    // Pass receipt HTML and styles to print service
    // Print service will wrap it in proper HTML structure
    await printReceipt(receiptHTML, receiptStyles);
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
      <div className="flex flex-col h-[85vh] no-print">
        {step === 'details' && (
          <form onSubmit={handleSubmit(handlePreview)} className="flex flex-col flex-grow min-h-0">
            <div className="flex-grow overflow-y-auto py-4 pr-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomerInfoPanel customers={customers} />
                <PaymentPanel finalTotal={discountResult.finalTotal} />
              </div>
            </div>
            <div className="flex-shrink-0 pt-4 mt-auto border-t flex items-center justify-end">
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
          <div className='py-4 flex flex-col flex-grow min-h-0'>
            <div
              className="bg-muted p-4 rounded-lg overflow-y-auto flex-grow printable-area focus:outline-none"
              style={{ boxShadow: 'none' }}
            >
              <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                <ThermalReceipt data={finalTransactionData} company={companyDetails} showAsGiftReceipt={isGiftReceipt} />
              </div>
            </div>
            <div className="flex-shrink-0 pt-4 mt-auto border-t flex items-center justify-between">
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
