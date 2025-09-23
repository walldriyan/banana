// src/app/dashboard/finance/FinanceClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FinancialTransaction, Company, Customer, Supplier } from '@prisma/client';
import { getTransactionsAction, deleteTransactionAction } from '@/lib/actions/finance.actions';
import { getCompaniesAction } from '@/lib/actions/company.actions';
import { getCustomersAction } from '@/lib/actions/customer.actions';
import { getSuppliersAction } from '@/lib/actions/supplier.actions';
import { FinanceDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Landmark, Briefcase } from 'lucide-react';
import { AddTransactionForm } from './AddTransactionForm';
import { Button } from '../ui/button';
import Link from 'next/link';

type TransactionWithRelations = FinancialTransaction & {
    company: Company | null;
    customer: Customer | null;
    supplier: Supplier | null;
};

const SummaryCard = ({ icon: Icon, label, value, valueClassName }: { icon: React.ElementType, label: string, value: string, valueClassName?: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${valueClassName}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName}`}>{value}</div>
      </CardContent>
    </Card>
);

export function FinanceClientPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [data, setData] = useState({
      companies: [] as Company[],
      customers: [] as Customer[],
      suppliers: [] as Supplier[],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [transactionsRes, companiesRes, customersRes, suppliersRes] = await Promise.all([
            getTransactionsAction(),
            getCompaniesAction(),
            getCustomersAction(),
            getSuppliersAction(),
        ]);
        
        if (transactionsRes.success && transactionsRes.data) {
            setTransactions(transactionsRes.data as TransactionWithRelations[]);
        } else {
             toast({ variant: 'destructive', title: 'Error', description: transactionsRes.error || 'Could not fetch transactions.' });
        }
        
        setData({
            companies: companiesRes.success ? companiesRes.data || [] : [],
            customers: customersRes.success ? customersRes.data || [] : [],
            suppliers: suppliersRes.success ? suppliersRes.data || [] : [],
        });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch initial data.' });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchData();
  };

  const openAddDrawer = () => {
    drawer.openDrawer({
      title: 'Add Financial Transaction',
      content: <AddTransactionForm onSuccess={handleFormSuccess} {...data} />,
      drawerClassName: 'sm:max-w-md'
    });
  };

  const openEditDrawer = useCallback((transaction: TransactionWithRelations) => {
    drawer.openDrawer({
        title: 'Edit Transaction',
        content: <AddTransactionForm transaction={transaction} onSuccess={handleFormSuccess} {...data} />,
        drawerClassName: 'sm:max-w-md'
    });
  }, [drawer, handleFormSuccess, data]);

  const handleDeleteRequest = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    const result = await deleteTransactionAction(transactionToDelete);
    if (result.success) {
        toast({ title: "Transaction Deleted" });
        fetchData();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const summary = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, netBalance };
  }, [transactions]);
  
  const columns = useMemo(() => getColumns(openEditDrawer, handleDeleteRequest), [openEditDrawer, handleDeleteRequest]);
  
  const formatCurrency = (value: number) => `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" />
        </div>
        <div className="flex justify-between"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-32" /></div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // If no companies are set up, prompt the user to create one first.
  if (data.companies.length === 0) {
      return (
          <Card className="text-center">
              <CardHeader>
                  <CardTitle>No Companies Found</CardTitle>
                  <CardDescription>
                    To manage income and expenses, you must first add a company profile.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Link href="/dashboard/company">
                    <Button>
                        <Briefcase className="mr-2 h-4 w-4" />
                        Add Your First Company
                    </Button>
                  </Link>
              </CardContent>
          </Card>
      )
  }

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard icon={TrendingUp} label="Total Income" value={formatCurrency(summary.totalIncome)} valueClassName="text-green-600" />
        <SummaryCard icon={TrendingDown} label="Total Expenses" value={formatCurrency(summary.totalExpense)} valueClassName="text-red-600" />
        <SummaryCard icon={Landmark} label="Net Balance" value={formatCurrency(summary.netBalance)} valueClassName={summary.netBalance >= 0 ? "text-blue-600" : "text-yellow-600"}/>
      </div>

      <FinanceDataTable
        columns={columns}
        data={transactions}
        onAddTransaction={openAddDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete the transaction.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
