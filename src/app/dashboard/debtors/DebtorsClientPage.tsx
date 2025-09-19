// src/app/dashboard/debtors/DebtorsClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Transaction, Customer } from '@prisma/client';
import { getDebtorTransactionsAction } from '@/lib/actions/debtor.actions';
import { DebtorsDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { ManageSalePaymentsDrawer } from '@/components/debtors/ManageSalePaymentsDrawer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Landmark, Wallet, Banknote } from 'lucide-react';


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


export function DebtorsClientPage() {
  const [transactions, setTransactions] = useState<DebtorTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const openManagePaymentsDrawer = useCallback((transaction: DebtorTransaction) => {
    drawer.openDrawer({
        title: `Manage Payments for Txn: ${transaction.id}`,
        description: `Customer: ${transaction.customer.name}`,
        content: <ManageSalePaymentsDrawer transaction={transaction} onPaymentUpdate={handlePaymentUpdate} />,
        drawerClassName: 'sm:max-w-4xl'
    });
  }, [drawer, handlePaymentUpdate]);
  
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
      <Card className="mt-8 bg-muted/20">
            <CardHeader>
                <CardTitle>Debtors Summary</CardTitle>
                <CardDescription>An overview of your outstanding customer credit.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Stats */}
                <Card className="lg:col-span-1 bg-transparent border-none shadow-none">
                    <CardHeader>
                        <CardTitle className="text-lg">General</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <SummaryRow icon={FileText} label="Total Debt Transactions" value={summary.totalTransactions} />
                        <SummaryRow icon={Users} label="Unique Customers (Debtors)" value={summary.totalCustomers} />
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
                            description="Total value of all credit sales"
                        />
                         <SummaryRow 
                            icon={Wallet} 
                            label="Total Received from Debtors" 
                            value={`Rs. ${summary.totalReceivedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                            description="Total cash inflow from credit payments"
                            valueClassName="text-green-600"
                        />
                         <SummaryRow 
                            icon={Banknote} 
                            label="Total Outstanding (Receivable)" 
                            value={`Rs. ${summary.totalOutstandingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                            description="Total amount owed by customers"
                            valueClassName="text-red-600"
                        />
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    </>
  );
}
