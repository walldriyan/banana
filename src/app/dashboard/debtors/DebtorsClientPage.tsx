// src/app/dashboard/debtors/DebtorsClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Transaction, Customer, SalePayment } from '@prisma/client';
import { getDebtorTransactionsAction, getPaymentsForSaleAction } from '@/lib/actions/debtor.actions';
import { getCompanyForReceiptAction } from '@/lib/actions/company.actions';
import { DebtorsDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { ManageSalePaymentsDrawer } from '@/components/debtors/ManageSalePaymentsDrawer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Landmark, Wallet, Banknote, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SaleReceipt } from '@/components/debtors/SaleReceipt';
import { useLanguage, LanguageProvider } from '@/context/LanguageContext';


export type DebtorTransaction = Transaction & {
    customer: Customer;
    totalPaid: number;
    _count: { salePayments: number };
};

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


export function DebtorsClientPage() {
  const [transactions, setTransactions] = useState<DebtorTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchDebtorTransactions = useCallback(async () => {
    setIsLoading(true);
    const result = await getDebtorTransactionsAction();
    if (result.success && result.data) {
      setTransactions(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching transactions',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchDebtorTransactions();
  }, [fetchDebtorTransactions]);
  
  const handlePaymentUpdate = useCallback(() => {
      fetchDebtorTransactions(); // Refresh the main list when a payment is made
  }, [fetchDebtorTransactions]);

  const handlePrint = useCallback(async (transaction: DebtorTransaction) => {
     const [paymentsResult, companyResult] = await Promise.all([
      getPaymentsForSaleAction(transaction.id),
      getCompanyForReceiptAction()
    ]);
    
    if (!paymentsResult.success || !paymentsResult.data) {
        toast({ variant: 'destructive', title: 'Print Error', description: 'Could not fetch payment history for printing.'});
        return;
    }
     if (!companyResult.success || !companyResult.data) {
        toast({ variant: 'destructive', title: 'Print Error', description: 'Could not fetch company details for printing.'});
        return;
    }
    
    const latestTransaction = {
        ...transaction,
        totalPaid: paymentsResult.data.reduce((sum, p) => sum + p.amount, 0),
    };

    const ReactDOMServer = (await import('react-dom/server')).default;
    const receiptHTML = ReactDOMServer.renderToString(
      <LanguageProvider initialLanguage={language}>
        <SaleReceipt transaction={latestTransaction} payments={paymentsResult.data} company={companyResult.data} />
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
            <title>Print Transaction Statement</title>
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
  }, [toast, language]);


  const openManagePaymentsDrawer = useCallback((transaction: DebtorTransaction) => {
    drawer.openDrawer({
        title: `Manage Payments for Txn: ${transaction.id}`,
        description: `Customer: ${transaction.customer.name}`,
        headerActions: (
            <Button onClick={() => handlePrint(transaction)} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Print Statement
            </Button>
        ),
        content: <ManageSalePaymentsDrawer transaction={transaction} onPaymentUpdate={handlePaymentUpdate} />,
        drawerClassName: 'sm:max-w-4xl'
    });
  }, [drawer, handlePaymentUpdate, handlePrint]);
  
  const summary = useMemo(() => {
    const totalTransactions = transactions.length;
    const totalCustomers = new Set(transactions.map(t => t.customerId)).size;
    const totalDebtValue = transactions.reduce((sum, t) => sum + t.finalTotal, 0);
    const totalReceivedValue = transactions.reduce((sum, t) => sum + t.totalPaid, 0);
    const totalOutstandingValue = totalDebtValue - totalReceivedValue;

    return {
        totalTransactions,
        totalCustomers,
        totalDebtValue,
        totalReceivedValue,
        totalOutstandingValue,
    };
  }, [transactions]);


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
      <DebtorsDataTable
        columns={columns}
        data={transactions}
      />
    </>
  );
}
