// src/app/dashboard/credit/CreditClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GoodsReceivedNote, Supplier, PurchasePayment } from '@prisma/client';
import { getCreditorGrnsAction, getPaymentsForGrnAction } from '@/lib/actions/credit.actions';
import { getCompanyForReceiptAction } from '@/lib/actions/company.actions';
import { CreditDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { ManagePaymentsDrawer } from '@/components/credit/ManagePaymentsDrawer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Building, Landmark, Wallet, Banknote, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GrnReceipt } from '@/components/credit/GrnReceipt';
import { useLanguage, LanguageProvider } from '@/context/LanguageContext';


export type CreditorGrn = GoodsReceivedNote & {
    supplier: Supplier;
    totalPaid: number;
    _count: { payments: number };
};

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


const SummaryRow = ({ icon: Icon, label, value, description, valueClassName }: { icon: React.ElementType, label: string, value: string | number, description?: string, valueClassName?: string }) => (
    <div className="flex items-start gap-4 py-3">
        <div className="bg-muted p-2 rounded-lg">
            <Icon className="h-5 w-5 text-foreground/80" />
        </div>
        <div className="flex-1">
            <p className="font-medium text-foreground">{label}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <p className={`text-xl font-bold text-right ${valueClassName}`}>{value}</p>
    </div>
);


export function CreditClientPage() {
  const [grns, setGrns] = useState<CreditorGrn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchCreditorGrns = useCallback(async () => {
    setIsLoading(true);
    const result = await getCreditorGrnsAction();
    if (result.success && result.data) {
      setGrns(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching GRNs',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchCreditorGrns();
  }, [fetchCreditorGrns]);
  
  const handlePaymentUpdate = useCallback(() => {
      fetchCreditorGrns(); // Refresh the main list when a payment is made
  }, [fetchCreditorGrns]);

  const handlePrint = useCallback(async (grn: CreditorGrn) => {
    // 1. Fetch the LATEST payment history and company details just before printing.
    const [paymentsResult, companyResult] = await Promise.all([
      getPaymentsForGrnAction(grn.id),
      getCompanyForReceiptAction()
    ]);
    
    if (!paymentsResult.success || !paymentsResult.data) {
        toast({ variant: 'destructive', title: 'Print Error', description: 'Could not fetch latest payment history for printing.'});
        return;
    }
     if (!companyResult.success || !companyResult.data) {
        toast({ variant: 'destructive', title: 'Print Error', description: 'Could not fetch company details for printing.'});
        return;
    }
    
    // 2. We also need the latest GRN data (e.g., totalPaid)
    const latestGrn = {
        ...grn,
        totalPaid: paymentsResult.data.reduce((sum, p) => sum + p.amount, 0),
    };


    // 3. Dynamically render the receipt component to an HTML string.
    const ReactDOMServer = (await import('react-dom/server')).default;
    const receiptHTML = ReactDOMServer.renderToString(
      <LanguageProvider initialLanguage={language}>
        <GrnReceipt grn={latestGrn} payments={paymentsResult.data} company={companyResult.data} />
      </LanguageProvider>
    );

    // 4. Create and configure the iframe for printing.
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      // 5. Inject the styles and the HTML content directly into the iframe's document.
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <title>Print GRN Statement</title>
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

    // 6. Clean up the iframe after a short delay.
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  }, [toast, language]);


  const openManagePaymentsDrawer = useCallback((grn: CreditorGrn) => {
    drawer.openDrawer({
        title: `Manage Payments for GRN: ${grn.grnNumber}`,
        description: `Supplier: ${grn.supplier.name}`,
        headerActions: (
            <Button onClick={() => handlePrint(grn)} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print Statement
            </Button>
        ),
        content: <ManagePaymentsDrawer grn={grn} onPaymentUpdate={handlePaymentUpdate} />,
        drawerClassName: 'sm:max-w-4xl'
    });
  }, [drawer, handlePaymentUpdate, handlePrint]);

  const summary = useMemo(() => {
    const totalOutstandingGrns = grns.length;
    const totalSuppliers = new Set(grns.map(g => g.supplierId)).size;
    const totalDebtValue = grns.reduce((sum, g) => sum + g.totalAmount, 0);
    const totalPaidValue = grns.reduce((sum, g) => sum + g.totalPaid, 0);
    const totalOutstandingValue = totalDebtValue - totalPaidValue;

    return {
        totalOutstandingGrns,
        totalSuppliers,
        totalDebtValue,
        totalPaidValue,
        totalOutstandingValue,
    };
  }, [grns]);


  const columns = useMemo(() => getColumns(openManagePaymentsDrawer), [openManagePaymentsDrawer]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <CreditDataTable
        columns={columns}
        data={grns}
      />
    </>
  );
}
