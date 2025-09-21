// src/app/dashboard/credit/CreditClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GoodsReceivedNote, Supplier, PurchasePayment } from '@prisma/client';
import { getCreditorGrnsAction, getPaymentsForGrnAction } from '@/lib/actions/credit.actions';
import { CreditDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { ManagePaymentsDrawer } from '@/components/credit/ManagePaymentsDrawer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Building, Landmark, Wallet, Banknote, Printer } from 'lucide-react';
import { Button } from '../ui/button';
import { GrnReceipt } from '../credit/GrnReceipt';


export type CreditorGrn = GoodsReceivedNote & {
    supplier: Supplier;
    totalPaid: number;
    _count: { payments: number };
};

const receiptStyles = `
  body { font-family: monospace; color: black; background-color: white; margin: 0; padding: 5px; font-size: 10px; }
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
    const paymentsResult = await getPaymentsForGrnAction(grn.id);
    if (!paymentsResult.success || !paymentsResult.data) {
        toast({ variant: 'destructive', title: 'Print Error', description: 'Could not fetch payment history for printing.'});
        return;
    }

    const ReactDOMServer = (await import('react-dom/server')).default;
    const receiptHTML = ReactDOMServer.renderToString(
      <GrnReceipt grn={grn} payments={paymentsResult.data} />
    );

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`<html><head><title>Print GRN Statement</title><style>${receiptStyles}</style></head><body>${receiptHTML}</body></html>`);
      iframeDoc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  }, [toast]);


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
      <Card className="mt-8 bg-muted/20">
            <CardHeader>
                <CardTitle>Creditors Summary</CardTitle>
                <CardDescription>An overview of your outstanding payments to suppliers.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Stats */}
                <Card className="lg:col-span-1 bg-transparent border-none shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">General</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <SummaryRow icon={FileText} label="Total Outstanding GRNs" value={summary.totalOutstandingGrns} />
                        <SummaryRow icon={Building} label="Unique Suppliers (Creditors)" value={summary.totalSuppliers} />
                    </CardContent>
                </Card>

                {/* Financial Stats */}
                <Card className="lg:col-span-1 bg-transparent border-none shadow-none">
                     <CardHeader>
                        <CardTitle className="text-lg">Financials</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                         <SummaryRow 
                            icon={Landmark} 
                            label="Total Debt Value" 
                            value={`Rs. ${summary.totalDebtValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            description="Total value of all credit GRNs"
                        />
                         <SummaryRow 
                            icon={Wallet} 
                            label="Total Paid for these GRNs" 
                            value={`Rs. ${summary.totalPaidValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                            description="Total cash outflow for these credit purchases"
                            valueClassName="text-green-600"
                        />
                         <SummaryRow 
                            icon={Banknote} 
                            label="Total Outstanding (Payable)" 
                            value={`Rs. ${summary.totalOutstandingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                            description="Total amount owed to suppliers"
                            valueClassName="text-red-600"
                        />
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    </>
  );
}
