// src/app/dashboard/customers/CustomersClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Customer } from '@prisma/client';
import { getCustomersAction, deleteCustomerAction } from '@/lib/actions/customer.actions';
import { CustomersDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { AddCustomerForm } from '@/components/customers/AddCustomerForm';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';


const SummaryCard = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
);

export function CustomersClientPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const drawer = useDrawer();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    const result = await getCustomersAction();
    if (result.success && result.data) {
      setCustomers(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching customers',
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchCustomers();
  };

  const openAddCustomerDrawer = () => {
    drawer.openDrawer({
      title: 'Add New Customer',
      description: 'Fill in the details below to add a new customer.',
      content: <AddCustomerForm onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-md'
    });
  };

  const openEditCustomerDrawer = useCallback((customer: Customer) => {
    drawer.openDrawer({
        title: 'Edit Customer',
        description: `Editing details for ${customer.name}`,
        content: <AddCustomerForm customer={customer} onSuccess={handleFormSuccess} />,
        drawerClassName: 'sm:max-w-md'
    });
  }, [drawer, handleFormSuccess]);

  const handleDeleteRequest = (customerId: string) => {
    setCustomerToDelete(customerId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    const result = await deleteCustomerAction(customerToDelete);

    if (result.success) {
        toast({ title: "Customer Deleted", description: `Customer has been deleted.` });
        fetchCustomers();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }

    setIsDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const columns = useMemo(() => getColumns(openEditCustomerDrawer, handleDeleteRequest), [openEditCustomerDrawer]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <SummaryCard 
            icon={Users}
            label="Total Customers"
            value={customers.length}
        />
      </div>

      <CustomersDataTable
        columns={columns}
        data={customers}
        onAddCustomer={openAddCustomerDrawer}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the customer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDeleteCustomer} className="bg-red-600 hover:bg-red-700">
                        Confirm Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
