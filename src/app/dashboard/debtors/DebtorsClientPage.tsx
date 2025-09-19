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


export type DebtorTransaction = Transaction & {
    customer: Customer;
    totalPaid: number;
    _count: { salePayments: number };
};


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
      <DebtorsDataTable
        columns={columns}
        data={transactions}
      />
  );
}
